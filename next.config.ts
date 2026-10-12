import type { NextConfig } from 'next';

/**
 * Static export: the whole site is plain HTML/CSS/JS in out/, so it can be hosted anywhere
 * (Hostinger, Vercel...). No API routes, middleware or image optimisation server.
 */
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default config;
