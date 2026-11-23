/**
 * Side-profile analysis. Points are found on the person silhouette (segmentation mask),
 * because face-mesh models don't fit true 90° profiles. Users can drag every point.
 * Pure functions — no DOM.
 */
export type ProfileKey = 'Fh' | 'G' | 'N' | 'Prn' | 'Cm' | 'Sn' | 'Ls' | 'Li' | 'Pog' | 'Me';
export type Pt = { x: number; y: number };
export type ProfilePoints = Record<ProfileKey, Pt>;
export type Facing = 'left' | 'right';

export const PROFILE_KEYS: ProfileKey[] = ['Fh', 'G', 'N', 'Prn', 'Cm', 'Sn', 'Ls', 'Li', 'Pog', 'Me'];
export const PROFILE_LABELS: Record<ProfileKey, { th: string; en: string }> = {
  Fh: { th: 'หน้าผากบน', en: 'Upper forehead' },
  G: { th: 'หน้าผากส่วนที่นูนสุด (กลาเบลลา)', en: 'Glabella' },
  N: { th: 'ร่องดั้งจมูก (เนเซียน)', en: 'Nasion' },
  Prn: { th: 'ปลายจมูก', en: 'Nose tip' },
  Cm: { th: 'ใต้ปลายจมูก (คอลูเมลลา)', en: 'Columella' },
  Sn: { th: 'ฐานจมูก', en: 'Subnasale' },
  Ls: { th: 'ริมฝีปากบน', en: 'Upper lip' },
  Li: { th: 'ริมฝีปากล่าง', en: 'Lower lip' },
  Pog: { th: 'ปลายคาง (ส่วนที่ยื่นสุด)', en: 'Chin (pogonion)' },
  Me: { th: 'ใต้คาง', en: 'Chin bottom (menton)' },
};

export type Mask = { data: Uint8Array; width: number; height: number };

/** Locate profile points on the silhouette. Returns image-pixel coordinates, or null if no head is found. */
export function detectProfile(mask: Mask, imgW: number, imgH: number, hint?: { facing?: Facing; noseY?: number }): { points: ProfilePoints; facing: Facing } | null {
  const { data, width: W, height: H } = mask;
  const L = new Float64Array(H).fill(NaN), R = new Float64Array(H).fill(NaN);
  for (let y = 0; y < H; y++) {
    let l = -1, r = -1;
    for (let x = 0; x < W; x++) if (data[y * W + x]) { if (l < 0) l = x; r = x; }
    if (l >= 0 && r - l > W * 0.02) {
      // An edge touching the image border is the frame, not the face.
      L[y] = l > 1 ? l : NaN; R[y] = r < W - 2 ? r : NaN;
    }
  }
  let yTop = -1;
  for (let y = 0; y < H; y++) if (!Number.isNaN(L[y]) || !Number.isNaN(R[y])) { yTop = y; break; }
  if (yTop < 0) return null;

  // Rough head depth (may include hair) — only used to bound the first nose search.
  let D = 0;
  for (let y = yTop; y < H; y++) {
    const span = (Number.isNaN(R[y]) ? W : R[y]) - (Number.isNaN(L[y]) ? 0 : L[y]);
    D = Math.max(D, span);
    if (y - yTop > 1.1 * D && D > 0) break;
  }
  if (D < W * 0.05) return null;

  const anterior = (side: Facing) => (y: number) => {
    if (y < 0 || y >= H) return NaN;
    return side === 'right' ? R[y] : -L[y];
  };
  const sharpness = (a: (y: number) => number, y: number, k: number) => {
    const c = a(y), u = a(y - k), d = a(y + k);
    return Number.isFinite(c) && Number.isFinite(u) && Number.isFinite(d) ? Math.min(c - u, c - d) : -Infinity;
  };
  const k0 = Math.max(2, Math.round(0.05 * D));
  const bestPeak = (side: Facing) => {
    const a = anterior(side); let best = -Infinity, at = -1;
    for (let y = Math.round(yTop + 0.3 * D); y <= Math.min(H - 1 - k0, Math.round(yTop + 1.3 * D)); y++) {
      const s = sharpness(a, y, k0);
      if (s > best) { best = s; at = y; }
    }
    return { best, at };
  };

  const right = bestPeak('right'), left = bestPeak('left');
  const facing: Facing = hint?.facing ?? (right.best >= left.best ? 'right' : 'left');
  const a = anterior(facing);
  let prnY = (facing === 'right' ? right : left).at;
  if (hint?.noseY !== undefined) prnY = Math.round(hint.noseY * H);
  if (prnY < 0) return null;

  const clampY = (y: number) => Math.max(yTop, Math.min(H - 1, Math.round(y)));
  const argExt = (from: number, to: number, mode: 'max' | 'min') => {
    let best = mode === 'max' ? -Infinity : Infinity, at = clampY((from + to) / 2);
    for (let y = clampY(Math.min(from, to)); y <= clampY(Math.max(from, to)); y++) {
      const v = a(y); if (!Number.isFinite(v)) continue;
      if (mode === 'max' ? v > best : v < best) { best = v; at = y; }
    }
    return at;
  };

  // Scale from head top to nose tip (≈ 14–15 cm on adults); every window below is in these units.
  prnY = argExt(prnY - 0.03 * D, prnY + 0.03 * D, 'max');
  const S = Math.max(10, prnY - yTop);
  const nY = argExt(prnY - 0.45 * S, prnY - 0.18 * S, 'min');
  const gY = argExt(nY - 0.2 * S, nY - 0.02 * S, 'max');
  const fhY = clampY(gY - 0.28 * S);
  const snY = argExt(prnY + 0.03 * S, prnY + 0.16 * S, 'min');
  const lsY = argExt(snY + 0.03 * S, snY + 0.14 * S, 'max');
  const stoY = argExt(lsY + 0.01 * S, lsY + 0.1 * S, 'min');
  const liY = argExt(stoY + 0.01 * S, stoY + 0.1 * S, 'max');
  // Chin bottom: first row below the lips where the outline falls well behind the chin (towards the neck).
  let meY = clampY(liY + 0.3 * S), runMax = -Infinity;
  for (let y = clampY(liY + 0.06 * S); y <= clampY(liY + 0.45 * S); y++) {
    const v = a(y); if (!Number.isFinite(v)) continue;
    runMax = Math.max(runMax, v);
    if (y > liY + 0.1 * S && v < runMax - 0.15 * S) { meY = y; break; }
  }
  // Pogonion: the chin point furthest in front of the chord from lower lip to chin bottom.
  let pogY = clampY((liY + meY) / 2), bestD = -Infinity;
  for (let y = clampY(liY + 0.05 * S); y < meY; y++) {
    const v = a(y); if (!Number.isFinite(v)) continue;
    const t = (y - liY) / Math.max(1, meY - liY);
    const chord = a(liY) + t * (a(meY) - a(liY));
    if (v - chord > bestD) { bestD = v - chord; pogY = y; }
  }
  const cmY = clampY(prnY + 0.55 * (snY - prnY));
  const edgeX = (y: number) => {
    for (let d = 0; d < 20; d++) for (const yy of [y - d, y + d]) { const v = facing === 'right' ? R[yy] : L[yy]; if (yy >= 0 && yy < H && !Number.isNaN(v)) return v; }
    return W / 2;
  };

  const sx = imgW / W, sy = imgH / H;
  const at = (y: number): Pt => ({ x: (edgeX(y) + 0.5) * sx, y: (y + 0.5) * sy });
  return {
    facing,
    points: { Fh: at(fhY), G: at(gY), N: at(nY), Prn: at(prnY), Cm: at(cmY), Sn: at(snY), Ls: at(lsY), Li: at(liY), Pog: at(pogY), Me: at(meY) },
  };
}

export type ProfileMetrics = {
  nasofrontal: number;   // ° G–N–Prn (ideal 115–135)
  nasolabial: number;    // ° Cm–Sn–Ls (ideal 90–110)
  nasofacial: number;    // ° between G–Pog and N–Prn (ideal 30–40)
  convexity: number;     // ° G–Sn–Pog (ideal 165–178; lower = convex / retruded chin, >180 = concave)
  tipProjection: number; // forward projection Sn→Prn / nasal length N→Prn (typical 0.22–0.40)
  upperLipE: number;     // upper lip to Ricketts E-line / E-line length (ideal ≈ −0.06; + = in front)
  lowerLipE: number;     // lower lip to E-line (ideal ≈ −0.03)
  foreheadSlope: number; // ° backward tilt of forehead vs facial vertical (typical 5–20)
  middleToLower: number; // N–Sn / Sn–Me height (typical 0.7–0.95)
};

const sub = (p: Pt, q: Pt) => ({ x: p.x - q.x, y: p.y - q.y });
const dot = (p: Pt, q: Pt) => p.x * q.x + p.y * q.y;
const len = (p: Pt) => Math.hypot(p.x, p.y);
const norm = (p: Pt) => { const l = len(p) || 1; return { x: p.x / l, y: p.y / l }; };
const deg = (r: number) => (r * 180) / Math.PI;
const angleAt = (a: Pt, b: Pt, c: Pt) => deg(Math.acos(Math.max(-1, Math.min(1, dot(norm(sub(a, b)), norm(sub(c, b)))))));

export function measureProfile(p: ProfilePoints): ProfileMetrics {
  const up = norm(sub(p.G, p.Me));
  // Forward = perpendicular to the facial vertical, on the side the nose points to.
  let fwd = { x: -up.y, y: up.x };
  const mid = { x: (p.G.x + p.Me.x) / 2, y: (p.G.y + p.Me.y) / 2 };
  if (dot(sub(p.Prn, mid), fwd) < 0) fwd = { x: -fwd.x, y: -fwd.y };

  const eDir = norm(sub(p.Pog, p.Prn));
  let eN = { x: -eDir.y, y: eDir.x };
  if (dot(eN, fwd) < 0) eN = { x: -eN.x, y: -eN.y };
  const eLen = len(sub(p.Pog, p.Prn)) || 1;

  const gpDir = norm(sub(p.Pog, p.G));
  let gpN = { x: -gpDir.y, y: gpDir.x };
  if (dot(gpN, fwd) < 0) gpN = { x: -gpN.x, y: -gpN.y };

  const fh = norm(sub(p.Fh, p.G));
  const slope = deg(Math.acos(Math.max(-1, Math.min(1, dot(fh, up))))) * (dot(fh, fwd) < 0 ? 1 : -1);

  return {
    nasofrontal: angleAt(p.G, p.N, p.Prn),
    nasolabial: angleAt(p.Cm, p.Sn, p.Ls),
    nasofacial: deg(Math.acos(Math.max(-1, Math.min(1, dot(norm(sub(p.Pog, p.G)), norm(sub(p.Prn, p.N))))))),
    // >180 = concave (chin ahead of the G–Sn line), <180 = convex.
    convexity: dot(sub(p.Sn, p.G), gpN) >= 0 ? angleAt(p.G, p.Sn, p.Pog) : 360 - angleAt(p.G, p.Sn, p.Pog),
    tipProjection: dot(sub(p.Prn, p.Sn), fwd) / (len(sub(p.Prn, p.N)) || 1),
    upperLipE: dot(sub(p.Ls, p.Prn), eN) / eLen,
    lowerLipE: dot(sub(p.Li, p.Prn), eN) / eLen,
    foreheadSlope: slope,
    middleToLower: dot(sub(p.N, p.Sn), up) / (dot(sub(p.Sn, p.Me), up) || 1),
  };
}

/** Reference ranges shown in the UI (cosmetic-surgery literature; approximate). */
export const PROFILE_RANGES: Record<keyof ProfileMetrics, { min: number; max: number; unit: '°' | '' ; name: { th: string; en: string } }> = {
  nasofrontal: { min: 115, max: 135, unit: '°', name: { th: 'มุมหน้าผาก–ดั้งจมูก', en: 'Nasofrontal angle' } },
  nasolabial: { min: 90, max: 110, unit: '°', name: { th: 'มุมจมูก–ริมฝีปาก', en: 'Nasolabial angle' } },
  nasofacial: { min: 30, max: 40, unit: '°', name: { th: 'มุมจมูกกับใบหน้า', en: 'Nasofacial angle' } },
  convexity: { min: 165, max: 178, unit: '°', name: { th: 'ความโค้งของโปรไฟล์', en: 'Facial convexity' } },
  tipProjection: { min: 0.22, max: 0.4, unit: '', name: { th: 'การยื่นของปลายจมูก', en: 'Tip projection' } },
  upperLipE: { min: -0.09, max: -0.02, unit: '', name: { th: 'ริมฝีปากบนกับเส้น E-line', en: 'Upper lip to E-line' } },
  lowerLipE: { min: -0.06, max: 0.0, unit: '', name: { th: 'ริมฝีปากล่างกับเส้น E-line', en: 'Lower lip to E-line' } },
  foreheadSlope: { min: 5, max: 22, unit: '°', name: { th: 'ความลาดของหน้าผาก', en: 'Forehead slope' } },
  middleToLower: { min: 0.7, max: 0.95, unit: '', name: { th: 'สัดส่วนกลาง : ล่าง', en: 'Middle : lower face' } },
};

/** True when the numbers are anatomically implausible — the points probably need adjusting. */
export function profileLooksOff(m: ProfileMetrics) {
  return m.nasofacial > 55 || m.nasofacial < 12 || m.tipProjection > 0.7 || m.tipProjection < 0.05 || m.nasolabial > 150 || m.nasolabial < 60
    || m.nasofrontal < 95 || m.nasofrontal > 170 || Math.abs(m.foreheadSlope) > 45 || m.middleToLower < 0.45 || m.middleToLower > 1.4;
}
