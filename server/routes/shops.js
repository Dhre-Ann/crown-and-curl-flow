const express = require("express");
const prisma = require("../lib/prisma");
const { requireShop } = require("../middleware/shopResolver");
const { requireAuth, requireShopAdmin, requireShopAdminMatchesShop } = require("../middleware/auth");

const router = express.Router();

const adminShopChain = [
  requireShop,
  requireAuth,
  requireShopAdmin,
  requireShopAdminMatchesShop,
];

/**
 * Public directory of shops for the global customer app (no x-shop-slug required).
 * Inactive subscriptions are hidden so customers only see bookable storefronts.
 */
router.get("/", async (req, res) => {
  try {
    const shops = await prisma.shop.findMany({
      where: {
        subscriptionStatus: { not: "inactive" },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        serviceCategory: true,
        subscriptionStatus: true,
      },
      orderBy: { name: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: { shops },
    });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to list shops" });
  }
});

/**
 * Shop admin: read booking UI preferences for the resolved tenant (dashboard upcoming window).
 */
router.get("/me/booking-preferences", ...adminShopChain, async (req, res) => {
  try {
    const row = await prisma.shop.findUnique({
      where: { id: req.shop.id },
      select: { upcomingBookingWeeks: true },
    });
    return res.status(200).json({
      success: true,
      data: { upcomingBookingWeeks: row?.upcomingBookingWeeks ?? 1 },
    });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to load booking preferences" });
  }
});

/**
 * Shop admin: update upcoming horizon (weeks). Clamped 1–12 so the dashboard stays practical.
 */
router.patch("/me/booking-preferences", ...adminShopChain, async (req, res) => {
  try {
    const raw = req.body?.upcomingBookingWeeks;
    const w = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
    if (!Number.isInteger(w) || w < 1 || w > 12) {
      return res.status(400).json({
        success: false,
        error: "upcomingBookingWeeks must be an integer from 1 to 12",
      });
    }
    const updated = await prisma.shop.update({
      where: { id: req.shop.id },
      data: { upcomingBookingWeeks: w },
      select: { upcomingBookingWeeks: true },
    });
    return res.status(200).json({ success: true, data: updated });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to save booking preferences" });
  }
});

module.exports = router;
