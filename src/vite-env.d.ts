/// <reference types="vite/client" />

interface Window {
  /** Optional override for API origin on static hosts (GitHub Pages). Set in public/api-runtime-config.js */
  __CROWN_STUDIO_API_BASE__?: string;
}
