# FacePangMuPang AI

A responsive Next.js prototype for face proportion exploration, conceptual aesthetic simulations, and culturally contextualized face reading.

## Start locally

1. Install Node.js 20+.
2. Run `npm install`.
3. Run `npm run dev` and open `http://localhost:3000`.

The analysis cards use sample data. Photo selection, preview, consent, landmarks, comparison slider, version selection, and privacy deletion are interactive. The photo preview stays in the browser and is not sent to the API routes. API handlers in `app/api` and providers in `lib/ai.ts` demonstrate server-side integration seams; no real facial analysis, image generation, or LLM is configured.

Copy `.env.example` to `.env.local` for future server-only provider credentials. Never use `NEXT_PUBLIC_` for secrets.
