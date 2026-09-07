import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite is the tool that runs the React app during development
// and bundles it for production. This file is its configuration.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    allowedHosts: ["movierecommender-um4p.onrender.com"],
  },
});
