import { defineConfig } from "vite";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { resolvePublicSiteOrigin } from "./src/lib/public-site-origin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: "replace-public-site-origin",
      transformIndexHtml(html: string) {
        const env = loadEnv(mode, process.cwd(), "");
        const origin = resolvePublicSiteOrigin(env.VITE_PUBLIC_SITE_URL);
        return html.replace(/https:\/\/filesmart-demo\.netlify\.app/g, origin);
      },
    },
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
