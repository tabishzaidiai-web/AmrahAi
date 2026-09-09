import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['SOFT', 'WONK'],
});

export const metadata: Metadata = {
  title: 'Amrah Studio — Fashion photography without the photoshoot',
  description:
    'Upload a garment. Get a full campaign-ready shoot on any model, from every angle, with every stitch intact. Marketplace-compliant and AI Act ready.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable}`}>{children}</body>
    </html>
  );
}
