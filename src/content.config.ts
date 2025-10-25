import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({
    // Only import the base path, don't include subfolders.
    // This forces unique titles across the blog and
    // ensure links don't break when reorganizing subfolders.
    // When doing `rsync` from Obsidian, flatten all files to the base path.
    base: "./src/blog",
    pattern: "[^_]*.{md,mdx}",
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().nullish(),
      tags: z.array(z.string()),
      image: image().optional(),
    }),
});

export const collections = { blog };
