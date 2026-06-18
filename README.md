# BranchWise AI Demo

A deployable Next.js demo for an AI business analyst platform serving Hong Kong SME restaurant and retail owners.

## Experience Flow

- `/` - landing page with brand vision, hero image, and Try Now entry point.
- `/workspace/input` - business intake page with manual inputs, file uploads, default real LLM mode, hidden template loader, and advanced model configuration.
- `/workspace/loading` - AI work page with staged progress, visible analysis log, and automatic redirect.
- `/workspace/report` - final consultant report with KPIs, diagnosis, recommendations, marketing strategy, expansion analysis, roadmap, and PDF export.

## Run locally

### One-click start on Windows

Double-click:

```text
start-dev.bat
```

Or run:

```powershell
.\start-dev.ps1
```

Open `http://localhost:3000`.

### Manual start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel and Cloudflare deployment notes.

## LLM Configuration

The default user flow uses Real LLM Mode. Local defaults are read from `.env.local`:

```bash
BRANCHWISE_AI_ENDPOINT=https://opencode.ai/zen/go/v1/chat/completions
BRANCHWISE_AI_MODEL=deepseek-v4-flash
BRANCHWISE_AI_API_KEY=your_key
```

The input page has a small `Advanced` control at the bottom for changing endpoint/model/key during a demo.

## Hidden Demo Template

For pitch rehearsal, click the `Business Input Workspace` title five times to open the internal template loader. Uploading a BranchWise template fills the form, loads demo evidence rows, controls the loading-page thought process, and renders a preset report. Normal users never see a simulation toggle.

## CSV format

Upload a CSV with these columns:

```csv
date,hour,product,category,units,revenue,cost,channel
2026-05-01,12,Green Curry Set,Signature Mains,18,2880,1044,Dine-in
```

The app includes a sample Hong Kong Thai restaurant dataset for pitch walkthroughs.
