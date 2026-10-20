# template-app

The app template used by [`pas create`](https://docs.proappstore.online/) to scaffold new Pro apps for [ProAppStore](https://proappstore.online).

You almost certainly want to use the CLI, not clone this directly:

```bash
npm i -g @proappstore/cli
pas create my-app
```

The CLI clones this template, replaces every `APPNAME` placeholder with your app id, runs `pnpm install`, initializes git, and makes the first commit — the result is a runnable app you can `pnpm dev` immediately. The starter is independently branded: its shell, public metadata, PWA manifest, and link preview contain no required platform attribution.

Need schedules, webhooks, or server routes? Scaffold the optional app worker:

```bash
pas create my-app --with-worker
```

This adds a `worker/` directory for those workloads. `worker/` is absent by default — the deploy workflow builds and uploads it only when `worker/package.json` exists, so apps without one deploy unchanged. The worker scaffold ships inside the CLI (not in this repo). Worker execution must be enabled per app by a platform administrator before the first worker deployment takes effect.

## What's in here

- `web/` — Vite + React + TypeScript app, ESM-only, Tailwind 4 via CSS variables.
- `web/src/App.tsx` — Starter component with `initPro()` + `useAuth()` and app-owned shell branding.
- `web/src/index.css` — Platform design system (Manrope + Fraunces fonts, full light/dark theme tokens).
- `web/index.html` — App-owned PWA and link-preview meta tags, font preloading, analytics script.
- `web/public/icon-192.png` and `web/public/icon-512.png` — browser and install icons.
- `web/public/og-image.png` — neutral 1200x630 shared-link preview image for `https://APPNAME.proappstore.online`.
- `marketing/` — Astro + Tailwind (pinned) static marketing site for `https://about-APPNAME.proappstore.online`: home, Privacy Policy and Terms & Conditions. Copy, owner, contact and brand colours (mapped into the Tailwind theme) live in `marketing/src/site.ts`. `pnpm build:marketing` writes static HTML to `marketing/dist/`; `pnpm dev:marketing` previews it.
- `package.json` — pnpm workspace, `dev` / `build` / `typecheck` scripts. `prebuild` runs platform compliance check.
- `.github/workflows/` — deploy (R2, keyless OIDC), compliance (MIT + brand + PWA), CI (typecheck); worker step runs only when `worker/package.json` exists. Every job is routed to a runner by the router job (see [CI](#ci)).
- `.gitignore` — excludes node_modules, dist, .env files.

## CI

Every workflow begins with a `router` job that calls
[`ProAgentStore/runner-router`](https://github.com/ProAgentStore/runner-router)
(`.github/workflows/router.yml@v1`), and every other job runs wherever the router says. Which
runner that is depends on whether the repo is public.

**Public repos build on GitHub's own runners, always.** GitHub gives public repos unlimited free
minutes on `ubuntu-latest`, so there is nothing to save, and a public repo must never run on our
self-hosted machines: anyone can open a pull request against it, and that would run their code on
our hardware. The router sees the repo is public, runs itself on `ubuntu-latest`, and sends every
job there. It does not check billing and does not read any secret.

**Private repos use GitHub's runners until the month's included minutes run out.** The router reads
the org's Actions usage. While included minutes remain, jobs run on `ubuntu-latest`. Once they are
spent, or if the usage check fails for any reason, jobs move to the self-hosted `pags` runners so
the pipeline keeps going.

**Secrets.** The router reads usage with a billing token stored as the repo-level secret
`RUNNER_BILLING_TOKEN`, on private repos only. We never use org-level secrets: on GitHub's free
plan a public repo can read them. A private repo without the secret still builds; it just always
uses the self-hosted runners.

**The self-hosted runner group is private-only** and stays that way.

When adding a workflow or job, copy the `router` job and give every job `needs: router` and
`runs-on: ${{ fromJSON(needs.router.outputs.runner) }}`. Never write a runner label on a job
directly.

## Scaffolding manually

If you really want to scaffold by hand:

```bash
cp -r ~/dev/stores/pas/templates/template-app my-app
cd my-app
find . -type f \( -name "*.json" -o -name "*.tsx" -o -name "*.ts" -o -name "*.html" -o -name "*.md" -o -name "*.yaml" \) \
  -not -path "*/node_modules/*" -exec sed -i '' "s/APPNAME/my-app/g" {} \;
rm -rf .git && git init
pnpm install && pnpm dev
```

## License

MIT.
