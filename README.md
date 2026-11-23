# FacePangMuPang AI

เว็บช่วยดูโหงวเฮ้งก่อนศัลยกรรม · Face reading before you change (TH/EN).

1. **Face mesh 468 จุด** — upload a photo or scan live with the camera (MediaPipe Face Landmarker, runs in the browser).
2. **Side profile (optional)** — upload or self-timer camera; 10 points are traced on the person silhouette (MediaPipe selfie segmenter, plus the face landmarker as a hint) and can be dragged. Measures nasofrontal / nasolabial / nasofacial angles, facial convexity, tip projection, E-line, forehead slope (`lib/face/profile.ts`).
3. **Face blueprint** — real proportions from the mesh: symmetry, facial thirds, feature ratios, face shape (`lib/face/measure.ts`).
4. **โหงวเฮ้ง** — traditional reading for 9 areas, plus the points tradition says could enhance the reading if adjusted, what is usually done and how it helps (`lib/face/reading-rules.ts`).
5. **AI simulation** — the selected points are sent with a downsized photo (after a separate consent) to an image-editing model via Vercel AI Gateway (`app/api/simulate-face`).
6. **Not ready for surgery?** — makeup, hair and clothing advice for the current face shape and features (`lib/face/style-rules.ts`).
7. **Optional Claude summary** — a personal summary written from rule results only, never the photo (`app/api/face-reading`), and a chatbot inside the โหงวเฮ้ง section that answers about the visitor's own reading (`app/api/chat`).

Face reading is presented as cultural belief, never as science or medical advice.

## Start locally

1. Node.js 22+ (AI SDK 7 requires it).
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in what you need:
   - `ANTHROPIC_API_KEY` — chatbot + personal summary (hidden when missing).
   - `AI_GATEWAY_API_KEY` — simulation images (on Vercel, OIDC is used automatically). Model: `SIMULATION_MODEL` (default `bytedance/seedream-4.0`, about $0.03 per image; `bfl/flux-kontext-pro` at about $0.04 is the other option. Newer models such as `bfl/flux-3-image`, `bytedance/seedream-5.5` and Nano Banana need paid gateway credits; free-tier credits are refused).
   - **Compare mode** runs the same photo through Seedream 4.0, FLUX Kontext Pro, FLUX 3, Seedream 5.5 and Nano Banana 2.1 (about $0.17 per run; list in `lib/sim-models.ts`). It is on automatically in `npm run dev`. In production it stays off unless you set `NEXT_PUBLIC_SIM_COMPARE=1`.
4. `npm run dev` → http://localhost:3000

The camera needs `localhost` or HTTPS — plain `http://<LAN-IP>` won't allow it on phones.

Model and runtime files are served from `public/models` and `public/mediapipe/wasm`; if you upgrade `@mediapipe/tasks-vision`, copy the matching `wasm/` files again.

## Privacy

Mesh, measurements, face reading and style advice all run in the browser. Claude receives only rule ids and proportions. The photo leaves the device only when the user consents and generates a simulation; it is not stored by this site. Never use `NEXT_PUBLIC_` for secrets.
