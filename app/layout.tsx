import type { Metadata } from 'next';
import { Anton, Inter } from 'next/font/google';
import './globals.css';

const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton', display: 'swap' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'V&B Performance Apparel | Hecho Para Rendir',
  description:
    'V&B Performance Apparel — ropa deportiva premium para quienes exigen más de sí mismos. Camisetas tipo tank en negro, blanco y merlot. Hecho para rendir.',
  icons: {
    icon: '/assets/img/brand/favicon-32.png',
    apple: '/assets/img/brand/apple-touch-icon.png'
  }
};

export const viewport = {
  themeColor: '#050505'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${anton.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
