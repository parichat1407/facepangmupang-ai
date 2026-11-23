'use client';
import { useCallback, useEffect, useRef, useState, ChangeEvent, DragEvent, KeyboardEvent, PointerEvent as RPointerEvent } from 'react';
import { Upload, Camera, Trash2, Timer, Aperture, VideoOff, FlipHorizontal2, Wand2, AlertTriangle, Check } from 'lucide-react';
import { useLang, type Bi } from '@/lib/i18n';
import { PROFILE_KEYS, PROFILE_LABELS, measureProfile, profileLooksOff, type Facing, type ProfileKey, type ProfilePoints, type Pt } from '@/lib/face/profile';
import { autoProfile, templateProfile } from '@/lib/face/profile-auto';

export type ProfileData = { points: ProfilePoints; facing: Facing; width: number; height: number };
type View = { x: number; y: number; w: number; h: number };
type Status = { kind: 'idle' | 'loading' | 'ok' | 'manual' | 'error'; msg?: Bi };

const MSG = {
  finding: { th: 'กำลังหาเส้นโปรไฟล์…', en: 'Tracing your profile…' },
  found: { th: 'วางจุดอัตโนมัติแล้ว · ลากปรับให้ตรงได้', en: 'Points placed · drag to fine-tune' },
  manual: { th: 'หาโปรไฟล์อัตโนมัติไม่ได้ · ลากจุดไปวางเอง', en: 'Couldn’t trace automatically · drag the points into place' },
  fail: { th: 'โหลดตัวช่วยวางจุดไม่ได้ · ลากจุดไปวางเอง', en: 'Auto-placement unavailable · drag the points into place' },
} satisfies Record<string, Bi>;

/** Crop around the points so the face fills the editor. */
function viewFor(points: ProfilePoints, W: number, H: number): View {
  const xs = PROFILE_KEYS.map(k => points[k].x), ys = PROFILE_KEYS.map(k => points[k].y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const size = Math.max(maxY - minY, maxX - minX) * 1.45;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const w = Math.min(W, size * 1.0), h = Math.min(H, size * 1.1);
  return { x: Math.max(0, Math.min(W - w, cx - w / 2)), y: Math.max(0, Math.min(H - h, cy - h / 2)), w, h };
}

/** The photo with profile points, guide lines and (optionally) draggable handles. */
export function ProfileFigure({ image, data, view, editable, onMove, label }: {
  image: string; data: ProfileData; view?: View; editable?: boolean; onMove?: (k: ProfileKey, p: Pt) => void; label: string;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<ProfileKey | null>(null);
  const [focus, setFocus] = useState<ProfileKey | null>(null);
  const v = view ?? viewFor(data.points, data.width, data.height);
  const p = data.points;
  const u = v.w / 100; // one "unit" relative to the crop
  const toLocal = (e: RPointerEvent) => {
    const el = svg.current; const ctm = el?.getScreenCTM(); if (!el || !ctm) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: Math.max(0, Math.min(data.width, pt.x)), y: Math.max(0, Math.min(data.height, pt.y)) };
  };
  const onKey = (k: ProfileKey) => (e: KeyboardEvent) => {
    const step = (e.shiftKey ? 5 : 1) * u * 0.3;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key as 'ArrowLeft'];
    if (!d || !onMove) return;
    e.preventDefault(); onMove(k, { x: p[k].x + d[0], y: p[k].y + d[1] });
  };
  const line = (a: Pt, b: Pt, cls: string) => <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={cls} strokeWidth={u * 0.35} />;
  const ext = (a: Pt, b: Pt, f: number) => ({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
  const dir = data.facing === 'right' ? 1 : -1;

  return (
    <svg ref={svg} className={`profile-svg ${editable ? 'editable' : ''}`} viewBox={`${v.x} ${v.y} ${v.w} ${v.h}`} role="img" aria-label={label}
      onPointerMove={e => { if (!drag || !onMove) return; const q = toLocal(e); if (q) onMove(drag, q); }}
      onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)}>
      <image href={image} x={0} y={0} width={data.width} height={data.height} preserveAspectRatio="none" />
      <g className="profile-lines">
        {line(ext(p.Prn, p.Pog, -0.15), ext(p.Prn, p.Pog, 1.15), 'eline')}
        {line(p.G, p.N, 'angle')}{line(p.N, p.Prn, 'angle')}
        {line(p.Cm, p.Sn, 'angle')}{line(p.Sn, p.Ls, 'angle')}
        {line(p.G, p.Sn, 'convex')}{line(p.Sn, p.Pog, 'convex')}
        {line(p.Fh, p.G, 'angle')}
      </g>
      {PROFILE_KEYS.map(k => (
        <g key={k} className={`profile-pt ${drag === k || focus === k ? 'active' : ''}`}>
          <circle cx={p[k].x} cy={p[k].y} r={u * (editable ? 1.05 : 0.8)} tabIndex={editable ? 0 : -1}
            aria-label={`${k}`} role={editable ? 'slider' : undefined}
            onPointerDown={editable ? e => { (e.target as Element).setPointerCapture(e.pointerId); setDrag(k); } : undefined}
            onKeyDown={editable ? onKey(k) : undefined} onFocus={() => setFocus(k)} onBlur={() => setFocus(null)} />
          <text x={p[k].x + dir * u * 2.4} y={p[k].y + u * 1.1} fontSize={u * 2.6} textAnchor={dir > 0 ? 'start' : 'end'}>{k}</text>
        </g>
      ))}
    </svg>
  );
}

export default function ProfileStudio({ image, data, onFile, onRemove, onChange }: {
  image: string; data: ProfileData | null; onFile: (f?: File) => void; onRemove: () => void; onChange: (d: ProfileData | null) => void;
}) {
  const { t } = useLang();
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [view, setView] = useState<View | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;

  const place = useCallback(async (img: HTMLImageElement, facing?: Facing) => {
    setStatus({ kind: 'loading', msg: MSG.finding });
    const W = img.naturalWidth, H = img.naturalHeight;
    try {
      const det = await autoProfile(img);
      if (det && !(facing && det.facing !== facing)) {
        const d = { ...det, width: W, height: H };
        const off = profileLooksOff(measureProfile(det.points));
        onChangeRef.current(d); setView(viewFor(det.points, W, H));
        setStatus({ kind: off ? 'manual' : 'ok', msg: off ? MSG.manual : MSG.found });
        return;
      }
      const pts = templateProfile(W, H, facing ?? det?.facing ?? 'right');
      onChangeRef.current({ points: pts, facing: facing ?? 'right', width: W, height: H });
      setView({ x: 0, y: 0, w: W, h: H }); setStatus({ kind: 'manual', msg: MSG.manual });
    } catch (err) {
      console.error(err);
      onChangeRef.current({ points: templateProfile(W, H, facing ?? 'right'), facing: facing ?? 'right', width: W, height: H });
      setView({ x: 0, y: 0, w: W, h: H }); setStatus({ kind: 'error', msg: MSG.fail });
    }
  }, []);

  useEffect(() => {
    if (!image) { imgRef.current = null; setStatus({ kind: 'idle' }); setView(null); return; }
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) { imgRef.current = img; place(img); } };
    img.src = image;
    return () => { cancelled = true; };
  }, [image, place]);

  // Flip mirrors the points around the facial vertical — for when the auto-trace picked the wrong side.
  const flip = () => {
    if (!data) return;
    const cx = (data.points.G.x + data.points.Me.x) / 2;
    const mirrored = Object.fromEntries(PROFILE_KEYS.map(k => [k, { x: 2 * cx - data.points[k].x, y: data.points[k].y }])) as ProfilePoints;
    onChange({ ...data, points: mirrored, facing: data.facing === 'right' ? 'left' : 'right' });
  };
  const move = (k: ProfileKey, p: Pt) => { if (data) onChange({ ...data, points: { ...data.points, [k]: p } }); };
  const metrics = data ? measureProfile(data.points) : null;
  const looksOff = metrics ? profileLooksOff(metrics) : false;

  return (
    <div className="profile-studio">
      <div className="mesh-tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'upload'} className={mode === 'upload' ? 'on' : ''} onClick={() => setMode('upload')}><Upload size={13} /> {t({ th: 'อัปโหลดรูปด้านข้าง', en: 'Upload side photo' })}</button>
        <button role="tab" aria-selected={mode === 'camera'} className={mode === 'camera' ? 'on' : ''} onClick={() => setMode('camera')}><Camera size={13} /> {t({ th: 'ถ่ายด้วยกล้อง', en: 'Use camera' })}</button>
      </div>

      {mode === 'upload' && (image && data && view ? (
        <>
          <div className="mesh-stage profile-stage">
            <ProfileFigure image={image} data={data} view={view} editable onMove={move} label={t({ th: 'รูปด้านข้างพร้อมจุดที่ลากปรับได้', en: 'Side photo with draggable points' })} />
            {status.msg && <span className={`mesh-status ${status.kind === 'ok' ? 'ok' : status.kind === 'loading' ? 'loading' : 'none'}`}>{status.kind === 'loading' ? <span className="spinner" /> : status.kind === 'ok' ? <Check size={11} /> : <AlertTriangle size={11} />} {t(status.msg)}</span>}
            <div className="preview-overlay"><span>{t({ th: 'ลากจุดสีทองให้ตรงขอบหน้า', en: 'DRAG THE GOLD POINTS ONTO YOUR OUTLINE' })}</span><div className="preview-actions"><label className="replace-photo" htmlFor="profile-upload">{t({ th: 'เลือกรูปอื่น', en: 'Choose another photo' })}</label><button onClick={onRemove}><Trash2 size={15} /> {t({ th: 'ลบ', en: 'Remove' })}</button></div></div>
          </div>
          <div className="profile-tools">
            <button onClick={() => imgRef.current && place(imgRef.current)}><Wand2 size={13} /> {t({ th: 'วางจุดอัตโนมัติใหม่', en: 'Auto-place again' })}</button>
            <button onClick={flip}><FlipHorizontal2 size={13} /> {t({ th: 'สลับด้าน', en: 'Flip side' })}</button>
            <button onClick={() => setView({ x: 0, y: 0, w: data.width, h: data.height })}>{t({ th: 'ดูทั้งภาพ', en: 'Show whole photo' })}</button>
            <button onClick={() => setView(viewFor(data.points, data.width, data.height))}>{t({ th: 'ซูมที่หน้า', en: 'Zoom to face' })}</button>
          </div>
          {looksOff && <p className="warn-text"><AlertTriangle size={13} /> {t({ th: 'ค่าที่วัดได้ดูผิดปกติ จุดอาจวางคลาด (เช่น ผมหน้าม้า เครา หรือพื้นหลังรก) ลองลากจุดให้ตรงขอบหน้า', en: 'These measurements look unusual — points may be off (bangs, beard or a busy background). Drag them onto your outline.' })}</p>}
          <details className="profile-legend">
            <summary>{t({ th: 'แต่ละจุดคืออะไร', en: 'What each point marks' })}</summary>
            <ul>{PROFILE_KEYS.map(k => <li key={k}><b>{k}</b> {t(PROFILE_LABELS[k])}</li>)}</ul>
            <small>{t({ th: 'ลากด้วยเมาส์หรือนิ้ว หรือกด Tab แล้วใช้ปุ่มลูกศร (Shift = เร็วขึ้น)', en: 'Drag with mouse or finger, or Tab to a point and use the arrow keys (Shift = faster).' })}</small>
          </details>
        </>
      ) : image ? (
        <div className="dropzone"><span className="spinner" /><small>{t(MSG.finding)}</small></div>
      ) : (
        <div className="dropzone" onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }} onDragOver={e => e.preventDefault()}>
          <div className="upload-icon profile-icon"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden><path d="M9 3c4 0 7 3 7 7l2 3-2 1v2c0 1.5-1 2.5-2.5 2.5H12V21" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
          <b>{t({ th: 'เพิ่มรูปด้านข้าง (ไม่บังคับ)', en: 'Add a side photo (optional)' })}</b>
          <span>{t({ th: 'หันข้างให้กล้อง 90° เห็นตั้งแต่หน้าผากถึงคาง', en: 'Turn 90° to the camera, forehead to chin visible' })} · <label className="browse-link" htmlFor="profile-upload">{t({ th: 'เลือกไฟล์', en: 'browse files' })}</label></span>
          <small>{t({ th: 'ใช้วัดดั้งจมูก ปลายจมูก ริมฝีปาก และคางจากด้านข้าง', en: 'Used to measure nose bridge, tip, lips and chin from the side' })}</small>
        </div>
      ))}

      {mode === 'camera' && <ProfileCamera onCapture={f => { onFile(f); setMode('upload'); }} onCancel={() => setMode('upload')} />}

      <input id="profile-upload" type="file" accept="image/*" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => { onFile(e.target.files?.[0]); setMode('upload'); e.target.value = ''; }} />
    </div>
  );
}

/** Camera with a side-profile guide and a self-timer, since you can't see the screen while turned sideways. */
function ProfileCamera({ onCapture, onCancel }: { onCapture: (f: File) => void; onCancel: () => void }) {
  const { t } = useLang();
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<Bi | null>(null);
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(0);
  const [facing, setFacing] = useState<Facing>('left');

  useEffect(() => {
    let stream: MediaStream | null = null, cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setErr({ th: 'กล้องต้องใช้การเชื่อมต่อที่ปลอดภัย (https หรือ localhost)', en: 'Camera needs a secure connection (https or localhost)' }); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
        if (cancelled) { stream.getTracks().forEach(tr => tr.stop()); return; }
        video.current!.srcObject = stream; await video.current!.play(); setReady(true);
      } catch (e) {
        setErr((e as Error)?.name === 'NotAllowedError' ? { th: 'ไม่ได้รับอนุญาตให้ใช้กล้อง', en: 'Camera permission was denied' } : { th: 'เปิดกล้องไม่ได้', en: 'Could not start the camera' });
      }
    })();
    return () => { cancelled = true; stream?.getTracks().forEach(tr => tr.stop()); };
  }, []);

  const shoot = useCallback(() => {
    const v = video.current; if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d')!; ctx.setTransform(-1, 0, 0, 1, c.width, 0); ctx.drawImage(v, 0, 0);
    c.toBlob(b => b && onCapture(new File([b], 'profile-capture.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.92);
  }, [onCapture]);

  useEffect(() => {
    if (count <= 0) return;
    const id = setTimeout(() => { if (count === 1) { setCount(0); shoot(); } else setCount(count - 1); }, 1000);
    return () => clearTimeout(id);
  }, [count, shoot]);

  return (
    <div className="mesh-stage camera profile-camera">
      <video ref={video} playsInline muted />
      {ready && <svg className={`profile-guide ${facing}`} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <path d="M58 12 C44 12 36 22 36 34 L35 40 L30 50 L35 52 L34 56 L36 58 L35 62 C35 68 40 70 46 70 L48 82" />
      </svg>}
      {err && <div className="cam-error"><VideoOff size={22} /><b>{t(err)}</b><button onClick={onCancel}>{t({ th: 'อัปโหลดรูปแทน', en: 'Upload a photo instead' })}</button></div>}
      {count > 0 && <div className="countdown">{count}</div>}
      {ready && <span className="mesh-status ok">{t({ th: 'หันข้างให้ตรงเส้นประ · ตั้งเวลาแล้วหันข้างค้างไว้', en: 'Match the dashed outline · start the timer, then hold still' })}</span>}
      {ready && <div className="profile-cam-actions">
        <button className="ghost" onClick={() => setFacing(facing === 'left' ? 'right' : 'left')}><FlipHorizontal2 size={14} /></button>
        <button className="capture-button static" onClick={() => setCount(3)} disabled={count > 0}><Timer size={15} /> {t({ th: 'ถ่ายใน 3 วิ', en: 'Shoot in 3s' })}</button>
        <button className="capture-button static" onClick={shoot} disabled={count > 0}><Aperture size={15} /> {t({ th: 'ถ่ายเลย', en: 'Shoot now' })}</button>
      </div>}
    </div>
  );
}
