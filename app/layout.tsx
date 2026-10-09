import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'FacePangMuPang AI — Face harmony, reimagined', description: 'Explore facial proportions, style possibilities and cultural face reading with care.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
