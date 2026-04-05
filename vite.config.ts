import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// For GitHub project Pages use `npm run build:gh-pages` (or set VITE_BASE_PATH to `/<repo>/`).
export default defineConfig(() => ({
  base: process.env.VITE_BASE_PATH || "/",
  envDir: path.resolve(__dirname, "src"),
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
