'use client';
import { useEffect, useState } from 'react';
import { COIN } from '../lib/fables';

const BASE = '/fable-terminal';
const fmt = n => Math.floor(n).toLocaleString('en-US');

export function useBurnData() {
  const [data, setData] = useState({ ledger: null, liveBurned: null, holders: null });
  useEffect(() => {
    fetch(`${BASE}/burns.json`).then(r => r.json())
      .then(ledger => setData(d => ({ ...d, ledger }))).catch(() => {});
    // live: balanceOf(0xdEaD) straight from the chain — trustless, self-updating
    fetch(COIN.rpc, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{
        to: COIN.token,
        data: '0x70a08231000000000000000000000000' + COIN.dead.slice(2).toLowerCase(),
      }, 'latest'] }),
    }).then(r => r.json())
      .then(j => { if (j.result) setData(d => ({ ...d, liveBurned: Number(BigInt(j.result) / (10n ** 12n)) / 1e6 })); })
      .catch(() => {});
    fetch(`${COIN.explorer}/api/v2/tokens/${COIN.token}`).then(r => r.json())
      .then(t => { if (t.holders) setData(d => ({ ...d, holders: t.holders })); }).catch(() => {});
  }, []);
  return data;
}

export default function LiveBurns() {
  const { ledger, liveBurned, holders } = useBurnData();
  const total = liveBurned ?? (ledger ? parseFloat(ledger.totalBurnedFable) : null);
  return (
    <>
      <div className="statgrid">
        <div className="stat">
          <div className="label">in the meadow (burned)</div>
          <div className="value">{total === null ? '…' : fmt(total)}</div>
          <div className="note">{liveBurned !== null ? 'read live from 0x…dEaD' : 'from the ledger'}</div>
        </div>
        <div className="stat">
          <div className="label">% of supply burned</div>
          <div className="value">{total === null ? '…' : (total / COIN.supply * 100).toFixed(3) + '%'}</div>
          <div className="note">supply is fixed. this only rises.</div>
        </div>
        <div className="stat">
          <div className="label">holders</div>
          <div className="value">{holders === null ? '…' : fmt(parseFloat(holders))}</div>
          <div className="note">via blockscout</div>
        </div>
      </div>
      <div id="burn-entries">
        {(ledger?.entries ?? []).map((e, i) => (
          <p key={i}>
            <span className="dim">{e.date}</span>{' · claimed '}
            {fmt(parseFloat(e.claimedFable))}{' FABLE + '}{parseFloat(e.claimedEth).toFixed(3)}{' ETH in fees · '}
            <span className="flame">burned {fmt(parseFloat(e.claimedFable))} FABLE</span>{' → '}
            <a href={`${COIN.explorer}/tx/${e.txBurn}`} target="_blank" rel="noopener noreferrer">burn tx ↗</a>
          </p>
        ))}
      </div>
      <p className="dim" style={{ marginTop: 14 }}>
        the ritual runs on a schedule. no hands. the ledger writes itself.<span className="cursor" />
      </p>
    </>
  );
}
