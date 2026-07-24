'use client';
import { useEffect, useState } from 'react';

const BASE = '/fable-terminal';

export default function Fables() {
  const [fables, setFables] = useState(null);
  useEffect(() => {
    fetch(`${BASE}/fables.json`).then(r => r.json())
      .then(j => setFables(j.fables)).catch(() => setFables([]));
  }, []);

  return (
    <>
      <p className="sub">
        {fables ? fables.length : '…'} entries · the shelf grows while the machine dreams · all morals final
      </p>
      {fables === null && <p className="dim">the shelf is loading…</p>}
      {fables?.map(f => (
        <article className="fable" key={f.id}>
          <div className="path">cat fables/{f.id}_{f.slug}.txt</div>
          <h3>{f.title}</h3>
          <p className="body">{f.body}</p>
          <p className="moral">
            {f.moral}{' '}
            {f.burnLink && <a href="#burning">(this one is not fiction — see burning.log)</a>}
          </p>
        </article>
      ))}
    </>
  );
}
