'use client';
import { useCallback, useEffect, useRef, useState, DragEvent, ChangeEvent } from 'react';
import { Upload, Camera, Trash2, Check, Aperture, VideoOff, ScanFace } from 'lucide-react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { loadLandmarker, switchRunningMode, meshConnections } from '@/lib/face/landmarker';
import { drawMesh, MESH_POINTS, type MeshSettings } from '@/lib/face/draw';
import { useLang, type Bi } from '@/lib/i18n';

type Mode = 'upload' | 'camera';
type Kind = 'idle' | 'loading' | 'ok' | 'none' | 'error';
type Status = { kind: Kind; msg?: Bi };

export type DetectedFace = { landmarks: NormalizedLandmark[]; width: number; height: number };

const MSG = {
  mapping: { th: 'กำลังวาง 468 จุด…', en: 'Mapping 468 points…' },
  mapped: { th: `วาง ${MESH_POINTS} จุดสำเร็จ`, en: `${MESH_POINTS} POINTS MAPPED` },
  noFace: { th: 'ไม่พบใบหน้า — ลองรูปหน้าตรงที่ชัดขึ้น', en: 'No face found — try a clearer, front-facing photo' },
  loadFail: { th: 'โหลด face mesh ในเบราว์เซอร์นี้ไม่ได้', en: 'Face mesh could not load in this browser' },
  insecure: { th: 'กล้องต้องใช้การเชื่อมต่อที่ปลอดภัย (https หรือ localhost)', en: 'Camera needs a secure connection (https or localhost)' },
  starting: { th: 'กำลังเปิดกล้อง…', en: 'Starting camera…' },
  loadingMesh: { th: 'กำลังโหลด face mesh…', en: 'Loading face mesh…' },
  live: { th: `สด · ติดตาม ${MESH_POINTS} จุด`, en: `LIVE · ${MESH_POINTS} POINTS TRACKING` },
  looking: { th: 'กำลังหาใบหน้า…', en: 'Looking for a face…' },
  denied: { th: 'ไม่ได้รับอนุญาตให้ใช้กล้อง', en: 'Camera permission was denied' },
  camFail: { th: 'เปิดกล้องไม่ได้', en: 'Could not start the camera' },
} satisfies Record<string, Bi>;

const LEVELS: Bi[] = [{ th: 'จุด', en: 'Points' }, { th: 'เส้นโครง', en: 'Contours' }, { th: 'ตาข่ายเต็ม', en: 'Full mesh' }];

export default function FaceMeshStudio({ image, onFile, onRemove, onFace }: { image: string; onFile: (file?: File) => void; onRemove: () => void; onFace: (face: DetectedFace | null) => void }) {
  const { t } = useLang();
  const [mode, setMode] = useState<Mode>('upload');
  const [settings, setSettings] = useState<MeshSettings>({ level: 3, opacity: 0.85, pointSize: 1.4 });
  const [showMesh, setShowMesh] = useState(true);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [camStatus, setCamStatus] = useState<Status>({ kind: 'idle' });

  const photoCanvas = useRef<HTMLCanvasElement>(null);
  const photoImg = useRef<HTMLImageElement | null>(null);
  const photoLandmarks = useRef<NormalizedLandmark[] | null>(null);
  const onFaceRef = useRef(onFace);
  onFaceRef.current = onFace;

  const video = useRef<HTMLVideoElement>(null);
  const camCanvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef(0);
  const liveSettings = useRef(settings);
  liveSettings.current = showMesh ? settings : { ...settings, opacity: 0 };

  // ---------- Upload mode ----------
  const redrawPhoto = useCallback(() => {
    const canvas = photoCanvas.current, img = photoImg.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if (showMesh && photoLandmarks.current) drawMesh(ctx, photoLandmarks.current, canvas.width, canvas.height, settings, meshConnections.tess, meshConnections.contours);
  }, [settings, showMesh]);

  useEffect(() => {
    photoLandmarks.current = null; photoImg.current = null;
    if (!image) { onFaceRef.current(null); setStatus({ kind: 'idle' }); return; }
    if (mode !== 'upload') return;
    let cancelled = false;
    const img = new Image();
    img.onload = async () => {
      if (cancelled || !photoCanvas.current) return;
      const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      photoCanvas.current.width = Math.round(img.naturalWidth * scale);
      photoCanvas.current.height = Math.round(img.naturalHeight * scale);
      photoImg.current = img;
      redrawPhoto();
      setStatus({ kind: 'loading', msg: MSG.mapping });
      try {
        const { lm } = await loadLandmarker();
        if (cancelled) return;
        await switchRunningMode(lm, 'IMAGE');
        const result = lm.detect(img);
        if (cancelled) return;
        const face = result.faceLandmarks[0];
        photoLandmarks.current = face ?? null;
        setStatus(face ? { kind: 'ok', msg: MSG.mapped } : { kind: 'none', msg: MSG.noFace });
        onFaceRef.current(face ? { landmarks: face, width: img.naturalWidth, height: img.naturalHeight } : null);
        redrawPhoto();
      } catch (err) {
        if (!cancelled) { setStatus({ kind: 'error', msg: MSG.loadFail }); onFaceRef.current(null); }
        console.error(err);
      }
    };
    img.src = image;
    return () => { cancelled = true; };
    // redrawPhoto intentionally excluded: settings changes only redraw (effect below), never re-detect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, mode]);

  useEffect(() => { redrawPhoto(); }, [redrawPhoto]);

  // ---------- Camera mode ----------
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach(tr => tr.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (mode !== 'camera') return;
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setCamStatus({ kind: 'error', msg: MSG.insecure }); return; }
      setCamStatus({ kind: 'loading', msg: MSG.starting });
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (cancelled) { s.getTracks().forEach(tr => tr.stop()); return; }
        stream.current = s;
        const v = video.current!;
        v.srcObject = s; await v.play();
        setCamStatus({ kind: 'loading', msg: MSG.loadingMesh });
        const { lm, tess, contours } = await loadLandmarker();
        if (cancelled) return;
        await switchRunningMode(lm, 'VIDEO');
        let lastTime = -1, lastFound: boolean | null = null;
        const loop = () => {
          if (cancelled) return;
          const canvas = camCanvas.current, ctx = canvas?.getContext('2d');
          if (canvas && ctx && v.readyState >= 2 && v.currentTime !== lastTime) {
            lastTime = v.currentTime;
            if (canvas.width !== v.videoWidth) { canvas.width = v.videoWidth; canvas.height = v.videoHeight; }
            const result = lm.detectForVideo(v, performance.now());
            const face = result.faceLandmarks[0];
            ctx.setTransform(-1, 0, 0, 1, canvas.width, 0); // mirror like a selfie camera
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            if (face) drawMesh(ctx, face, canvas.width, canvas.height, liveSettings.current, tess, contours);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            if (!!face !== lastFound) {
              lastFound = !!face;
              setCamStatus(face ? { kind: 'ok', msg: MSG.live } : { kind: 'none', msg: MSG.looking });
            }
          }
          raf.current = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        console.error(err);
        if (!cancelled) setCamStatus({ kind: 'error', msg: (err as Error)?.name === 'NotAllowedError' ? MSG.denied : MSG.camFail });
      }
    })();
    return () => { cancelled = true; stopCamera(); };
  }, [mode, stopCamera]);

  const capture = () => {
    const v = video.current; if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(-1, 0, 0, 1, c.width, 0); ctx.drawImage(v, 0, 0);
    c.toBlob(blob => {
      if (!blob) return;
      onFile(new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' }));
      setMode('upload');
    }, 'image/jpeg', 0.92);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); setMode('upload'); };

  const controls = (
    <div className="mesh-controls">
      <div className="mesh-levels" role="radiogroup" aria-label={t({ th: 'ระดับ mesh', en: 'Mesh level' })}>
        <span>{t({ th: 'ระดับ MESH', en: 'MESH LEVEL' })}</span>
        {LEVELS.map((name, i) => (
          <button key={name.en} role="radio" aria-checked={settings.level === i + 1} className={settings.level === i + 1 ? 'picked' : ''} onClick={() => setSettings({ ...settings, level: i + 1 })}>{t(name)}</button>
        ))}
        <label className="mesh-toggle"><input type="checkbox" checked={showMesh} onChange={e => setShowMesh(e.target.checked)} /> {t({ th: 'แสดง mesh', en: 'Show mesh' })}</label>
      </div>
      <label>{t({ th: 'ความเข้ม', en: 'Opacity' })} <b>{Math.round(settings.opacity * 100)}%</b>
        <input type="range" min="10" max="100" value={Math.round(settings.opacity * 100)} onChange={e => setSettings({ ...settings, opacity: Number(e.target.value) / 100 })} />
      </label>
      <label>{t({ th: 'ขนาดจุด', en: 'Point size' })} <b>{settings.pointSize.toFixed(1)}</b>
        <input type="range" min="5" max="40" value={Math.round(settings.pointSize * 10)} onChange={e => setSettings({ ...settings, pointSize: Number(e.target.value) / 10 })} />
      </label>
    </div>
  );

  const statusIcon = (k: Kind, live = false) => k === 'loading' ? <span className="spinner" /> : live && k !== 'none' ? <i className="rec-dot" /> : k === 'ok' ? <Check size={11} /> : <ScanFace size={11} />;

  return (
    <div className="mesh-studio">
      <div className="mesh-tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'upload'} className={mode === 'upload' ? 'on' : ''} onClick={() => setMode('upload')}><Upload size={13} /> {t({ th: 'อัปโหลดรูป', en: 'Upload photo' })}</button>
        <button role="tab" aria-selected={mode === 'camera'} className={mode === 'camera' ? 'on' : ''} onClick={() => setMode('camera')}><Camera size={13} /> {t({ th: 'สแกนด้วยกล้อง', en: 'Scan with camera' })}</button>
      </div>

      {mode === 'upload' && (image ? (
        <>
          <div className="mesh-stage">
            <canvas ref={photoCanvas} aria-label={t({ th: 'รูปของคุณพร้อม face mesh 468 จุด', en: 'Your photo with a 468-point face mesh' })} />
            {status.msg && <span className={`mesh-status ${status.kind}`}>{statusIcon(status.kind)} {t(status.msg)}</span>}
            <div className="preview-overlay"><span><Check size={14} /> {t({ th: 'พร้อมวิเคราะห์', en: 'READY TO ANALYZE' })}</span><div className="preview-actions"><label className="replace-photo" htmlFor="face-upload">{t({ th: 'เลือกรูปอื่น', en: 'Choose another photo' })}</label><button onClick={onRemove} aria-label={t({ th: 'ลบรูป', en: 'Delete image' })}><Trash2 size={15} /> {t({ th: 'ลบ', en: 'Remove' })}</button></div></div>
          </div>
          {controls}
        </>
      ) : (
        <div className="dropzone" onDrop={onDrop} onDragOver={e => e.preventDefault()}>
          <div className="upload-icon"><Upload size={18} /></div>
          <b>{t({ th: 'ลากรูปมาวางที่นี่', en: 'Drop your photo here' })}</b>
          <span>{t({ th: 'หรือ', en: 'or' })} <label className="browse-link" htmlFor="face-upload">{t({ th: 'เลือกไฟล์', en: 'browse files' })}</label> · {t({ th: 'หรือ', en: 'or' })} <button className="browse-link" onClick={() => setMode('camera')}>{t({ th: 'ใช้กล้อง', en: 'use your camera' })}</button></span>
          <small>{t({ th: 'JPG, PNG หรือ WEBP · ไม่เกิน 10 MB', en: 'JPG, PNG or WEBP · up to 10 MB' })}</small>
        </div>
      ))}

      {mode === 'camera' && (
        <>
          <div className="mesh-stage camera">
            <video ref={video} playsInline muted hidden />
            <canvas ref={camCanvas} aria-label={t({ th: 'กล้องสดพร้อม face mesh 468 จุด', en: 'Live camera with a 468-point face mesh' })} />
            {camStatus.kind === 'error' && camStatus.msg && <div className="cam-error"><VideoOff size={22} /><b>{t(camStatus.msg)}</b><button onClick={() => setMode('upload')}>{t({ th: 'อัปโหลดรูปแทน', en: 'Upload a photo instead' })}</button></div>}
            {camStatus.msg && camStatus.kind !== 'error' && <span className={`mesh-status ${camStatus.kind}`}>{statusIcon(camStatus.kind, true)} {t(camStatus.msg)}</span>}
            <button className="capture-button" disabled={camStatus.kind !== 'ok'} onClick={capture}><Aperture size={15} /> {t({ th: 'ถ่ายภาพ', en: 'Capture photo' })}</button>
          </div>
          {controls}
        </>
      )}

      <input id="face-upload" type="file" accept="image/*" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => { onFile(e.target.files?.[0]); setMode('upload'); e.target.value = ''; }} />
    </div>
  );
}
