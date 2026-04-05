const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, loadCurrentUser } = require("../middleware/auth");

const router = express.Router();

/**
 * Unique shops the user has booked with, for "My Techs" on the global customer dashboard.
 * Scoped by user id only — never filter by req.shop here.
 */
router.get("/techs", requireAuth, loadCurrentUser, async (req, res) => {
  try {
    const userId = req.currentUser.id;

    const appointments = await prisma.appointment.findMany({
      where: { userId },
      include: {
        shop: { select: { id: true, name: true, slug: true } },
      },
    });

    const byShop = new Map();
    for (const apt of appointments) {
      const prev = byShop.get(apt.shopId);
      const t = apt.date instanceof Date ? apt.date.getTime() : new Date(apt.date).getTime();
      if (!prev || t > prev.lastTime) {
        byShop.set(apt.shopId, {
          shopName: apt.shop.name,
          slug: apt.shop.slug,
          lastTime: t,
          lastDate: apt.date,
        });
      }
    }

    const techs = Array.from(byShop.values())
      .map((v) => ({
        shopName: v.shopName,
        slug: v.slug,
        lastAppointmentDate:
          v.lastDate instanceof Date ? v.lastDate.toISOString().slice(0, 10) : String(v.lastDate),
      }))
      .sort((a, b) => (a.shopName < b.shopName ? -1 : a.shopName > b.shopName ? 1 : 0));

    return res.status(200).json({
      success: true,
      data: { techs },
    });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to load techs" });
  }
});

module.exports = router;
