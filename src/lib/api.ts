import type { CatalogStyle, StyleCustomizationOption } from "@/types/style";

declare global {
  interface Window {
    /** Emergency override on GitHub Pages: set before app loads in a small inline script. */
    __CROWN_STUDIO_API_BASE__?: string;
  }
}

const TOKEN_KEY = "crownStudioToken";

/**
 * Resolves the API origin at runtime (Pages-friendly): window override → meta tag (injected at build) → Vite env → localhost.
 * Use a repository Actions secret `VITE_API_BASE_URL` (not an Environment-only secret) so the build step receives it.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const fromWindow = window.__CROWN_STUDIO_API_BASE__;
    if (typeof fromWindow === "string" && fromWindow.trim() !== "") {
      return fromWindow.trim().replace(/\/$/, "");
    }
    const meta = document.querySelector('meta[name="crown-studio-api-base"]');
    const fromMeta = meta?.getAttribute("content")?.trim();
    if (fromMeta) {
      return fromMeta.replace(/\/$/, "");
    }
  }
  const envApi = import.meta.env.VITE_API_BASE_URL;
  if (typeof envApi === "string" && envApi.trim() !== "") {
    return envApi.replace(/\/$/, "");
  }
  return "http://localhost:5000";
}

/**
 * Hosts where the leftmost DNS label is NOT a Crown shop slug (e.g. GitHub Pages is user.github.io).
 * Without this, dhre-ann.github.io was misread as shop slug "dhre-ann".
 */
const HOSTS_FIRST_LABEL_IS_NOT_SHOP_SLUG = [
  "github.io",
  "vercel.app",
  "netlify.app",
  "cloudflarepages.dev",
  "pages.dev",
  "herokuapp.com",
  "azurewebsites.net",
];

function isManagedOrPagesHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return HOSTS_FIRST_LABEL_IS_NOT_SHOP_SLUG.some((suffix) => h === suffix || h.endsWith(`.${suffix}`));
}

/**
 * Production: set VITE_SHOP_ROOT_DOMAIN=crownstudio.com so only {slug}.crownstudio.com yields a slug
 * (apex crownstudio.com stays customer / marketing context).
 */
function slugFromConfiguredRootDomain(hostname: string): string | null {
  const root = import.meta.env.VITE_SHOP_ROOT_DOMAIN;
  if (typeof root !== "string" || !root.trim()) {
    return null;
  }
  const rootNorm = root.trim().toLowerCase();
  const hostNorm = hostname.toLowerCase();
  if (hostNorm === rootNorm) {
    return null;
  }
  const suffix = `.${rootNorm}`;
  if (!hostNorm.endsWith(suffix)) {
    return null;
  }
  const sub = hostNorm.slice(0, -suffix.length);
  if (!sub || sub.includes(".")) {
    return null;
  }
  if (sub === "www") {
    return null;
  }
  return sub;
}

/** Dev pattern: kairstyles.localhost → kairstyles (see https://datatracker.ietf.org/doc/html/rfc6761). */
function slugFromLocalhostMultitenancy(hostname: string): string | null {
  if (!hostname.endsWith(".localhost") || hostname === "localhost") {
    return null;
  }
  const sub = hostname.split(".")[0];
  return sub || null;
}

function shopSlugFromEnv(): string | null {
  const envSlug = import.meta.env.VITE_SHOP_SLUG;
  if (typeof envSlug === "string" && envSlug.trim() !== "") {
    return envSlug.trim();
  }
  return null;
}

/** `?shopSlug=` / `?slug=` — global customer app picks a shop without a vanity subdomain. */
function slugFromSearchParams(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const p = new URLSearchParams(window.location.search);
  const s = p.get("shopSlug") || p.get("slug");
  if (s && s.trim()) {
    return s.trim();
  }
  return null;
}

/** On `/shops`, ignore `VITE_SHOP_SLUG` so the directory stays global even in dev defaults. */
function isShopsBrowsePath(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  let path = window.location.pathname.replace(/\/$/, "") || "/";
  if (base && base !== "/" && path.startsWith(base)) {
    path = path.slice(base.length) || "/";
  }
  return path === "/shops";
}

/** Slug implied only by the hostname (vanity subdomain), so links can omit `?shopSlug=`. */
function getCanonicalHostnameSlug(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const hostname = window.location.hostname;
  return slugFromConfiguredRootDomain(hostname) || slugFromLocalhostMultitenancy(hostname);
}

/** True when the hostname alone identifies the tenant (subdomain deploy), not query/env. */
export function hostnameProvidesShopSlug(): boolean {
  return getCanonicalHostnameSlug() !== null;
}

/**
 * Active shop: `/shops` is never tenant-scoped → `?shopSlug=` (browse hand-off) → hostname → env.
 * Query beats hostname so choosing another shop from the directory works on *.localhost too.
 */
export function getShopSlug(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const hostname = window.location.hostname;

  if (isShopsBrowsePath()) {
    return null;
  }

  const fromSearch = slugFromSearchParams();
  if (fromSearch) {
    return fromSearch;
  }

  const fromRoot = slugFromConfiguredRootDomain(hostname);
  if (fromRoot) {
    return fromRoot;
  }

  const fromLocal = slugFromLocalhostMultitenancy(hostname);
  if (fromLocal) {
    return fromLocal;
  }

  if (isManagedOrPagesHostname(hostname)) {
    return shopSlugFromEnv();
  }

  return shopSlugFromEnv();
}

/**
 * Preserve tenant in router links: add `?shopSlug=` when the active slug is not already the hostname slug.
 */
export function withShopSearch(path: string): string {
  const slug = getShopSlug();
  if (!slug) {
    return path;
  }
  const canonical = getCanonicalHostnameSlug();
  if (canonical && slug === canonical) {
    return path;
  }
  const u = new URL(path, "http://local.router");
  u.searchParams.set("shopSlug", slug);
  return `${u.pathname}${u.search}`;
}

/** Carry tenant through booking steps when using query-based shop selection. */
export function appendActiveShopSlugToParams(params: URLSearchParams): void {
  const slug = getShopSlug();
  if (!slug) {
    return;
  }
  const canonical = getCanonicalHostnameSlug();
  if (canonical && slug === canonical) {
    return;
  }
  params.set("shopSlug", slug);
}

export interface PublicShopListing {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  serviceCategory: string | null;
  subscriptionStatus: string;
}

/** Path to a shop’s service catalog on the same SPA host (query-based tenant). */
export function shopServicesPath(slug: string): string {
  const p = new URLSearchParams();
  p.set("shopSlug", slug);
  return `/services?${p.toString()}`;
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
  description?: string | null;
  serviceCategory?: string | null;
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
  const base = getApiBaseUrl();
  const pathWithShop = appendShopSlugQuery(path);
  const url = `${base}${pathWithShop}`;
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: buildHeaders(options.auth ?? false),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const raw = await response.text();

  let payload: ApiResponse<T>;
  try {
    payload = JSON.parse(raw) as ApiResponse<T>;
  } catch {
    const hint =
      raw.trimStart().startsWith("<!") || raw.trimStart().toLowerCase().startsWith("<html")
        ? "Received a web page instead of API data. GitHub Pages only serves static files — set repository secret VITE_API_BASE_URL to your real API (https://…onrender.com), not your Pages site URL. Use Settings → Secrets and variables → Actions (repository secret). Or set window.__CROWN_STUDIO_API_BASE__ before the app loads."
        : `Could not parse JSON from ${url}.`;
    throw new Error(hint);
  }

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
  serviceCategory?: string;
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

export async function fetchShopsForBrowseRequest(): Promise<PublicShopListing[]> {
  const data = await request<{ shops: PublicShopListing[] }>("/api/shops");
  return data.shops;
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
