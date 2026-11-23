'use client';
import { useState } from 'react';
import { ArrowRight, Brush, Scissors, Shirt } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { SHAPE_NAMES, SHAPE_SUMMARY, type StyleCategory } from '@/lib/face/style-rules';
import type { Analysis } from '@/app/page';

const TABS: { id: StyleCategory; icon: typeof Brush; name: { th: string; en: string } }[] = [
  { id: 'makeup', icon: Brush, name: { th: 'แต่งหน้า', en: 'Makeup' } },
  { id: 'hair', icon: Scissors, name: { th: 'ทรงผม', en: 'Hair' } },
  { id: 'clothing', icon: Shirt, name: { th: 'การแต่งกาย', en: 'Clothing' } },
];

export default function StyleSection({ analysis }: { analysis: Analysis | null }) {
  const { t } = useLang();
  const [tab, setTab] = useState<StyleCategory>('makeup');
  const tips = analysis?.style[tab] ?? [];
  return (
    <section className="style-section section-pad" id="style">
      <div className="section-heading">
        <div><span className="eyebrow">{t({ th: 'ยังไม่พร้อมศัลยกรรม?', en: 'NOT READY FOR SURGERY?' })}</span><h2>{t({ th: 'ปังได้', en: 'Shine with' })} <em>{t({ th: 'ด้วยโครงหน้าเดิม.', en: 'the face you have.' })}</em></h2></div>
        <p>{t({ th: 'คำแนะนำแต่งหน้า ทรงผม และการแต่งกาย ที่เลือกมาให้เข้ากับโครงหน้าปัจจุบันของคุณ รวมถึงเทคนิคที่ให้ผลคล้ายจุดเสริมโหงวเฮ้งโดยไม่ต้องศัลยกรรม', en: 'Makeup, hair and clothing picked for your current face — including techniques that echo each enhancement point without surgery.' })}</p>
      </div>
      {!analysis ? (
        <div className="style-empty"><b>{t({ th: 'วิเคราะห์ใบหน้าก่อนเพื่อรับคำแนะนำเฉพาะคุณ', en: 'Analyze your face to get advice made for you' })}</b><a className="button dark" href="#upload">{t({ th: 'เริ่มวิเคราะห์', en: 'Start your analysis' })} <ArrowRight size={14} /></a></div>
      ) : (
        <div className="style-shell">
          <div className="style-profile">
            <span className="card-kicker">{t({ th: 'รูปหน้าของคุณ', en: 'YOUR FACE SHAPE' })}</span>
            <h3>{t(SHAPE_NAMES[analysis.metrics.faceShape])}</h3>
            <p>{t(SHAPE_SUMMARY[analysis.metrics.faceShape])}</p>
            <div className="style-tabs" role="tablist">
              {TABS.map(x => <button key={x.id} role="tab" aria-selected={tab === x.id} className={tab === x.id ? 'on' : ''} onClick={() => setTab(x.id)}><x.icon size={14} /> {t(x.name)}</button>)}
            </div>
          </div>
          <div className="style-grid">
            {tips.map((tip, i) => <div className="style-card" key={tip.title.en + i}><span className="suggestion-num">{String(i + 1).padStart(2, '0')}</span><h4>{t(tip.title)}</h4><p>{t(tip.text)}</p></div>)}
          </div>
        </div>
      )}
    </section>
  );
}
