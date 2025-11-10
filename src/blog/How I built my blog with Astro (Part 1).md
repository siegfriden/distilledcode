---
title: How I built my blog with Astro (Part 1)
description: Setting up pages and shared layout in Astro.
pubDate: 19 Oct 2025 21:00 +0700
tags:
  - astro
  - blog
---

After researching web frameworks for my blog, I was considering either Hugo (based on Go) or Astro. Both work well with Markdown, which makes writing posts simple and straightforward. In the end, I picked Astro because I wanted to customize my own blog template without having to learn Go templating. Astro's syntax is very close to native HTML and JS. And while Hugo builds many times faster, the difference is still in the milliseconds.

## Starting a new Astro blog project

Astro has a feature-complete [blog starter template](https://astro.build/themes/details/blog/), along with many user-made ones on their [themes library](https://astro.build/themes/1/?search=&categories%5B%5D=blog). Still, I wanted to build my blog from scratch. It was my first time using Astro so I wanted to learn the basics along the way without being overwhelmed by too many of the framework's features at once.

I started with Astro's minimal starter template.

```bash
npm create astro@latest -- --template minimal
```

It generated this simple project structure:

```text
/
├── public/...     # static assets (favicons, fonts, etc.)
├── src/
│   └── pages/
│       └── index.astro
├── astro.config.mjs
├── package.json
├── README.md
└── tsconfig.json
```

Here's what they do in a nutshell:

- `public/` → static assets, served directly as-is
- `src/` → components, pages, pre-processed assets
- `src/pages/` → page routes (based on filenames)
- `astro.config.mjs` → plugins

Images can be placed in `public` but Astro recommends keeping them in `src` so they can be transformed and optimized.

## Creating my first Astro page

I started with a simple `src/pages/about.astro` page.

```astro file="src/pages/about.astro"
---

---

<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<title>About Me</title>
	</head>
	<body>
		<h1>About Me</h1>
		<p>Hi, I’m Nathan. I’m a DevOps Engineer and a full-stack developer.</p>
	</body>
</html>
```

The frontmatter (the section between `---` at the top) is a special section in Astro files where we write JS code to define variables, imports, data fetching, etc. This code runs at build time, not in the client’s browser.

For client-side JS, we write them in the `<script>` element:

```astro
---
console.log("This runs once at build time.")
---

<html lang="en">
	...
</html>

<script>
	console.log("This runs in the client's browser.")
</script>
```

## Shared layout in Astro

Since each Astro page must be a complete HTML document, we use layouts to avoid duplicating things like nav headers, metadata, etc. A "layout" is just an Astro "component" that is used in a specific way. The distinction is functional rather than technical.

I created `src/layouts/RootLayout.astro` based on the original `index.astro` file, adding a nav header and a footer. Dynamic content was replaced with props and a `<slot>` element.

```astro file="src/layouts/RootLayout.astro"
---
interface Props {
	title: string;
}

const { title } = Astro.props;
---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
		<meta name="viewport" content="width=device-width" />
		<meta name="generator" content={Astro.generator} />
		<title>{title}</title>
	</head>

	<body>
		<header>
			<nav>
				<a href="/">Home</a>
				<span aria-hidden="true">|</span>
				<a href="/about/">About</a>
			</nav>
		</header>

		<main>
			<!-- page content -->
			<slot />
		</main>

		<footer>© 2025 Nathan Siegfrid</footer>
	</body>
</html>
```

Here's what the page files look like using the layout component:

```astro file="src/pages/index.astro"
---
import RootLayout from "../layouts/RootLayout.astro";
---

<RootLayout title="Home">
	<h1>Home</h1>
</RootLayout>
```

```astro file="src/pages/about.astro"
---
import RootLayout from "../layouts/RootLayout.astro";
---

<RootLayout title="About Me">
	<h1>About Me</h1>
	<p>Hi, I'm Nathan. I'm a DevOps Engineer and a full-stack developer.</p>
</RootLayout>
```

With this, I have the nav header and footer shared across pages. The image below is what the `/about` page looked like.

![About page](assets/How%20I%20built%20my%20blog%20with%20Astro%20(Part%201)%20--%20Image%2001.jpg)

## The next step

In the next part, I will discuss about the method I use to display my Markdown content in Astro. I will build a Markdown blog, with recent posts on the home page, paginated page lists, and table of contents on each post.
