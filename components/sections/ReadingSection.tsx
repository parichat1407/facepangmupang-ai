'use client';
import { ArrowRight, ShieldCheck, Sparkles, Check, Brush } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { ZONES, type Tone } from '@/lib/face/reading-rules';
import type { Analysis } from '@/app/page';
import Chatbot from '@/components/Chatbot';

const TONE: Record<Tone, { th: string; en: string }> = {
  strong: { th: 'จุดเด่นตามตำรา', en: 'Strength' },
  neutral: { th: 'ลักษณะเฉพาะ', en: 'Distinctive' },
  enhance: { th: 'เสริมได้', en: 'Can enhance' },
};

type Props = { analysis: Analysis | null; selected: string[]; toggle: (id: string) => void; summary: string | null; summaryLoading: boolean };

export default function ReadingSection({ analysis, selected, toggle, summary, summaryLoading }: Props) {
  const { t } = useLang();
  const report = analysis?.report;
  return (
    <section className="reading-section section-pad" id="reading">
      <div className="reading-grid">
      <div className="reading-intro">
        <span className="eyebrow">{t({ th: 'ตำราโหงวเฮ้ง ในมุมที่เข้าใจ', en: 'TRADITION, HELD LIGHTLY' })}</span>
        <h2>{t({ th: 'โหงวเฮ้ง', en: 'Face reading,' })}<br /><em>{t({ th: 'ของใบหน้าคุณ.', en: 'with perspective.' })}</em></h2>
        <p>{t({ th: 'อ่านแต่ละตำแหน่งบนใบหน้าตามตำราโหงวเฮ้ง พร้อมบอกจุดที่ตำราเชื่อว่าหากปรับแล้วช่วยเสริมดวง และเสริมเรื่องอะไร', en: 'Each area of your face, read through traditional face reading — plus the points tradition believes would improve your reading if adjusted, and how.' })}</p>
        {report && (summary || summaryLoading) && (
          <div className="ai-summary">
            <div className="ai-summary-title"><Sparkles size={14} /> {t({ th: 'บทสรุปส่วนตัวจาก AI', en: 'Your personal AI summary' })}</div>
            {summaryLoading ? <p className="ai-summary-loading"><span className="spinner" /> {t({ th: 'กำลังเขียนบทสรุป…', en: 'Writing your summary…' })}</p> : <p>{summary}</p>}
            <small>{t({ th: 'เขียนจากตัวเลขสัดส่วนเท่านั้น AI ไม่ได้เห็นรูปของคุณ', en: 'Written from your measurements only — the AI never sees your photo.' })}</small>
          </div>
        )}
        <div className="cultural-note dark-note"><ShieldCheck size={16} /><span>{t({ th: 'โหงวเฮ้งเป็นความเชื่อทางวัฒนธรรม ไม่ใช่วิทยาศาสตร์ ไม่สามารถทำนายอนาคตหรือตัดสินคุณค่าของใครได้', en: 'Face reading is a cultural belief, not science. It cannot predict the future or define anyone’s worth.' })}</span></div>
        <Chatbot context={report && analysis ? { faceShape: analysis.metrics.faceShape, readings: report.readings.map(r => r.id) } : null} />
        <div className="reading-glyph">相</div>
      </div>

      <div className="reading-dashboard">
        {!report && <div className="reading-empty"><span>相</span><b>{t({ th: 'ยังไม่มีผลโหงวเฮ้ง', en: 'No reading yet' })}</b><p>{t({ th: 'อัปโหลดรูปหน้าตรงและกด “วิเคราะห์” ด้านบน เพื่อดูโหงวเฮ้งของคุณ 9 ตำแหน่ง', en: 'Upload a front-facing photo and press “Analyze” above to see your reading across 9 areas.' })}</p><a className="button light" href="#upload">{t({ th: 'เริ่มวิเคราะห์', en: 'Start your analysis' })} <ArrowRight size={14} /></a></div>}
        {report && (Object.keys(ZONES) as (keyof typeof ZONES)[]).map(zone => {
          const items = report.readings.filter(r => r.zone === zone);
          const z = ZONES[zone];
          return (
            <div className={`zone-card tone-${items.some(r => r.tone === 'enhance') ? 'enhance' : items[0].tone}`} key={zone}>
              <div className="zone-card-head">
                <div><span className="card-kicker">{t(z.ages)} · {t(z.area)}</span><h4>{t(z.name)}</h4></div>
                <span className="zone-score" title={t({ th: 'คะแนนตามตำรา', en: 'Score by tradition' })}>{report.zoneScores[zone]}</span>
              </div>
              {items.map(r => (
                <div className="zone-reading" key={r.id}>
                  <span className={`tone-chip ${r.tone}`}>{t(TONE[r.tone])}</span>{r.view === 'side' && <span className="view-chip">{t({ th: 'มุมด้านข้าง', en: 'Side view' })}</span>}
                  <b>{t(r.title)}</b>
                  <p>{t(r.text)}</p>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      </div>

      {report && (
        <div className="enhance-block">
          <div className="enhance-heading">
            <div><span className="eyebrow">{t({ th: 'จุดที่ตำราเชื่อว่าเสริมโหงวเฮ้งได้', en: 'POINTS TRADITION SAYS YOU COULD ENHANCE' })}</span><h3>{report.enhancements.length ? t({ th: `${report.enhancements.length} จุดที่อาจพิจารณา`, en: `${report.enhancements.length} areas to consider` }) : t({ th: 'โหงวเฮ้งสมดุลดีแล้ว', en: 'Your reading is already balanced' })}</h3></div>
            <p>{t({ th: 'เลือกจุดเพื่อดูภาพจำลอง ข้อมูลนี้อิงตามตำรา ไม่ใช่คำแนะนำทางการแพทย์ ควรปรึกษาแพทย์ผู้เชี่ยวชาญก่อนตัดสินใจทุกครั้ง', en: 'Select points to simulate. This follows tradition, not medical advice — always consult a qualified specialist first.' })}</p>
          </div>
          <div className="enhance-grid">
            {report.enhancements.map((r, i) => {
              const on = selected.includes(r.enhancement.id);
              return (
                <div className={`enhance-card ${on ? 'on' : ''}`} key={r.id}>
                  <div className="enhance-top"><span className="suggestion-num">0{i + 1}</span><span className="card-kicker">{t(ZONES[r.zone].name)} · {t(ZONES[r.zone].area)}</span></div>
                  <h4>{t(r.title)}</h4>
                  <dl>
                    <dt>{t({ th: 'วิธีที่นิยม', en: 'Common approach' })}</dt><dd>{t(r.enhancement.procedure)}</dd>
                    <dt>{t({ th: 'ตามตำราช่วยเสริม', en: 'What tradition says it improves' })}</dt><dd>{t(r.enhancement.beliefGain)}</dd>
                  </dl>
                  <div className="enhance-actions">
                    <button className={on ? 'picked' : ''} aria-pressed={on} onClick={() => toggle(r.enhancement.id)}>{on ? <><Check size={13} /> {t({ th: 'เลือกแล้ว', en: 'Selected' })}</> : t({ th: 'เลือกเพื่อจำลอง', en: 'Select to simulate' })}</button>
                    <a href="#style"><Brush size={13} /> {t({ th: 'ยังไม่พร้อม? ลองแบบไม่ศัลยกรรม', en: 'Not ready? Try it without surgery' })}</a>
                  </div>
                </div>
              );
            })}
          </div>
          {report.enhancements.length > 0 && <a className="button light enhance-cta" href="#simulation">{t({ th: `จำลองภาพ ${selected.length} จุดที่เลือก`, en: `Simulate ${selected.length} selected point${selected.length === 1 ? '' : 's'}` })} <ArrowRight size={15} /></a>}
        </div>
      )}
    </section>
  );
}
