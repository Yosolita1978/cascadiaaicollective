# How to Add a Blog with Sveltia CMS to a Static HTML Site (Deployed on AWS Amplify)

## The Starting Point

A single-page static website — one `index.html`, one `styles.css`, two background images. No framework, no build tool, no package.json. Deployed on AWS Amplify from a GitHub repo.

**The goal**: Add a blog that can be managed through a browser-based CMS, without switching to a heavy framework.

**The stack we chose**:
- **Eleventy (11ty)** — minimal static site generator that turns Markdown into HTML
- **Sveltia CMS** — modern, open-source CMS that stores content as Markdown files in your Git repo
- **AWS Amplify** — hosting with automatic deploys on every push

**Why this stack**:
- Eleventy works with your existing HTML/CSS — no rewrite needed
- Sveltia CMS is a drop-in replacement for Decap CMS (formerly Netlify CMS) but doesn't require Netlify Identity or an OAuth proxy
- The whole blog is just Markdown files in a folder — no database, no external CMS service
- Works on any hosting provider (Amplify, Vercel, Netlify, GitHub Pages, etc.)

---

## Phase 1: Adding Eleventy as a Static Site Generator

### Why do you need Eleventy?

A blog needs many pages (one per post), and those posts will be written in Markdown. Something needs to convert those `.md` files into finished HTML pages with your site's header, footer, and styles. That's what Eleventy does — it runs at build time, reads your Markdown, wraps it in templates, and outputs plain HTML.

Your site visitors never know Eleventy exists. They still get plain HTML/CSS.

### Step 1.1 — Initialize a Node.js project

```bash
npm init -y
```

This creates a `package.json` file — a manifest that tracks your project's dependencies.

### Step 1.2 — Install Eleventy

```bash
npm install @11ty/eleventy
```

Downloads Eleventy into `node_modules/` and records it as a dependency.

### Step 1.3 — Restructure files into src/

Move your site files into a source directory:

```
your-project/
├── src/
│   ├── index.html
│   ├── styles.css
│   └── (your images)
├── package.json
└── .eleventy.js
```

**Why**: Eleventy needs a clean separation between "source files you edit" (`src/`) and "generated output" (`_site/`). Without this, Eleventy would try to process `node_modules/`, `package.json`, etc.

### Step 1.4 — Create the Eleventy config file

Create `.eleventy.js` at the project root:

```js
module.exports = function(eleventyConfig) {
  // Date filter for Nunjucks templates
  eleventyConfig.addFilter("date", function(value, format) {
    const date = new Date(value);
    const months = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];
    if (format === "%Y-%m-%d") {
      return date.toISOString().split("T")[0];
    }
    if (format === "%B %d, %Y") {
      return `${months[date.getUTCMonth()]} ${String(date.getUTCDate()).padStart(2, "0")}, ${date.getUTCFullYear()}`;
    }
    return date.toLocaleDateString("en-US");
  });

  // Copy these files as-is (no processing)
  eleventyConfig.addPassthroughCopy("src/styles.css");
  eleventyConfig.addPassthroughCopy("src/*.png");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/admin");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};
```

Key concepts:
- **`addPassthroughCopy`** — tells Eleventy to copy these files as-is to `_site/` without processing them
- **`input: "src"`** — look for source files here
- **`output: "_site"`** — write the generated site here
- **`includes: "_includes"`** — layout templates live in `src/_includes/`
- **`addFilter("date")`** — custom date formatting filter (Eleventy v3 doesn't include one for Nunjucks)

### Step 1.5 — Create a base layout template

Create `src/_includes/base.njk`. This is a Nunjucks template that contains the shared "shell" of every page — the `<head>`, fonts, styles link, and footer.

```njk
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
  {% if description %}
  <meta name="description" content="{{ description }}">
  {% endif %}
  {% if canonical %}
  <link rel="canonical" href="{{ canonical }}">
  {% endif %}

  <!-- Open Graph -->
  <meta property="og:title" content="{{ ogTitle or title }}">
  {% if description %}
  <meta property="og:description" content="{{ ogDescription or description }}">
  {% endif %}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Your Site Name">

  <!-- Twitter / X Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{{ ogTitle or title }}">

  {% if preloadImage %}
  <link rel="preload" as="image" href="{{ preloadImage }}">
  {% endif %}

  <!-- Your fonts and CSS -->
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a href="#main" class="skip-link">Skip to content</a>

  {{ content | safe }}

  <footer class="footer">
    <!-- your footer content -->
  </footer>
</body>
</html>
```

The key line is `{{ content | safe }}` — this is where each page's unique content gets injected.

### Step 1.6 — Update index.html to use the layout

Add **front matter** (a YAML block between `---` lines) at the top of `index.html`:

```html
---
layout: base.njk
title: "Your Page Title"
description: "Your meta description"
canonical: "https://yoursite.com/"
---

<!-- Only the page-specific content remains here -->
<header class="hero">
  ...
</header>

<main id="main">
  ...
</main>
```

**What was removed** from `index.html` (now lives in `base.njk`):
- `<!DOCTYPE html>`, `<html>`, `<head>`, `</head>`, `<body>` — the HTML shell
- Font links, CSS link
- Skip link
- Footer
- `</body>`, `</html>`

**What was kept**: everything visible — the hero, all sections, all content.

Structured data (JSON-LD `<script>` tags) can stay in the page content — Google reads them anywhere in the HTML, not just in `<head>`.

### Step 1.7 — Add build scripts to package.json

```json
"scripts": {
  "dev": "eleventy --serve",
  "build": "eleventy"
}
```

- `npm run dev` — local dev server with live reload at `localhost:8080`
- `npm run build` — generates `_site/` for production

### Step 1.8 — Add .gitignore and verify

```
node_modules/
_site/
.DS_Store
```

Run `npm run dev` and verify the site looks identical to the original.

---

## Phase 2: Build the Blog Infrastructure

### Step 2.1 — Create the blog directory

```bash
mkdir -p src/blog
```

### Step 2.2 — Create default settings for all posts

Create `src/blog/blog.json`:

```json
{
  "layout": "post.njk",
  "tags": "blog"
}
```

This is an Eleventy **directory data file**. It applies to every file in `src/blog/`:
- Every post automatically uses the `post.njk` template
- Every post is tagged `"blog"`, which creates a collection you can loop through

### Step 2.3 — Create the blog post template

Create `src/_includes/post.njk`:

```njk
---
layout: base.njk
---

<main id="main" class="post-page">
  <article class="container post">
    <header class="post-header">
      <a href="/blog/" class="post-back">&larr; Back to blog</a>
      <h1 class="post-title">{{ title }}</h1>
      <div class="post-meta">
        {% if author %}<span class="post-author">By {{ author }}</span>{% endif %}
        <time class="post-date" datetime="{{ date | date("%Y-%m-%d") }}">{{ date | date("%B %d, %Y") }}</time>
      </div>
      {% if summary %}
      <p class="post-summary">{{ summary }}</p>
      {% endif %}
    </header>

    {% if featuredImage %}
    <figure class="post-featured-image">
      <img src="{{ featuredImage }}" alt="{{ featuredImageAlt or title }}">
      {% if featuredImageCaption %}
      <figcaption>{{ featuredImageCaption }}</figcaption>
      {% endif %}
    </figure>
    {% endif %}

    <div class="post-body">
      {{ content | safe }}
    </div>
  </article>
</main>
```

This template inherits from `base.njk` (so it gets fonts, CSS, footer) and renders: back link, title, author, date, summary, optional featured image, then the Markdown body converted to HTML.

### Step 2.4 — Create the blog listing page

Create `src/blog/index.njk`:

```njk
---
layout: base.njk
title: "Blog — Your Site Name"
description: "Articles and tutorials from our community."
eleventyExcludeFromCollections: true
permalink: /blog/
---

<main id="main" class="blog-page">
  <div class="container">
    <a href="/" class="post-back">&larr; Home</a>
    <h1 class="section-title">Blog</h1>
    <p class="blog-intro">Articles, tutorials, and stories from our community.</p>

    <div class="blog-list">
      {% for post in collections.blog | reverse %}
      <article class="blog-card">
        {% if post.data.featuredImage %}
        <a href="{{ post.url }}" class="blog-card-image-link">
          <img src="{{ post.data.featuredImage }}" alt="{{ post.data.featuredImageAlt or post.data.title }}" class="blog-card-image">
        </a>
        {% endif %}
        <div class="blog-card-body">
          <h2 class="blog-card-title">
            <a href="{{ post.url }}">{{ post.data.title }}</a>
          </h2>
          <div class="post-meta">
            {% if post.data.author %}<span class="post-author">{{ post.data.author }}</span>{% endif %}
            <time class="post-date" datetime="{{ post.date | date("%Y-%m-%d") }}">{{ post.date | date("%B %d, %Y") }}</time>
          </div>
          {% if post.data.summary %}
          <p class="blog-card-summary">{{ post.data.summary }}</p>
          {% endif %}
          <a href="{{ post.url }}" class="blog-card-link">Read more &rarr;</a>
        </div>
      </article>
      {% endfor %}
    </div>
  </div>
</main>
```

**Critical detail**: `eleventyExcludeFromCollections: true` prevents this listing page from appearing as a blog post itself. Without it, `blog.json` would tag it as `"blog"` and it would show up in its own list.

### Step 2.5 — Write a sample blog post

Create `src/blog/2026-02-10-your-first-post.md`:

```markdown
---
title: "Your First Blog Post Title"
date: 2026-02-10
author: "Your Name"
summary: "A short description that appears on the blog listing page."
featuredImage: "/images/blog/your-image.png"
featuredImageAlt: "Description of the image"
featuredImageCaption: ""
---

Your Markdown content goes here.

## A section heading

Regular paragraphs, **bold text**, [links](https://example.com), and everything else Markdown supports.

```code blocks work too```
```

**Featured image recommendations**: 1440x810px (16:9 aspect ratio, 2x retina), JPG or PNG, under 500KB. Store in `src/images/blog/`.

### Step 2.6 — Style the blog pages

Add CSS for `.blog-page`, `.blog-card`, `.post-page`, `.post-body`, etc. Key things to style:

- **Blog listing**: card grid (1 column mobile, 2 columns tablet+), image with zoom on hover, staggered fade-in animations
- **Blog post**: large serif title, author/date meta, featured image with rounded corners, prose styles for the Markdown body
- **Post body prose**: headings with top borders as section dividers, custom bullet markers, styled blockquotes, dark code blocks with light text, link underline animations
- **Dark mode**: override code block backgrounds, inline code, blockquote backgrounds

### Step 2.7 — Add blog navigation links

Add a "Blog" link in at least two places:
1. Somewhere prominent on the landing page (a card, a nav link, a section link)
2. The footer (since `base.njk` footer appears on every page)

---

## Phase 3: Configure AWS Amplify

Create `amplify.yml` at the project root:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npx eleventy
  artifacts:
    baseDirectory: _site
    files:
      - '**/*'
```

This tells Amplify: install dependencies, run Eleventy, serve the `_site/` folder.

**For other hosting providers**:
- **Vercel**: create `vercel.json` with `"buildCommand": "npx eleventy"` and `"outputDirectory": "_site"`
- **Netlify**: create `netlify.toml` with `[build] command = "npx eleventy"` and `publish = "_site"`
- **GitHub Pages**: use a GitHub Actions workflow that runs `npx eleventy` and deploys `_site/`

Push and verify the deploy works.

---

## Phase 4: Install Sveltia CMS

### Why Sveltia CMS?

Sveltia CMS is the modern successor to Decap CMS (formerly Netlify CMS). Key advantages:
- **Same config format** as Decap — all Decap documentation applies
- **No OAuth proxy needed** — sign in with a GitHub Personal Access Token
- **Works on any host** — no vendor lock-in (Netlify, Vercel, Amplify, anywhere)
- **Smaller** (300KB vs 1.5MB) and actively maintained
- **Important context**: Netlify Identity and Git Gateway were deprecated in 2025, so the old "easy path" with Decap CMS no longer works. Sveltia CMS solves this cleanly.

### Step 4.1 — Create the admin page

Create `src/admin/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Content Manager</title>
</head>
<body>
  <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
</body>
</html>
```

That's the entire admin UI — one script tag.

### Step 4.2 — Create the CMS config

Create `src/admin/config.yml`:

```yaml
backend:
  name: github
  repo: your-username/your-repo-name
  branch: main

media_folder: src/images/blog
public_folder: /images/blog

collections:
  - name: blog
    label: Blog
    folder: src/blog
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Date", name: "date", widget: "datetime", date_format: "YYYY-MM-DD", time_format: false }
      - { label: "Author", name: "author", widget: "string" }
      - { label: "Summary", name: "summary", widget: "text" }
      - { label: "Featured Image", name: "featuredImage", widget: "image", required: false }
      - { label: "Featured Image Alt Text", name: "featuredImageAlt", widget: "string", required: false }
      - { label: "Featured Image Caption", name: "featuredImageCaption", widget: "string", required: false }
      - { label: "Body", name: "body", widget: "markdown" }
```

Key settings:
- **`backend.repo`** — your GitHub `username/repo-name`
- **`media_folder`** — where uploaded images are saved in the repo
- **`public_folder`** — the URL path to those images on the live site
- **`slug`** — filenames follow the pattern `2026-02-10-post-title.md`
- **`fields`** — matches the front matter structure of your blog posts

### Step 4.3 — Make sure Eleventy copies the admin folder

In `.eleventy.js`, add:

```js
eleventyConfig.addPassthroughCopy("src/admin");
```

### Step 4.4 — Deploy and create a GitHub token

1. Push to GitHub → Amplify rebuilds automatically
2. Go to `https://yoursite.com/admin/`
3. Sveltia CMS asks for a GitHub Personal Access Token:
   - Go to [github.com/settings/tokens](https://github.com/settings/tokens)
   - Click **"Generate new token (classic)"**
   - Name it (e.g., `sveltia-cms`)
   - Select scope: **`repo`**
   - Generate and copy the token
   - Paste into Sveltia CMS
4. You're in! Create a post, hit publish, and it commits to your repo → triggers a rebuild → post goes live.

---

## Final Project Structure

```
your-project/
├── src/
│   ├── _includes/
│   │   ├── base.njk          ← shared HTML shell (head, footer)
│   │   └── post.njk          ← blog post template
│   ├── admin/
│   │   ├── index.html         ← Sveltia CMS admin page
│   │   └── config.yml         ← CMS configuration
│   ├── blog/
│   │   ├── blog.json          ← default settings for all posts
│   │   ├── index.njk          ← blog listing page
│   │   └── *.md               ← blog posts (Markdown)
│   ├── images/
│   │   └── blog/              ← uploaded blog images
│   ├── index.html             ← landing page
│   └── styles.css             ← all styles
├── _site/                     ← generated output (gitignored)
├── .eleventy.js               ← Eleventy config
├── amplify.yml                ← AWS Amplify build config
├── package.json
├── package-lock.json
└── .gitignore
```

## The Content Workflow

1. Go to `yoursite.com/admin/`
2. Sign in with your GitHub token
3. Click "New Blog" → fill in title, author, date, summary, body
4. Optionally upload a featured image
5. Click "Publish"
6. Sveltia CMS commits the `.md` file (and image) to your GitHub repo
7. Amplify detects the push and rebuilds the site
8. The new post is live in ~1-2 minutes

No database. No external CMS service. Just Markdown files in Git.

---

## Gotchas We Hit Along the Way

### 1. Nunjucks vs Liquid date filter syntax
**Wrong** (Liquid): `{{ date | date: '%B %d, %Y' }}`
**Right** (Nunjucks): `{{ date | date("%B %d, %Y") }}`

Eleventy v3 also doesn't include a built-in date filter for Nunjucks — you need to add one in `.eleventy.js`.

### 2. Blog listing page appearing as a blog post
When `blog.json` sets `tags: "blog"` for all files in `src/blog/`, the `index.njk` listing page also gets tagged. Fix: add `eleventyExcludeFromCollections: true` to the listing page's front matter. Setting `tags: []` doesn't work because Eleventy merges tags from directory data files.

### 3. Netlify Identity is dead
As of 2025, Netlify Identity and Git Gateway are deprecated. If you're reading older Decap CMS tutorials that say "enable Netlify Identity and Git Gateway" — that path no longer works. Use Sveltia CMS with a GitHub Personal Access Token instead, or set up an OAuth proxy if you need multiple editors.

### 4. Decap CMS on non-Netlify hosts needs an OAuth proxy
If you specifically want Decap CMS (not Sveltia) on Vercel/Amplify/etc., you need to deploy a separate OAuth proxy for GitHub authentication. Sveltia CMS avoids this entirely with its PAT-based login.

### 5. AWS Amplify build config
Amplify needs an `amplify.yml` file. The build command is `npx eleventy` and the output directory is `_site`. Don't forget the `npm install` in the preBuild phase.
