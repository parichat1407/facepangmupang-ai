'use client';
import { useState } from 'react';
import { Sparkles, ArrowRight, ArrowUpRight, ShieldCheck, ScanFace, ScanLine, Menu, X } from 'lucide-react';
import { useLang, LangToggle } from '@/lib/i18n';

function AppIcon() { return <span className="brand-mark"><ScanFace size={20} /></span>; }
function Brand({ className = 'brand' }: { className?: string }) {
  return <a className={className} href="#home"><AppIcon /><span>facepang<span className="brand-light">mupang</span><sup> AI</sup></span></a>;
}

export function Header() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const links = [
    { href: '#analysis', label: { th: 'วิเคราะห์ใบหน้า', en: 'Face analysis' } },
    { href: '#reading', label: { th: 'โหงวเฮ้ง', en: 'Face reading' } },
    { href: '#simulation', label: { th: 'ภาพจำลอง', en: 'AI simulation' } },
    { href: '#style', label: { th: 'สไตล์ไม่ศัลยกรรม', en: 'Style tips' } },
  ];
  return (
    <header className="topbar">
      <Brand />
      <nav className={open ? 'nav open' : 'nav'}>{links.map(l => <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{t(l.label)}</a>)}</nav>
      <div className="top-actions">
        <LangToggle />
        <a className="text-button" href="#upload">{t({ th: 'เริ่มวิเคราะห์', en: 'My workspace' })} <ArrowUpRight size={15} /></a>
        <button className="menu-button" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
    </header>
  );
}

export function Hero() {
  const { t } = useLang();
  return (
    <>
      <section className="hero" id="home">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> {t({ th: 'โหงวเฮ้งก่อนศัลยกรรม · ผู้ช่วยส่วนตัวของใบหน้า', en: 'FACE READING BEFORE YOU CHANGE' })}</div>
          <h1>{t({ th: 'เสริมโหงวเฮ้ง', en: 'Face harmony,' })}<br /><em>{t({ th: 'อย่างเข้าใจ.', en: 'reimagined.' })}</em></h1>
          <p>{t({ th: 'วิเคราะห์ใบหน้า 468 จุด อ่านโหงวเฮ้งตามตำรา รู้ว่าจุดไหนหากปรับแล้วช่วยเสริมดวง จำลองภาพก่อนตัดสินใจ หรือเลือกเสริมด้วยการแต่งหน้า ทรงผม และการแต่งกาย', en: 'Map 468 points, read your face through tradition, see which areas could enhance your reading, simulate before you decide — or enhance with makeup, hair and style instead.' })}</p>
          <div className="hero-buttons"><a className="button dark" href="#upload"><Sparkles size={16} /> {t({ th: 'เริ่มวิเคราะห์', en: 'Start your analysis' })} <ArrowRight size={16} /></a><a className="link-button" href="#reading">{t({ th: 'ดูโหงวเฮ้ง', en: 'Explore face reading' })} <ArrowUpRight size={15} /></a></div>
          <div className="hero-foot"><div className="mini-avatars"><i>✳</i><i>◌</i><i>✦</i></div><span>{t({ th: 'อยากรู้ อย่างใส่ใจ', en: 'Curiosity, with care.' })}</span><span className="hero-sep">·</span><span>{t({ th: 'ตัดสินใจเองเสมอ', en: 'Always your choice' })}</span></div>
        </div>
        <div className="hero-art">
          <div className="art-glow" />
          <div className="art-card">
            <div className="art-top"><span>FACE STUDY № 01</span><span className="art-status">● 468 PTS</span></div>
            <div className="portrait-wrap"><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop&q=85" alt={t({ th: 'ภาพตัวอย่างใบหน้า', en: 'Portrait illustration of face harmony' })} /><div className="portrait-lines"><svg viewBox="0 0 400 500"><path d="M82 180 Q200 100 318 180 M120 215 Q160 190 188 215 Q160 236 120 215 M212 215 Q244 190 280 215 Q246 236 212 215 M200 220 L187 282 L212 286 M160 330 Q200 348 240 328 M200 108V405 M105 258H296" /><circle cx="156" cy="216" r="3" /><circle cx="246" cy="216" r="3" /><circle cx="200" cy="283" r="3" /><circle cx="200" cy="343" r="3" /></svg></div></div>
            <div className="art-bottom"><div><b>{t({ th: 'โหงวเฮ้ง 9 ตำแหน่ง', en: 'Reading across 9 areas' })}</b><small>{t({ th: 'หน้าผากถึงคาง', en: 'From forehead to chin' })}</small></div><span className="score">相</span></div>
          </div>
          <div className="floating-chip"><span className="chip-icon"><ScanLine size={16} /></span><span><b>{t({ th: 'Face mesh', en: 'Face blueprint' })}</b><small>{t({ th: 'วัดจากใบหน้าคุณจริง', en: 'Measured from your face' })}</small></span><ArrowUpRight size={14} /></div>
          <div className="art-stamp">FP<br /><span>—</span><br />AI</div>
        </div>
      </section>
      <div className="trust-strip"><span><ShieldCheck size={15} /> {t({ th: 'วิเคราะห์ในเครื่องของคุณ', en: 'Analysed on your device' })}</span><i /><span>{t({ th: 'โหงวเฮ้งคือความเชื่อ ไม่ใช่ข้อบังคับ', en: 'Tradition, not rules' })}</span><i /><span>{t({ th: 'ตัดสินใจเองเสมอ', en: 'Always your choice' })}</span></div>
    </>
  );
}

export function LifeSection() {
  const { t } = useLang();
  const cards = [
    ['✳', { th: 'สไตล์ส่วนตัว', en: 'Personal style' }, { th: 'ลองลุคแต่งหน้าใหม่ ทรงผมที่ใช่ หรือสีที่เป็นตัวคุณ', en: 'Try a new makeup look, a flattering haircut, or a colour that feels like you.' }],
    ['↗', { th: 'การงาน', en: 'Career & craft' }, { th: 'สร้างพอร์ตโฟลิโอ ฝึกทักษะ หรือหาวิธีใหม่ในการแบ่งปันผลงาน', en: 'Build a portfolio, practise a skill, or find a new way to share your work.' }],
    ['⌁', { th: 'การเงิน', en: 'Money & goals' }, { th: 'วางแผนรายจ่าย เริ่มออม หรือตั้งเป้าหมายการเงินเล็กๆ สักข้อ', en: 'Make a simple spending plan, start saving, or set one small financial goal.' }],
    ['♡', { th: 'ความสัมพันธ์', en: 'Connection' }, { th: 'ฟังอย่างเปิดใจ สื่อสารชัดเจน และให้ความมั่นใจเติบโตตามจังหวะของคุณ', en: 'Listen openly, communicate clearly, and let confidence grow at your own pace.' }],
  ] as const;
  return (
    <section className="life-section section-pad" id="about">
      <div className="section-heading"><div><span className="eyebrow">{t({ th: 'มากกว่าในกระจก', en: 'BEYOND THE MIRROR' })}</span><h2>{t({ th: 'ดวงดีเริ่มจาก', en: 'Good things start' })} <em>{t({ th: 'ตัวคุณ.', en: 'with you.' })}</em></h2></div><p>{t({ th: 'ใบหน้าไม่ได้กำหนดอนาคต นี่คือสิ่งที่ลงมือทำได้จริงในชีวิตประจำวัน', en: 'Your face doesn’t determine your future. Here are a few real-world places to put your energy.' })}</p></div>
      <div className="life-grid">{cards.map(([icon, title, desc]) => <div className="life-card" key={title.en}><span>{icon}</span><h4>{t(title)}</h4><p>{t(desc)}</p><ArrowUpRight size={15} /></div>)}</div>
      <p className="choice-note">{t({ th: 'การเปลี่ยนแปลงรูปลักษณ์เป็นการตัดสินใจส่วนบุคคล ไม่ได้กำหนดคุณค่าของคุณหรือสิ่งที่ชีวิตจะนำมา', en: 'Exploring a change to your appearance is a personal choice. It doesn’t define your worth or determine what life brings.' })}</p>
    </section>
  );
}

export function Disclaimer() {
  const { t } = useLang();
  return (
    <section className="faq-disclaimer" id="privacy">
      <div className="disclaimer-mark"><ShieldCheck size={22} /></div>
      <div>
        <span className="eyebrow">{t({ th: 'ข้อควรรู้และความเป็นส่วนตัว', en: 'A NOTE ON CARE & CONTEXT' })}</span>
        <h3>{t({ th: 'อยากรู้ อย่าง', en: 'Curiosity, with' })} <em>{t({ th: 'ใส่ใจ.', en: 'care.' })}</em></h3>
        <p>{t({ th: 'การวัดสัดส่วนเป็นค่าประมาณจากภาพและมีข้อจำกัดด้านความแม่นยำ ภาพจำลองเป็นภาพแนวคิด ไม่ใช่การรับประกันผลศัลยกรรม การตัดสินใจเรื่องหัตถการควรปรึกษาแพทย์ผู้เชี่ยวชาญ', en: 'Proportion analysis is an estimate from an image with accuracy limits. Simulations are conceptual illustrations, not guarantees of real procedure outcomes. Decisions about treatments should be discussed with a qualified medical professional.' })}</p>
        <p>{t({ th: 'โหงวเฮ้งเป็นความเชื่อทางวัฒนธรรม ไม่ใช่วิทยาศาสตร์ ไม่สามารถทำนายอนาคตหรือยืนยันบุคลิกภาพได้ รูปลักษณ์ไม่ใช่ตัวชี้วัดคุณค่าของคน', en: 'Face reading is a cultural belief, not science. It cannot predict the future or establish personality. Appearance is never a measure of personal value.' })}</p>
        <p>{t({ th: 'ความเป็นส่วนตัว: mesh, การวัด, โหงวเฮ้ง และคำแนะนำสไตล์ ประมวลผลในเบราว์เซอร์ทั้งหมด บทสรุปจาก AI ได้รับเฉพาะตัวเลขสัดส่วน ไม่ได้รับรูป รูปจะถูกส่งออก (แบบย่อขนาด) เฉพาะเมื่อคุณยินยอมและกดสร้างภาพจำลอง ไปยังผู้ให้บริการภาพ (FLUX.1 Kontext ผ่าน Replicate หรือ Vercel AI Gateway) ซึ่งลบข้อมูลภายในประมาณ 1 ชั่วโมง เว็บไซต์ไม่เก็บรูปของคุณ', en: 'Privacy: the mesh, measurements, face reading and style advice all run in your browser. The AI summary receives only proportion numbers, never your photo. A downsized copy of your photo leaves the device only when you consent and generate a simulation, to an image provider (FLUX.1 Kontext via Replicate, or Vercel AI Gateway). This site does not store your photo.' })}</p>
      </div>
      <div className="disclaimer-side">{t({ th: 'รูปของคุณ', en: 'YOUR PHOTO' })}<br />{t({ th: 'เป็นของคุณ', en: 'IS YOURS.' })}<span>✳</span><small>{t({ th: 'ไม่เก็บรูป', en: 'NO PHOTO STORAGE' })}</small></div>
    </section>
  );
}

export function Footer() {
  const { t } = useLang();
  return <footer><Brand className="brand footer-brand" /><span>{t({ th: 'ทำด้วยความใส่ใจ เพื่อใบหน้าที่เป็นคุณ', en: 'Made with care, for the face you’re in.' })}</span><span>© 2026 FACEPANGMUPANG AI</span></footer>;
}
