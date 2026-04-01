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

async function shopResolver(req, res, next) {
  const shopSlug = resolveShopSlug(req);

  if (!shopSlug) {
    return res.status(400).json({
      success: false,
      error:
        "Missing shop identifier. Send header x-shop-slug, or add query shopSlug or slug (browser navigations cannot set custom headers).",
    });
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

module.exports = shopResolver;
