'use client';
import { Sparkles, ScanFace, ArrowRight, Check, Camera, ShieldCheck, ScanLine, CircleHelp, Wand2, Shirt, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import FaceMeshStudio, { type DetectedFace } from '@/components/FaceMeshStudio';
import MeshCanvas from '@/components/MeshCanvas';
import ProfileStudio, { ProfileFigure, type ProfileData } from '@/components/ProfileStudio';
import { PROFILE_RANGES, type ProfileMetrics } from '@/lib/face/profile';
import { useLang } from '@/lib/i18n';
import { SHAPE_NAMES, SHAPE_SUMMARY } from '@/lib/face/style-rules';
import type { Analysis } from '@/app/page';

const STEPS = [
  { href: '#upload', icon: Sparkles, label: { th: 'รูปของคุณ', en: 'Your photo' } },
  { href: '#results', icon: ScanLine, label: { th: 'โครงหน้า', en: 'Face blueprint' } },
  { href: '#reading', icon: CircleHelp, label: { th: 'โหงวเฮ้ง', en: 'Face reading' } },
  { href: '#simulation', icon: Wand2, label: { th: 'ภาพจำลอง', en: 'Simulation' } },
  { href: '#style', icon: Shirt, label: { th: 'สไตล์ไม่ศัลยกรรม', en: 'Style, no surgery' } },
];

type Props = {
  image: string; face: DetectedFace | null; analysis: Analysis | null; analyzed: boolean;
  consent: boolean; setConsent: (v: boolean) => void; error: string;
  onFile: (f?: File) => void; onRemove: () => void; onFace: (f: DetectedFace | null) => void; onAnalyze: () => void;
  profileImage: string; profile: ProfileData | null; onProfileFile: (f?: File) => void; onProfileRemove: () => void; onProfileChange: (d: ProfileData | null) => void;
};

export default function Workspace({ image, face, analysis, analyzed, consent, setConsent, error, onFile, onRemove, onFace, onAnalyze, profileImage, profile, onProfileFile, onProfileRemove, onProfileChange }: Props) {
  const { t } = useLang();
  const show = analyzed && analysis && face;
  const m = show ? analysis.metrics : null;
  const balance = show ? analysis.balance : null;
  const radar = balance ? [
    { subject: t({ th: 'ตา', en: 'Eyes' }), value: balance.eyes }, { subject: t({ th: 'จมูก', en: 'Nose' }), value: balance.nose },
    { subject: t({ th: 'ปาก', en: 'Lips' }), value: balance.lips }, { subject: t({ th: 'คาง', en: 'Chin' }), value: balance.chin },
    { subject: t({ th: 'กราม', en: 'Jaw' }), value: balance.jaw }, { subject: t({ th: 'หน้าผาก', en: 'Forehead' }), value: balance.forehead },
  ] : [];
  const done = [!!face, !!show, !!show, false, !!show];

  return (
    <section className="workspace section-pad" id="analysis">
      <div className="section-heading">
        <div><span className="eyebrow">{t({ th: 'พื้นที่ส่วนตัวของคุณ', en: 'YOUR PERSONAL SPACE' })}</span><h2>{t({ th: 'รู้จักใบหน้า', en: 'A little more' })} <em>{t({ th: 'ของคุณ.', en: 'you.' })}</em></h2></div>
        <p>{t({ th: 'วาง 468 จุดบนใบหน้า วัดสัดส่วนจริง แล้วอ่านโหงวเฮ้งตามตำรา ทุกอย่างประมวลผลในเบราว์เซอร์ของคุณ', en: 'Map 468 points, measure your real proportions and read them through tradition — all processed in your browser.' })}</p>
      </div>
      <div className="workspace-shell">
        <aside className="side-nav">
          <div className="side-caption">{t({ th: 'ขั้นตอน', en: 'YOUR WORKSPACE' })}</div>
          {STEPS.map((s, i) => <a key={s.href} href={s.href} className={i === 0 ? 'side-item selected' : 'side-item'}><span><s.icon size={16} /></span>{t(s.label)}{done[i] ? <span className="side-count done"><Check size={11} /></span> : <span className="side-count">0{i + 1}</span>}</a>)}
          <div className="side-rule" />
          <div className="privacy-card"><ShieldCheck size={17} /><b>{t({ th: 'ใบหน้าเป็นของคุณ', en: 'Your face stays yours.' })}</b><p>{t({ th: 'การวิเคราะห์ทำในเบราว์เซอร์ รูปจะถูกส่งออกเฉพาะตอนที่คุณกดสร้างภาพจำลองเท่านั้น', en: 'Analysis runs in your browser. Your photo only leaves the device if you choose to generate a simulation.' })}</p><span><i /> {t({ th: 'เซสชันส่วนตัว', en: 'PRIVATE SESSION' })}</span></div>
          <div className="side-bottom">FACEPANGMUPANG AI <span>V 2.0</span></div>
        </aside>
        <div className="workspace-main">
          <div className="workspace-toolbar"><div className="crumb">{t({ th: 'พื้นที่ทำงาน', en: 'WORKSPACE' })} <span>/</span> {t({ th: 'ภาพรวม', en: 'OVERVIEW' })}</div><div className="demo-pill"><i /> {t({ th: 'ประมวลผลในเครื่อง', en: 'ON-DEVICE' })}</div></div>

          <div className="upload-section" id="upload">
            <div className="upload-heading">
              <div><span className="step-number">01</span><span className="eyebrow">{t({ th: 'เริ่มจากรูปของคุณ', en: 'LET’S GET TO KNOW YOU' })}</span><h3>{t({ th: 'เริ่มด้วยรูปหน้าตรง', en: 'Start with a photo.' })}</h3><p>{t({ th: 'อัปโหลดรูปหรือสแกนด้วยกล้อง รูปหน้าตรงที่ชัดช่วยให้วัดสัดส่วนได้แม่นขึ้น', en: 'Upload or scan with your camera. A clear, front-facing photo gives the most accurate proportions.' })}</p></div>
              <span className="required-pill">{t({ th: 'ต้องมีรูป', en: 'PHOTO REQUIRED' })}</span>
            </div>
            <div className="upload-row">
              <FaceMeshStudio image={image} onFile={onFile} onRemove={onRemove} onFace={onFace} />
              <div className="photo-tips">
                <div className="tips-title"><Camera size={16} /> {t({ th: 'เพื่อผลที่แม่นที่สุด', en: 'For the clearest reading' })}</div>
                {[{ th: 'มองตรงเข้ากล้อง', en: 'Face the camera, straight on' }, { th: 'แสงนุ่ม สม่ำเสมอ', en: 'Find soft, natural light' }, { th: 'ถอดแว่น ไม่ใช้ฟิลเตอร์', en: 'Remove glasses and filters' }, { th: 'รวบผมให้เห็นหน้าผาก', en: 'Keep your forehead and whole face visible' }, { th: 'สีหน้าปกติ ไม่ยิ้มกว้าง', en: 'Neutral expression, no big smile' }].map(x => <div key={x.en} className="tip"><span><Check size={11} /></span>{t(x)}</div>)}
                <div className="tip-note">{t({ th: 'สีหน้าผ่อนคลายให้ผลดีที่สุด', en: 'A simple, relaxed expression works best.' })}</div>
              </div>
            </div>
            <div className="profile-block">
              <div className="profile-block-head"><span className="eyebrow">{t({ th: 'เพิ่มมุมด้านข้าง · ไม่บังคับ', en: 'ADD A SIDE VIEW · OPTIONAL' })}</span><b>{t({ th: 'รูปด้านข้างช่วยวัดดั้งจมูก ปลายจมูก ริมฝีปาก และคาง ที่มองจากด้านหน้าไม่เห็น', en: 'A side photo measures the nose bridge, tip, lips and chin — things a front photo can’t show.' })}</b></div>
              <ProfileStudio image={profileImage} data={profile} onFile={onProfileFile} onRemove={onProfileRemove} onChange={onProfileChange} />
            </div>
            {analysis && Math.abs(analysis.metrics.yaw) > 0.07 && <p className="warn-text"><AlertTriangle size={13} /> {t({ th: 'ดูเหมือนใบหน้าหันข้าง ผลการวัดอาจคลาดเคลื่อน ลองใช้รูปหน้าตรง', en: 'Your head looks turned — measurements may be off. Try a straight-on photo.' })}</p>}
            <div className="privacy-notice"><ShieldCheck size={16} /><span><b>{t({ th: 'ความเป็นส่วนตัวของคุณสำคัญ', en: 'Your privacy matters.' })}</b> {t({ th: 'ใบหน้าคือข้อมูลส่วนบุคคล การวัดและอ่านโหงวเฮ้งทำในเบราว์เซอร์ของคุณ เราไม่เก็บรูป', en: 'Your face is personal data. Measurement and face reading run in your browser. We don’t store your photo.' })}</span><a href="#privacy">{t({ th: 'อ่านเพิ่มเติม', en: 'Learn more' })}</a></div>
            <label className="consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span className="custom-check"><Check size={12} /></span><span>{t({ th: 'ฉันยินยอมให้ประมวลผลรูปเพื่อการวิเคราะห์นี้', en: 'I consent to processing my photo to create this analysis.' })} <b>{t({ th: 'รูปของฉันไม่ถูกบันทึก', en: 'My image is not saved.' })}</b></span></label>
            {error && <p className="error-text">{error}</p>}
            <button disabled={!face || !consent} className="button dark analyze-button" onClick={onAnalyze}><ScanFace size={16} /> {t({ th: 'วิเคราะห์ใบหน้าและโหงวเฮ้ง', en: 'Analyze my face' })} <ArrowRight size={16} /></button>
            <div className="analysis-foot">{face ? t({ th: 'พบใบหน้า · 468 จุด', en: 'FACE FOUND · 468 POINTS' }) : image ? t({ th: 'กำลังหาใบหน้า…', en: 'LOOKING FOR A FACE…' }) : t({ th: 'ยังไม่มีรูป', en: 'NO PHOTO ADDED' })} <span>{t({ th: 'ใช้เวลาไม่กี่วินาที', en: 'TAKES A FEW SECONDS' })}</span></div>
          </div>

          <div className="results" id="results">
            <div className="result-heading">
              <div><span className="step-number">02</span><span className="eyebrow">{t({ th: 'โครงหน้าของคุณ', en: 'YOUR FACE BLUEPRINT' })}</span><h3>{t({ th: 'สัดส่วนที่', en: 'A study in' })} <em>{t({ th: 'เป็นคุณ.', en: 'balance.' })}</em></h3></div>
              <span className={'status-chip ' + (show ? 'complete' : '')}>{show ? t({ th: '✓ วิเคราะห์เสร็จแล้ว', en: '✓ ANALYSIS COMPLETE' }) : t({ th: 'รอการวิเคราะห์', en: 'WAITING FOR ANALYSIS' })}</span>
            </div>
            <div className="dashboard-grid">
              <div className="result-card blueprint-card">
                <div className="card-heading"><div><span className="card-kicker">01 — {t({ th: 'โครงสร้าง', en: 'YOUR FEATURES' })}</span><h4>{t({ th: 'Face mesh', en: 'Face blueprint' })}</h4></div></div>
                <div className="blueprint-image">{show ? <MeshCanvas image={image} face={face} label={t({ th: 'ใบหน้าพร้อมเส้นแบ่งสามส่วน', en: 'Face with facial-thirds guides' })} /> : <div className="sample-face"><ScanFace size={42} /><span>{t({ th: 'ตัวอย่างใบหน้าของคุณ', en: 'YOUR PHOTO PREVIEW' })}</span><small>{t({ th: 'อัปโหลดรูปแล้วกดวิเคราะห์', en: 'Add a photo and analyze to see your blueprint' })}</small></div>}</div>
                <div className="legend"><span><i className="gold-dot" /> {t({ th: 'เส้นโครงหน้า', en: 'Feature contours' })}</span><span><i className="line-dot" /> {t({ th: 'เส้นแบ่งสามส่วน', en: 'Facial thirds' })}</span></div>
              </div>
              <div className="result-card balance-card">
                <div className="card-heading"><div><span className="card-kicker">02 — {t({ th: 'ภาพรวม', en: 'THE BIG PICTURE' })}</span><h4>{t({ th: 'ความสมมาตร', en: 'Your balance' })}</h4></div><span className="soft-icon">◉</span></div>
                <div className="balance-score"><div className="score-ring"><span>{m ? m.symmetry : '—'}<small>%</small></span></div><div><b>{m ? (m.symmetry >= 90 ? t({ th: 'สมมาตรสูง', en: 'Highly symmetrical' }) : m.symmetry >= 80 ? t({ th: 'สมดุลดี', en: 'Well balanced' }) : t({ th: 'มีความต่างซ้าย-ขวา', en: 'Some left–right difference' })) : t({ th: 'รอการวิเคราะห์', en: 'Waiting for analysis' })}</b><small>{t({ th: 'ประเมินความสมมาตรจาก mesh', en: 'Symmetry estimate from the mesh' })}</small></div></div>
                <div className="chart-wrap">{radar.length > 0 && <ResponsiveContainer width="100%" height={146}><RadarChart data={radar}><PolarGrid stroke="#e8e4dd" /><PolarAngleAxis dataKey="subject" tick={{ fill: '#807d76', fontSize: 10 }} /><Radar dataKey="value" stroke="#b89c6d" fill="#d7c4a3" fillOpacity={0.28} strokeWidth={1.5} /></RadarChart></ResponsiveContainer>}</div>
                <p className="tiny-note">{t({ th: 'ดัชนีความใกล้เคียงสัดส่วนคลาสสิก ไม่ใช่มาตรฐานความงาม', en: 'Closeness to classic ratios — not a universal beauty standard.' })}</p>
              </div>
              <div className="result-card thirds-card">
                <div className="card-heading"><div><span className="card-kicker">03 — {t({ th: 'สัดส่วนใบหน้า', en: 'FACIAL PROPORTIONS' })}</span><h4>{t({ th: 'สามส่วนของใบหน้า', en: 'Three-part harmony' })}</h4></div><span className="soft-icon">⌁</span></div>
                <p className="muted-small">{t({ th: 'อุดมคติคือแต่ละส่วนราว 33%', en: 'The classic ideal is about 33% each.' })}</p>
                {([[{ th: 'ส่วนบน', en: 'Upper face' }, { th: 'หน้าผาก (ประมาณ)', en: 'Forehead (estimated)' }, m?.thirds.upper], [{ th: 'ส่วนกลาง', en: 'Middle face' }, { th: 'คิ้วถึงฐานจมูก', en: 'Brow to nose base' }, m?.thirds.middle], [{ th: 'ส่วนล่าง', en: 'Lower face' }, { th: 'ฐานจมูกถึงคาง', en: 'Nose base to chin' }, m?.thirds.lower]] as const).map(([a, b, v]) => { const pct = v ? Math.round(v * 100) : 0; return <div className="zone" key={a.en}><div><b>{t(a)}</b><span>{t(b)}</span><small>{v ? `${pct}%` : '—'}</small></div><div className="bar"><i style={{ width: `${Math.min(100, pct * 2)}%` }} /></div></div>; })}
              </div>
              <div className="result-card shape-card">
                <div className="card-heading"><div><span className="card-kicker">04 — {t({ th: 'รูปหน้า', en: 'YOUR SILHOUETTE' })}</span><h4>{t({ th: 'รูปหน้า', en: 'Face shape' })}</h4></div><span className="soft-icon">◇</span></div>
                <div className="shape-visual"><span>◠</span><div><b>{m ? t(SHAPE_NAMES[m.faceShape]) : '—'}</b><small>{m ? t(SHAPE_SUMMARY[m.faceShape]) : t({ th: 'คำนวณจากสัดส่วนของคุณ', en: 'Based on your proportions' })}</small></div></div>
                <p className="tiny-note">{t({ th: 'รูปหน้าเป็นค่าประมาณ อาจเปลี่ยนตามมุมกล้อง แสง และสีหน้า', en: 'Face shape is an estimate and can vary with angle, lighting and expression.' })}</p>
              </div>
            </div>
            {show && analysis.profile && <ProfileCard image={profileImage} data={analysis.profile.data} metrics={analysis.profile.metrics} />}
            {show && <div className="next-step"><span>{t({ th: 'ขั้นต่อไป', en: 'NEXT' })}</span><a href="#reading">{t({ th: 'ดูโหงวเฮ้งและจุดที่เสริมได้', en: 'See your face reading and enhancement points' })} <ArrowRight size={14} /></a></div>}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileCard({ image, data, metrics }: { image: string; data: ProfileData; metrics: ProfileMetrics }) {
  const { t } = useLang();
  const fmt = (k: keyof ProfileMetrics) => {
    const v = metrics[k], r = PROFILE_RANGES[k];
    return r.unit === '°' ? `${Math.round(v)}°` : v.toFixed(2);
  };
  const ref = (k: keyof ProfileMetrics) => {
    const r = PROFILE_RANGES[k];
    return r.unit === '°' ? `${r.min}–${r.max}°` : `${r.min.toFixed(2)} – ${r.max.toFixed(2)}`;
  };
  return (
    <div className="result-card profile-card">
      <div className="card-heading"><div><span className="card-kicker">05 — {t({ th: 'มุมด้านข้าง', en: 'SIDE PROFILE' })}</span><h4>{t({ th: 'สัดส่วนด้านข้าง', en: 'Profile proportions' })}</h4></div><span className="soft-icon">◐</span></div>
      <div className="profile-card-body">
        <div className="profile-card-figure"><ProfileFigure image={image} data={data} label={t({ th: 'โปรไฟล์ด้านข้างพร้อมเส้นวัด', en: 'Side profile with measurement lines' })} /></div>
        <table className="profile-table">
          <thead><tr><th>{t({ th: 'ค่าที่วัด', en: 'Measure' })}</th><th>{t({ th: 'ของคุณ', en: 'Yours' })}</th><th>{t({ th: 'ช่วงอ้างอิง', en: 'Reference' })}</th></tr></thead>
          <tbody>
            {(Object.keys(PROFILE_RANGES) as (keyof ProfileMetrics)[]).map(k => {
              const r = PROFILE_RANGES[k], v = metrics[k];
              const state = v < r.min ? 'low' : v > r.max ? 'high' : 'in';
              return <tr key={k} className={state}><td>{t(r.name)}</td><td><b>{fmt(k)}</b></td><td>{ref(k)} <i>{state === 'in' ? '✓' : state === 'low' ? '↓' : '↑'}</i></td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <p className="tiny-note">{t({ th: 'ช่วงอ้างอิงมาจากตำราศัลยกรรมความงาม (ค่าประมาณ) ผลขึ้นกับการวางจุดและมุมกล้อง เส้นประคือ E-line (ปลายจมูก–ปลายคาง)', en: 'Reference ranges are approximate values from aesthetic-surgery literature; results depend on point placement and camera angle. The dashed line is the E-line (nose tip to chin).' })}</p>
    </div>
  );
}
