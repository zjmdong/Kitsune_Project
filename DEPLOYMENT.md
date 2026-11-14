# KITSUNE Deployment Guide

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

## Required Environment Variables

Set these locally in `.env.local` and in your cloud platform environment variables:

```bash
KITSUNE_AI_ENDPOINT=https://opencode.ai/zen/go/v1/chat/completions
KITSUNE_AI_MODEL=deepseek-v4-flash
KITSUNE_AI_API_KEY=your_real_api_key
```

Never commit `.env.local`.

## Deploy To Vercel

Vercel is the simplest production target for this app because it supports Next.js App Router and API route handlers with minimal configuration.

### GitHub Import

1. Push the repository to GitHub.
2. Open Vercel Dashboard.
3. Select `Add New...` -> `Project`.
4. Import `zjmdong/Kitsune_Project`.
5. Framework preset: `Next.js`.
6. Build command: keep default, or use `pnpm build` / `npm run build`.
7. Add environment variables:
   - `KITSUNE_AI_ENDPOINT`
   - `KITSUNE_AI_MODEL`
   - `KITSUNE_AI_API_KEY`
8. Deploy.

Every push to `main` will trigger a new production deployment if the project is connected to that branch.

### CLI Deploy

```bash
npm i -g vercel
vercel login
vercel --prod
```

When prompted, link this folder to a Vercel project. Add the same environment variables in the Vercel dashboard or with `vercel env add`.

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

Set production secrets with Wrangler:

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
