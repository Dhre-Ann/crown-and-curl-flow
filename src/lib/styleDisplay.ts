import type { CatalogStyle } from "@/types/style";
import fallbackStyleImage from "@/assets/style-knotless.jpg";

export function formatStyleDuration(style: Pick<CatalogStyle, "durationMin" | "durationMax">): string {
  return `${style.durationMin}–${style.durationMax} hrs`;
}

/** First image URL from API, or a local fallback when the catalog has no images yet. */
export function stylePrimaryImageUrl(style: CatalogStyle): string {
  const url = style.images[0]?.imageUrl?.trim();
  return url || fallbackStyleImage;
}
