const SHOP_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Turn a business display name into a URL-safe slug: lowercase, spaces → hyphens,
 * strip diacritics, drop other special characters (same style as "Tech Exec" → "tech-exec").
 */
function slugifyShopName(rawName) {
  const s = String(rawName ?? "").trim();
  if (!s) {
    return "shop";
  }
  const normalized = s.normalize("NFKD").replace(/\p{M}/gu, "");
  let slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug || !/^[a-z0-9]/.test(slug)) {
    slug = "shop";
  }
  if (!SHOP_SLUG_REGEX.test(slug)) {
    slug = "shop";
  }
  return slug;
}

/**
 * Reserves a unique slug, appending -2, -3, … if the base is taken.
 */
async function allocateUniqueShopSlug(tx, shopName) {
  const base = slugifyShopName(shopName);
  let candidate = base;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await tx.shop.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${n}`;
    n += 1;
    if (n > 500) {
      throw new Error("Could not allocate a unique shop slug");
    }
  }
  return candidate;
}

module.exports = { slugifyShopName, allocateUniqueShopSlug, SHOP_SLUG_REGEX };
