import { foxSvg } from '../lib/fox';

const BASE = '/fable-terminal';

// Renders an AI fox (stored image) as <img>, or a procedural fox as inline SVG
// (the same SVG the generator rasterizes) — one component for both.
export default function FableFox({ fox, size = 150 }) {
  if (fox.img) {
    return (
      <div className="fox" style={{ width: size, height: size }}>
        <img
          src={`${BASE}/${fox.img}`}
          alt={fox.name || 'a fox'}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }
  return (
    <div
      className="fox"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: foxSvg(fox) }}
    />
  );
}
