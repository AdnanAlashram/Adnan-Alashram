# Future Horizon — Portfolio

Studio portfolio site built with Next.js 16 (App Router) and React 19, deployed as a
fully static export.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Static export to `out/` |
| `npm run start` | Serve a production build |
| `npm run lint` | ESLint |

## Before deploying

Three placeholders in [`data/site.ts`](data/site.ts) need real values — `canonicalUrl`
drives `metadataBase`, the sitemap and `robots.txt`, so the deployed site advertises
`example.com` until it is set:

- `email`
- `canonicalUrl`
- the `socialLinks` hrefs (currently bare `linkedin.com` / `github.com`)

## Structure

```
app/
  layout.tsx            Root layout, fonts, site-wide metadata
  page.tsx              Home page composition
  globals.css           The whole design system (tokens → components → responsive)
  robots.ts             \
  sitemap.ts            / generated from siteConfig; need `dynamic = "force-static"`
  projects/[slug]/      Case study template, prerendered per project
components/             One component per section, plus Reveal/ProjectImage/ProjectGallery
data/
  site.ts               Brand, services, technologies
  projects.ts           Project content — the single source for cards and case studies
public/images/projects/ Cover art and screenshots
```

## Adding a project

Append an entry to `projects` in [`data/projects.ts`](data/projects.ts). The home page
card and the `/projects/<slug>` case study are both generated from it.

- `coverImage` — the home page card image. Set `coverFit: "contain"` for a logo or
  wordmark; the default crop is meant for screenshots.
- `images` — case study screenshots. The first becomes the full-bleed cover, the rest
  fill the gallery. Leave it empty and both sections are skipped, so a project with no
  screenshots still renders cleanly.
- Optional sections (`ecosystem`, `features`, `engineering`, `outcome`, `challenge`,
  `solution`) each render only when present.

Use lowercase image filenames — the dev machine is case-insensitive but most deploy
targets are not.

## Notes

- `output: "export"` in `next.config.ts` means no server features: no route handlers
  that read the request, no ISR, no image optimization.
- Animation is Framer Motion, which drives inline styles from JS. CSS alone cannot stop
  it, so every animated component checks `useReducedMotion()`.
