'use client';
import { useEffect, useState } from 'react';
import { Sparkles, Upload, ArrowRight, MoveHorizontal, Download, RotateCcw, Check, ShieldCheck, X, Images } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import type { Analysis } from '@/app/page';
import { listSims, saveSim, deleteSim, clearSims, downloadName, MAX_SAVED, type SavedSim } from '@/lib/sim-gallery';
import { COMPARE_MODELS, COMPARE_TOTAL, compareEnabled, modelLabel } from '@/lib/sim-models';

type CompareSlot = { model: (typeof COMPARE_MODELS)[number]; status: 'pending' | 'done' | 'error'; sim?: SavedSim; error?: string };
const COMPARE_ON = compareEnabled();

export type SimLevel = 'natural' | 'balanced' | 'defined';
const LEVELS: { id: SimLevel; name: { th: string; en: string }; sub: { th: string; en: string } }[] = [
  { id: 'natural', name: { th: 'เป็นธรรมชาติ', en: 'Natural' }, sub: { th: 'น้อย', en: 'Subtle' } },
  { id: 'balanced', name: { th: 'พอดี', en: 'Balanced' }, sub: { th: 'ปานกลาง', en: 'Refined' } },
  { id: 'defined', name: { th: 'ชัดเจน', en: 'Defined' }, sub: { th: 'เห็นชัด', en: 'Structured' } },
];
const MAX_NOTE = 200;

/** Downscale to ≤1024px JPEG so the request stays well under Vercel's 4.5 MB body limit. */
async function toUploadJpeg(src: string) {
  const img = new Image(); img.src = src; await img.decode();
  const scale = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return { b64: c.toDataURL('image/jpeg', 0.9).split(',')[1], width: c.width, height: c.height };
}

/**
 * Some models return a different aspect ratio (e.g. a square) than the photo they were given.
 * Centre-crop the result to the source ratio, at the result's own resolution, so before/after line up.
 */
async function matchAspect(src: string, width: number, height: number) {
  const img = new Image(); img.src = src; await img.decode();
  const target = width / height, actual = img.naturalWidth / img.naturalHeight;
  if (Math.abs(actual - target) / target < 0.01) return src;
  const cw = actual > target ? Math.round(img.naturalHeight * target) : img.naturalWidth;
  const ch = actual > target ? img.naturalHeight : Math.round(img.naturalWidth / target);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  c.getContext('2d')!.drawImage(img, (img.naturalWidth - cw) / 2, (img.naturalHeight - ch) / 2, cw, ch, 0, 0, cw, ch);
  return c.toDataURL('image/jpeg', 0.92);
}

type Props = { image: string; profileImage: string; analysis: Analysis | null; selected: string[]; toggle: (id: string) => void };

export default function SimulationSection({ image: frontImage, profileImage, analysis, selected, toggle }: Props) {
  const { t, lang } = useLang();
  const [level, setLevel] = useState<SimLevel>('natural');
  const [note, setNote] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState<SavedSim | null>(null);
  const [gallery, setGallery] = useState<SavedSim[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [slots, setSlots] = useState<CompareSlot[]>([]);
  const [split, setSplit] = useState(50);
  const [view, setView] = useState<'front' | 'side'>('front');
  const image = view === 'side' && profileImage ? profileImage : frontImage;
  useEffect(() => { if (!profileImage) setView('front'); }, [profileImage]);

  useEffect(() => { setCurrent(null); setError(''); setSlots([]); }, [image]);
  useEffect(() => { listSims().then(setGallery); }, []);
  const after = current?.after ?? '';
  const shownBefore = current ? current.before : image;

  const show = (sim: SavedSim) => { setCurrent(sim); setSplit(50); document.getElementById('simulation')?.scrollIntoView({ behavior: 'smooth' }); };
  const remove = async (id: string) => {
    await deleteSim(id);
    setGallery(g => g.filter(s => s.id !== id));
    if (current?.id === id) setCurrent(null);
  };
  const removeAll = async () => {
    if (!window.confirm(t({ th: 'ลบภาพจำลองที่บันทึกไว้ทั้งหมดในเครื่องนี้?', en: 'Delete all saved simulations on this device?' }))) return;
    await clearSims(); setGallery([]); setCurrent(null);
  };

  const enhancements = analysis?.report.enhancements ?? [];
  const canGenerate = !!image && !!analysis && (selected.length > 0 || note.trim().length > 0) && consent && !busy;

  /** One request to the simulate route; resolves to a saved-ready simulation or throws a user-facing message. */
  const requestSim = async (jpeg: { b64: string; width: number; height: number }, simView: 'front' | 'side', model?: string): Promise<SavedSim> => {
    const res = await fetch('/api/simulate-face', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: jpeg.b64, width: jpeg.width, height: jpeg.height, ids: selected, level, note: note.trim().slice(0, MAX_NOTE), lang, view: simView, model }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.image) throw new Error(data.error || t({ th: 'สร้างภาพจำลองไม่สำเร็จ', en: 'Could not create the simulation' }));
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      before: `data:image/jpeg;base64,${jpeg.b64}`,
      after: await matchAspect(`data:${data.mediaType || 'image/png'};base64,${data.image}`, jpeg.width, jpeg.height),
      level, view: simView, model: data.model, ms: data.ms,
    };
  };

  const generate = async () => {
    if (!canGenerate) return;
    setBusy(true); setError('');
    try {
      const jpeg = await toUploadJpeg(image);
      const simView = image === profileImage ? 'side' as const : 'front' as const;
      if (!compareMode) {
        setSlots([]);
        const sim = await requestSim(jpeg, simView);
        setCurrent(sim); setSplit(50);
        setGallery(await saveSim(sim)); // kept in this browser only
        return;
      }
      // Compare: same photo and prompt to every model in parallel; each card fills in as its model finishes.
      setCurrent(null);
      setSlots(COMPARE_MODELS.map(model => ({ model, status: 'pending' })));
      let shown = false;
      await Promise.all(COMPARE_MODELS.map(async (model, i) => {
        try {
          const sim = await requestSim(jpeg, simView, model.id);
          await saveSim(sim);
          setSlots(s => s.map((slot, j) => j === i ? { ...slot, status: 'done', sim } : slot));
          if (!shown) { shown = true; setCurrent(sim); setSplit(50); }
        } catch (e) {
          setSlots(s => s.map((slot, j) => j === i ? { ...slot, status: 'error', error: (e as Error).message } : slot));
        }
      }));
      setGallery(await listSims());
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <section className="simulation section-pad" id="simulation">
      <div className="section-heading">
        <div><span className="eyebrow">{t({ th: 'ลองดูก่อนตัดสินใจ', en: 'A LITTLE WHAT-IF' })}</span><h2>{t({ th: 'ถ้าปรับแล้ว', en: 'Curious to' })} <em>{t({ th: 'จะเป็นอย่างไร?', en: 'see?' })}</em></h2></div>
        <p>{t({ th: 'เลือกจุดจากผลโหงวเฮ้ง แล้วให้ AI จำลองภาพ เป็นเพียงภาพแนวคิด ไม่ใช่ผลลัพธ์จริงของการศัลยกรรม', en: 'Pick points from your reading and let AI visualise them. Always a concept, never a promised result.' })}</p>
      </div>
      <div className="simulation-shell">
        <div className="simulation-top"><div><span className="card-kicker">{t({ th: 'ภาพจำลองของคุณ', en: 'YOUR FACE TRANSFORMATION' })}</span><h3>{t({ th: 'ก่อน', en: 'Before' })} <em>{t({ th: '& หลัง', en: '& after' })}</em></h3></div><span className="concept-tag"><Sparkles size={13} /> {t({ th: 'ภาพแนวคิด', en: 'CONCEPTUAL PREVIEW' })}</span></div>
        <div className="compare-grid">
          <div className="compare-panel">
            <div className="compare-label">{t({ th: 'ก่อน', en: 'BEFORE' })} <span>{t({ th: 'รูปต้นฉบับ', en: 'YOUR ORIGINAL PHOTO' })}</span></div>
            {shownBefore ? <img className="compare-img" src={shownBefore} alt={t({ th: 'รูปต้นฉบับ', en: 'Original photo' })} /> : <div className="compare-empty"><Upload size={22} /><b>{t({ th: 'รูปของคุณจะอยู่ตรงนี้', en: 'Your photo goes here' })}</b><a href="#upload">{t({ th: 'เพิ่มรูป', en: 'Add a photo' })} <ArrowRight size={14} /></a></div>}
          </div>
          <div className="compare-panel">
            <div className="compare-label">{t({ th: 'ภาพจำลอง AI', en: 'AI SIMULATION' })} <span>{t(LEVELS.find(l => l.id === (current?.level ?? level))!.name).toUpperCase()}{current?.model && ` · ${modelLabel(current.model)}`}</span></div>
            {after ? <><img className="compare-img" src={shownBefore} alt="" /><img className="compare-img compare-after" src={after} style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} alt={t({ th: 'ภาพจำลองหลังปรับ', en: 'Simulated result' })} /><i className="compare-divider" style={{ left: `${split}%` }} /></>
              : <div className="compare-empty after-empty">{busy ? <><span className="spinner" /><b>{t({ th: 'กำลังสร้างภาพจำลอง…', en: 'Creating your concept…' })}</b><small>{t({ th: 'ใช้เวลาประมาณ 10–30 วินาที', en: 'Usually 10–30 seconds' })}</small></> : <><Sparkles size={23} /><b>{t({ th: 'ภาพจำลองจะปรากฏที่นี่', en: 'Your concept takes shape here.' })}</b><small>{t({ th: 'เลือกจุดแล้วกดสร้างภาพ', en: 'Pick points, then generate.' })}</small></>}</div>}
            <span className="after-watermark">{t({ th: 'ภาพจำลอง · ไม่ใช่ผลจริง', en: 'CONCEPT · NOT A RESULT' })}</span>
          </div>
        </div>
        {after && <div className="compare-slider"><span>{t({ th: 'ก่อน', en: 'BEFORE' })}</span><input aria-label={t({ th: 'เลื่อนเทียบก่อนและหลัง', en: 'Before and after comparison' })} type="range" min="0" max="100" value={split} onChange={e => setSplit(Number(e.target.value))} /><MoveHorizontal size={16} /><span>{t({ th: 'หลัง', en: 'AFTER' })}</span></div>}
        {slots.length > 0 && <div className="model-compare">
          {slots.map(slot => <div key={slot.model.id} className={`model-card ${slot.status}${current && current.id === slot.sim?.id ? ' active' : ''}`}>
            <div className="model-card-head"><b>{slot.model.label}</b><small>{slot.model.maker} · ~${slot.model.price.toFixed(3)}</small></div>
            {slot.status === 'pending' && <div className="model-card-body"><span className="spinner" /><small>{t({ th: 'กำลังสร้าง…', en: 'Creating…' })}</small></div>}
            {slot.status === 'error' && <div className="model-card-body"><small className="error-text">{slot.error}</small></div>}
            {slot.status === 'done' && slot.sim && <button className="model-card-img" onClick={() => { setCurrent(slot.sim!); setSplit(50); }} aria-label={t({ th: `เปิดเทียบภาพจาก ${slot.model.label}`, en: `Compare the ${slot.model.label} result` })}><img src={slot.sim.after} alt="" /></button>}
            <div className="model-card-foot">
              {slot.sim?.ms ? <small>{(slot.sim.ms / 1000).toFixed(1)} {t({ th: 'วินาที', en: 's' })}</small> : <small />}
              {slot.sim && <a href={slot.sim.after} download={downloadName(slot.sim)} aria-label={t({ th: 'ดาวน์โหลด', en: 'Download' })}><Download size={12} /></a>}
            </div>
          </div>)}
        </div>}
        {current && <div className="sim-save-row">
          <a className="button dark" href={current.after} download={downloadName(current)}><Download size={14} /> {t({ th: 'บันทึกรูปลงเครื่อง', en: 'Save image' })}</a>
          <small><Check size={12} /> {t({ th: 'เก็บไว้ในแกลเลอรีด้านล่างแล้ว (เฉพาะในเบราว์เซอร์นี้)', en: 'Kept in the gallery below (this browser only)' })}</small>
        </div>}

        {profileImage && frontImage && <div className="sim-source" role="radiogroup" aria-label={t({ th: 'ภาพที่ใช้จำลอง', en: 'Photo to simulate' })}>
          <span className="card-kicker">{t({ th: 'ภาพที่ใช้จำลอง', en: 'PHOTO TO SIMULATE' })}</span>
          {(['front', 'side'] as const).map(v => <button key={v} role="radio" aria-checked={view === v} className={view === v ? 'picked' : ''} onClick={() => setView(v)}>{v === 'front' ? t({ th: 'หน้าตรง', en: 'Front' }) : t({ th: 'ด้านข้าง (เห็นจมูกและคางชัด)', en: 'Side (best for nose & chin)' })}</button>)}
        </div>}
        <div className="sim-points">
          <span className="card-kicker">{t({ th: 'จุดที่จะจำลอง', en: 'POINTS TO SIMULATE' })}</span>
          {!analysis && <small>{t({ th: 'วิเคราะห์ใบหน้าก่อนเพื่อเลือกจุด', en: 'Analyze your face first to pick points.' })}</small>}
          {analysis && enhancements.length === 0 && <small>{t({ th: 'ไม่มีจุดที่ตำราแนะนำ ใช้ช่องข้อความด้านล่างได้', en: 'No suggested points — use the text box below.' })}</small>}
          {enhancements.map(r => { const on = selected.includes(r.enhancement.id); return <button key={r.id} className={on ? 'picked' : ''} aria-pressed={on} onClick={() => toggle(r.enhancement.id)}>{on && <Check size={12} />}{t(r.title)}</button>; })}
        </div>
        <div className="simulation-controls">
          <div className="version-picker"><span>{t({ th: 'ระดับการปรับ', en: 'EXPLORE A FEEL' })}</span>{LEVELS.map(v => <button key={v.id} className={level === v.id ? 'picked' : ''} onClick={() => setLevel(v.id)}>{t(v.name)}<small>{t(v.sub)}</small></button>)}</div>
          <div className="generate-wrap">
            {COMPARE_ON && <label className="compare-toggle"><input type="checkbox" checked={compareMode} disabled={busy} onChange={e => setCompareMode(e.target.checked)} /> {t({ th: `โหมดเทียบ ${COMPARE_MODELS.length} โมเดล (~$${COMPARE_TOTAL.toFixed(2)} ต่อครั้ง)`, en: `Compare ${COMPARE_MODELS.length} models (~$${COMPARE_TOTAL.toFixed(2)} per run)` })}</label>}
            <button disabled={!canGenerate} className="button dark generate" onClick={generate}>{busy ? <><span className="spinner" /> {t({ th: 'กำลังสร้าง…', en: 'Creating…' })}</> : <><Sparkles size={15} /> {compareMode ? t({ th: `สร้างเทียบ ${COMPARE_MODELS.length} โมเดล`, en: `Generate with ${COMPARE_MODELS.length} models` }) : t({ th: 'สร้างภาพจำลอง', en: 'Generate a concept' })} <ArrowRight size={15} /></>}</button>
          </div>
        </div>
        <div className="custom-request"><div><b>{t({ th: 'อยากลองปรับอะไรเพิ่ม?', en: 'Tell us what you’re curious about.' })}</b><small>{t({ th: `ไม่บังคับ · ไม่เกิน ${MAX_NOTE} ตัวอักษร`, en: `Optional · up to ${MAX_NOTE} characters` })}</small></div><input value={note} maxLength={MAX_NOTE} onChange={e => setNote(e.target.value)} placeholder={t({ th: 'เช่น สันจมูกโด่งขึ้นนิดเดียว ให้ยังดูเป็นธรรมชาติ…', en: 'e.g. A slightly more defined nose bridge, keeping my features natural…' })} /></div>
        <label className="consent sim-consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span className="custom-check"><Check size={12} /></span><span>{compareMode
          ? t({ th: `ฉันยินยอมให้ส่งรูปที่ย่อขนาดแล้วไปยังผู้ให้บริการ AI ภายนอก ${COMPARE_MODELS.length} ราย (${COMPARE_MODELS.map(m => m.maker).join(', ')} ผ่าน Replicate และ Vercel AI Gateway) เพื่อสร้างภาพจำลองนี้เท่านั้น`, en: `I agree to send a downsized copy of my photo to ${COMPARE_MODELS.length} external AI providers (${COMPARE_MODELS.map(m => m.maker).join(', ')} via Replicate and Vercel AI Gateway) only to create these simulations.` })
          : t({ th: 'ฉันยินยอมให้ส่งรูปที่ย่อขนาดแล้วไปยังผู้ให้บริการ AI ภายนอก (FLUX Kontext Pro ผ่าน Vercel AI Gateway) เพื่อสร้างภาพจำลองนี้เท่านั้น', en: 'I agree to send a downsized copy of my photo to an external AI provider (FLUX Kontext Pro via Vercel AI Gateway) only to create this simulation.' })} <b>{t({ th: 'เว็บไซต์นี้ไม่เก็บรูป', en: 'This site does not store it.' })}</b></span></label>
        {error && <p className="error-text">{error}</p>}
        <div className="changes-line">
          <span>{t({ th: 'เลือกแล้ว', en: 'SELECTED' })} <b>{selected.length}</b></span>
          <span className="level">{t({ th: 'ระดับ', en: 'CHANGE LEVEL' })} <b>{t(LEVELS.find(l => l.id === level)!.sub)}</b></span>
          {after && <button onClick={() => setCurrent(null)}><RotateCcw size={13} /> {t({ th: 'ปิดภาพ', en: 'Close' })}</button>}
        </div>
        {gallery.length > 0 && <div className="sim-gallery">
          <div className="sim-gallery-head">
            <span className="card-kicker"><Images size={12} /> {t({ th: `ภาพที่บันทึกไว้ (${gallery.length}/${MAX_SAVED})`, en: `SAVED SIMULATIONS (${gallery.length}/${MAX_SAVED})` })}</span>
            <small>{t({ th: 'เก็บในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ได้ส่งขึ้นเซิร์ฟเวอร์ · ภาพเก่าสุดจะถูกลบเมื่อเกินจำนวน', en: 'Stored only in this browser, never on our server · oldest are removed past the limit' })}</small>
            <button onClick={removeAll}>{t({ th: 'ลบทั้งหมด', en: 'Delete all' })}</button>
          </div>
          <div className="sim-gallery-grid">
            {gallery.map(sim => <figure key={sim.id} className={current?.id === sim.id ? 'active' : ''}>
              <button className="sim-thumb" onClick={() => show(sim)} aria-label={t({ th: 'ดูภาพนี้', en: 'View this simulation' })}><img src={sim.after} alt="" /></button>
              <figcaption>
                <span>{sim.model && <b>{modelLabel(sim.model)}</b>}{new Date(sim.createdAt).toLocaleString(lang === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                <a href={sim.after} download={downloadName(sim)} aria-label={t({ th: 'ดาวน์โหลด', en: 'Download' })}><Download size={12} /></a>
                <button onClick={() => remove(sim.id)} aria-label={t({ th: 'ลบ', en: 'Delete' })}><X size={12} /></button>
              </figcaption>
            </figure>)}
          </div>
        </div>}
      </div>
      <div className="notice"><ShieldCheck size={17} /><span>{t({ th: 'ภาพจำลองเป็นภาพแนวคิดจาก AI ไม่ใช่การทำนายหรือรับประกันผลศัลยกรรม และไม่สามารถแทนการปรึกษาแพทย์ผู้เชี่ยวชาญได้ การทำหัตถการใดๆ เป็นการตัดสินใจส่วนบุคคล', en: 'AI simulations are conceptual, not predictions or guarantees of surgical results, and can’t replace a consultation with a qualified medical professional. Any procedure is a personal choice.' })}</span></div>
    </section>
  );
}
