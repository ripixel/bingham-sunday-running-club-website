# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Root (website)
npm install                        # Install root dependencies
npm run dev                        # Watch mode with live reload → http://localhost:3000
npm run build                      # Full production build → public/
npm run serve                      # Serve already-built public/ locally
npm run local                      # build + serve (no deploy)
firebase deploy --only hosting     # Deploy static site only (no functions change)
firebase deploy                    # Deploy everything (hosting + functions)

# Functions (OAuth gateway) — run from functions/
npm install                        # Install separately
npm run lint                       # ESLint
npm run build                      # Compile TypeScript → lib/
firebase emulators:start --only functions  # Run locally
```

No test suite exists.

## Architecture

A JAMstack static site. Skier (custom SSG) reads `content/*.json` files and Handlebars templates, outputs HTML to `public/`. Firebase Hosting serves `public/`. Decap CMS (`/admin`) lets non-developers edit JSON files via the GitHub API.

### Build pipeline (`skier.tasks.mjs`)

Tasks run in sequence at build time:

1. **fetch-spotify-playlist** — fetches the club playlist and caches it into content
2. **process-staging** — converts any JSON files in `content/staging/runs/` into result Markdown files in `content/results/`. This is the handoff point from the race-tracker app. Also fetches weather from Open-Meteo for each result date. After processing, deletes all but the most recent staging file.
3. **load-content** — reads all `content/` directories, computes club stats/legends/records, and injects everything into Skier globals for downstream templates
4. Static tasks (CSS bundle, copy assets, sitemap, etc.)
5. **generate-runner-pages** / **generate-result-pages** — render per-runner and per-result HTML pages from `templates/runner.html` and `templates/result.html` using Handlebars

### Content model

- `content/pages/*.json` — per-page CMS content
- `content/runners/*.json` — one file per runner (filename = runner ID slug)
- `content/results/*.md` — YAML frontmatter + markdown body for each run result
- `content/staging/runs/*.json` — raw race-tracker output, consumed and deleted at build time
- `content/settings/recurring-run.json` — default loop distances, location, and event title used by `process-staging`
- `content/events/*.md` — special events; matched by date during staging to override the result title/description

All visible text on the site must come from `content/` — no hardcoded strings in templates (see `.agent/rules/CMS_CONTENT_RULES.md`).

### CMS Authentication

Decap CMS uses a **custom OAuth gateway** (Firebase Cloud Function, `functions/`) rather than Netlify Identity (which only works on Netlify). The function handles the GitHub OAuth popup handshake (`/api/auth` → GitHub → `/api/callback` → `postMessage` back to CMS). Secrets (`OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`) live in Firebase Secret Manager, not in `.env`. See `docs/CMS_AUTH.md` before touching `functions/` or `admin/config.yml`.

### Deployment

CircleCI deploys on every push to `main`. After deploying, the CI job commits any generated files in `content/results/` and `content/staging/` back to `main` with `[skip ci]`. There is also a scheduled pipeline that rebuilds and deploys at 10:00 and 18:00 UTC daily (hosting only).

If you change the build pipeline (new `npm` script, new dependency folder, etc.), you must update all three of: `package.json`, `firebase.json` predeploy hooks, and `.circleci/config.yml` cache keys/install steps — see `.agent/rules/CICD_MAINTENANCE.md`.

### `.cts` file extension

Task files and utilities use `.cts` (CommonJS TypeScript) because the root `package.json` sets `"type": "module"` but these files need `require()` for interop with Skier. Import them with `require()` from ESM using `createRequire`, as shown in `skier.tasks.mjs`.

## Documentation

Whenever you change code, update the relevant doc in `docs/`. The table in `.agent/rules/MAINTENANCE_RULES.md` maps each file to the doc that covers it.
