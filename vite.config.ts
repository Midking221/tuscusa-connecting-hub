import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  define: {
    'process.env.LOVABLE_TAGGER': 'false',
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro(),
    viteReact()
  ],
  build: {
    cssMinify: false,
  },
});