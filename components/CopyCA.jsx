'use client';
import { useState } from 'react';

export default function CopyCA({ address }) {
  const [copied, setCopied] = useState(false);
  return (
    <code
      className={'ca' + (copied ? ' copied' : '')}
      onClick={() => navigator.clipboard.writeText(address).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })}
    >
      {address}
    </code>
  );
}
