'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { LoaderCircle, MessageCircle, Send, Sparkles, X } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

const greeting: Message = {
  role: 'assistant',
  content: 'สวัสดีค่ะ ถามฉันเกี่ยวกับ FacePangMuPang AI หรือการใช้งานเว็บไซต์ได้เลยนะคะ',
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const content = draft.trim();
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
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ส่งข้อความไม่สำเร็จ ลองใหม่อีกครั้งได้เลย');
      setMessages([...nextMessages, { role: 'assistant' as const, content: String(data.reply ?? '') }].slice(-20));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'เชื่อมต่อแชทไม่สำเร็จ ลองใหม่อีกครั้งได้เลย');
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="chatbot-root">
      {open && (
        <section className="chatbot-panel" aria-label="FacePangMuPang AI assistant">
          <header className="chatbot-header">
            <div className="chatbot-avatar"><Sparkles size={16} /></div>
            <div className="chatbot-heading">
              <b>FacePangMuPang AI</b>
              <span><i /> Claude assistant</span>
            </div>
            <button className="chatbot-close" type="button" onClick={() => setOpen(false)} aria-label="Close chat"><X size={18} /></button>
          </header>

          <div className="chatbot-messages" aria-live="polite">
            <div className="chatbot-message assistant">{greeting.content}</div>
            {messages.map((message, index) => (
              <div className={`chatbot-message ${message.role}`} key={`${index}-${message.role}`}>
                {message.content}
              </div>
            ))}
            {busy && <div className="chatbot-message assistant chatbot-typing"><LoaderCircle size={15} /> กำลังพิมพ์…</div>}
            {error && <p className="chatbot-error" role="alert">{error}</p>}
            <div ref={endRef} />
          </div>

          <form className="chatbot-compose" onSubmit={sendMessage}>
            <textarea
              ref={inputRef}
              aria-label="พิมพ์ข้อความถึงแชทบอท"
              placeholder="พิมพ์ข้อความ…"
              value={draft}
              maxLength={1500}
              rows={1}
              onChange={event => setDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <button type="submit" aria-label="ส่งข้อความ" disabled={!draft.trim() || busy}><Send size={16} /></button>
          </form>
          <p className="chatbot-disclosure">ข้อความจะถูกส่งไปยัง Anthropic และอาจมีค่าใช้จ่ายตามการใช้งาน อย่าส่งข้อมูลส่วนตัวหรือรูปภาพ</p>
        </section>
      )}

      <button className="chatbot-launcher" type="button" onClick={() => setOpen(value => !value)} aria-label={open ? 'ปิดแชท' : 'เปิดแชทกับ Claude'} aria-expanded={open}>
        {open ? <X size={20} /> : <><MessageCircle size={19} /><Sparkles size={12} className="chatbot-launcher-sparkle" /></>}
      </button>
    </div>
  );
}
