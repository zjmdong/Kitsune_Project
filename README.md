# BranchWise AI Demo

A deployable Next.js demo for an AI business analyst platform serving Hong Kong SME restaurant and retail owners.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Optional live AI

The demo works without an API key. To enable live report generation, set:

```bash
AI_API_KEY=your_key
AI_MODEL=your_preferred_model
```

If the live call fails or no key is configured, the API returns the deterministic demo report.

## CSV format

Upload a CSV with these columns:

```csv
date,hour,product,category,units,revenue,cost,channel
2026-05-01,12,Green Curry Set,Signature Mains,18,2880,1044,Dine-in
```

The app includes a sample Hong Kong Thai restaurant dataset for pitch walkthroughs.
