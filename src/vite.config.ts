import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // Since your files are in a "pile", the base is just the root
  base: "./", 
  plugins: [react()],
  resolve: {
    alias: {
      // This was pointing to "src", now it points to "right here"
      "@": path.resolve(__dirname, "."),
      // Since your images/models are also in the pile, point assets here too
      "@assets": path.resolve(__dirname, "."), 
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // This helps Vite handle the "pile" better
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
});
