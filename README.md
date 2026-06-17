# BranchWise AI Demo

A deployable Next.js demo for an AI business analyst platform serving Hong Kong SME restaurant and retail owners.

## Experience Flow

- `/` - landing page with brand vision, hero image, and Try Now entry point.
- `/workspace/input` - business intake page with manual inputs, file uploads, simulation/real LLM mode switch, and model API configuration.
- `/workspace/loading` - AI work page with staged progress, visible analysis log, and automatic redirect.
- `/workspace/report` - final consultant report with KPIs, diagnosis, recommendations, marketing strategy, expansion analysis, roadmap, and PDF export.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Optional live AI

The demo works without an API key in Simulation Mode. Real LLM Mode is configured from the input page with an OpenAI-compatible base URL, model, and API key.

For server-side defaults, you can also set:

```bash
AI_API_KEY=your_key
AI_MODEL=your_preferred_model
```

Simulation Mode uses the deterministic local computation engine. Real LLM Mode requires the configured model API to return the final report.

## CSV format

Upload a CSV with these columns:

```csv
date,hour,product,category,units,revenue,cost,channel
2026-05-01,12,Green Curry Set,Signature Mains,18,2880,1044,Dine-in
```

The app includes a sample Hong Kong Thai restaurant dataset for pitch walkthroughs.
