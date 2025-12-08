// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";


import node from "@astrojs/node";



export default defineConfig({
  integrations: [react()],

  

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  output: "server",

  adapter: node({
    mode: "standalone",
  }),
});

