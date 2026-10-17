import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Content Security Policy without nonces (the documented static option for
 * this Next.js version). 'unsafe-inline' for scripts is needed by Next's inline
 * hydration scripts. The page talks to its own /api routes and, for the
 * "verify you are human" widget on the start form, to Cloudflare Turnstile
 * (script, iframe and XHR all on challenges.cloudflare.com). The proof-of-work
 * check runs in a blob: worker (worker-src). Fonts are self-hosted by next/font.
 */
const turnstile = 'https://challenges.cloudflare.com';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${turnstile}${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  `connect-src 'self' ${turnstile}`,
  // The start form solves its proof-of-work challenge in an inline (blob:) Web Worker.
  "worker-src 'self' blob:",
  `frame-src 'self' ${turnstile} https://*.vercel.app https://messy-site-maayan.vercel.app http://localhost:* http://127.0.0.1:*`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(), payment=(), usb=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ['127.0.0.1:3001', 'localhost:3001', '127.0.0.1', 'localhost'],
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      { source: '/api/(.*)', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};

export default nextConfig;
