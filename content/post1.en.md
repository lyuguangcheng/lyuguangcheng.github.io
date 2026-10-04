---
title: Why I hand-wrote a personal site
date: 2025-12-05
tags: [Intro, Frontend]
summary: There are plenty of ready-made blog frameworks, but I wanted to write this one myself — on the technical choices, and the freedom of having no build step.
---

# Why I hand-wrote a personal site

There is no shortage of blog frameworks and themes. So why write one myself?

Because with someone else's framework, most of my time went into **arguing with its conventions**: how to override the theme, how to configure plugins, how to tune the build. And the only thing I actually wanted was to write something down and have people read it.

## What I wanted to fix

- **A short path from idea to page** — open the editor, write Markdown, save, refresh, done. No build, no deploy script
- **A structure anyone can read** — one HTML file, one CSS file, one JS file
- **Works on any machine** — no Node install, no dependency download

## The choices

| Need | Choice | Why |
| --- | --- | --- |
| Content format | Markdown | Plain text, still readable in ten years |
| Rendering | marked | One CDN file and it works |
| Routing | hash | Zero config on static hosting, safe under a sub-path |
| Styling | native CSS variables | Theme switching is a single attribute change |

> A tool should be transparent: the longer you use it, the less you notice it.

## Three rules for myself

1. **No build step** — refreshing the browser is the whole pipeline
2. **No backend** — pure static, deployable anywhere
3. **The code must be readable** — future me should find the edit point in `app.js` within ten minutes

## What's next

Fill in the content first, then consider an archive page and RSS. Features are not urgent — **writing consistently is the whole point of this site existing**.
