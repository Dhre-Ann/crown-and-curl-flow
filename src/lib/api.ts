import type { CatalogStyle, StyleCustomizationOption } from "@/types/style";

const envApi = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL =
  typeof envApi === "string" && envApi.trim() !== ""
    ? envApi.replace(/\/$/, "")
    : "http://localhost:5000";
const TOKEN_KEY = "crownStudioToken";

// TODO: Replace with dynamic subdomain resolution in production.
const DEV_SHOP_SLUG = "kairstyles";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "customer" | "shop_admin" | "super_admin";
  shopId: string | null;
  createdAt: string;
}

export interface ApiShop {
  id: string;
  name: string;
  slug: string;
  ownerId: string | null;
  subscriptionStatus: string;
  createdAt: string;
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  error: string;
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function buildHeaders(auth: boolean) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-shop-slug": DEV_SHOP_SLUG,
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: buildHeaders(options.auth ?? false),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    if (payload.success === false) {
      throw new Error(payload.error);
    }
    throw new Error("Request failed");
  }

  return payload.data;
}

export async function loginRequest(payload: { email: string; password: string }) {
  return request<{ token: string; user: ApiUser; shop: ApiShop | null }>("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function registerCustomerRequest(payload: {
  name: string;
  email: string;
  password: string;
  shopSlug?: string;
}) {
  return request<{ token: string; user: ApiUser }>("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function registerShopRequest(payload: {
  name: string;
  email: string;
  password: string;
  shopName: string;
  shopSlug: string;
}) {
  return request<{ token: string; user: ApiUser; shop: ApiShop }>("/api/auth/shop-register", {
    method: "POST",
    body: payload,
  });
}

export async function meRequest() {
  return request<{ user: ApiUser; shop: ApiShop | null }>("/api/auth/me", {
    auth: true,
  });
}

export async function fetchStylesCatalog(opts?: { auth?: boolean }): Promise<CatalogStyle[]> {
  const data = await request<{ styles: CatalogStyle[] }>("/api/styles", {
    auth: opts?.auth ?? false,
  });
  return data.styles;
}

export async function fetchStyleById(id: string): Promise<CatalogStyle> {
  const data = await request<{ style: CatalogStyle }>(`/api/styles/${id}`);
  return data.style;
}

export async function createStyleRequest(payload: {
  name: string;
  description?: string | null;
  basePrice: number;
  durationMin: number;
  durationMax: number;
}): Promise<CatalogStyle> {
  const data = await request<{ style: CatalogStyle }>("/api/styles", {
    method: "POST",
    body: payload,
    auth: true,
  });
  return data.style;
}

export async function updateStyleRequest(
  id: string,
  payload: {
    name: string;
    description?: string | null;
    basePrice: number;
    durationMin: number;
    durationMax: number;
  }
): Promise<CatalogStyle> {
  const data = await request<{ style: CatalogStyle }>(`/api/styles/${id}`, {
    method: "PUT",
    body: payload,
    auth: true,
  });
  return data.style;
}

export async function deleteStyleRequest(id: string): Promise<void> {
  await request<{ deleted: boolean }>(`/api/styles/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function toggleStyleRequest(id: string): Promise<CatalogStyle> {
  const data = await request<{ style: CatalogStyle }>(`/api/styles/${id}/toggle`, {
    method: "PATCH",
    auth: true,
  });
  return data.style;
}

export async function addStyleOptionRequest(
  styleId: string,
  payload: { optionType: string; name: string; priceModifier: number }
): Promise<{ option: StyleCustomizationOption; style: CatalogStyle }> {
  return request<{ option: StyleCustomizationOption; style: CatalogStyle }>(
    `/api/styles/${styleId}/options`,
    {
      method: "POST",
      body: payload,
      auth: true,
    }
  );
}

export async function removeStyleOptionRequest(styleId: string, optionId: string): Promise<CatalogStyle> {
  const data = await request<{ style: CatalogStyle }>(`/api/styles/${styleId}/options/${optionId}`, {
    method: "DELETE",
    auth: true,
  });
  return data.style;
}
