---
title: How I built my blog with Astro (Part 2)
description: Building an unstyled feature-complete Markdown blog.
pubDate: 26 Oct 2025 18:00 +0700
updatedDate: 09 Nov 2025 12:00 +0700
tags:
  - astro
  - blog
  - markdown
---

I write all my blog posts in Markdown format, including this one. In this post, I'll discuss how we can load those Markdown posts and render them into web pages in Astro. The goal is to have a minimalist feature-complete Markdown blog. I will cover these 3 steps in order:

1. Import Markdown files into Astro collection
2. Render and display the posts with dynamic routing
3. Create a page that lists all blog posts with pagination

## Fetch local Markdown files

For this blog, I'm using Astro's [Content Loader API](https://docs.astro.build/en/reference/content-loader-reference/) to import Markdown files. There are other alternative methods but I won't cover them here.

First, let's create an example Markdown post at `src/blog/hello.md`. Avoid using the top level heading (`#`) in the content, it will be rendered into `<h1>` which should be reserved for the post title.

```markdown src/blog/hello.md
---
title: Hello, World
description: My very first blog post.
pubDate: 25 Oct 2025 17:00 +0700
tags: [personal, blog]
---

## A section title

### A smaller section title

This content is written in Markdown.
```

Inside the frontmatter (between `---`) is the post's metadata. I'm using the [RFC 2822](https://www.w3.org/Protocols/rfc822/#z28) format for `pubDate`, which is also compatible with RSS, as shown in [this Wikipedia example](https://en.wikipedia.org/wiki/RSS#Example).

### Define collections

To define Astro content collections, we need to create `src/content.config.ts`. I defined a `"blog"` collection in the example below.

```js src/content.config.ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Define the "blog" collection.
const blog = blog: defineCollection({
	// Define how to load the Markdown files.
	loader: glob({
		base: "./src/blog",
		pattern: "[^_]*.{md,mdx}",
	}),
	// Define validation schema for frontmatter metadata.
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		tags: z.array(z.string()),
	}),
}),

export const collections = { blog };
```

I set the `loader` to import all Markdown files in `src/blog`, excluding filenames beginning in underscore because I use that for my drafts. If you want to also include files in subdirectories, use the `**/[^_]*.{md,mdx}` pattern. I force myself to only use the base folder to avoid breaking links when I reorganize posts in different subfolders.

### Retrieve collections

To retrieve the `"blog"` collection, we use `getCollection` function from `astro:content`. The function takes the collection name as an argument.

```js src/contentQuery.ts
import { getCollection, type CollectionEntry } from "astro:content";

const posts = await getCollection("blog"));
```

The code above will return an array of `CollectionEntry`. If we print it out with `console.log`, it would look like this:

```json
[
	{
		id: 'hello',
		data: {
			title: 'Hello, World',
			description: 'My very first blog post.',
			pubDate: 2025-10-25T10:00:00.000Z,
			tags: [Array]
		},
		body: '## A section title\n\nThis content is written in Markdown.',
		filePath: 'src/blog/hello.md',
		digest: 'a2fa997f00ea1538',
		rendered: {
			html: '<h2 id="a-section-title">A section title</h2>\n' +
				'<p>This content is written in Markdown.</p>',
			metadata: [Object]
		},
		collection: 'blog'
	}
]
```

The `id` field is a URL-friendly slug, based on the Markdown file's path relative to the `base` defined in `loader`. I will use this later to generate the post's URL. The `data` field contains validated frontmatter metadata. The other fields aren't used directly, but they may be needed when we render the pages.

One thing to note is that this array of posts is not sorted, we have to sort them manually. Since I'm using the collection in multiple places, I made a helper function to retrieve the `blog` collection and immediately sort the posts by `pubDate`.

```js src/content.ts
import { getCollection } from "astro:content";

export async function getAllBlogPosts() {
	const posts = await getCollection("blog"));
	const sortedByDateDesc = posts.sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
	);
	return sortedByDateDesc;
}
```

## Display blog posts

Now that I have the posts in an Astro collection, the next step is to render them as web pages. This can be done with a single file using [dynamic routes](https://docs.astro.build/en/guides/routing/#dynamic-routes).

### Set up dynamic routes

I'm hosting my blog posts at `/blog/my-post-slug`, so I need to define the page at `src/pages/blog/[slug].astro`. The "slug" here will be the param name, this can be any desired string.

If you used the `**/*.md` pattern in the `loader` to include subdirectories, you should name the file `[...slug].astro` so the routes will match the depth of the Markdown file paths. For more details, see the [Astro docs on rest parameters](https://docs.astro.build/en/guides/routing/#rest-parameters).

In the page file, we can define multiple routes with [`getStaticPaths`](https://docs.astro.build/en/reference/routing-reference/#getstaticpaths) function. Use the post `id` to populate the `slug` param, and pass in the `post` object as props.

```jsx src/pages/blog/[slug].astro
---
import { getAllBlogPosts } from "../../content";

export async function getStaticPaths() {
	const posts = await getAllBlogPosts();
	const routes = posts.map((post) => ({
		params: {
			slug: post.id,
		},
		props: { post },
	}));
	return routes;
}
---

<!-- page content -->
```

### Render the Markdown content

With the `post` object in the props, we can use the [`render`](https://docs.astro.build/en/reference/modules/astro-content/#render) function the get its `headings` and the `Content` component. The frontmatter can be accessed from `post.data`. That's everything we need to build the page.

```jsx src/pages/blog/[slug].astro
---
import { render } from "astro:content";
import RootLayout from "../../layouts/RootLayout.astro";
import TableOfContents from "../../components/TableOfContents.astro";

... // getStaticPaths()

const { post } = Astro.props;
const { title, description, pubDate } = post.data;
const { headings, Content } = await render(post);
---

<RootLayout title={title}>
	<header>
		<h1>{title}</h1>
		<p>{description}</p>
		<p>Published on {pubDate.toLocaleString()}</p>
		<hr />
	</header>

	{headings.length > 0 && (
		<nav>
			<h2>Table of contents</h2>
			<ul>
				{headings.map((heading) => (
					<li style={`margin-left: ${(heading.depth - 2) * 1.5}rem;`}>
						<a href={`#${heading.slug}`}>{heading.text}</a>
					</li>
				))}
			</ul>
			<hr />
		</nav>
	)}

	<Content />
</RootLayout>
```

Using the example Markdown file before, we should see the page below on `/blog/hello`.

![Example blog post](assets/How%20I%20built%20my%20blog%20with%20Astro%20(Part%202)%20--%20Image%2001.jpg)

### Style the Markdown content

I wasn't planning to add any style to the blog at this stage, but I needed to fix some display problems on the content. The code below prevents images from overflowing on smaller screens and sets the tab size to 4 (defaults to 8).

```jsx
<style is:global>
	/* this doesn't work on <Content /> without is:global */

	/* fits images on smaller screens */
	.content img {
		max-width: 100%;
		height: auto; /* ensure proper aspect ratio */
	}

	/* sets the tab size on code blocks */
	.content pre,
	.content code {
		tab-size: 4;
	}
</style>
```

## List of blog posts

The last step is to list all our blog posts on `/blog` and show some recent posts on the home page. Let's first create a simple `PostList.astro` component.

```jsx src/components/PostList.astro
---
import type { CollectionEntry } from "astro:content";
import FormattedDate from "./FormattedDate.astro";

interface Props {
	posts: CollectionEntry<"blog">[];
}

const { posts } = Astro.props;
---

<ul>
	{
		posts.map(({ id, data }) => (
			<li>
				<article>
					<div>
						<a href={`/blog/${id}/`}>{data.title}</a>
					</div>
					<p>{data.description}</p>
					<p>{data.pubDate.toLocaleString()}</p>
				</article>
			</li>
		))
	}
</ul>
```

### Pagination

Pagination in Astro is achieved using dynamic routes, which will generate a static path for each page. URL query string (`?page=2`) is supported in [SSR mode](https://docs.astro.build/en/guides/on-demand-rendering/), but for a simple blog, I won't be using that.

Astro has a built-in [`paginate`](https://docs.astro.build/en/reference/routing-reference/#paginate) function for dividing content into separate pages. We get that function from the argument on `getStaticPaths()`. The function assumes a `[page]` param.

For the filename, we have two options, which will affect the URL of the first page:

- `[page].astro` will generate `/blog/1`, `/blog/2`, `/blog/3`, etc.
- `[...page].astro` will generate `/blog`, `/blog/2`, `/blog/3`, etc.

For now, I'll keep my main list page at `/blog`. I might change this later, maybe repurposing `/blog` for featured posts and moving the first paginated list to `/blog/1`.

On each page, `paginate` passes in a `page` object as props. We can use it to create a page navigation. To display the list of posts, pass in `page.data` to our `PostList` component. The amount of page and items are determined by the `pageSize` defined in `paginate`.

```jsx src/pages/blog/[...page].astro
---
import type { GetStaticPathsOptions } from "astro";
import RootLayout from "../../layouts/RootLayout.astro";
import PostList from "../../components/PostList.astro";
import Pagination from "../../components/Pagination.astro";
import { getAllBlogPosts } from "../../content";

export async function getStaticPaths({ paginate }: GetStaticPathsOptions) {
	const posts = await getAllBlogPosts();
	const routes = paginate(posts, { pageSize: 3 });
	return routes;
}

const { page } = Astro.props;
---

<RootLayout title="Blog">
	<h1>Blog</h1>
	<PostList posts={page.data} />

	<nav aria-label="Pagination">
		{page.url.prev && <a href={page.url.prev}>← Previous</a>}
		<span>Page {page.currentPage} of {page.lastPage}</span>
		{page.url.next && <a href={page.url.next}>Next →</a>}
	</nav>
</RootLayout>
```

And finally, add `/blog/` to the header nav in `RootLayout`.

Now we have a working paginated post list.

![Paginated list of all blog posts](assets/How%20I%20built%20my%20blog%20with%20Astro%20(Part%202)%20--%20Image%2002.jpg)

### Recent posts on the home page

This one is very simple, just pass in the desired slice of posts to the `PostList` component.

```jsx src/pages/index.astro
---
import PostList from "../components/PostList.astro";
import RootLayout from "../layouts/RootLayout.astro";
import { getAllBlogPosts } from "../content";

const posts = await getAllBlogPosts();
const recentPosts = posts.slice(0, 3);
---

<RootLayout title="Home">
	<h1>Home</h1>
	...
	<section>
		<h2>Recent posts</h2>
		<PostList posts={recentPosts} />
		<a href="/blog/">See all posts →</a>
	</section>
</RootLayout>
```

## Fixing the rough edges

Troubleshooting notes for type errors and rendering quirks I found along the way.

### Type error on `astro:content` import

The `astro:content` module depends on `.astro` folder in the project root, which is generated when we run `astro dev` (`npm run dev`). If we remove it, we'll encounter some TypeScript errors.

![Type error on `astro:content` import](assets/How%20I%20built%20my%20blog%20with%20Astro%20(Part%202)%20--%20Image%2003.jpg)

This isn't a major issue, but I prefer not having people see errors immediately after cloning the source code. Fortunately, they're easy to fix.

#### Cannot find module `astro:content`

To fix this, add the `astro/client` type to `tsconfig.json`.

```json tsconfig.json
{
	...
	"compilerOptions": {
		"types": ["astro/client"]
	}
}
```

#### Implicit any type

The root cause of this error is that the type definition for `getCollection` isn't available until the `.astro` folder is generated. Without that folder, the return type of `getCollection()` becomes `any`. Calling `.map()` or `.sort()` on it triggers the "implicit 'any'" error. To fix this, we need to explicitly type the return value.

```js src/content.ts
import { getCollection } from "astro:content";

export async function getAllBlogPosts() {
	const posts = (await getCollection("blog")) as CollectionEntry<"blog">[];
	const sortedByDateDesc = posts.sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
	);
	return sortedByDateDesc;
}
```

### Type error on `paginate` function

Astro doesn't provide type definitions for `getStaticPaths`, even with `.astro` folder present. Following the docs for [`paginate`](https://docs.astro.build/en/reference/routing-reference/#paginate) will result in the error below.

![Type error on paginate function](assets/How%20I%20built%20my%20blog%20with%20Astro%20(Part%202)%20--%20Image%2004.jpg)

Therefore, we need to manually type the function arguments.

```jsx
import type { GetStaticPathsOptions } from "astro";

export async function getStaticPaths({ paginate }: GetStaticPathsOptions) {
	...
}
```

### Unwanted whitespaces on `FormattedDate` component

Astro's blog template uses the `<FormattedDate>` element for accessibility.

```jsx src/components/FormattedDate.astro
---
interface Props {
  date: Date;
}

const { date } = Astro.props;
---

<time datetime={date.toISOString()}>
	{
		date.toLocaleDateString("en-us", {
			year: "numeric",
			month: "short",
			day: "numeric",
		})
	}
</time>
```

 This component adds unexpected whitespaces around the content. The rendered HTML will look like `<time> 25 Oct 2025 </time>`. These spaces appear when we wrap the component in parenthesis or brackets.

![](assets/How%20I%20built%20my%20blog%20with%20Astro%20(Part%202)%20--%20Image%2005.jpg)

This problem occurs when the `<time>` element is split across multiple lines. To work around this, we need to place the opening and closing `<time>` tags on the same line.

```jsx src/components/FormattedDate.astro
---
interface Props {
  date: Date;
}

const { date } = Astro.props;

const isoDate = date.toISOString().split("T")[0];
const localeDate = date.toLocaleDateString();
---

<time datetime={isoDate}>{localeDate}</time>
```

## What's next

The blog is now complete and functional. In future posts, I may cover additional features such as RSS, search functionality, and displaying file names on code blocks.
