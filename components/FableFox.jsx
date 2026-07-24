import { foxSvg } from '../lib/fox';

// Renders the exact same SVG the generator rasterizes for X — one source of truth.
export default function FableFox({ fox, size = 150 }) {
  return (
    <div
      className="fox"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: foxSvg(fox) }}
    />
  );
}
