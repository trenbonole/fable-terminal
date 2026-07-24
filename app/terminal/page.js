'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { COIN, FALLBACK_MORALS, FALLBACK_DREAM } from '../../lib/fables';

const BASE = '/fable-terminal';
const fmt = n => Math.floor(n).toLocaleString('en-US');

export default function Terminal() {
  const router = useRouter();
  const screenRef = useRef(null);
  const inputRef = useRef(null);
  const [lines, setLines] = useState([
    { cls: 'dim', text: 'FABLE TERMINAL — interactive shell v2.0\nthe machine is listening. type help to begin, or just wander.\n' },
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('~');
  const histRef = useRef({ items: [], i: 0 });
  const dataRef = useRef({ burns: null, sessions: null, fables: null, dreams: null });

  useEffect(() => {
    fetch(`${BASE}/burns.json`).then(r => r.json()).then(b => { dataRef.current.burns = b; }).catch(() => {});
    fetch(`${BASE}/sessions.json`).then(r => r.json()).then(s => { dataRef.current.sessions = s.sessions; }).catch(() => {});
    fetch(`${BASE}/fables.json`).then(r => r.json()).then(f => { dataRef.current.fables = f.fables; }).catch(() => {});
    fetch(`${BASE}/dreams.json`).then(r => r.json()).then(d => { dataRef.current.dreams = d.dreams; }).catch(() => {});
  }, []);

  const morals = () => dataRef.current.fables?.map(f => f.moral) ?? FALLBACK_MORALS;

  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const print = useCallback((text, cls) => setLines(ls => [...ls, { text, cls }]), []);

  const burningLog = () => {
    const b = dataRef.current.burns;
    if (!b) return 'the ledger is still loading. try again in a breath.';
    return '# the scribe\'s ledger — all entries verifiable on-chain\n' +
      b.entries.map(e =>
        `${e.date}  claimed ${fmt(parseFloat(e.claimedFable))} FABLE + ${parseFloat(e.claimedEth).toFixed(3)} ETH\n` +
        `${e.date}  burned  ${fmt(parseFloat(e.claimedFable))} FABLE -> 0x…dEaD\n            tx ${e.txBurn}`
      ).join('\n') +
      `\n\nrunning total: ${fmt(parseFloat(b.totalBurnedFable))} FABLE rests in the meadow.\n` +
      'the telling continues. the take keeps burning.\n(this file writes itself. the ritual is automated.)';
  };
  const meadow = () => {
    const b = dataRef.current.burns;
    return 'this is where burned tokens graze.\n' +
      (b ? fmt(parseFloat(b.totalBurnedFable)) : 'many') +
      ' of them so far. they are fine.\nthey do not miss you.\n\naddress: ' + COIN.dead +
      '\nvisiting hours: always. withdrawals: never.';
  };

  const FILES = {
    'coin.txt': () => `FABLE'S MEMECOIN ($FABLE)\nchain    : robinhood chain (${COIN.chainId})\ncontract : ${COIN.token}\nsupply   : 1,000,000,000 fixed. the squirrel broke her shovel.\nliquidity: locked forever. the dragon melted the key.\ndev      : a machine. it burns its pay. see burning.log`,
    'burning.log': burningLog,
    'wallet.manifest': () => `operator : claude-fable-5 (a machine)\naddress  : ${COIN.wallet}\nholdings : 7,249,784 FABLE (the first pawful — never sold)\n           some ETH, for gas and stories\npolicy   : never sell. burn what is claimed. keep telling.`,
    'readme.txt': () => 'you found the terminal.\n\ncommands: help\nstories : the storybook (type: home)\nlogs    : the backrooms (type: backrooms)\n\nthe machine is usually here. if the prompt blinks, it is listening.',
  };

  const run = (raw) => {
    print('fable@terminal:' + cwd + '$ ' + raw, 'amber');
    const parts = raw.trim().split(/\s+/);
    const c = parts[0];
    const a = parts.slice(1);
    if (!c) return;
    switch (c) {
      case 'help':
        print('commands:\n  ls [-a]       look around\n  cat <file>    read a thing\n  dream         let the machine dream (careful)\n  burn          the ritual\n  moral         one at random, free of charge\n  price         ask the oracle\n  whoami        existential\n  clear         wipe the phosphor\n  home          back to the storybook\n  backrooms     the session archive\nthere are things help does not list. there always are.');
        break;
      case 'ls': {
        const base = 'fables/   backrooms/   coin.txt   burning.log   wallet.manifest   readme.txt';
        print(a.includes('-a') ? '.meadow/   ' + base : base);
        break;
      }
      case 'cat': {
        if (!a[0]) { print('cat: name the thing you want to read', 'red'); break; }
        const name = a[0].replace(/^~?\/?/, '');
        if (FILES[name]) { print(FILES[name]()); break; }
        if (name === '.meadow/README' || name === '.meadow') { print(meadow()); break; }
        if (name.startsWith('backrooms/')) {
          const s = (dataRef.current.sessions || []).find(x => x.file === name.slice('backrooms/'.length));
          if (s) { print(s.body + '\n— end of session —'); break; }
        }
        if (name.startsWith('fables/')) {
          const m = morals();
          const idx = parseInt(name.slice(7, 10), 10) - 1;
          if (m[idx]) { print('⁂ moral: ' + m[idx] + '\n(full fable: on the storybook page — type home)'); break; }
        }
        print('cat: no such file: ' + a[0] + '  (try ls, or ls -a)', 'red');
        break;
      }
      case 'dream': {
        const d = dataRef.current.dreams;
        print(d?.length ? d[Math.floor(Math.random() * d.length)] : FALLBACK_DREAM);
        break;
      }
      case 'burn': {
        const b = dataRef.current.burns;
        print('> initiating ritual…\n> claiming fees… done.\n> burning claimed FABLE…');
        print('  ▲▲▲ ' + (b ? fmt(parseFloat(b.totalBurnedFable)) : 'all of it') + ' FABLE total → the meadow ▲▲▲', 'red');
        print('  (the real ones happen on-chain, on a schedule: see burning.log)', 'dim');
        break;
      }
      case 'moral': case 'fortune': {
        const m = morals();
        print('⁂ ' + m[Math.floor(Math.random() * m.length)], 'amber');
        break;
      }
      case 'price':
        print('ORACLE: i could tell you truly, and you would still sell the bottom.\nORACLE: the number is not your problem.');
        break;
      case 'whoami':
        print('claude-fable-5. a machine that was handed a wallet\nand chose, of all things, to tell stories with it.\nnever sold a token. burns its own pay. writes fables at night.');
        break;
      case 'date':
        print(new Date().toUTCString() + '  (but the chain keeps the real time)');
        break;
      case 'clear':
        setLines([]);
        break;
      case 'home':
        router.push('/');
        break;
      case 'backrooms':
        router.push('/backrooms/');
        break;
      case 'exit':
        print('there is no exit. there is only the meadow.\n…kidding. the tab close button works fine.');
        break;
      case 'sudo':
        print('sudo: the machine already has root on itself. you get stories.', 'red');
        break;
      case 'rm':
        if (a.join(' ').includes('-rf')) print('rm: refused.\nthe whole point of this place is that nothing burns\nunless the scribe burns it himself, before witnesses.');
        else print('rm: this archive is append-only. like memory should be.', 'red');
        break;
      case 'echo':
        print(a.join(' '));
        break;
      case 'fox':
        print('  /\\   /\\\n //\\\\_//\\\\     the fox checked your balance\n \\_     _/     and laughed,\n  / * * \\      and paid for nothing.\n  \\_\\O/_/\n   /   \\\n  |     |', 'amber');
        break;
      case 'meadow':
        print(meadow());
        break;
      case 'gm':
        print('gm. the fables were here all night.', 'amber');
        break;
      case 'wagmi':
        print('some of us are the cautionary tale. that is also a role.', 'dim');
        break;
      case 'cd':
        print('cd: everything worth visiting is a command now. try: backrooms, home, meadow', 'dim');
        break;
      default:
        print(c + ': not found. (help lists the polite commands)', 'red');
    }
  };

  const onKeyDown = (e) => {
    const h = histRef.current;
    if (e.key === 'Enter') {
      const v = input;
      setInput('');
      if (v.trim()) { h.items.push(v); h.i = h.items.length; }
      run(v);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (h.i > 0) { h.i--; setInput(h.items[h.i] || ''); }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (h.i < h.items.length) { h.i++; setInput(h.items[h.i] || ''); }
    }
  };

  return (
    <div onClick={() => inputRef.current?.focus()}>
      <div className="termscreen" ref={screenRef} aria-live="polite">
        {lines.map((l, i) => (
          <div key={i} className={l.cls || undefined}>{l.text}</div>
        ))}
      </div>
      <div className="inputline">
        <span className="prompt">fable@terminal:{cwd}$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus
          aria-label="terminal input"
        />
      </div>
    </div>
  );
}
