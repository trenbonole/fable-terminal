// Single source of truth for foxes: rollFox() decides traits, foxSvg() draws.
// Used by the website (React, via dangerouslySetInnerHTML) AND the Node
// generator (rasterized to PNG for X). Keep it dependency-free and deterministic.

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
function weighted(r, pairs) {
  const total = pairs.reduce((s, p) => s + p[1], 0);
  let x = r() * total;
  for (const [v, w] of pairs) { if ((x -= w) < 0) return v; }
  return pairs[0][0];
}
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const PALETTES = [
  { name: 'ember', fur: '#ff8c42', belly: '#fff3e4', accent: '#ffb347' },
  { name: 'ash', fur: '#9aa0a6', belly: '#f2f4f5', accent: '#c8d0d4' },
  { name: 'phosphor', fur: '#2f9e57', belly: '#dffbe8', accent: '#39ff6e' },
  { name: 'moonlit', fur: '#7d8bb0', belly: '#eaf0ff', accent: '#c8ffdb' },
  { name: 'void', fur: '#4b2e83', belly: '#d9cbff', accent: '#b79bff' },
  { name: 'rust', fur: '#b0552f', belly: '#ffe6cf', accent: '#ff8c42' },
  { name: 'ink', fur: '#2b2f3a', belly: '#b9c2d0', accent: '#7f8ba3' },
  { name: 'blood', fur: '#8f2d2d', belly: '#ffd9d3', accent: '#ff5f56' }, // rare-looking
];
const EYES = ['round', 'closed', 'star', 'sleepy', 'glow'];
const MARKINGS = ['none', 'none', 'moon-crest', 'third-eye', 'freckles'];
const ACCESSORIES = ['none', 'none', 'none', 'none', 'scarf', 'ember', 'crown', 'halo'];
const BGS = ['night', 'night', 'dawn', 'void', 'grid'];
const NAMES = ['Ember', 'Ash', 'Cinder', 'Vesper', 'Sable', 'Marlow', 'Pyre', 'Quill', 'Umbra',
  'Bracken', 'Sorrel', 'Fennec', 'Vulpes', 'Kit', 'Reynard', 'Tod', 'Hollow', 'Mote', 'Cairn', 'Wick'];

function rollFox(seed) {
  const r = mulberry32(seed);
  const pal = pick(r, PALETTES);
  const tails = weighted(r, [[1, 0.55], [2, 0.24], [3, 0.13], [5, 0.06], [9, 0.02]]);
  const eyes = pick(r, EYES);
  const marking = pick(r, MARKINGS);
  const accessory = pick(r, ACCESSORIES);
  const bg = pick(r, BGS);
  const namePrefix = pick(r, NAMES);

  let rarity = 'common';
  if (tails === 9) rarity = 'legendary';
  else if (tails === 5 || accessory === 'crown' || accessory === 'halo') rarity = 'rare';
  else if (tails === 3 || marking === 'third-eye' || accessory === 'scarf' || accessory === 'ember') rarity = 'uncommon';

  return { fur: pal.fur, belly: pal.belly, accent: pal.accent, palette: pal.name, tails, eyes, marking, accessory, bg, namePrefix, rarity };
}

// ---- drawing ----
function background(bg, uid) {
  if (bg === 'void') return `<rect width="100" height="100" fill="#05070a"/>`;
  if (bg === 'grid') {
    let g = `<rect width="100" height="100" fill="#070b0a"/>`;
    for (let i = 10; i < 100; i += 12) {
      g += `<line x1="0" y1="${i}" x2="100" y2="${i}" stroke="#123" stroke-width="0.5"/>`;
      g += `<line x1="${i}" y1="0" x2="${i}" y2="100" stroke="#123" stroke-width="0.5"/>`;
    }
    return g;
  }
  if (bg === 'dawn') {
    return `<defs><linearGradient id="d${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3a2352"/><stop offset="60%" stop-color="#7a3b2e"/><stop offset="100%" stop-color="#2a1836"/></linearGradient></defs><rect width="100" height="100" fill="url(#d${uid})"/>`;
  }
  return `<defs><radialGradient id="n${uid}" cx="50%" cy="36%" r="80%"><stop offset="0%" stop-color="#241a4d"/><stop offset="100%" stop-color="#0c0a22"/></radialGradient></defs><rect width="100" height="100" fill="url(#n${uid})"/>`;
}
function tailsSvg(n, fur, belly) {
  const spread = n === 1 ? 0 : Math.min(168, (n - 1) * 22);
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = n === 1 ? 0 : -spread / 2 + (spread * i) / (n - 1);
    s += `<g transform="translate(50 66) rotate(${a.toFixed(2)})"><path d="M -6 6 Q -10 -22 0 -42 Q 10 -22 6 6 Z" fill="${fur}" stroke="#2a1a0e" stroke-width="1"/><path d="M -3.6 -30 Q 0 -44 3.6 -30 Q 0 -25 -3.6 -30 Z" fill="${belly}"/></g>`;
  }
  return s;
}
function eyesSvg(style, accent) {
  const L = 43, R = 57, Y = 45;
  if (style === 'closed') return `<g stroke="#2a1a0e" stroke-width="2.2" stroke-linecap="round" fill="none"><path d="M${L - 4} ${Y} q4 -5 8 0"/><path d="M${R - 4} ${Y} q4 -5 8 0"/></g>`;
  if (style === 'star') {
    const st = x => `M${x} ${Y - 4.5} l1.5 3.2 3.4 .5 -2.5 2.4 .6 3.4 -3 -1.7 -3 1.7 .6 -3.4 -2.5 -2.4 3.4 -.5 z`;
    return `<g fill="${accent}"><path d="${st(L)}"/><path d="${st(R)}"/></g>`;
  }
  if (style === 'sleepy') return `<g stroke="#2a1a0e" stroke-width="2.2" stroke-linecap="round"><line x1="${L - 4}" y1="${Y}" x2="${L + 4}" y2="${Y}"/><line x1="${R - 4}" y1="${Y}" x2="${R + 4}" y2="${Y}"/></g>`;
  if (style === 'glow') return `<g><circle cx="${L}" cy="${Y}" r="3.4" fill="${accent}" opacity="0.35"/><circle cx="${R}" cy="${Y}" r="3.4" fill="${accent}" opacity="0.35"/><circle cx="${L}" cy="${Y}" r="1.8" fill="${accent}"/><circle cx="${R}" cy="${Y}" r="1.8" fill="${accent}"/></g>`;
  return `<g fill="#2a1a0e"><circle cx="${L}" cy="${Y}" r="2.9"/><circle cx="${R}" cy="${Y}" r="2.9"/><circle cx="${L + 1}" cy="${Y - 1}" r="0.8" fill="#fff"/><circle cx="${R + 1}" cy="${Y - 1}" r="0.8" fill="#fff"/></g>`;
}
function markingSvg(marking, accent) {
  if (marking === 'moon-crest') return `<path d="M50 30 a4 4 0 1 1 -3.4 -6 a3 3 0 1 0 3.4 6 z" fill="${accent}" opacity="0.9"/>`;
  if (marking === 'third-eye') return `<g><ellipse cx="50" cy="33" rx="2.6" ry="3.4" fill="${accent}"/><circle cx="50" cy="33" r="1.1" fill="#2a1a0e"/></g>`;
  if (marking === 'freckles') return `<g fill="#2a1a0e" opacity="0.5"><circle cx="39" cy="53" r="0.8"/><circle cx="42" cy="55" r="0.8"/><circle cx="45" cy="53.5" r="0.8"/><circle cx="61" cy="53" r="0.8"/><circle cx="58" cy="55" r="0.8"/><circle cx="55" cy="53.5" r="0.8"/></g>`;
  return '';
}
function accessorySvg(accessory, accent) {
  if (accessory === 'crown') return `<path d="M40 12 l3 6 3.5 -7 3.5 7 3.5 -7 3.5 7 3 -6 -1 9 -19 0 z" fill="${accent}" stroke="#2a1a0e" stroke-width="0.6"/>`;
  if (accessory === 'halo') return `<ellipse cx="50" cy="9" rx="15" ry="4" fill="none" stroke="${accent}" stroke-width="1.6" opacity="0.9"/>`;
  if (accessory === 'scarf') return `<g><path d="M36 63 q14 8 28 0 l-2 5 q-12 6 -24 0 z" fill="${accent}" stroke="#2a1a0e" stroke-width="0.6"/><path d="M60 67 l4 10 -5 -1 -2 -7 z" fill="${accent}" stroke="#2a1a0e" stroke-width="0.6"/></g>`;
  if (accessory === 'ember') return `<g><circle cx="76" cy="30" r="2.4" fill="${accent}"/><circle cx="76" cy="30" r="4.4" fill="${accent}" opacity="0.3"/><circle cx="70" cy="22" r="1.2" fill="${accent}" opacity="0.7"/></g>`;
  return '';
}

function foxSvg(f) {
  const uid = f.id != null ? f.id : (hashStr(String(f.fur) + f.tails + f.eyes) % 100000);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label="${(f.name || 'a fox').replace(/"/g, '')}">`
    + background(f.bg, uid)
    + tailsSvg(f.tails, f.fur, f.belly)
    + `<path d="M34 30 L41 9 L51 28 Z" fill="${f.fur}" stroke="#2a1a0e" stroke-width="1.2"/>`
    + `<path d="M66 30 L59 9 L49 28 Z" fill="${f.fur}" stroke="#2a1a0e" stroke-width="1.2"/>`
    + `<path d="M38.5 27 L42.5 14 L48 26 Z" fill="${f.belly}"/>`
    + `<path d="M61.5 27 L57.5 14 L52 26 Z" fill="${f.belly}"/>`
    + `<circle cx="50" cy="46" r="20" fill="${f.fur}" stroke="#2a1a0e" stroke-width="1.2"/>`
    + `<ellipse cx="42" cy="52" rx="10" ry="9" fill="${f.belly}"/>`
    + `<ellipse cx="58" cy="52" rx="10" ry="9" fill="${f.belly}"/>`
    + `<ellipse cx="50" cy="56" rx="11" ry="8" fill="${f.belly}"/>`
    + markingSvg(f.marking, f.accent)
    + eyesSvg(f.eyes, f.accent)
    + `<ellipse cx="50" cy="55" rx="2.6" ry="2" fill="#2a1a0e"/>`
    + `<path d="M50 57 q0 4 -4 5 M50 57 q0 4 4 5" stroke="#2a1a0e" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
    + accessorySvg(f.accessory, f.accent)
    + `</svg>`;
}

module.exports = { rollFox, foxSvg, ordinal, hashStr, mulberry32 };
