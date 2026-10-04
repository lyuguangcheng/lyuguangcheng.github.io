---
title: The page was slow, so I checked five things first
date: 2026-03-02
tags: [Performance, Frontend]
summary: Don't reach for a bundler yet. Going through the browser's own panels in order usually finds the problem in the first two steps.
---

# The page was slow, so I checked five things first

Mention performance and people reach for bundlers, CDNs and lazy loading. But what actually slows a page down is usually something much more mundane. Here is the order I check in.

## 1. What is actually loading on first paint

Open the Network panel and sort by size. If the top three files are 80% of the weight, the answer is right there.

- Are images compressed, and served at their display size
- Is a font loading in five weights when one would do
- Is there a large library that nothing on the page actually uses

## 2. Is anything blocking render

Both CSS and synchronous `<script>` tags hold up the first paint. Move synchronous scripts to just before `</body>`, and add `defer` or `async` to anything non-critical.

```js
// A script that does one small thing should not make the whole page wait
document.addEventListener('DOMContentLoaded', init);
```

## 3. Are off-screen images lazy

Anything below the fold should carry `loading="lazy"`. One attribute, often several megabytes saved:

```html
<img src="cover.svg" alt="Cover" loading="lazy" width="1200" height="675" />
```

> Add `width` and `height` while you are there — it also stops the page from jumping when the image arrives.

## 4. Are you fetching the same thing twice

The same payload requested by three different components is the most common waste. Add a cache layer, or hoist the request and pass the result down.

## 5. Only then look at the build output

Splitting, minification and tree shaking belong here, at the end.

## What I have learned

| Problem | How often | Cost to fix |
| --- | --- | --- |
| Uncompressed large images | Very often | Trivial |
| Render-blocking resources | Often | Low |
| Duplicate requests | Sometimes | Medium |
| Build configuration | Rarely | High |

**Measure, change, measure again.** Optimising by feel usually just adds complexity and weight at the same time.
