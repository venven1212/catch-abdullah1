import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // Base "./" ensures the site works even if it's not at the domain root
  base: "./", 
  plugins: [react()],
  resolve: {
    alias: {
      // Points "@" specifically to your new src folder
      "@": path.resolve(__dirname, "src"),
      // Points "@assets" specifically to your new public folder
      "@assets": path.resolve(__dirname, "public"), 
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // We can simplify rollupOptions now that index.html is in the root
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
});
