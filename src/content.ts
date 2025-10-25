import { getCollection, type CollectionEntry } from "astro:content";

export async function getAllBlogPosts() {
  const posts = (await getCollection("blog")) as CollectionEntry<"blog">[];
  const sortedByDateDesc = posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
  return sortedByDateDesc;
}
