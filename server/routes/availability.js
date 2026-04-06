const express = require("express");
const { Prisma } = require("@prisma/client");
const prisma = require("../lib/prisma");
const { requireShop } = require("../middleware/shopResolver");
const { requireAuth, requireShopAdmin, requireShopAdminMatchesShop } = require("../middleware/auth");
const {
  dayOfWeekFromYmd,
  ymdFromDateUtc,
  workWindowMinutes,
  busyIntervalsFromAppointments,
  buildSlotsForDay,
  parseTimeToMinutes,
} = require("../lib/availabilitySlots");

const router = express.Router();

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const YM = /^\d{4}-\d{2}$/;

function parseYmdOr400(ymd, res) {
  if (!ymd || typeof ymd !== "string" || !YMD.test(ymd)) {
    res.status(400).json({ success: false, error: "Invalid or missing date (use YYYY-MM-DD)" });
    return null;
  }
  return ymd;
}

function atUtcNoonDate(ymd) {
  return new Date(`${ymd}T12:00:00.000Z`);
}

/** How long (minutes) a new booking might occupy — from a specific style or worst-case shop max. */
async function bookingSpanMinutes(shopId, styleId) {
  if (styleId && typeof styleId === "string") {
    const st = await prisma.style.findFirst({
      where: { id: styleId, shopId },
      select: { durationMax: true },
    });
    if (st) {
      return Math.max(1, Number(st.durationMax) * 60);
    }
  }
  const agg = await prisma.style.aggregate({
    where: { shopId },
    _max: { durationMax: true },
  });
  const h = agg._max.durationMax;
  return Math.max(1, (h != null ? Number(h) : 2) * 60);
}

/**
 * Public + shop: slots for one day, or month overview for the booking calendar.
 * Optional `styleId` narrows how much contiguous time each slot must keep free (uses that style's
 * durationMax); otherwise we use the shop's longest style so the grid stays conservative.
 * `month=YYYY-MM` returns blocked dates and which days have active work hours (client hides past days).
 */
router.get("/", requireShop, async (req, res) => {
  try {
    const shopId = req.shop.id;
    const { date, month, styleId } = req.query;

    if (month != null && String(month).trim()) {
      const m = String(month).trim();
      if (!YM.test(m)) {
        return res.status(400).json({ success: false, error: "Invalid month (use YYYY-MM)" });
      }
      const [yStr, moStr] = m.split("-");
      const y = Number(yStr);
      const mo = Number(moStr);
      const start = new Date(Date.UTC(y, mo - 1, 1));
      const end = new Date(Date.UTC(y, mo, 0));
      const startYmd = ymdFromDateUtc(start);
      const endYmd = ymdFromDateUtc(end);

      const [blockedRows, workRows] = await Promise.all([
        prisma.blockedDate.findMany({
          where: {
            shopId,
            date: { gte: atUtcNoonDate(startYmd), lte: atUtcNoonDate(endYmd) },
          },
          select: { date: true },
        }),
        prisma.workHour.findMany({ where: { shopId } }),
      ]);

      const blockedSet = new Set(
        blockedRows.map((r) => {
          const d = r.date;
          return d instanceof Date ? ymdFromDateUtc(d) : String(d).slice(0, 10);
        })
      );

      const workByDow = new Map();
      for (const wh of workRows) {
        workByDow.set(wh.dayOfWeek, wh);
      }

      const days = [];
      for (let day = 1; day <= end.getUTCDate(); day++) {
        const ymd = `${yStr}-${moStr}-${String(day).padStart(2, "0")}`;
        const dow = dayOfWeekFromYmd(ymd);
        const wh = workByDow.get(dow);
        const win = workWindowMinutes(wh);
        const blocked = blockedSet.has(ymd);
        // Selectable when the shop is open that weekday and the day is not admin-blocked.
        days.push({
          date: ymd,
          blocked,
          hasWorkHours: Boolean(win),
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          blockedDates: [...blockedSet].sort(),
          days,
        },
      });
    }

    const d = parseYmdOr400(date != null ? String(date) : "", res);
    if (!d) return;

    const dow = dayOfWeekFromYmd(d);
    if (dow === null) {
      return res.status(400).json({ success: false, error: "Invalid date" });
    }

    const shopDate = atUtcNoonDate(d);

    const [blocked, workHour, appointments, spanMin] = await Promise.all([
      prisma.blockedDate.findFirst({
        where: { shopId, date: shopDate },
      }),
      prisma.workHour.findFirst({
        where: { shopId, dayOfWeek: dow },
      }),
      prisma.appointment.findMany({
        where: {
          shopId,
          date: shopDate,
          status: { in: ["pending", "approved"] },
        },
        include: {
          style: { select: { durationMax: true } },
        },
      }),
      bookingSpanMinutes(shopId, styleId != null ? String(styleId) : null),
    ]);

    if (blocked) {
      return res.status(200).json({ success: true, data: { slots: [] } });
    }

    const win = workWindowMinutes(workHour);
    if (!win) {
      return res.status(200).json({ success: true, data: { slots: [] } });
    }

    const busy = busyIntervalsFromAppointments(appointments);
    const slots = buildSlotsForDay({
      openStartMin: win.start,
      openEndMin: win.end,
      bookingSpanMin: spanMin,
      busyIntervals: busy,
    });

    return res.status(200).json({ success: true, data: { slots } });
  } catch (e) {
    return res.status(500).json({ success: false, error: "Failed to load availability" });
  }
});

function adminChain() {
  return [requireShop, requireAuth, requireShopAdmin, requireShopAdminMatchesShop];
}

router.get("/blocked", ...adminChain(), async (req, res) => {
  try {
    const shopId = req.shop.id;
    const [rows, workRows] = await Promise.all([
      prisma.blockedDate.findMany({
        where: { shopId },
        orderBy: { date: "asc" },
      }),
      prisma.workHour.findMany({
        where: { shopId },
        orderBy: { dayOfWeek: "asc" },
      }),
    ]);
    const blocked = rows.map((r) => {
      const d = r.date;
      const dateStr = d instanceof Date ? ymdFromDateUtc(d) : String(d).slice(0, 10);
      return { date: dateStr, reason: r.reason };
    });
    const workHours = workRows.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
      isActive: h.isActive,
    }));
    return res.status(200).json({ success: true, data: { blocked, workHours } });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to load blocked dates" });
  }
});

router.post("/block", ...adminChain(), async (req, res) => {
  try {
    const { date, reason } = req.body || {};
    const ymd = parseYmdOr400(typeof date === "string" ? date : "", res);
    if (!ymd) return;

    const row = await prisma.blockedDate.upsert({
      where: {
        shopId_date: { shopId: req.shop.id, date: atUtcNoonDate(ymd) },
      },
      create: {
        shopId: req.shop.id,
        date: atUtcNoonDate(ymd),
        reason: reason != null && String(reason).trim() ? String(reason).trim() : null,
      },
      update: {
        reason: reason != null && String(reason).trim() ? String(reason).trim() : null,
      },
    });

    const d = row.date;
    const dateStr = d instanceof Date ? ymdFromDateUtc(d) : String(d).slice(0, 10);
    return res.status(200).json({
      success: true,
      data: { blocked: { date: dateStr, reason: row.reason } },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return res.status(409).json({ success: false, error: "Date already blocked" });
    }
    return res.status(500).json({ success: false, error: "Failed to block date" });
  }
});

router.delete("/block/:date", ...adminChain(), async (req, res) => {
  try {
    const ymd = parseYmdOr400(req.params.date, res);
    if (!ymd) return;

    await prisma.blockedDate.deleteMany({
      where: { shopId: req.shop.id, date: atUtcNoonDate(ymd) },
    });

    return res.status(200).json({ success: true, data: { deleted: true, date: ymd } });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to unblock date" });
  }
});

router.put("/hours", ...adminChain(), async (req, res) => {
  try {
    const { hours } = req.body || {};
    if (!Array.isArray(hours)) {
      return res.status(400).json({ success: false, error: "hours must be an array" });
    }
    if (hours.length === 0) {
      return res.status(400).json({ success: false, error: "hours must include at least one day" });
    }

    const normalized = [];
    const seenDow = new Set();
    for (const row of hours) {
      if (!row || typeof row !== "object") {
        return res.status(400).json({ success: false, error: "Invalid hours entry" });
      }
      const dayOfWeek = Number(row.dayOfWeek);
      const startTime = row.startTime != null ? String(row.startTime).trim() : "";
      const endTime = row.endTime != null ? String(row.endTime).trim() : "";
      const isActive = Boolean(row.isActive);
      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({ success: false, error: "dayOfWeek must be 0–6" });
      }
      if (seenDow.has(dayOfWeek)) {
        return res.status(400).json({ success: false, error: "Duplicate dayOfWeek in payload" });
      }
      seenDow.add(dayOfWeek);
      if (!startTime || !endTime) {
        return res.status(400).json({ success: false, error: "startTime and endTime required" });
      }
      const sm = parseTimeToMinutes(startTime);
      const em = parseTimeToMinutes(endTime);
      if (sm == null || em == null || em <= sm) {
        return res.status(400).json({ success: false, error: "Invalid startTime or endTime" });
      }
      // Store normalized 24h strings so parsing stays deterministic across clients.
      const sh = Math.floor(sm / 60);
      const smin = sm % 60;
      const eh = Math.floor(em / 60);
      const emin = em % 60;
      const start24 = `${String(sh).padStart(2, "0")}:${String(smin).padStart(2, "0")}`;
      const end24 = `${String(eh).padStart(2, "0")}:${String(emin).padStart(2, "0")}`;
      normalized.push({ dayOfWeek, startTime: start24, endTime: end24, isActive });
    }

    const shopId = req.shop.id;
    await prisma.$transaction([
      prisma.workHour.deleteMany({ where: { shopId } }),
      prisma.workHour.createMany({
        data: normalized.map((h) => ({
          shopId,
          dayOfWeek: h.dayOfWeek,
          startTime: h.startTime,
          endTime: h.endTime,
          isActive: h.isActive,
        })),
      }),
    ]);

    const saved = await prisma.workHour.findMany({
      where: { shopId },
      orderBy: { dayOfWeek: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: {
        hours: saved.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          startTime: h.startTime,
          endTime: h.endTime,
          isActive: h.isActive,
        })),
      },
    });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to update work hours" });
  }
});

module.exports = router;
