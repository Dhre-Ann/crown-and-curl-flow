/**
 * GitHub Actions overwrites this file before `vite build` when the repository secret
 * VITE_API_BASE_URL is set. You can also set the URL here manually (no trailing slash).
 * Loaded before the app so the API works on static hosting without rebuilding for URL changes.
 */
window.__CROWN_STUDIO_API_BASE__ = "";
