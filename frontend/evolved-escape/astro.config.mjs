import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import speedInsights from "@vercel/speed-insights/astro";
import font from "astro-font";

// Exemple si tu utilises Tailwind
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [
    react(),
    tailwind(),
    speedInsights(),
    font({
      provider: "google",
      families: ["Poppins:300,400,600"], // identique CAP
    }),
  ],
});