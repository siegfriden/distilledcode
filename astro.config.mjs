// @ts-check
import { defineConfig } from "astro/config";
import shikiCodeMetadata from "./src/plugins/shiki-code-filename";
import rehypeCodeWrapper from "./src/plugins/rehype-code-wrapper";

// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: {
      transformers: [shikiCodeMetadata()],
    },
    rehypePlugins: [rehypeCodeWrapper],
  },
});
