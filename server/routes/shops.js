const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

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

module.exports = router;
