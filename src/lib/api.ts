import type { CatalogStyle, StyleCustomizationOption } from "@/types/style";

const envApi = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL =
  typeof envApi === "string" && envApi.trim() !== ""
    ? envApi.replace(/\/$/, "")
    : "http://localhost:5000";
const TOKEN_KEY = "crownStudioToken";

/** Shop storefront tenant: subdomain in production, VITE_SHOP_SLUG in dev, or null on main domain (customer context). */
export function getShopSlug(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }

  const envSlug = import.meta.env.VITE_SHOP_SLUG;
  if (typeof envSlug === "string" && envSlug.trim() !== "") {
    return envSlug.trim();
  }

  return null;
}

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

export interface MyAppointment {
  id: string;
  date: string;
  time: string;
  status: string;
  depositAmount: number;
  totalPrice: number;
  shop: { name: string; slug: string };
  style: { name: string };
}

export interface CustomerTech {
  shopName: string;
  slug: string;
  lastAppointmentDate: string;
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
  };

  const slug = getShopSlug();
  if (slug) {
    headers["x-shop-slug"] = slug;
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * When a shop slug exists, add it to the query so links opened without custom headers still resolve the tenant
 * (see server shopResolver: originalUrl / query).
 */
function appendShopSlugQuery(path: string): string {
  const slug = getShopSlug();
  if (!slug) {
    return path;
  }
  const u = new URL(path, "http://local.fake");
  if (!u.searchParams.has("shopSlug") && !u.searchParams.has("slug")) {
    u.searchParams.set("shopSlug", slug);
  }
  return `${u.pathname}${u.search}`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const pathWithShop = appendShopSlugQuery(path);
  const response = await fetch(`${API_BASE_URL}${pathWithShop}`, {
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

export async function registerCustomerRequest(payload: { name: string; email: string; password: string }) {
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

export async function fetchMyAppointmentsRequest(): Promise<MyAppointment[]> {
  const data = await request<{ appointments: MyAppointment[] }>("/api/appointments/mine", {
    auth: true,
  });
  return data.appointments;
}

export async function fetchCustomerTechsRequest(): Promise<CustomerTech[]> {
  const data = await request<{ techs: CustomerTech[] }>("/api/customer/techs", {
    auth: true,
  });
  return data.techs;
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

/**
 * Build a URL to open a shop's storefront. On localhost, subdomain.localhost hits the same dev server when supported.
 */
export function getShopStorefrontHref(slug: string): string {
  if (typeof window === "undefined") {
    return `https://${slug}.crownstudio.com/`;
  }
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const p = port || "8080";
    return `${protocol}//${slug}.localhost:${p}/`;
  }

  const parts = hostname.split(".");
  if (parts.length >= 3) {
    const rest = parts.slice(1).join(".");
    const portSeg = port ? `:${port}` : "";
    return `${protocol}//${slug}.${rest}${portSeg}/`;
  }

  return `https://${slug}.crownstudio.com/`;
}
