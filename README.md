# Future Horizon — Portfolio
## Live chat configuration

Copy the variables from `.env.example` into `.env.local`. Set a unique
`ADMIN_SESSION_SECRET` with at least 32 characters and a strong `ADMIN_PASSWORD`
with at least 12 characters. `npm run prisma:seed` creates or updates the single
admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

Generate VAPID keys with:

```bash
npx web-push generate-vapid-keys
```

Put the public key in `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, the private key in
`VAPID_PRIVATE_KEY`, and use a valid `mailto:` value for `VAPID_SUBJECT`. The private
key must stay server-side. Web Push requires an HTTPS origin in production and a
powered-on device; it can notify while the browser or dashboard is closed, but not
when the physical device is powered off.

The custom server requires a persistent Node.js host. Static hosting and a
serverless-only Vercel deployment cannot host this Socket.IO process directly. Use a
Node host such as Railway, Render, Fly.io, or a separate Socket.IO service, and move
SQLite to PostgreSQL before running multiple application instances.

The old AI provider key was removed from `.env.local`. Revoke or rotate that key in
the provider console if it was ever active.

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
