// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";


import node from "@astrojs/node";


export default defineConfig({
  integrations: [react()],
  output: "server",
  server: {
    host: true,           
    port: 4321,
  },
  
  vite: {
    plugins: [
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@components": "/src/components",
        "@layouts": "/src/layouts",
        "@images": "/src/assets/images",
        "@icons": "/src/icons",
      },
    },
  },

  adapter: node({
    mode: "standalone",
  }),
});
