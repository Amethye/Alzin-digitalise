// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";


import node from "@astrojs/node";



export default defineConfig({
  integrations: [react()],

  //server: {
    //host: true,              // = 0.0.0.0 en dev
    //port: 4321,
    server: {
      host: '0.0.0.0', // accessible depuis l’extérieur
      port: 4321,
      strictPort: true,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'frontend',
        'alzin.fede.fpms.ac.be'
      ],
      hmr: {
        host: 'alzin.fede.fpms.ac.be',
        protocol: 'ws', // ⚠️ HTTP => ws
        clientPort: 80  // ⚠️ puisque ton Nginx écoute sur 80
      }
  }

  output: "server"
   
  //vite: {
   // plugins: [
    //  tailwindcss(),
   // ],
 // },

,

  adapter: node({
    mode: "standalone",
  }),
});