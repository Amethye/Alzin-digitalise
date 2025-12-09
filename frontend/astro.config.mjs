import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [react()],
  output: "server",

  // Astro (dev/preview)
  server: {
    host: true,      // = 0.0.0.0
    port: 4321,
  },

  // Toute la config Vite (HMR, allowedHosts, alias, plugins…)
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        "frontend",
        "alzin.fede.fpms.ac.be",
      ],
      hmr: {
        host: "alzin.fede.fpms.ac.be",
        protocol: "ws",
        clientPort: 80,
      },
    },
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

