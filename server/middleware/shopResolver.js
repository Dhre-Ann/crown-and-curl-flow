const prisma = require("../lib/prisma");

/**
 * Read x-shop-slug from every place Node may expose it. Some stacks only surface
 * duplicate or custom headers on rawHeaders / headersDistinct; bracket access on
 * req.headers alone can be empty even when the client sent the header.
 */
function extractShopSlug(req) {
  const pick = (v) => {
    if (v == null) return "";
    if (typeof v === "string") return v.trim();
    if (Array.isArray(v)) {
      for (const x of v) {
        const s = String(x).trim();
        if (s) return s;
      }
      return "";
    }
    return String(v).trim();
  };

  let s = pick(req.headers?.["x-shop-slug"]);
  if (s) return s;

  if (req.headers && typeof req.headers === "object") {
    for (const key of Object.keys(req.headers)) {
      if (key.toLowerCase() === "x-shop-slug") {
        s = pick(req.headers[key]);
        if (s) return s;
      }
    }
  }

  const raw = req.rawHeaders;
  if (Array.isArray(raw)) {
    for (let i = 0; i < raw.length - 1; i += 2) {
      if (String(raw[i]).toLowerCase() === "x-shop-slug") {
        s = pick(raw[i + 1]);
        if (s) return s;
      }
    }
  }

  const distinct = req.headersDistinct;
  if (distinct && typeof distinct === "object") {
    s = pick(distinct["x-shop-slug"]);
    if (s) return s;
  }

  return "";
}

async function shopResolver(req, res, next) {
  // CORS preflight is OPTIONS and does not include custom headers; the slug is only sent on the real request.
  if (req.method === "OPTIONS") {
    return next();
  }

  const shopSlug = extractShopSlug(req);

  if (!shopSlug) {
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
