// Single source of truth for foxes: rollFox() decides traits, foxSvg() draws.
// Used by the website (React) AND the Node generator (rasterized to PNG for X).
// Dependency-free and deterministic — same seed, same fox, everywhere.

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
// lighten (p>0) or darken (p<0) a #rrggbb hex
function shade(hex, p) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = p < 0 ? 0 : 255, a = Math.abs(p);
  r = Math.round((t - r) * a) + r; g = Math.round((t - g) * a) + g; b = Math.round((t - b) * a) + b;
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const PALETTES = [
  { name: 'ember', fur: '#f0803a', belly: '#fff1e0', accent: '#ffc061' },
  { name: 'ash', fur: '#9aa0a6', belly: '#f4f6f7', accent: '#d3dade' },
  { name: 'phosphor', fur: '#37a862', belly: '#e2fced', accent: '#5cff8e' },
  { name: 'moonlit', fur: '#8090b8', belly: '#eef3ff', accent: '#cfe6ff' },
  { name: 'amethyst', fur: '#7a54b5', belly: '#e9dcff', accent: '#c4a6ff' },
  { name: 'rust', fur: '#c05f33', belly: '#ffe7d3', accent: '#ff9a5c' },
  { name: 'ink', fur: '#3a3f4d', belly: '#c3ccda', accent: '#8b98b3' },
  { name: 'blood', fur: '#a4362f', belly: '#ffdcd6', accent: '#ff6f63' },
  { name: 'gilded', fur: '#c99a2e', belly: '#fff4d0', accent: '#ffd869' },
  { name: 'frost', fur: '#5fa9c4', belly: '#e6fbff', accent: '#9fe8ff' },
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

// ---------- drawing ----------
const OUTLINE = '#241a12';

function starsField(rng, n) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = (rng() * 112 - 6).toFixed(1), y = (rng() * 62 - 4).toFixed(1);
    const r = (0.4 + rng() * 1.1).toFixed(2), o = (0.3 + rng() * 0.6).toFixed(2);
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`;
  }
  return s;
}
function moon(rng) {
  const cx = (68 + rng() * 20).toFixed(1), cy = (9 + rng() * 10).toFixed(1);
  const r = 5 + rng() * 2.6, r2 = (r * 0.8).toFixed(1);
  const top = (cy - r).toFixed(1), bot = (+cy + r).toFixed(1);
  return `<circle cx="${cx}" cy="${cy}" r="${(r + 1.6).toFixed(1)}" fill="#fdf6d8" opacity="0.14"/>`
    + `<path d="M ${cx} ${top} A ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${cx} ${bot} A ${r2} ${r2} 0 1 1 ${cx} ${top} Z" fill="#fdf6d8" opacity="0.9"/>`;
}
function bg(kind, uid, rng) {
  if (kind === 'grid') {
    let g = `<rect x="-6" y="-4" width="112" height="112" fill="#080d0c"/>`;
    for (let i = -4; i < 108; i += 11) {
      g += `<line x1="-6" y1="${i}" x2="106" y2="${i}" stroke="#12321f" stroke-width="0.4"/>`;
      g += `<line x1="${i}" y1="-4" x2="${i}" y2="108" stroke="#12321f" stroke-width="0.4"/>`;
    }
    return g + starsField(rng, 10);
  }
  if (kind === 'void') {
    return `<defs><radialGradient id="v${uid}" cx="50%" cy="42%" r="75%"><stop offset="0%" stop-color="#151024"/><stop offset="100%" stop-color="#050409"/></radialGradient></defs>`
      + `<rect x="-6" y="-4" width="112" height="112" fill="url(#v${uid})"/>` + starsField(rng, 34) + moon(rng);
  }
  if (kind === 'dawn') {
    return `<defs><linearGradient id="dw${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3c2a5e"/><stop offset="55%" stop-color="#9c4f43"/><stop offset="100%" stop-color="#e0895a"/></linearGradient></defs>`
      + `<rect x="-6" y="-4" width="112" height="112" fill="url(#dw${uid})"/>` + starsField(rng, 8);
  }
  return `<defs><radialGradient id="ni${uid}" cx="50%" cy="34%" r="82%"><stop offset="0%" stop-color="#2a2058"/><stop offset="100%" stop-color="#0b0a22"/></radialGradient></defs>`
    + `<rect x="-6" y="-4" width="112" height="112" fill="url(#ni${uid})"/>` + starsField(rng, 26) + moon(rng);
}

function tailsSvg(n, uid) {
  const spread = n === 1 ? 0 : Math.min(150, (n - 1) * 20);
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = n === 1 ? 0 : -spread / 2 + (spread * i) / (n - 1);
    s += `<g transform="translate(50 72) rotate(${a.toFixed(2)})">`
      + `<path d="M -7 8 Q -13 -16 -2 -44 Q 0 -47 2 -44 Q 13 -16 7 8 Q 0 12 -7 8 Z" fill="url(#tail${uid})" stroke="${OUTLINE}" stroke-width="1.1"/>`
      + `<path d="M -5 -33 Q 0 -50 5 -33 Q 0 -27 -5 -33 Z" fill="url(#tip${uid})"/></g>`;
  }
  return s;
}

function eyesSvg(style, accent) {
  const L = 41.5, R = 58.5, Y = 45;
  if (style === 'closed') {
    return `<g stroke="${OUTLINE}" stroke-width="2.4" stroke-linecap="round" fill="none">`
      + `<path d="M${L - 4.5} ${Y + 1} q4.5 -6 9 0"/><path d="M${R - 4.5} ${Y + 1} q4.5 -6 9 0"/></g>`;
  }
  if (style === 'star') {
    const st = x => `M${x} ${Y - 5} l1.7 3.5 3.8 .6 -2.8 2.7 .7 3.8 -3.4 -1.9 -3.4 1.9 .7 -3.8 -2.8 -2.7 3.8 -.6 z`;
    return `<g fill="${accent}" stroke="${shade(accent, -0.3)}" stroke-width="0.4">`
      + `<path d="${st(L)}"/><path d="${st(R)}"/></g>`;
  }
  if (style === 'sleepy') {
    return `<g stroke="${OUTLINE}" stroke-width="2.3" stroke-linecap="round">`
      + `<path d="M${L - 4} ${Y} q4 3 8 0" fill="none"/><path d="M${R - 4} ${Y} q4 3 8 0" fill="none"/></g>`;
  }
  if (style === 'glow') {
    return `<g>`
      + `<circle cx="${L}" cy="${Y}" r="4" fill="${accent}" opacity="0.3"/><circle cx="${R}" cy="${Y}" r="4" fill="${accent}" opacity="0.3"/>`
      + `<circle cx="${L}" cy="${Y}" r="2.1" fill="${accent}"/><circle cx="${R}" cy="${Y}" r="2.1" fill="${accent}"/>`
      + `<circle cx="${L - 0.6}" cy="${Y - 0.7}" r="0.7" fill="#fff"/><circle cx="${R - 0.6}" cy="${Y - 0.7}" r="0.7" fill="#fff"/></g>`;
  }
  // round — glossy almond
  return `<g>`
    + `<ellipse cx="${L}" cy="${Y}" rx="3" ry="3.6" fill="${OUTLINE}"/><ellipse cx="${R}" cy="${Y}" rx="3" ry="3.6" fill="${OUTLINE}"/>`
    + `<circle cx="${L + 0.9}" cy="${Y - 1.4}" r="1" fill="#fff"/><circle cx="${R + 0.9}" cy="${Y - 1.4}" r="1" fill="#fff"/>`
    + `<circle cx="${L - 1}" cy="${Y + 1.2}" r="0.5" fill="#fff" opacity="0.6"/><circle cx="${R - 1}" cy="${Y + 1.2}" r="0.5" fill="#fff" opacity="0.6"/></g>`;
}

function markingSvg(marking, accent) {
  if (marking === 'moon-crest') return `<path d="M50 27 a4.4 4.4 0 1 1 -3.6 -6.6 a3.3 3.3 0 1 0 3.6 6.6 z" fill="${accent}" opacity="0.92"/>`;
  if (marking === 'third-eye') return `<g><ellipse cx="50" cy="30" rx="2.7" ry="3.6" fill="${accent}"/><circle cx="50" cy="30" r="1.2" fill="${OUTLINE}"/><circle cx="50.6" cy="29" r="0.5" fill="#fff"/></g>`;
  if (marking === 'freckles') return `<g fill="${OUTLINE}" opacity="0.45"><circle cx="40" cy="53" r="0.8"/><circle cx="43" cy="55" r="0.8"/><circle cx="46" cy="53.5" r="0.8"/><circle cx="60" cy="53" r="0.8"/><circle cx="57" cy="55" r="0.8"/><circle cx="54" cy="53.5" r="0.8"/></g>`;
  return '';
}
function accessorySvg(accessory, accent) {
  if (accessory === 'crown') return `<path d="M40 11 l3.2 6.5 3.6 -7.6 3.6 7.6 3.6 -7.6 3.6 7.6 3.2 -6.5 -1 9.5 -19.4 0 z" fill="${accent}" stroke="${OUTLINE}" stroke-width="0.7"/><circle cx="50" cy="9" r="1.3" fill="${shade(accent, 0.3)}"/>`;
  if (accessory === 'halo') return `<ellipse cx="50" cy="7" rx="16" ry="4.2" fill="none" stroke="${accent}" stroke-width="1.8" opacity="0.95"/><ellipse cx="50" cy="7" rx="16" ry="4.2" fill="none" stroke="#fff" stroke-width="0.6" opacity="0.5"/>`;
  if (accessory === 'scarf') return `<g><path d="M33 70 q17 10 34 0 l-2.5 7 q-14.5 7 -29 0 z" fill="${accent}" stroke="${OUTLINE}" stroke-width="0.7"/><path d="M62 76 l5 12 -6 -1.5 -2.5 -8.5 z" fill="${shade(accent, -0.12)}" stroke="${OUTLINE}" stroke-width="0.7"/></g>`;
  if (accessory === 'ember') return `<g><circle cx="80" cy="30" r="2.6" fill="${accent}"/><circle cx="80" cy="30" r="5" fill="${accent}" opacity="0.28"/><circle cx="73" cy="21" r="1.3" fill="${accent}" opacity="0.75"/><circle cx="85" cy="38" r="0.9" fill="${accent}" opacity="0.6"/></g>`;
  return '';
}

function foxSvg(f) {
  const uid = f.id != null ? f.id : (hashStr(String(f.fur) + f.tails + f.eyes) % 100000);
  const rng = mulberry32(hashStr('fox' + uid));
  const furHi = shade(f.fur, 0.24), furLo = shade(f.fur, -0.34);
  const bellyHi = shade(f.belly, 0.10), bellyLo = shade(f.belly, -0.14);
  const legendary = f.rarity === 'legendary';

  const defs = `<defs>`
    + `<radialGradient id="fur${uid}" cx="50%" cy="36%" r="72%"><stop offset="0%" stop-color="${furHi}"/><stop offset="72%" stop-color="${f.fur}"/><stop offset="100%" stop-color="${furLo}"/></radialGradient>`
    + `<linearGradient id="tail${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${furLo}"/><stop offset="100%" stop-color="${furHi}"/></linearGradient>`
    + `<radialGradient id="tip${uid}" cx="50%" cy="60%" r="60%"><stop offset="0%" stop-color="${bellyHi}"/><stop offset="100%" stop-color="${bellyLo}"/></radialGradient>`
    + `<linearGradient id="belly${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bellyHi}"/><stop offset="100%" stop-color="${bellyLo}"/></linearGradient>`
    + `<radialGradient id="glow${uid}" cx="50%" cy="44%" r="52%"><stop offset="0%" stop-color="${f.accent}" stop-opacity="${legendary ? 0.45 : 0.24}"/><stop offset="100%" stop-color="${f.accent}" stop-opacity="0"/></radialGradient>`
    + `<radialGradient id="vig${uid}" cx="50%" cy="45%" r="72%"><stop offset="58%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.5"/></radialGradient>`
    + `</defs>`;

  const glow = `<rect x="-6" y="-4" width="112" height="112" fill="url(#glow${uid})"/>`;

  // ears (behind head)
  const ears = `<g stroke="${OUTLINE}" stroke-width="1.3" stroke-linejoin="round">`
    + `<path d="M31 33 L36 7 L53 29 Z" fill="url(#fur${uid})"/>`
    + `<path d="M69 33 L64 7 L47 29 Z" fill="url(#fur${uid})"/>`
    + `<path d="M35.5 29 L38.5 14 L48 28 Z" fill="url(#belly${uid})" stroke="none"/>`
    + `<path d="M64.5 29 L61.5 14 L52 28 Z" fill="url(#belly${uid})" stroke="none"/></g>`;

  // fluffy chest ruff (behind head)
  const ruff = `<path d="M29 60 Q26 78 37 86 Q44 91 50 89 Q56 91 63 86 Q74 78 71 60 `
    + `Q65 69 58 68 L55 73 Q50 77 45 73 L42 68 Q35 69 29 60 Z" fill="url(#belly${uid})" stroke="${OUTLINE}" stroke-width="1.2" stroke-linejoin="round"/>`;

  // head
  const head = `<path d="M50 24 C64 24 71.5 33 71 45 C70.5 56 63 63 55 66.5 Q50 68.5 45 66.5 C37 63 29.5 56 29 45 C28.5 33 36 24 50 24 Z" fill="url(#fur${uid})" stroke="${OUTLINE}" stroke-width="1.3"/>`;
  // cheek fluffs
  const cheeks = `<g fill="url(#fur${uid})" stroke="${OUTLINE}" stroke-width="1"><path d="M30 47 L23 51 L31 55 Z"/><path d="M70 47 L77 51 L69 55 Z"/></g>`;
  // muzzle
  const muzzle = `<path d="M50 67 C42 65 37.5 56 41 50 C45 54 50 53.5 50 53.5 C50 53.5 55 54 59 50 C62.5 56 58 65 50 67 Z" fill="url(#belly${uid})"/>`;
  // nose + mouth
  const nose = `<path d="M50 60 L46.4 56 Q50 54.2 53.6 56 Z" fill="${OUTLINE}"/>`
    + `<path d="M50 60 Q50 63.5 46.5 64.5 M50 60 Q50 63.5 53.5 64.5" stroke="${OUTLINE}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;

  const sparkle = legendary
    ? `<g fill="${f.accent}">` + [[16, 30], [84, 26], [22, 74], [80, 70]].map(([x, y], i) =>
      `<path transform="translate(${x} ${y}) scale(${(0.7 + rng() * 0.5).toFixed(2)})" d="M0 -3 L0.8 -0.8 3 0 0.8 0.8 0 3 -0.8 0.8 -3 0 -0.8 -0.8 Z"/>`).join('') + `</g>`
    : '';

  const vignette = `<rect x="-6" y="-4" width="112" height="112" fill="url(#vig${uid})"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -4 112 112" width="100%" height="100%" role="img" aria-label="${(f.name || 'a fox').replace(/"/g, '')}">`
    + defs
    + bg(f.bg, uid, rng)
    + glow
    + tailsSvg(f.tails, uid)
    + ruff
    + ears
    + head
    + cheeks
    + muzzle
    + markingSvg(f.marking, f.accent)
    + eyesSvg(f.eyes, f.accent)
    + nose
    + accessorySvg(f.accessory, f.accent)
    + sparkle
    + vignette
    + `</svg>`;
}

module.exports = { rollFox, foxSvg, ordinal, hashStr, mulberry32, shade };
