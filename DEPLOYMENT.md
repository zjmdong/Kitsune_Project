# KITSUNE Deployment Guide

## Public Showcase (Default)

Production builds and Vercel deployments default to **showcase-only** mode:

- The landing page stays public.
- Every `/workspace/*` page redirects to `/maintenance`, with a link to this GitHub repository.
- All three analysis APIs return `503 SHOWCASE_ONLY` before reading the request or calling a model.
- No model API key is needed for the showcase. Local `pnpm dev` keeps the full workspace available.

`KITSUNE_SHOWCASE_ONLY=true` explicitly enables this mode, including for a local preview. Leave it enabled on both Production and Preview deployments. Only use `KITSUNE_SHOWCASE_ONLY=false` for a private, access-controlled instance; this flag is not authentication.

Before sharing a public URL, remove model API keys from the Vercel project's environment variables and redeploy. Protect or delete older deployments that still contain working keys; changing environment variables does not secure old deployment snapshots. Revoke/rotate any key whose previous deployment remains accessible.

## One-Click Local Start On Windows

Double-click:

```text
start-dev.bat
```

Or run from PowerShell:

```powershell
.\start-dev.ps1
```

The script will:

- switch to the project directory
- create `.env.local` from `.env.example` if missing
- use existing `node_modules` when available
- install dependencies with `pnpm install` or `npm install` if needed
- start the Next.js dev server

Open:

```text
http://localhost:3000
```

Keep the terminal window open while using the app. Press `Ctrl+C` to stop.

## Full Workspace Configuration

For local analysis or a private full-workspace deployment, set these in `.env.local` or your hosting environment. They are not required for a public showcase:

```bash
KITSUNE_AI_ENDPOINT=https://opencode.ai/zen/go/v1/chat/completions
KITSUNE_AI_MODEL=deepseek-v4-flash
KITSUNE_AI_API_KEY=your_real_api_key
```

Never commit `.env.local`.

To run the full workspace with `pnpm build` / `pnpm start`, explicitly set `KITSUNE_SHOWCASE_ONLY=false` in a private environment. Without that override, a production build serves the showcase.

## Deploy To Vercel

Vercel is the simplest production target for this app because it supports Next.js App Router and API route handlers with minimal configuration.

### GitHub Import

1. Push the repository to GitHub.
2. Open Vercel Dashboard.
3. Select `Add New...` -> `Project`.
4. Import `zjmdong/Kitsune_Project`.
5. Framework preset: `Next.js`.
6. Build command: keep default, or use `pnpm build` / `npm run build`.
7. For a public showcase, set `KITSUNE_SHOWCASE_ONLY=true` and do not add provider keys. For a private full workspace only, add the model variables above and explicitly set `KITSUNE_SHOWCASE_ONLY=false`.
8. Deploy.

Every push to `main` will trigger a new production deployment if the project is connected to that branch.

### CLI Deploy

```bash
npm i -g vercel
vercel login
vercel --prod
```

When prompted, link this folder to a Vercel project. Keep the public showcase key-free; configure only `KITSUNE_SHOWCASE_ONLY=true` in the dashboard or with `vercel env add`.

## Deploy To Cloudflare

This app uses Next.js route handlers and streaming API responses, so do not deploy it as a plain static Cloudflare Pages export.

Recommended Cloudflare target:

```text
Cloudflare Workers + OpenNext adapter
```

### Existing Next.js Project Path

From the project root:

```bash
npx @opennextjs/cloudflare migrate
```

Then follow the generated setup. In general, the Cloudflare/OpenNext path adds:

- `@opennextjs/cloudflare`
- `wrangler`
- `wrangler.jsonc`
- `open-next.config.ts`
- package scripts such as `preview` and `deploy`

Then deploy:

```bash
npm run deploy
```

or, if Wrangler auto-detects the app:

```bash
npx wrangler deploy
```

### Cloudflare Environment Variables

For a public showcase, set `KITSUNE_SHOWCASE_ONLY=true` and omit model secrets. Only for a private full workspace, set the provider key with Wrangler:

```bash
npx wrangler secret put KITSUNE_AI_API_KEY
```

Non-secret values can go in `wrangler.jsonc` or Cloudflare dashboard variables:

```text
KITSUNE_AI_ENDPOINT
KITSUNE_AI_MODEL
```

### Windows Note

OpenNext Cloudflare workflows can be more reliable on Linux/macOS or WSL. If migration/build behaves strangely on Windows, use WSL or GitHub Actions for the Cloudflare build.

## Recommendation

Use Vercel for the fastest stable production deployment.

Use Cloudflare Workers if you specifically want Cloudflare hosting or already know Wrangler/OpenNext.
