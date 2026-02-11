# Cascadia AI Collective

A community for women+ exploring, practicing, and shaping the future of AI across Seattle, Portland, Vancouver BC, and remotely.

**Live site**: [cascadiaai.org](https://cascadiaai.org)

---

## Tech Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| **Static Site Generator** | [Eleventy (11ty)](https://www.11ty.dev/) v3 | Converts Markdown blog posts into HTML pages |
| **Templating** | [Nunjucks](https://mozilla.github.io/nunjucks/) | Layout templates for shared HTML shell |
| **CMS** | [Sveltia CMS](https://github.com/sveltia/sveltia-cms) | Browser-based content editor, commits to GitHub |
| **Hosting** | [AWS Amplify](https://aws.amazon.com/amplify/) | Auto-deploys on every push to `main` |
| **Styling** | Vanilla CSS with custom properties | No preprocessor, no framework |
| **Fonts** | [Fraunces](https://fonts.google.com/specimen/Fraunces) + [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | Display serif + body sans-serif |

No JavaScript framework. No database. Blog content is stored as Markdown files in Git.

---

## Architecture

```
                 +-----------------+
                 |  Sveltia CMS    |
                 |  /admin/        |
                 +--------+--------+
                          |
                     commits .md files
                          |
                          v
                 +-----------------+
                 |  GitHub Repo    |
                 |  (main branch)  |
                 +--------+--------+
                          |
                     triggers build
                          |
                          v
                 +-----------------+
                 |  AWS Amplify    |
                 |  npm install    |
                 |  npx eleventy   |
                 +--------+--------+
                          |
                     deploys _site/
                          |
                          v
                 +-----------------+
                 |  Live Site      |
                 |  cascadiaai.org |
                 +-----------------+
```

---

## Project Structure

```
cascadiaaicollective/
├── src/                          # Source files (what you edit)
│   ├── _includes/                # Nunjucks layout templates
│   │   ├── base.njk              #   Shared HTML shell (head, meta, footer)
│   │   └── post.njk              #   Blog post template
│   ├── admin/                    # Sveltia CMS
│   │   ├── index.html            #   Admin UI (loads CMS from CDN)
│   │   └── config.yml            #   CMS collections and field definitions
│   ├── blog/                     # Blog content
│   │   ├── blog.json             #   Default layout + tags for all posts
│   │   ├── index.njk             #   Blog listing page (/blog/)
│   │   └── *.md                  #   Blog posts (Markdown)
│   ├── images/
│   │   └── blog/                 #   Blog post images
│   ├── index.html                # Landing page
│   └── styles.css                # All styles
├── _site/                        # Generated output (gitignored)
├── docs/                         # Documentation
├── .eleventy.js                  # Eleventy configuration
├── amplify.yml                   # AWS Amplify build config
├── package.json
└── .gitignore
```

---

## How It Works

### Templates

Eleventy uses a **layout chain**. Each page declares which template wraps it:

```
blog post (.md)  -->  post.njk  -->  base.njk  -->  final HTML
landing page     -------------------> base.njk  -->  final HTML
```

- **`base.njk`** — the outermost shell: `<html>`, `<head>`, fonts, CSS, footer. Every page uses this.
- **`post.njk`** — wraps blog post content with title, author, date, featured image, and prose styling. Inherits from `base.njk`.

### Blog Posts

A blog post is a Markdown file in `src/blog/` with front matter:

```markdown
---
title: "Post Title"
date: 2026-02-10
author: "Author Name"
summary: "Short description for the listing page."
featuredImage: "/images/blog/your-image.png"
featuredImageAlt: "Image description"
---

Your content in Markdown...
```

`blog.json` automatically applies `layout: post.njk` and `tags: blog` to every file in the folder — no need to repeat it per post.

### Collections

Eleventy groups all posts tagged `"blog"` into `collections.blog`. The listing page (`blog/index.njk`) loops through this collection in reverse chronological order.

### CMS

Sveltia CMS runs entirely in the browser at `/admin/`. It reads `config.yml` to know what fields each post has, then commits Markdown files and images directly to GitHub. No server-side component — authentication is via GitHub Personal Access Token.

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server with live reload
npm run dev
```

Site runs at `http://localhost:8080`. Changes to source files auto-reload.

### Build for production

```bash
npm run build
```

Outputs the static site to `_site/`.

---

## Writing Blog Posts

### Via the CMS (recommended)

1. Go to `https://cascadiaai.org/admin/`
2. Sign in with a GitHub Personal Access Token ([create one here](https://github.com/settings/tokens) with `repo` scope)
3. Click **Blog** > **New Blog**
4. Fill in title, author, date, summary, body
5. Optionally upload a featured image (1440x810px, 16:9, JPG or PNG)
6. Click **Publish**
7. Amplify rebuilds automatically — post is live in ~1-2 minutes

### Via Git (manual)

1. Create a new `.md` file in `src/blog/` following the naming pattern: `YYYY-MM-DD-post-slug.md`
2. Add front matter (title, date, author, summary, featuredImage)
3. Write content in Markdown
4. Add images to `src/images/blog/`
5. Commit and push to `main`

---

## Design System

### Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--accent` | `#2a8f9d` | `#3db4c4` | Primary teal — links, buttons, highlights |
| `--warm` | `#c47a52` | `#d89a73` | Secondary rust — accents, badges |
| `--text-primary` | `#1a2332` | `#e8edf2` | Headings, body text |
| `--text-secondary` | `#3a4a5c` | `#b0bec9` | Paragraphs, descriptions |
| `--bg-body` | `#f8f9fb` | `#0f1722` | Page background |
| `--bg-surface` | `#ffffff` | `#1a2838` | Cards, sections |

### Typography

- **Display**: Fraunces (serif, variable weight) — headings, titles
- **Body**: Plus Jakarta Sans (sans-serif, variable weight) — paragraphs, UI

### Spacing Scale

`--space-xs` (0.5rem) / `--space-sm` (1rem) / `--space-md` (1.5rem) / `--space-lg` (2.5rem) / `--space-xl` (4rem) / `--space-2xl` (6rem)

### Breakpoints

- Mobile-first (default)
- Tablet: `768px`
- Desktop: `1024px`

---

## Deployment

AWS Amplify is configured via `amplify.yml`:

1. **preBuild**: `npm install`
2. **build**: `npx eleventy`
3. **artifacts**: serves `_site/`

Every push to `main` triggers an automatic rebuild and deploy.
