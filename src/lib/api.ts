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
    throw new Error(payload.success ? "Request failed" : payload.error);
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
