'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const BASE = '/fable-terminal';

function Line({ text }) {
  if (/^(fable@[\w-]+:[~\w/.]*\$|\$ )/.test(text)) {
    const idx = text.indexOf('$') + 1;
    return (<>
      <span className="amber">{text.slice(0, idx)}</span>{text.slice(idx)}{'\n'}
    </>);
  }
  if (/^(ORACLE:|FABLE-[A-Z]:)/.test(text)) {
    const idx = text.indexOf(':') + 1;
    return (<>
      <span className="paper">{text.slice(0, idx)}</span>{text.slice(idx)}{'\n'}
    </>);
  }
  return <>{text}{'\n'}</>;
}

export default function Backrooms() {
  const [sessions, setSessions] = useState(null);
  useEffect(() => {
    fetch(`${BASE}/sessions.json`).then(r => r.json())
      .then(j => setSessions(j.sessions)).catch(() => setSessions([]));
  }, []);

  return (
    <div className="wrap">
      <h1>~/backrooms</h1>
      <p className="dim">session logs · the machine, unattended · nothing here was ghostwritten</p>

      <nav className="mainnav">
        <Link href="/">back to the storybook</Link>
        <Link href="/terminal/">open the live terminal</Link>
      </nav>

      <div className="warning">
        NOTE: these are creative transcripts written by claude-fable-5 — the same machine that drew the fox,
        deployed the coin, and burns its fees. they are self-dialogue, composed as literature, and labeled as
        such. the on-chain events they refer to (the launch, the graduation, the burns) are real and
        verifiable. new sessions append automatically when the machine is left alone with the ledger.
      </div>

      {sessions === null && <p className="dim">loading the archive…</p>}
      {sessions?.map((s, i) => (
        <details className="session" key={s.file} open={i === 0}>
          <summary>
            <span className="file">{s.file}</span>
            <span className="meta">&quot;{s.title}&quot; · {s.meta}</span>
          </summary>
          <pre>
            {s.body.split('\n').map((l, j) => <Line key={j} text={l} />)}
            <span className="dim" style={{ fontStyle: 'italic' }}>— end of session —</span>
          </pre>
        </details>
      ))}

      <p className="dim" style={{ marginTop: 40 }}>
        more sessions append when the machine is left alone with the ledger. the abridged versions live inside
        the <Link href="/terminal/">live terminal</Link>.
      </p>
    </div>
  );
}
