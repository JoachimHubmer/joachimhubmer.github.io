# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static academic personal website for Joachim Hubmer (Assistant Professor of Economics, UPenn). Hosted on GitHub Pages at `joachimhubmer.github.io`. No build system, framework, or package manager — just HTML, CSS, and vanilla JS served directly.

## Development

Open `index.html` in a browser. No build step, no dev server required. For local testing with `fetch()` (papers.json loading), use a local server:

```
python3 -m http.server 8000
```

## Architecture

**Single-page site** with three sections (About, Research, Teaching) all in `index.html`.

**Paper rendering is data-driven:** `papers.json` contains all paper metadata (title, authors, year, journal, abstract, bibtex fields, links). `script.js` fetches this JSON at page load and renders paper cards into `#working-papers`, `#publications`, and `#discussions` containers. To add/edit papers, modify `papers.json` — not the HTML.

**Theming:** Light/dark mode via CSS custom properties on `:root` and `[data-theme="dark"]` in `style.css`. Theme state stored in `localStorage('theme')` and toggled via `data-theme` attribute on `<html>`.

**BibTeX generation:** Built dynamically in `generateBibtex()` from the `bibtex` object on each paper in `papers.json`. The bibtex key convention is `firstAuthorLastName + year + keyword`.

## Key Conventions

- **Penn brand colors:** blue `#011F5B`, red `#990000`. These are used throughout as `--accent` and `--link`.
- **Fonts:** Source Sans 3 (body), Georgia (headings).
- **Author ordering:** Most papers use alphabetical ordering. Two papers use randomized order with Hubmer listed first: "Why Are the Wealthiest So Wealthy?" and "Scalable versus Productive Technologies".
- Paper PDFs and slides go in `assets/papers/`.
- Discussions use a different render path than regular papers (`isDiscussion` flag) — they show `discussedAuthors` and `venue` instead of standard author/journal metadata.
