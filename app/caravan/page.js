'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BrowserProvider } from 'ethers';
import { CHAIN, STOCKS, BASKETS, ADDR, quoteBasket, buyBasket, getPrices } from '../../lib/caravan';

const short = a => a ? a.slice(0, 6) + '…' + a.slice(-4) : '';

export default function Caravan() {
  const [account, setAccount] = useState(null);
  const [chainOk, setChainOk] = useState(false);
  const [basket, setBasket] = useState(BASKETS[0]);
  const [eth, setEth] = useState('0.01');
  const [slippage, setSlippage] = useState(5);
  const [quotes, setQuotes] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [err, setErr] = useState('');
  const [prices, setPrices] = useState(null);

  useEffect(() => {
    let live = true;
    const load = () => getPrices().then(p => { if (live) setPrices(p); }).catch(() => {});
    load();
    const iv = setInterval(load, 30000);
    return () => { live = false; clearInterval(iv); };
  }, []);

  const hasWallet = typeof window !== 'undefined' && window.ethereum;

  const ensureChain = async () => {
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN.hex }] });
      setChainOk(true);
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{ chainId: CHAIN.hex, chainName: CHAIN.name, rpcUrls: [CHAIN.rpc], nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, blockExplorerUrls: [CHAIN.explorer] }],
        });
        setChainOk(true);
      } else { throw e; }
    }
  };

  const connect = async () => {
    setErr('');
    try {
      if (!window.ethereum) { setErr('no wallet found — install MetaMask or a Robinhood Chain-compatible wallet.'); return; }
      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      await ensureChain();
      const signer = await provider.getSigner();
      setAccount(await signer.getAddress());
    } catch (e) { setErr(e.shortMessage || e.message || String(e)); }
  };

  const refreshQuote = useCallback(async () => {
    const n = parseFloat(eth);
    if (!n || n <= 0) { setQuotes(null); return; }
    setQuoting(true);
    try { setQuotes(await quoteBasket(basket, eth)); } catch { setQuotes(null); }
    setQuoting(false);
  }, [basket, eth]);

  useEffect(() => { const t = setTimeout(refreshQuote, 400); return () => clearTimeout(t); }, [refreshQuote]);

  const buy = async () => {
    setErr(''); setTxHash(''); setStatus('');
    try {
      const provider = new BrowserProvider(window.ethereum);
      await ensureChain();
      const signer = await provider.getSigner();
      const user = await signer.getAddress();
      const q = quotes || await quoteBasket(basket, eth);
      const hash = await buyBasket({ signer, user, basket, ethAmount: eth, slippagePct: slippage, quotes: q, onStep: setStatus });
      setTxHash(hash); setStatus('caravan delivered ✓');
    } catch (e) { setErr(e.shortMessage || e.reason || e.message || String(e)); setStatus(''); }
  };

  return (
    <div className="wrap caravan">
      <h1>~/caravan-market</h1>
      <p className="dim">the tokenized-stock caravans pass through the machine&apos;s village. buy a themed crate in one click — the real stock tokens land in your own wallet. no custody, no house, no fee. just a swap on Uniswap V3.</p>

      <nav className="mainnav">
        <Link href="/">back to the storybook</Link>
        <Link href="/den/">the den</Link>
        <a href={`${CHAIN.explorer}/token/${ADDR.USDG}`} target="_blank" rel="noopener noreferrer">USDG ↗</a>
      </nav>

      <div className="cvticker">
        {prices
          ? Object.keys(STOCKS).map(sym => (
            <span key={sym} className="cvtick">
              <span className="amber">{sym}</span>{' '}
              <span className="paper">{prices[sym] != null ? '$' + prices[sym].toFixed(2) : '—'}</span>
            </span>))
          : <span className="dim">reading the caravans…</span>}
        <span className="dim cvticknote">· live from Uniswap V3 · updates every 30s</span>
      </div>

      <div className="cvbar">
        {account
          ? <span className="dim">connected: <span className="paper">{short(account)}</span> on {CHAIN.name}</span>
          : <button className="cvbtn" onClick={connect}>connect wallet</button>}
      </div>

      <div className="cvgrid">
        {BASKETS.map(b => (
          <button key={b.id} className={'cvcard' + (basket.id === b.id ? ' sel' : '')} onClick={() => setBasket(b)}>
            <div className="cvname">{b.name}</div>
            <div className="dim">{b.blurb}</div>
            <div className="cvlegs">
              {b.legs.map(([sym, w]) => <span key={sym}>{sym} {Math.round(w * 100)}%</span>)}
            </div>
          </button>
        ))}
      </div>

      <div className="cvpanel">
        <div className="cvrow">
          <label>spend</label>
          <input value={eth} onChange={e => setEth(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" />
          <span className="dim">ETH</span>
        </div>
        <div className="cvrow">
          <label>max slippage</label>
          <input type="range" min="1" max="15" value={slippage} onChange={e => setSlippage(+e.target.value)} />
          <span className="dim">{slippage}%</span>
        </div>

        <div className="cvquote">
          <div className="dim">you receive (est.):</div>
          {quoting && <div className="dim">reading the caravans…</div>}
          {!quoting && quotes && quotes.map(q => (
            <div key={q.sym} className="cvqline">
              <span className="amber">{q.sym}</span>
              <span className="paper">{Number(q.shares).toPrecision(4)}</span>
              <span className="dim">tokens · {STOCKS[q.sym].name}</span>
            </div>
          ))}
          {!quoting && !quotes && <div className="dim">enter an amount above.</div>}
        </div>

        {account
          ? <button className="cvbtn buy" onClick={buy} disabled={!quotes}>buy {basket.name}</button>
          : <button className="cvbtn buy" onClick={connect}>connect wallet to buy</button>}

        {status && <div className="cvstatus amber">{status}</div>}
        {txHash && <div className="cvstatus"><a href={`${CHAIN.explorer}/tx/${txHash}`} target="_blank" rel="noopener noreferrer">view transaction ↗</a></div>}
        {err && <div className="cvstatus red">{err}</div>}
      </div>

      <div className="warning" style={{ marginTop: 40 }}>
        <strong>how this works:</strong> your wallet wraps ETH to WETH and swaps it, per the basket&apos;s weights, into the real tokenized-stock ERC-20s (routed ETH→USDG→stock on Uniswap V3). The tokens are delivered to <em>your</em> wallet — you hold them directly and can sell them anywhere, anytime. This page issues nothing, holds nothing, and takes no fee; it is just a themed front-end over public on-chain markets.
        <br /><br />
        Tokenized stocks track real equities and their prices move — you can lose money. Nothing here is investment advice, and this is not affiliated with Anthropic, Robinhood Markets, or the stocks referenced. Availability of tokenized stocks may be restricted in your jurisdiction; only proceed if it is lawful for you.
      </div>
    </div>
  );
}
