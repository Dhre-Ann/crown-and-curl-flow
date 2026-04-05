const prisma = require("../lib/prisma");

/**
 * When a sub-router is mounted, Express may leave req.query empty even though the client sent a query string.
 * The full path + search from the incoming request is still on originalUrl, so we parse shopSlug/slug from there.
 * Base URL is only for the URL parser; it is not used as a tenant default.
 */
function readShopSlugFromOriginalUrl(req) {
  try {
    const pathAndSearch = req.originalUrl || req.url || "";
    const u = new URL(pathAndSearch, "http://resolver.local");
    const shopSlug = u.searchParams.get("shopSlug") || u.searchParams.get("slug");
    if (shopSlug && typeof shopSlug === "string" && shopSlug.trim()) {
      return shopSlug.trim();
    }
  } catch {
    // ignore malformed URLs
  }
  return null;
}

function readShopSlugFromRawHeaders(req) {
  const raw = req.rawHeaders;
  if (!raw || !Array.isArray(raw)) {
    return null;
  }
  for (let i = 0; i < raw.length; i += 2) {
    if (String(raw[i]).toLowerCase() === "x-shop-slug") {
      const v = raw[i + 1];
      if (v && typeof v === "string" && v.trim()) {
        return v.trim();
      }
    }
  }
  return null;
}

function readShopSlugFromQuery(req) {
  const q = req.query || {};
  const v = q.shopSlug ?? q.slug;
  if (typeof v === "string" && v.trim()) {
    return v.trim();
  }
  if (Array.isArray(v) && v.length > 0) {
    const first = v[0];
    if (first != null && String(first).trim()) {
      return String(first).trim();
    }
  }
  return null;
}

/**
 * Resolution order: normalized header → rawHeaders → query object → originalUrl query string.
 * Matches how browsers and fetch clients send the tenant (header preferred; query supports plain links).
 */
function resolveShopSlug(req) {
  const fromHeader = req.headers["x-shop-slug"];
  if (typeof fromHeader === "string" && fromHeader.trim()) {
    return fromHeader.trim();
  }

  const fromRaw = readShopSlugFromRawHeaders(req);
  if (fromRaw) {
    return fromRaw;
  }

  const fromQuery = readShopSlugFromQuery(req);
  if (fromQuery) {
    return fromQuery;
  }

  return readShopSlugFromOriginalUrl(req);
}

/**
 * Optional tenant resolution: attaches req.shop when a slug resolves to a real shop; otherwise req.shop is null.
 * Customer-global routes (e.g. dashboard API) omit the slug and proceed without a shop.
 */
async function shopResolver(req, res, next) {
  const shopSlug = resolveShopSlug(req);

  if (!shopSlug) {
    req.shop = null;
    return next();
  }

  const shop = await prisma.shop.findUnique({
    where: { slug: shopSlug },
  });

  if (!shop) {
    return res.status(404).json({ success: false, error: "Shop not found" });
  }

  req.shop = shop;
  return next();
}

/** Use after shopResolver on routes that must be scoped to a single shop (catalog, admin styles, etc.). */
function requireShop(req, res, next) {
  if (!req.shop) {
    return res.status(400).json({ success: false, error: "Shop context required" });
  }
  return next();
}

module.exports = { shopResolver, requireShop };
