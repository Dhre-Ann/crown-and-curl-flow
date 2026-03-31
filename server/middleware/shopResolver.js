const prisma = require("../lib/prisma");

async function shopResolver(req, res, next) {
  const shopSlug = req.headers["x-shop-slug"];

  if (!shopSlug || typeof shopSlug !== "string") {
    return res.status(400).json({ success: false, error: "x-shop-slug header is required" });
  }

  // Every shop-scoped request must resolve a concrete shop record first.
  const shop = await prisma.shop.findUnique({
    where: { slug: shopSlug },
  });

  if (!shop) {
    return res.status(404).json({ success: false, error: "Shop not found" });
  }

  req.shop = shop;
  return next();
}

module.exports = shopResolver;
