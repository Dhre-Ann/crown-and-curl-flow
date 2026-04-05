import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// For GitHub project Pages use `npm run build:gh-pages` (or set VITE_BASE_PATH to `/<repo>/`).
export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, "src");
  const fileEnv = loadEnv(mode, envDir, "");
  const apiBaseFromFiles = (fileEnv.VITE_API_BASE_URL || "").trim();

  return {
    base: process.env.VITE_BASE_PATH || "/",
    envDir,
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      // Embed API URL in index.html so GitHub Pages still resolves the API if the JS bundle env is wrong.
      {
        name: "inject-crown-studio-api-meta",
        transformIndexHtml(html) {
          const fromShell = (process.env.VITE_API_BASE_URL || "").trim();
          const apiBase = fromShell || apiBaseFromFiles;
          if (!apiBase) {
            return html;
          }
          const escaped = apiBase.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
          if (/<meta\s+name="crown-studio-api-base"/i.test(html)) {
            return html.replace(
              /<meta\s+name="crown-studio-api-base"\s+content="[^"]*"\s*\/?>/i,
              `<meta name="crown-studio-api-base" content="${escaped}" />`
            );
          }
          return html.replace("</head>", `    <meta name="crown-studio-api-base" content="${escaped}" />\n  </head>`);
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
  };
});
