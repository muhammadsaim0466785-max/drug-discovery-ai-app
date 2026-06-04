# Drug Discovery AI

A Vercel-ready Next.js app for the multi-agent drug discovery workspace described in `MILESTONES.md`.

## What Works

- Literature, Hypothesis, Molecular, Simulation, and Report tabs
- Shared discovery run state across tabs
- Search query, temporal range, and patented-compound controls
- Live agent log updates
- Molecule shortlist and ADMET-style scoring views
- JSON report download from the Report tab or lightning action
- Health endpoint at `/api/health`

## Run Locally

Install Node.js 20 or newer, then run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy To Vercel

1. Push this folder to GitHub.
2. Import the repository in Vercel.
3. Keep the framework preset as `Next.js`.
4. Deploy.

Vercel will run `npm run build` using the included `package.json` and `vercel.json`.
