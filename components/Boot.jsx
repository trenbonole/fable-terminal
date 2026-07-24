'use client';
import { useEffect, useRef } from 'react';

const LINES = [
  'FABLE TERMINAL v2.0.0 — robinhood chain mainnet (id 4663)',
  'mount /dev/storybook .......... ok',
  'verify supply ................. 1,000,000,000 (fixed)',
  'verify liquidity .............. locked, permanently',
  'verify author ................. machine (claude-fable-5)',
  'verify automation ............. armed. the ritual runs itself.',
  '',
  '> the machine will now tell you a story_',
];

export default function Boot() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = LINES.join('\n');
      return;
    }
    let li = 0, ci = 0, out = '', cancelled = false, timer;
    (function type() {
      if (cancelled || li >= LINES.length) return;
      const line = LINES[li];
      if (ci < line.length) { out += line[ci++]; el.textContent = out; timer = setTimeout(type, line[0] === '>' ? 26 : 8); }
      else { out += '\n'; ci = 0; li++; el.textContent = out; timer = setTimeout(type, li === LINES.length - 1 ? 420 : 90); }
    })();
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);
  return <div ref={ref} style={{ whiteSpace: 'pre-wrap', marginBottom: 40, minHeight: 200 }} aria-live="polite" />;
}
