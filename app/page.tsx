'use client';
import { useEffect, useMemo, useState } from 'react';
import type { DetectedFace } from '@/components/FaceMeshStudio';
import type { ProfileData } from '@/components/ProfileStudio';
import Workspace from '@/components/sections/Workspace';
import ReadingSection from '@/components/sections/ReadingSection';
import SimulationSection from '@/components/sections/SimulationSection';
import StyleSection from '@/components/sections/StyleSection';
import { Header, Hero, LifeSection, Disclaimer, Footer } from '@/components/sections/Static';
import { useLang } from '@/lib/i18n';
import { measureFace, featureBalance, type FaceMetrics } from '@/lib/face/measure';
import { measureProfile, type ProfileMetrics } from '@/lib/face/profile';
import { readFace, type FaceReport } from '@/lib/face/reading-rules';
import { styleAdvice, type StyleCategory, type StyleTip } from '@/lib/face/style-rules';

export type Analysis = {
  metrics: FaceMetrics;
  balance: ReturnType<typeof featureBalance>;
  profile: { data: ProfileData; metrics: ProfileMetrics } | null;
  report: FaceReport;
  style: Record<StyleCategory, StyleTip[]>;
};

const MAX_BYTES = 10 * 1024 * 1024;

export default function Home() {
  const { t, lang } = useLang();
  const [image, setImage] = useState('');
  const [face, setFace] = useState<DetectedFace | null>(null);
  const [profileImage, setProfileImage] = useState('');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [consent, setConsent] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryDisabled, setSummaryDisabled] = useState(false);

  const analysis = useMemo<Analysis | null>(() => {
    if (!face) return null;
    const metrics = measureFace(face.landmarks, face.width, face.height);
    const side = profile ? { data: profile, metrics: measureProfile(profile.points) } : null;
    const report = readFace(metrics, side?.metrics);
    return { metrics, balance: featureBalance(metrics), profile: side, report, style: styleAdvice(metrics, report, side?.metrics) };
  }, [face, profile]);

  // A new front face invalidates the previous analysis and selections.
  useEffect(() => { setAnalyzed(false); setSelected([]); }, [face]);

  const readImage = (file: File | undefined, apply: (url: string) => void) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError(t({ th: 'กรุณาเลือกไฟล์รูปภาพ', en: 'Please choose an image file.' })); return; }
    if (file.size > MAX_BYTES) { setError(t({ th: 'กรุณาเลือกรูปขนาดไม่เกิน 10 MB', en: 'Please choose an image under 10 MB.' })); return; }
    setError(''); apply(URL.createObjectURL(file));
  };
  const setFile = (file?: File) => readImage(file, url => { if (image) URL.revokeObjectURL(image); setImage(url); setFace(null); });
  const removeImage = () => { if (image) URL.revokeObjectURL(image); setImage(''); setFace(null); };
  const setProfileFile = (file?: File) => readImage(file, url => { if (profileImage) URL.revokeObjectURL(profileImage); setProfileImage(url); setProfile(null); });
  const removeProfile = () => { if (profileImage) URL.revokeObjectURL(profileImage); setProfileImage(''); setProfile(null); };
  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const analyze = () => {
    if (!analysis || !consent) return;
    setAnalyzed(true);
    // Pre-select the two most prominent enhancement points for the simulation.
    setSelected(analysis.report.enhancements.slice(0, 2).map(r => r.enhancement.id));
    requestAnimationFrame(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }));
  };

  // Optional Claude summary (rule results only, never the photo). Keyed by the result set so dragging
  // profile points doesn't re-request unless the reading actually changes. Hidden if the server has no key.
  const readingIds = analysis?.report.readings.map(r => r.id) ?? [];
  const summaryKey = analyzed && analysis ? `${lang}|${analysis.metrics.faceShape}|${readingIds.join(',')}` : '';
  useEffect(() => {
    if (!summaryKey || summaryDisabled || summaries[summaryKey] || !analysis) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      setSummaryLoading(true);
      fetch('/api/face-reading', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
        body: JSON.stringify({ lang, faceShape: analysis.metrics.faceShape, readings: readingIds }),
      })
        .then(async res => {
          if (res.status === 503) { setSummaryDisabled(true); return; }
          const data = await res.json();
          if (res.ok && data.summary) setSummaries(s => ({ ...s, [summaryKey]: data.summary }));
        })
        .catch(() => {})
        .finally(() => { if (!ctrl.signal.aborted) setSummaryLoading(false); });
    }, 900);
    return () => { clearTimeout(timer); ctrl.abort(); };
    // readingIds/analysis are captured through summaryKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryKey, summaryDisabled]);

  return (
    <main>
      <Header />
      <Hero />
      <Workspace image={image} face={face} analysis={analysis} analyzed={analyzed} consent={consent} setConsent={setConsent} error={error}
        onFile={setFile} onRemove={removeImage} onFace={setFace} onAnalyze={analyze}
        profileImage={profileImage} profile={profile} onProfileFile={setProfileFile} onProfileRemove={removeProfile} onProfileChange={setProfile} />
      <ReadingSection analysis={analyzed ? analysis : null} selected={selected} toggle={toggle} summary={summaries[summaryKey] ?? null} summaryLoading={summaryLoading && !summaries[summaryKey]} />
      <SimulationSection image={image} profileImage={profile ? profileImage : ''} analysis={analyzed ? analysis : null} selected={selected} toggle={toggle} />
      <StyleSection analysis={analyzed ? analysis : null} />
      <LifeSection />
      <Disclaimer />
      <Footer />
    </main>
  );
}
