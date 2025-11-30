import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  alias: {
    "@": "./src",
    "@components": "./src/components",
    "@styles": "./src/styles",
    "@layouts": "./src/layouts",
    "@icons": "./src/icons",
    "@images": "./src/assests/images"
  },

  vite: {
    plugins: [tailwindcss()],
  },
});