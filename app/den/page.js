'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import FableFox from '../../components/FableFox';

const BASE = '/fable-terminal';
const EXPLORER = 'https://robinhoodchain.blockscout.com';
const NFT_CONTRACT = '0x7D922d1737370b0CB24fd30afe6454B6DE8EbC07';
const shortAddr = a => a ? a.slice(0, 6) + '…' + a.slice(-4) : '';

export default function Den() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(`${BASE}/foxes.json`).then(r => r.json())
      .then(setData).catch(() => setData({ count: 0, foxes: [] }));
  }, []);

  const foxes = data?.foxes ? [...data.foxes].reverse() : null; // newest first
  const legendary = foxes?.filter(f => f.rarity === 'legendary').length || 0;

  return (
    <div className="wrap fox-den">
      <h1>~/den</h1>
      <p className="dim">the machine dreams a fox every thirty minutes. each one is born once, named, minted as an NFT, and airdropped to a random $FABLE holder — the machine keeps none of them.</p>
      <p className="dim" style={{ marginTop: 6 }}>collection: <a href={`${EXPLORER}/token/${NFT_CONTRACT}`} target="_blank" rel="noopener noreferrer">Fable Foxes (FOX) ↗</a> on Robinhood Chain</p>

      <nav className="mainnav">
        <Link href="/">back to the storybook</Link>
        <Link href="/backrooms/">the backrooms</Link>
        <Link href="/terminal/">the terminal</Link>
      </nav>

      {data && (
        <div className="statgrid">
          <div className="stat"><div className="label">foxes dreamed</div><div className="value">{data.count}</div><div className="note">one every 30 min</div></div>
          <div className="stat"><div className="label">legendary (9-tailed)</div><div className="value">{legendary}</div><div className="note">~1 in 50 born</div></div>
          <div className="stat"><div className="label">newest</div><div className="value">{foxes?.[0]?.name || '…'}</div><div className="note">{foxes?.[0]?.born?.slice(0, 16).replace('T', ' ') || ''}</div></div>
        </div>
      )}

      {foxes === null && <p className="dim">opening the den…</p>}
      {foxes && foxes.length === 0 && <p className="dim">the den is empty. the first fox is on its way.</p>}

      <div className="foxwall">
        {foxes?.map(f => (
          <figure className={'foxcard r-' + (f.rarity || 'common')} key={f.id}>
            <FableFox fox={f} size={150} />
            <figcaption>
              <div className="foxname">{f.name}</div>
              <div className="dim">no.{f.id} · {f.tails}-tailed · {f.palette}</div>
              <div className={'rar r-' + f.rarity}>{f.rarity}</div>
              {f.nft && (
                <div className="dim nftline">
                  NFT #{f.nft.tokenId} → <a href={`${EXPLORER}/address/${f.nft.owner}`} target="_blank" rel="noopener noreferrer">{shortAddr(f.nft.owner)}</a>
                  {' · '}<a href={`${EXPLORER}/tx/${f.nft.tx}`} target="_blank" rel="noopener noreferrer">tx ↗</a>
                </div>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
