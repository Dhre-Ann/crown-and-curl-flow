/**
 * GitHub Pages / static hosting: if the build did not receive VITE_API_BASE_URL, set your API origin here
 * (no trailing slash), then redeploy or commit. Example:
 *   window.__CROWN_STUDIO_API_BASE__ = "https://your-service.onrender.com";
 *
 * Repository Actions secret VITE_API_BASE_URL should still be set when possible so the value is baked in at build time.
 */
window.__CROWN_STUDIO_API_BASE__ = window.__CROWN_STUDIO_API_BASE__ || "";
