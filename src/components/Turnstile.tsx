'use client';

import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';

/** Public site key; inlined at build time. Empty means the widget is not rendered. */
export const TURNSTILE_SITE_KEY = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '').trim();

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SCRIPT_ID = 'cf-turnstile-script';

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string | undefined;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export interface TurnstileHandle {
  reset: () => void;
}

interface Props {
  onToken: (token: string | null) => void;
}

function loadScript(): Promise<TurnstileApi> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    let s = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!s) {
      s = document.createElement('script');
      s.id = SCRIPT_ID;
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
    const onLoad = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile missing')));
    s.addEventListener('load', onLoad, { once: true });
    s.addEventListener('error', () => reject(new Error('turnstile load failed')), { once: true });
  });
}

/**
 * Cloudflare Turnstile widget, rendered explicitly into a div.
 * Calls onToken(token) when the check passes, onToken(null) when the token
 * expires or the widget errors. reset() clears it for another attempt.
 */
const Turnstile = forwardRef<TurnstileHandle, Props>(function Turnstile({ onToken }, ref) {
  const divRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useImperativeHandle(ref, () => ({
    reset() {
      onTokenRef.current(null);
      try {
        window.turnstile?.reset(widgetId.current);
      } catch {
        /* widget gone; nothing to reset */
      }
    },
  }));

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;
    loadScript()
      .then((api) => {
        if (cancelled || !divRef.current) return;
        widgetId.current = api.render(divRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'auto',
          language: 'he',
          size: 'flexible',
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        });
      })
      .catch(() => onTokenRef.current(null));
    return () => {
      cancelled = true;
      try {
        window.turnstile?.remove(widgetId.current);
      } catch {
        /* already removed */
      }
      widgetId.current = undefined;
    };
  }, []);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={divRef} className="min-h-[65px]" data-testid="turnstile" />;
});

export default Turnstile;
