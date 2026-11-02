import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { validateBuildEnv } from "./scripts/validate-env.mjs";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  if (command === "build") validateBuildEnv(loadEnv(mode, process.cwd(), "VITE_"));
  return ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["sb-1luv0hyzcvfm.vercel.run"],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
});
