import { defineConfig } from "vite";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { resolvePublicSiteOrigin } from "./src/lib/public-site-origin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const origin = resolvePublicSiteOrigin(env.VITE_PUBLIC_SITE_URL);

  return {
    plugins: [
      react(),
      {
        name: "replace-public-site-origin",
        transformIndexHtml(html: string) {
          return html.replace(/https:\/\/filesmart-demo\.netlify\.app/g, origin);
        },
        writeBundle(options: { dir?: string; file?: string }) {
          const outputDir = options.dir ?? (options.file ? path.dirname(options.file) : path.resolve("dist"));
          if (mode === "public") {
            const publicEntry = path.resolve(outputDir, "public.html");
            const indexEntry = path.resolve(outputDir, "index.html");
            if (fs.existsSync(publicEntry)) fs.renameSync(publicEntry, indexEntry);
          }
          for (const fileName of ["robots.txt", "sitemap.xml"]) {
            const filePath = path.resolve(outputDir, fileName);
            if (!fs.existsSync(filePath)) continue;

            const source = fs.readFileSync(filePath, "utf8");
            fs.writeFileSync(filePath, source.replace(/https:\/\/filesmart-demo\.netlify\.app/g, origin));
          }
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
    ...(mode === "public" ? {
      build: {
        rollupOptions: {
          input: { index: path.resolve(__dirname, "public.html") },
          output: {
            manualChunks(id: string) {
              if (!id.includes("node_modules")) return;

              if (/[\\/]node_modules[\\/](react|react-dom|scheduler|use-sync-external-store)[\\/]/.test(id)) {
                return "vendor-react";
              }
              if (id.includes("/node_modules/@supabase/")) return "vendor-supabase";
              if (id.includes("/node_modules/@radix-ui/")) return "vendor-radix";
              if (id.includes("/node_modules/lucide-react/")) return "vendor-icons";
              if (/[\\/]node_modules[\\/](react-router|react-router-dom|@remix-run)[\\/]/.test(id)) {
                return "vendor-router";
              }
            },
          },
        },
      },
    } : {}),
  };
});
