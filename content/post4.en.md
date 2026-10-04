---
title: A note on "good enough"
date: 2026-05-18
tags: [Thoughts, Engineering]
summary: The hard part of building a product is not adding features, it is deciding which ones not to add. Some rules I use to hold myself back.
---

# A note on "good enough"

Every project starts restrained, and then it starts to swell: this feature is easy to add, that setting deserves a flag. Half a year later, half the code serves scenarios nobody has.

## Three questions before adding anything

1. **Did anyone actually ask for it?** Or do I merely think it might be useful one day?
2. **What happens if we don't build it?** If the answer is "not much", don't build it yet.
3. **Who maintains it afterwards?** Every line is debt, and the interest is having to route around it on every future change.

> A feature is not an asset. It is a promise.

## Trade-offs I would rather make

- **One less option, one better default** — most people don't want a choice, they want the right answer
- **Dumb but obvious beats clever but opaque** — an abstraction nobody understands is worse than three plain repeated lines
- **Write down what you refuse to do** — stating the unsupported cases plainly is more honest than hedging

## When adding is right

There is a counter-case. **When the same problem shows up three times or more**, it is time to abstract seriously. Hardcode it the first time, copy it the second, abstract it the third — by then you know its real shape.

## A reminder to myself

Subtracting is harder than adding, because it produces nothing visible: delete a hundred lines and no screenshot changes. But **whoever reads the code will feel it**.

It is also why this site is only three files.
