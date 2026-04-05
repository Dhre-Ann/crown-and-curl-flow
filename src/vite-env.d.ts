/// <reference types="vite/client" />

declare global {
  interface Window {
    /**
     * Optional runtime API root (https://...) when the bundle was built without VITE_API_BASE_URL.
     * Set via a small script in index.html before the app loads — useful for GitHub Pages without rebuilding.
     */
    __CROWN_STUDIO_API_BASE__?: string;
  }
}

export {};
