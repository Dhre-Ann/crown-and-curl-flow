const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { allocateUniqueShopSlug } = require("../lib/shopSlugFromName");
const { requireAuth, loadCurrentUser } = require("../middleware/auth");

const router = express.Router();
const SALT_ROUNDS = 12;

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

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "name, email and password are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    // Customers are platform-wide; they are not tied to a single shop row.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: "customer",
        shopId: null,
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
    const { name, email, password, shopName, serviceCategory } = req.body;
    if (!name || !email || !password || !shopName) {
      return res.status(400).json({
        success: false,
        error: "name, email, password and shopName are required",
      });
    }

    const trimmedShopName = String(shopName).trim();
    if (!trimmedShopName) {
      return res.status(400).json({ success: false, error: "shopName cannot be empty" });
    }

    const categoryTrimmed =
      serviceCategory != null && String(serviceCategory).trim() !== ""
        ? String(serviceCategory).trim()
        : null;

    const existingEmailUser = await prisma.user.findUnique({ where: { email } });

    if (existingEmailUser) {
      return res.status(409).json({ success: false, error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await prisma.$transaction(async (tx) => {
      const slug = await allocateUniqueShopSlug(tx, trimmedShopName);

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
          name: trimmedShopName,
          slug,
          serviceCategory: categoryTrimmed,
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

router.post("/login", async (req, res) => {
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

    // Shop admins are only denied when a shop slug was sent and it does not match their assigned shop.
    if (user.role === "shop_admin" && req.shop && user.shopId !== req.shop.id) {
      return res.status(403).json({ success: false, error: "You do not have access to this shop" });
    }

    // Customers use one account across all shops; never tie login to a single shopId.

    const token = signToken(user);

    let shop = null;
    if (user.role === "super_admin") {
      shop = null;
    } else if (user.role === "shop_admin") {
      shop = req.shop && user.shopId === req.shop.id ? req.shop : user.shop;
    } else {
      shop = req.shop ?? null;
    }

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

router.get("/me", requireAuth, loadCurrentUser, async (req, res) => {
  const user = req.currentUser;
  if (user.role === "shop_admin" && req.shop && user.shopId !== req.shop.id) {
    return res.status(403).json({ success: false, error: "You do not have access to this shop" });
  }

  let shop = null;
  if (user.role === "super_admin") {
    shop = null;
  } else if (user.role === "shop_admin") {
    shop = req.shop ?? user.shop;
  } else {
    shop = req.shop ?? null;
  }

  return res.status(200).json({
    success: true,
    data: {
      user: sanitizeUser(user),
      shop,
    },
  });
});

module.exports = router;
