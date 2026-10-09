# FacePangMuPang AI

A responsive Next.js prototype for face proportion exploration, conceptual aesthetic simulations, and culturally contextualized face reading.

## Start locally

1. Install Node.js 20+.
2. Run `npm install`.
3. Run `npm run dev` and open `http://localhost:3000`.

The analysis cards use sample data. Photo selection, preview, consent, landmarks, comparison slider, version selection, and privacy deletion are interactive. The photo preview stays in the browser and is not sent to the API routes. The floating Claude chatbot sends only the text conversation to Anthropic through the server-side `/api/chat` route; it does not send or read uploaded photos. Add `ANTHROPIC_API_KEY` to the server environment to enable replies. The face analysis and image simulation providers remain demos.

Copy `.env.example` to `.env.local` for local server-only provider credentials. For Vercel, add the same variables under Project Settings → Environment Variables, then redeploy. Never use `NEXT_PUBLIC_` for secrets.
