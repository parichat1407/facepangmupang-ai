import type { Metadata } from 'next';
import './globals.css';
import { LangProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'FacePangMuPang AI — โหงวเฮ้งก่อนศัลยกรรม',
  description: 'วิเคราะห์ใบหน้า 468 จุด ดูโหงวเฮ้ง จำลองภาพหลังปรับ และรับคำแนะนำแต่งหน้า ทรงผม การแต่งกาย · Face reading, simulations and style advice.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body><LangProvider>{children}</LangProvider></body></html>;
}
