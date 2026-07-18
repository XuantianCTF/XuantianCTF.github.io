# AGENTS.md

## Project Overview

Astro 6 + React 19 + Tailwind CSS static site deployed to GitHub Pages. Content-driven CTF learning platform with docs and blog sections written in Markdown.

## Commands

```bash
pnpm dev          # local dev server (port 4321)
pnpm build        # astro check && astro build (outputs to dist/)
pnpm preview      # preview production build
```

No test suite, no linter script, no typecheck-only script. `pnpm build` runs `astro check` first, so it doubles as the type check.

## Content Structure

- **Docs**: `src/content/docs/` — flat naming, `category-topic.md` (e.g., `web-sqli.md`, `crypto-rsa.md`)
- **Blog**: `src/content/blog/` — standard blog posts
- Both use Astro content collections defined in `src/content.config.ts`
- Frontmatter schema: `title` (required), `description` (optional), `date` (optional for docs, required for blog), `tags` (defaults to `[]`)

## Routing

- `src/pages/docs/[...slug].astro` and `src/pages/blog/[...slug].astro` handle content rendering via catch-all routes
- Adding a new `.md` file to the content dirs automatically creates a new page

## Key Conventions

- Path aliases: `@/` → `src/`, `@components/` → `src/components/` (configured in both `tsconfig.json` and `astro.config.mjs`)
- Astro components in `src/components/` (`.astro`), React components in `src/React/` (`.tsx`)
- `.nojekyll` present — required for GitHub Pages to serve dotfiles/underscore paths
- Language: site content is in Chinese (Simplified)

## CI/CD

- `.github/workflows/astro.yml` deploys on push to `main`
- Uses Node 22 + pnpm 9 in CI (matches `engines` in package.json: `node >=20`, `pnpm >=9`)

## Branch Strategy

- Do NOT push directly to `main`
- Branch naming: `feature/*`, `content/*`, `fix/*`, `docs/*`
- Commit messages follow conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## Gotchas

- `sharp` is a native dependency — if `pnpm install` fails on sharp, check Node version and platform compatibility
- Static output only (`output: "static"` in astro.config.mjs) — no SSR, no server-side logic
- Tailwind config extends animations only; no plugins
