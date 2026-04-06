const express = require("express");
const { Prisma } = require("@prisma/client");
const prisma = require("../lib/prisma");
const { requireShop } = require("../middleware/shopResolver");
const {
  requireAuth,
  requireShopAdmin,
  requireShopAdminMatchesShop,
  loadCurrentUser,
} = require("../middleware/auth");
const {
  dayOfWeekFromYmd,
  workWindowMinutes,
  busyIntervalsFromAppointments,
  parseTimeToMinutes,
  ymdFromDateUtc,
  rangesOverlap,
} = require("../lib/availabilitySlots");

const router = express.Router();

const YMD = /^\d{4}-\d{2}-\d{2}$/;

function atUtcNoonDate(ymd) {
  return new Date(`${ymd}T12:00:00.000Z`);
}

function serializeMineAppointment(row) {
  const d = row.date;
  const dateStr = d instanceof Date ? ymdFromDateUtc(d) : String(d).slice(0, 10);

  return {
    id: row.id,
    date: dateStr,
    time: row.time,
    status: row.status,
    depositAmount: Number(row.depositAmount),
    totalPrice: Number(row.totalPrice),
    shop: {
      name: row.shop.name,
      slug: row.shop.slug,
    },
    style: {
      name: row.style.name,
    },
  };
}

function serializeAppointmentFull(row) {
  const d = row.date;
  const dateStr = d instanceof Date ? ymdFromDateUtc(d) : String(d).slice(0, 10);
  return {
    id: row.id,
    date: dateStr,
    time: row.time,
    selectedOptions: row.selectedOptions,
    totalPrice: Number(row.totalPrice),
    depositAmount: Number(row.depositAmount),
    status: row.status,
    createdAt: row.createdAt,
    userId: row.userId,
    styleId: row.styleId,
    shopId: row.shopId,
    style: row.style ? { id: row.style.id, name: row.style.name } : undefined,
    shop: row.shop ? { id: row.shop.id, name: row.shop.name, slug: row.shop.slug } : undefined,
  };
}

/**
 * Re-check the slot inside the same transaction as create so two concurrent POSTs cannot double book.
 * Uses each existing appointment's style.durationMax so overlap is detected, not just identical start strings.
 */
async function assertSlotBookable(prismaTx, shopId, ymd, timeStr, styleRow) {
  const shopDate = atUtcNoonDate(ymd);
  const blocked = await prismaTx.blockedDate.findFirst({
    where: { shopId, date: shopDate },
  });
  if (blocked) {
    return "This date is not available for booking";
  }

  const dow = dayOfWeekFromYmd(ymd);
  if (dow === null) {
    return "Invalid date";
  }

  const wh = await prismaTx.workHour.findFirst({
    where: { shopId, dayOfWeek: dow },
  });
  const win = workWindowMinutes(wh);
  if (!win) {
    return "This date is not available for booking";
  }

  const slotMin = parseTimeToMinutes(timeStr);
  if (slotMin == null) {
    return "Invalid time";
  }

  const span = Math.max(1, Number(styleRow.durationMax) * 60);
  if (slotMin < win.start || slotMin + span > win.end) {
    return "Selected time is outside working hours";
  }

  const apts = await prismaTx.appointment.findMany({
    where: {
      shopId,
      date: shopDate,
      status: { in: ["pending", "approved"] },
    },
    include: { style: { select: { durationMax: true } } },
  });
  const busy = busyIntervalsFromAppointments(apts);
  const slotEnd = slotMin + span;
  const overlaps = busy.some((b) => rangesOverlap(slotMin, slotEnd, b.start, b.end));
  if (overlaps) {
    return "This time slot is no longer available";
  }

  return null;
}

/**
 * Customer-global: all appointments for the authenticated user across every shop (no shop filter).
 */
router.get("/mine", requireAuth, loadCurrentUser, async (req, res) => {
  try {
    const userId = req.currentUser.id;

    const rows = await prisma.appointment.findMany({
      where: { userId },
      include: {
        shop: { select: { name: true, slug: true } },
        style: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { time: "desc" }],
    });

    return res.status(200).json({
      success: true,
      data: { appointments: rows.map(serializeMineAppointment) },
    });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to load appointments" });
  }
});

/**
 * Customer books in shop context: totalPrice from the client is ignored — recomputed from DB rows only.
 */
router.post("/", requireShop, requireAuth, loadCurrentUser, async (req, res) => {
  try {
    const shopId = req.shop.id;
    const userId = req.currentUser.id;
    const { styleId, date, time, selectedOptions } = req.body || {};

    if (!styleId || typeof styleId !== "string") {
      return res.status(400).json({ success: false, error: "styleId is required" });
    }
    if (!date || typeof date !== "string" || !YMD.test(date)) {
      return res.status(400).json({ success: false, error: "Invalid date (use YYYY-MM-DD)" });
    }
    if (!time || typeof time !== "string" || !String(time).trim()) {
      return res.status(400).json({ success: false, error: "time is required" });
    }
    if (!Array.isArray(selectedOptions)) {
      return res.status(400).json({ success: false, error: "selectedOptions must be an array" });
    }

    const optionIds = selectedOptions.map((x) => String(x));

    const appointment = await prisma.$transaction(async (tx) => {
      const styleRow = await tx.style.findFirst({
        where: { id: styleId, shopId, isAvailable: true },
        include: { customizationOptions: true },
      });

      if (!styleRow) {
        const err = new Error("STYLE_OR_SHOP");
        err.code = "STYLE_OR_SHOP";
        throw err;
      }

      const slotErr = await assertSlotBookable(tx, shopId, date, String(time).trim(), styleRow);
      if (slotErr) {
        const err = new Error(slotErr);
        err.code = "SLOT";
        throw err;
      }

      const optById = new Map(styleRow.customizationOptions.map((o) => [o.id, o]));
      const snapshot = [];
      let modifiers = new Prisma.Decimal(0);
      // Never trust request pricing: sum DB basePrice + each option's priceModifier only.
      for (const oid of optionIds) {
        const opt = optById.get(oid);
        if (!opt) {
          const err = new Error("Invalid customization option for this style");
          err.code = "OPTIONS";
          throw err;
        }
        snapshot.push({
          id: opt.id,
          optionType: opt.optionType,
          name: opt.name,
          priceModifier: Number(opt.priceModifier),
        });
        modifiers = modifiers.add(new Prisma.Decimal(opt.priceModifier));
      }

      const totalPrice = new Prisma.Decimal(styleRow.basePrice).add(modifiers);
      const depositRaw = totalPrice.mul(new Prisma.Decimal("0.3"));
      const depositAmount = depositRaw.toDecimalPlaces(2);

      return tx.appointment.create({
        data: {
          shopId,
          userId,
          styleId: styleRow.id,
          date: atUtcNoonDate(date),
          time: String(time).trim(),
          selectedOptions: snapshot,
          totalPrice,
          depositAmount,
          status: "pending",
        },
        include: {
          style: { select: { id: true, name: true } },
          shop: { select: { id: true, name: true, slug: true } },
        },
      });
    });

    return res.status(201).json({
      success: true,
      data: { appointment: serializeAppointmentFull(appointment) },
    });
  } catch (e) {
    if (e && e.code === "STYLE_OR_SHOP") {
      return res.status(400).json({ success: false, error: "Style not found or not available in this shop" });
    }
    if (e && e.code === "SLOT") {
      return res.status(409).json({ success: false, error: e.message });
    }
    if (e && e.code === "OPTIONS") {
      return res.status(400).json({ success: false, error: e.message });
    }
    return res.status(500).json({ success: false, error: "Failed to create appointment" });
  }
});

/**
 * Shop admin: list this shop's appointments with customer + style labels for the calendar UI.
 */
router.get(
  "/",
  requireShop,
  requireAuth,
  requireShopAdmin,
  requireShopAdminMatchesShop,
  async (req, res) => {
    try {
      const rows = await prisma.appointment.findMany({
        where: { shopId: req.shop.id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          style: { select: { id: true, name: true } },
        },
        orderBy: [{ date: "asc" }, { time: "asc" }],
      });

      const appointments = rows.map((r) => {
        const d = r.date;
        const dateStr = d instanceof Date ? ymdFromDateUtc(d) : String(d).slice(0, 10);
        return {
          id: r.id,
          date: dateStr,
          time: r.time,
          status: r.status,
          customerName: r.user.name,
          styleName: r.style.name,
          totalPrice: Number(r.totalPrice),
          depositAmount: Number(r.depositAmount),
        };
      });

      return res.status(200).json({ success: true, data: { appointments } });
    } catch {
      return res.status(500).json({ success: false, error: "Failed to load appointments" });
    }
  }
);

router.patch(
  "/:id/status",
  requireShop,
  requireAuth,
  requireShopAdmin,
  requireShopAdminMatchesShop,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body || {};
      const allowed = ["approved", "cancelled", "completed"];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `status must be one of: ${allowed.join(", ")}`,
        });
      }

      const existing = await prisma.appointment.findFirst({
        where: { id, shopId: req.shop.id },
      });
      if (!existing) {
        return res.status(404).json({ success: false, error: "Appointment not found" });
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: { status },
        include: {
          style: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      });

      const d = updated.date;
      const dateStr = d instanceof Date ? ymdFromDateUtc(d) : String(d).slice(0, 10);

      return res.status(200).json({
        success: true,
        data: {
          appointment: {
            id: updated.id,
            date: dateStr,
            time: updated.time,
            status: updated.status,
            customerName: updated.user.name,
            styleName: updated.style.name,
          },
        },
      });
    } catch {
      return res.status(500).json({ success: false, error: "Failed to update appointment" });
    }
  }
);

module.exports = router;
