'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { LoaderCircle, Send, Sparkles, RotateCcw } from 'lucide-react';
import { useLang, type Bi } from '@/lib/i18n';

type Message = { role: 'user' | 'assistant'; content: string };
export type ChatContext = { faceShape: string; readings: string[] } | null;

const SUGGESTIONS: Bi[] = [
  { th: 'สรุปโหงวเฮ้งของฉันให้หน่อย', en: 'Summarise my reading' },
  { th: 'จุดไหนควรเริ่มก่อน ถ้ายังไม่อยากศัลยกรรม?', en: 'Where should I start if I’m not ready for surgery?' },
  { th: 'การเสริมจมูกต้องเตรียมตัวอย่างไร?', en: 'How do people prepare for a nose job?' },
];

/** Face-reading assistant, embedded in the reading section. Sends text and rule ids only — never photos. */
export default function Chatbot({ context }: { context: ChatContext }) {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll only the message list, never the page.
  useEffect(() => {
    const el = listRef.current; if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  async function sendMessage(event?: FormEvent, text?: string) {
    event?.preventDefault();
    const content = (text ?? draft).trim();
    if (!content || busy) return;

    const nextMessages: Message[] = [...messages, { role: 'user' as const, content }].slice(-20);
    setMessages(nextMessages);
    setDraft('');
    setError('');
    setBusy(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, lang, context }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t({ th: 'ส่งข้อความไม่สำเร็จ ลองใหม่อีกครั้งได้เลย', en: 'Could not send. Please try again.' }));
      setMessages([...nextMessages, { role: 'assistant' as const, content: String(data.reply ?? '') }].slice(-20));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t({ th: 'เชื่อมต่อแชทไม่สำเร็จ ลองใหม่อีกครั้งได้เลย', en: 'Chat connection failed. Please try again.' }));
    } finally {
      setBusy(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  }

  return (
    <section className="chatbot-inline" aria-label={t({ th: 'ผู้ช่วยโหงวเฮ้ง', en: 'Face-reading assistant' })}>
      <header className="chatbot-header">
        <div className="chatbot-avatar"><Sparkles size={16} /></div>
        <div className="chatbot-heading">
          <b>{t({ th: 'ถามผู้ช่วยโหงวเฮ้ง', en: 'Ask the face-reading assistant' })}</b>
          <span><i /> {context ? t({ th: 'รู้ผลโหงวเฮ้งของคุณแล้ว', en: 'Knows your reading' }) : t({ th: 'วิเคราะห์ใบหน้าก่อนเพื่อคำตอบเฉพาะคุณ', en: 'Analyze first for personal answers' })}</span>
        </div>
        {messages.length > 0 && <button className="chatbot-close" type="button" onClick={() => { setMessages([]); setError(''); }} aria-label={t({ th: 'เริ่มบทสนทนาใหม่', en: 'Start over' })}><RotateCcw size={15} /></button>}
      </header>

      <div className="chatbot-messages" aria-live="polite" ref={listRef}>
        <div className="chatbot-message assistant">{context
          ? t({ th: 'สวัสดีค่ะ ถามเกี่ยวกับโหงวเฮ้งของคุณได้เลย เช่น แต่ละจุดหมายถึงอะไร หรือถ้ายังไม่พร้อมศัลยกรรมควรเริ่มตรงไหน', en: 'Hi! Ask me about your reading — what each point means, or where to start if you’re not ready for surgery.' })
          : t({ th: 'สวัสดีค่ะ ถามเรื่องโหงวเฮ้งหรือการใช้งานเว็บได้เลย ถ้าวิเคราะห์ใบหน้าก่อน จะตอบตามผลของคุณได้', en: 'Hi! Ask about face reading or using the site. Analyze your face first for answers about your own reading.' })}</div>
        {messages.map((message, index) => (
          <div className={`chatbot-message ${message.role}`} key={`${index}-${message.role}`}>{message.content}</div>
        ))}
        {messages.length === 0 && (
          <div className="chatbot-suggestions">
            {SUGGESTIONS.slice(context ? 0 : 2).map(s => <button key={s.en} type="button" onClick={() => sendMessage(undefined, t(s))}>{t(s)}</button>)}
          </div>
        )}
        {busy && <div className="chatbot-message assistant chatbot-typing"><LoaderCircle size={15} /> {t({ th: 'กำลังพิมพ์…', en: 'Typing…' })}</div>}
        {error && <p className="chatbot-error" role="alert">{error}</p>}
      </div>

      <form className="chatbot-compose" onSubmit={sendMessage}>
        <textarea
          ref={inputRef}
          aria-label={t({ th: 'พิมพ์ข้อความถึงผู้ช่วย', en: 'Message the assistant' })}
          placeholder={t({ th: 'พิมพ์คำถาม…', en: 'Type a question…' })}
          value={draft}
          maxLength={1500}
          rows={1}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void sendMessage();
            }
          }}
        />
        <button type="submit" aria-label={t({ th: 'ส่งข้อความ', en: 'Send' })} disabled={!draft.trim() || busy}><Send size={16} /></button>
      </form>
      <p className="chatbot-disclosure">{t({ th: 'ข้อความถูกส่งไปยัง Anthropic (Claude) พร้อมรหัสผลโหงวเฮ้ง ไม่มีการส่งรูป อย่าพิมพ์ข้อมูลส่วนตัว', en: 'Messages go to Anthropic (Claude) with your reading result codes — never your photo. Don’t share personal details.' })}</p>
    </section>
  );
}
