import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { content, MODE } from '../site/data.ts';

const domain = content().site.domain;

export const metadata: Metadata = {
  // social images need an absolute URL; the domain is a placeholder until site.json is filled in
  metadataBase: /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain) ? new URL(`https://${domain}`) : undefined,
  // a preview build must never be indexed
  robots: MODE === 'preview' ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B6E4F',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
