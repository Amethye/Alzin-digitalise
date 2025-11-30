import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

export default defineConfig({
  alias: {
    "@": "./src",
    "@components": "./src/components",
    "@styles": "./src/styles",
    "@layouts": "./src/layouts",
    "@icons": "./src/icons",
    "@images": "./src/assets/images"
  },
  
  integrations : [tailwind()],
});