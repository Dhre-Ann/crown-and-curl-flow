const express = require("express");
const { Prisma } = require("@prisma/client");
const prisma = require("../lib/prisma");
const shopResolver = require("../middleware/shopResolver");
const {
  requireAuth,
  requireShopAdmin,
  optionalAuthPayload,
  requireShopAdminMatchesShop,
} = require("../middleware/auth");

const router = express.Router();

const styleInclude = {
  images: { orderBy: { displayOrder: "asc" } },
  customizationOptions: { orderBy: { name: "asc" } },
};

// Prisma returns Decimal fields as objects; JSON clients need plain numbers for math and display.
function serializeStyle(style) {
  return {
    id: style.id,
    name: style.name,
    description: style.description,
    basePrice: Number(style.basePrice),
    durationMin: style.durationMin,
    durationMax: style.durationMax,
    isAvailable: style.isAvailable,
    shopId: style.shopId,
    createdAt: style.createdAt,
    images: (style.images || []).map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      displayOrder: img.displayOrder,
    })),
    customizationOptions: (style.customizationOptions || []).map((opt) => ({
      id: opt.id,
      optionType: opt.optionType,
      name: opt.name,
      priceModifier: Number(opt.priceModifier),
    })),
  };
}

async function findStyleInShop(styleId, shopId) {
  return prisma.style.findFirst({
    where: { id: styleId, shopId },
    include: styleInclude,
  });
}

// GET / — Public catalog uses isAvailable only. When a valid shop_admin JWT matches x-shop-slug,
// return every style so the admin UI can toggle visibility without a separate list endpoint.
router.get("/", shopResolver, async (req, res) => {
  try {
    const payload = optionalAuthPayload(req);
    const isAdminOfThisShop =
      payload &&
      payload.role === "shop_admin" &&
      payload.shopId === req.shop.id;

    const where = {
      shopId: req.shop.id,
      ...(isAdminOfThisShop ? {} : { isAvailable: true }),
    };

    const rows = await prisma.style.findMany({
      where,
      include: styleInclude,
      orderBy: { name: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: { styles: rows.map(serializeStyle) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to list styles" });
  }
});

// GET /:id — Public detail only for active services so deep links cannot surface hidden catalog items.
router.get("/:id", shopResolver, async (req, res) => {
  try {
    const style = await prisma.style.findFirst({
      where: {
        id: req.params.id,
        shopId: req.shop.id,
        isAvailable: true,
      },
      include: styleInclude,
    });

    if (!style) {
      return res.status(404).json({ success: false, error: "Style not found" });
    }

    return res.status(200).json({ success: true, data: { style: serializeStyle(style) } });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to load style" });
  }
});

router.post(
  "/",
  shopResolver,
  requireAuth,
  requireShopAdmin,
  requireShopAdminMatchesShop,
  async (req, res) => {
    try {
      const { name, description, basePrice, durationMin, durationMax } = req.body;
      if (!name || basePrice === undefined || durationMin === undefined || durationMax === undefined) {
        return res.status(400).json({
          success: false,
          error: "name, basePrice, durationMin and durationMax are required",
        });
      }

      const min = parseInt(String(durationMin), 10);
      const max = parseInt(String(durationMax), 10);
      if (Number.isNaN(min) || Number.isNaN(max) || min < 0 || max < min) {
        return res.status(400).json({
          success: false,
          error: "durationMin and durationMax must be valid integers with durationMax >= durationMin",
        });
      }

      let priceDecimal;
      try {
        priceDecimal = new Prisma.Decimal(String(basePrice));
      } catch {
        return res.status(400).json({ success: false, error: "Invalid basePrice" });
      }

      const style = await prisma.style.create({
        data: {
          name: String(name).trim(),
          description: description != null ? String(description) : null,
          basePrice: priceDecimal,
          durationMin: min,
          durationMax: max,
          shopId: req.shop.id,
        },
        include: styleInclude,
      });

      return res.status(201).json({ success: true, data: { style: serializeStyle(style) } });
    } catch (error) {
      return res.status(500).json({ success: false, error: "Failed to create style" });
    }
  }
);

router.put(
  "/:id",
  shopResolver,
  requireAuth,
  requireShopAdmin,
  requireShopAdminMatchesShop,
  async (req, res) => {
    try {
      const existing = await prisma.style.findFirst({
        where: { id: req.params.id, shopId: req.shop.id },
      });
      if (!existing) {
        return res.status(404).json({ success: false, error: "Style not found" });
      }

      const { name, description, basePrice, durationMin, durationMax } = req.body;
      if (!name || basePrice === undefined || durationMin === undefined || durationMax === undefined) {
        return res.status(400).json({
          success: false,
          error: "name, basePrice, durationMin and durationMax are required",
        });
      }

      const min = parseInt(String(durationMin), 10);
      const max = parseInt(String(durationMax), 10);
      if (Number.isNaN(min) || Number.isNaN(max) || min < 0 || max < min) {
        return res.status(400).json({
          success: false,
          error: "durationMin and durationMax must be valid integers with durationMax >= durationMin",
        });
      }

      let priceDecimal;
      try {
        priceDecimal = new Prisma.Decimal(String(basePrice));
      } catch {
        return res.status(400).json({ success: false, error: "Invalid basePrice" });
      }

      const style = await prisma.style.update({
        where: { id: existing.id },
        data: {
          name: String(name).trim(),
          description: description != null ? String(description) : null,
          basePrice: priceDecimal,
          durationMin: min,
          durationMax: max,
        },
        include: styleInclude,
      });

      return res.status(200).json({ success: true, data: { style: serializeStyle(style) } });
    } catch (error) {
      return res.status(500).json({ success: false, error: "Failed to update style" });
    }
  }
);

router.delete(
  "/:id",
  shopResolver,
  requireAuth,
  requireShopAdmin,
  requireShopAdminMatchesShop,
  async (req, res) => {
    try {
      const existing = await prisma.style.findFirst({
        where: { id: req.params.id, shopId: req.shop.id },
      });
      if (!existing) {
        return res.status(404).json({ success: false, error: "Style not found" });
      }

      await prisma.style.delete({ where: { id: existing.id } });
      return res.status(200).json({ success: true, data: { deleted: true } });
    } catch (error) {
      // Referenced by appointments or other FKs — do not cascade-delete client bookings.
      if (error && error.code === "P2003") {
        return res.status(409).json({
          success: false,
          error: "Cannot delete a style that is referenced by existing appointments",
        });
      }
      return res.status(500).json({ success: false, error: "Failed to delete style" });
    }
  }
);

router.patch(
  "/:id/toggle",
  shopResolver,
  requireAuth,
  requireShopAdmin,
  requireShopAdminMatchesShop,
  async (req, res) => {
    try {
      const existing = await prisma.style.findFirst({
        where: { id: req.params.id, shopId: req.shop.id },
      });
      if (!existing) {
        return res.status(404).json({ success: false, error: "Style not found" });
      }

      const style = await prisma.style.update({
        where: { id: existing.id },
        data: { isAvailable: !existing.isAvailable },
        include: styleInclude,
      });

      return res.status(200).json({ success: true, data: { style: serializeStyle(style) } });
    } catch (error) {
      return res.status(500).json({ success: false, error: "Failed to toggle style" });
    }
  }
);

router.post(
  "/:id/options",
  shopResolver,
  requireAuth,
  requireShopAdmin,
  requireShopAdminMatchesShop,
  async (req, res) => {
    try {
      const existing = await prisma.style.findFirst({
        where: { id: req.params.id, shopId: req.shop.id },
      });
      if (!existing) {
        return res.status(404).json({ success: false, error: "Style not found" });
      }

      const { optionType, name, priceModifier } = req.body;
      if (!optionType || !name || priceModifier === undefined) {
        return res.status(400).json({
          success: false,
          error: "optionType, name and priceModifier are required",
        });
      }

      let modDecimal;
      try {
        modDecimal = new Prisma.Decimal(String(priceModifier));
      } catch {
        return res.status(400).json({ success: false, error: "Invalid priceModifier" });
      }

      const option = await prisma.customizationOption.create({
        data: {
          optionType: String(optionType).trim(),
          name: String(name).trim(),
          priceModifier: modDecimal,
          styleId: existing.id,
        },
      });

      const style = await findStyleInShop(existing.id, req.shop.id);
      return res.status(201).json({
        success: true,
        data: {
          option: {
            id: option.id,
            optionType: option.optionType,
            name: option.name,
            priceModifier: Number(option.priceModifier),
          },
          style: serializeStyle(style),
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: "Failed to add option" });
    }
  }
);

router.delete(
  "/:id/options/:optionId",
  shopResolver,
  requireAuth,
  requireShopAdmin,
  requireShopAdminMatchesShop,
  async (req, res) => {
    try {
      const style = await prisma.style.findFirst({
        where: { id: req.params.id, shopId: req.shop.id },
      });
      if (!style) {
        return res.status(404).json({ success: false, error: "Style not found" });
      }

      const option = await prisma.customizationOption.findFirst({
        where: { id: req.params.optionId, styleId: style.id },
      });
      if (!option) {
        return res.status(404).json({ success: false, error: "Option not found" });
      }

      await prisma.customizationOption.delete({ where: { id: option.id } });
      const updated = await findStyleInShop(style.id, req.shop.id);
      return res.status(200).json({ success: true, data: { style: serializeStyle(updated) } });
    } catch (error) {
      return res.status(500).json({ success: false, error: "Failed to remove option" });
    }
  }
);

module.exports = router;
