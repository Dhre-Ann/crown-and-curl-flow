import { useCallback } from "react";
import { useCustomerPreviewReadOnly } from "@/context/ShopAdminPreviewContext";

function buildCustomerFlowHref(inPreview: boolean, pathWithSearch: string): string {
  const raw = pathWithSearch.trim() || "/";
  const u = new URL(raw.startsWith("/") ? raw : `/${raw}`, "http://_");
  const pathPart = u.pathname;
  const search = u.search;

  if (!inPreview) {
    return `${pathPart}${search}`;
  }

  const isCustomerFlow =
    pathPart === "/services" ||
    pathPart.startsWith("/services/") ||
    pathPart === "/book" ||
    pathPart === "/checkout";

  if (isCustomerFlow) {
    return `/admin/preview${pathPart}${search}`;
  }

  return `${pathPart}${search}`;
}

/**
 * Customer catalog/booking lives at /services, /book, /checkout normally, or under /admin/preview/*
 * when a shop admin previews their storefront.
 */
export function useCustomerFlowHrefFn() {
  const inPreview = useCustomerPreviewReadOnly();
  return useCallback((pathWithSearch: string) => buildCustomerFlowHref(inPreview, pathWithSearch), [inPreview]);
}
