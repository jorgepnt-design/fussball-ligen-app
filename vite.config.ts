import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Fuer GitHub Pages: an den Repo-Namen anpassen, falls anders.
  base: "/fussball-ligen-app/",
  plugins: [react()],
  server: { port: 5174, strictPort: true },
});
