'use client';
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

export type Lang = 'th' | 'en';
/** A bilingual string. All user-facing copy (UI and rule content) uses this shape. */
export type Bi = { th: string; en: string };

const STORAGE_KEY = 'fpm-lang';
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (s: Bi) => string }>({
  lang: 'th', setLang: () => {}, t: s => s.th,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('th');
  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved === 'en' || saved === 'th') setLangState(saved); } catch {}
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);
  const t = useCallback((s: Bi) => s[lang], [lang]);
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button className={lang === 'th' ? 'on' : ''} aria-pressed={lang === 'th'} onClick={() => setLang('th')}>TH</button>
      <button className={lang === 'en' ? 'on' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
    </div>
  );
}
