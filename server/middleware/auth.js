const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

function getJwtSecret() {
  return process.env.JWT_SECRET;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    return res.status(500).json({ success: false, error: "Server auth configuration is missing" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

function requireShopAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  if (req.user.role !== "shop_admin") {
    return res.status(403).json({ success: false, error: "Shop admin role required" });
  }

  return next();
}

function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  if (req.user.role !== "super_admin") {
    return res.status(403).json({ success: false, error: "Super admin role required" });
  }

  return next();
}

async function loadCurrentUser(req, res, next) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { ownedShop: true, shop: true },
  });

  if (!user) {
    return res.status(401).json({ success: false, error: "User not found" });
  }

  req.currentUser = user;
  return next();
}

/**
 * JWT payload if the Bearer token verifies; otherwise null.
 * Used on GET /api/styles so the same URL serves the public catalog and the authenticated admin list.
 */
function optionalAuthPayload(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.replace("Bearer ", "").trim();
  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    return null;
  }
  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    return null;
  }
}

/**
 * Shop admins may only mutate data for the shop resolved from x-shop-slug.
 * JWT shopId must match req.shop.id so a token cannot be replayed against another tenant header.
 */
function requireShopAdminMatchesShop(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }
  if (req.user.role !== "shop_admin") {
    return res.status(403).json({ success: false, error: "Shop admin role required" });
  }
  if (!req.user.shopId || req.user.shopId !== req.shop.id) {
    return res.status(403).json({ success: false, error: "You do not have access to this shop" });
  }
  return next();
}

module.exports = {
  requireAuth,
  requireShopAdmin,
  requireSuperAdmin,
  loadCurrentUser,
  optionalAuthPayload,
  requireShopAdminMatchesShop,
};
