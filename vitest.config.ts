import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    testTimeout: 15_000,
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "scripts/**/*.{test,spec}.{ts,tsx}",
      "supabase/functions/support-chat/**/*.{test,spec}.{ts,tsx}",
    ],
    // These use Deno.test and must run with the Deno runner, not Vitest.
    exclude: [
      "supabase/functions/support-chat/handler-retrieval.test.ts",
      "supabase/functions/support-chat/prompt-injection.test.ts",
      "supabase/functions/support-chat/retrieval.test.ts",
    ],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
