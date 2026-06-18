# KITSUNE

KITSUNE is a Next.js AI business intelligence application for Hong Kong SME restaurant and retail owners.

## Experience Flow

- `/` - product landing page with the KITSUNE brand and entry point.
- `/workspace/input` - business intake page with manual inputs, file uploads, real LLM mode, internal sample package loader, and advanced model configuration.
- `/workspace/loading` - AI work page with staged progress, readable thinking updates, and automatic redirect.
- `/workspace/report` - final consultant report with KPIs, diagnosis, recommendations, marketing strategy, expansion analysis, roadmap, and PDF export.

## Run Locally

### One-Click Start On Windows

Double-click:

```text
start-dev.bat
```

Or run:

```powershell
.\start-dev.ps1
```

Open `http://localhost:3000`.

### Manual Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel and Cloudflare deployment notes.

## LLM Configuration

The default user flow uses Real LLM Mode. Local defaults are read from `.env.local`:

```bash
KITSUNE_AI_ENDPOINT=https://opencode.ai/zen/go/v1/chat/completions
KITSUNE_AI_MODEL=deepseek-v4-flash
KITSUNE_AI_API_KEY=your_key
```

The input page has a small `Advanced` control at the bottom for changing endpoint/model/key.

## Internal Sample Package

For internal validation, click the `Input Your Business Info` title five times to open the sample package loader. Uploading a KITSUNE sample package fills the form, attaches evidence files, controls the loading-page work sequence, and renders a preset report.

## CSV Format

Upload a CSV with these columns:

```csv
date,hour,product,category,units,revenue,cost,channel
2026-05-01,12,Green Curry Set,Signature Mains,18,2880,1044,Dine-in
```

The app includes a sample Hong Kong Thai restaurant dataset for product walkthroughs.
