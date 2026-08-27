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

## CV and Research Statement

The LaTeX sources for both live in Dropbox (not in this repo). Only the compiled PDFs are committed to `assets/`.

- **CV:** source `~/Library/CloudStorage/Dropbox/CV/CV_Joachim_Hubmer.tex` → `assets/CV_Joachim_Hubmer.pdf`
- **Research statement:** `assets/research_statement_hubmer.pdf` is a byte-identical copy of the current internal statement, `~/Library/CloudStorage/Dropbox/promotion/research_statement/research_statement_hubmer_vN.pdf` (currently v7, July 2026, the Penn tenure version), with the `_vN` suffix dropped. Deliberately not a separate "public" edit: the website must carry exactly the version used internally. When a new version is compiled, copy it over the asset under the same name.

## Key Conventions

- **Penn brand colors:** blue `#011F5B`, red `#990000`. These are used throughout as `--accent` and `--link`.
- **Fonts:** Source Sans 3 (body), Source Serif 4 (headings/paper titles). Both loaded from Google Fonts.
- **Design register:** quiet editorial — flat hairline-divided paper list (no cards/shadows), inline dot-separated paper links, no decorative animation. The econ-rain easter egg (triple-click the headshot) is intentional and stays.
- **Headshot:** `assets/headshot.jpg` (880×1120 for the 220×280 slot) is the only photo in the repo and also serves as og:image. Source/master files live in `~/Library/CloudStorage/Dropbox/promotion/headshots/` (canonical exports `joachim_hubmer_headshot_2026_*`; alternate treatments in subfolders), not in this repo.
- **Author ordering:** Most papers use alphabetical ordering. Two papers use certified randomized order (ⓡ) with Hubmer listed first, and the display string in `papers.json` must follow the certified order from the paper's title page, not alphabetical order: "Why Are the Wealthiest So Wealthy?" = Hubmer, Halvorsen, Salgado, Ozkan; "Scalable versus Productive Technologies" = Hubmer, Chan, Ozkan, Salgado, Hong.
- Paper PDFs and slides go in `assets/papers/`.
- Discussions use a different render path than regular papers (`isDiscussion` flag) — they show `discussedAuthors` and `venue` instead of standard author/journal metadata.
