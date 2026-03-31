export interface StyleImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export interface StyleCustomizationOption {
  id: string;
  optionType: string;
  name: string;
  priceModifier: number;
}

/** Style row from GET /api/styles (public or admin list). */
export interface CatalogStyle {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  durationMin: number;
  durationMax: number;
  isAvailable: boolean;
  shopId: string;
  createdAt: string;
  images: StyleImage[];
  customizationOptions: StyleCustomizationOption[];
}
