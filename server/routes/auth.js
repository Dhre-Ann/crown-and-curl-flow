const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { requireAuth, loadCurrentUser } = require("../middleware/auth");
const shopResolver = require("../middleware/shopResolver");

const router = express.Router();
const SALT_ROUNDS = 12;
const SHOP_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function getJwtSecret() {
  return process.env.JWT_SECRET;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    shopId: user.shopId,
    createdAt: user.createdAt,
  };
}

function signToken(user) {
  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    throw new Error("JWT secret is missing");
  }

  return jwt.sign({ userId: user.id, role: user.role, shopId: user.shopId ?? null }, jwtSecret, {
    expiresIn: "7d",
  });
}

router.post("/register", shopResolver, async (req, res) => {
  try {
    const { name, email, password, shopSlug } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "name, email and password are required" });
    }

    let resolvedShopId = req.shop.id;
    if (shopSlug) {
      const shopFromBody = await prisma.shop.findUnique({ where: { slug: shopSlug } });
      if (!shopFromBody) {
        return res.status(404).json({ success: false, error: "Shop not found for provided shopSlug" });
      }
      resolvedShopId = shopFromBody.id;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: "customer",
        shopId: resolvedShopId,
      },
    });

    const token = signToken(user);
    return res.status(201).json({
      success: true,
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to register user" });
  }
});

router.post("/shop-register", async (req, res) => {
  try {
    const { name, email, password, shopName, shopSlug } = req.body;
    if (!name || !email || !password || !shopName || !shopSlug) {
      return res.status(400).json({
        success: false,
        error: "name, email, password, shopName and shopSlug are required",
      });
    }

    if (!SHOP_SLUG_REGEX.test(shopSlug)) {
      return res.status(400).json({
        success: false,
        error: "shopSlug must be lowercase and hyphen-separated only",
      });
    }

    const [existingEmailUser, existingSlugShop] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.shop.findUnique({ where: { slug: shopSlug } }),
    ]);

    if (existingEmailUser) {
      return res.status(409).json({ success: false, error: "Email already in use" });
    }
    if (existingSlugShop) {
      return res.status(409).json({ success: false, error: "Shop slug already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: passwordHash,
          role: "shop_admin",
        },
      });

      const shop = await tx.shop.create({
        data: {
          name: shopName,
          slug: shopSlug,
          ownerId: user.id,
        },
      });

      const linkedUser = await tx.user.update({
        where: { id: user.id },
        data: { shopId: shop.id },
      });

      return { user: linkedUser, shop };
    });

    const token = signToken(result.user);
    return res.status(201).json({
      success: true,
      data: {
        token,
        user: sanitizeUser(result.user),
        shop: result.shop,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to register shop" });
  }
});

router.post("/login", shopResolver, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { ownedShop: true, shop: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    if (user.role === "shop_admin" && user.shopId !== req.shop.id) {
      return res.status(403).json({ success: false, error: "You do not have access to this shop" });
    }

    if (user.role === "customer" && user.shopId !== req.shop.id) {
      return res.status(403).json({ success: false, error: "You do not have access to this shop" });
    }

    const token = signToken(user);
    const shop = user.role === "super_admin" ? null : req.shop;

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: sanitizeUser(user),
        shop,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to login" });
  }
});

router.get("/me", shopResolver, requireAuth, loadCurrentUser, async (req, res) => {
  const user = req.currentUser;
  if (user.role === "shop_admin" && user.shopId !== req.shop.id) {
    return res.status(403).json({ success: false, error: "You do not have access to this shop" });
  }

  const shop = req.shop;

  return res.status(200).json({
    success: true,
    data: {
      user: sanitizeUser(user),
      shop,
    },
  });
});

module.exports = router;
