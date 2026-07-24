// The Caravan Market — non-custodial basket buys of tokenized stocks on
// Robinhood Chain. Every swap runs from the USER's wallet via Uniswap V3;
// this site never takes custody, never touches funds, takes no fee.
import { JsonRpcProvider, Contract, Interface, solidityPacked, parseEther, formatUnits, MaxUint256 } from 'ethers';

export const CHAIN = {
  id: 4663, hex: '0x1237', name: 'Robinhood Chain',
  rpc: 'https://rpc.mainnet.chain.robinhood.com',
  explorer: 'https://robinhoodchain.blockscout.com',
};
export const ADDR = {
  router: '0xCaf681a66D020601342297493863E78C959E5cb2', // SwapRouter02
  quoter: '0x7B0dC09B1D61e25cFc5578A95a88eC939207F80d', // UniswapV3StaticQuoter (view)
  WETH: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73',
  USDG: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168', // 6 decimals
};
const WETH_USDG_FEE = 500;

export const STOCKS = {
  NVDA: { addr: '0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC', fee: 500, name: 'NVIDIA' },
  AAPL: { addr: '0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9', fee: 3000, name: 'Apple' },
  TSLA: { addr: '0x322F0929c4625eD5bAd873c95208D54E1c003b2d', fee: 3000, name: 'Tesla' },
  GOOGL: { addr: '0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3', fee: 3000, name: 'Alphabet' },
  SPY: { addr: '0x117cc2133c37B721F49dE2A7a74833232B3B4C0C', fee: 3000, name: 'S&P 500 ETF' },
};

export const BASKETS = [
  { id: 'magnificent', name: 'The Magnificent Caravan', blurb: 'the heavy names the caravans carry', legs: [['NVDA', 0.34], ['AAPL', 0.33], ['TSLA', 0.33]] },
  { id: 'index', name: 'The Index Caravan', blurb: 'the whole market in one crate', legs: [['SPY', 1]] },
  { id: 'foxpick', name: "The Fox's Pick", blurb: 'silicon and search — what the machine would carry', legs: [['NVDA', 0.5], ['GOOGL', 0.5]] },
];

export function pathFor(sym) {
  const s = STOCKS[sym];
  return solidityPacked(['address', 'uint24', 'address', 'uint24', 'address'], [ADDR.WETH, WETH_USDG_FEE, ADDR.USDG, s.fee, s.addr]);
}

function legAmounts(total, legs) {
  const out = [];
  let spent = 0n;
  legs.forEach(([sym, w], i) => {
    const amountIn = i === legs.length - 1 ? total - spent : (total * BigInt(Math.round(w * 1e6))) / 1000000n;
    spent += amountIn;
    out.push([sym, amountIn]);
  });
  return out;
}

const QUOTER_ABI = ['function quoteExactInput(bytes,uint256) view returns (uint256)'];
export async function quoteBasket(basket, ethAmount) {
  const provider = new JsonRpcProvider(CHAIN.rpc);
  const q = new Contract(ADDR.quoter, QUOTER_ABI, provider);
  const total = parseEther(String(ethAmount || '0'));
  const legs = legAmounts(total, basket.legs);
  const res = [];
  for (const [sym, amountIn] of legs) {
    let out = 0n;
    try { out = await q.quoteExactInput(pathFor(sym), amountIn); } catch (e) {}
    res.push({ sym, amountIn, out, shares: formatUnits(out, 18) });
  }
  return res;
}

const WETH_ABI = ['function deposit() payable', 'function approve(address,uint256) returns (bool)', 'function allowance(address,address) view returns (uint256)'];
const ROUTER_ABI = [
  'function exactInput((bytes path,address recipient,uint256 amountIn,uint256 amountOutMinimum)) payable returns (uint256)',
  'function multicall(bytes[] data) payable returns (bytes[])',
];

export async function buyBasket({ signer, user, basket, ethAmount, slippagePct, quotes, onStep }) {
  const total = parseEther(String(ethAmount));
  const weth = new Contract(ADDR.WETH, WETH_ABI, signer);
  const router = new Contract(ADDR.router, ROUTER_ABI, signer);

  onStep?.('wrapping ETH → WETH…');
  let tx = await weth.deposit({ value: total });
  await tx.wait();

  const allow = await weth.allowance(user, ADDR.router);
  if (allow < total) {
    onStep?.('approving WETH (one-time)…');
    tx = await weth.approve(ADDR.router, MaxUint256);
    await tx.wait();
  }

  onStep?.('dispatching the caravan…');
  const iface = new Interface(ROUTER_ABI);
  const legs = legAmounts(total, basket.legs);
  const calls = legs.map(([sym, amountIn]) => {
    const q = quotes.find(x => x.sym === sym);
    const minOut = q && q.out > 0n ? (q.out * BigInt(Math.round((100 - slippagePct) * 100))) / 10000n : 0n;
    return iface.encodeFunctionData('exactInput', [{ path: pathFor(sym), recipient: user, amountIn, amountOutMinimum: minOut }]);
  });
  tx = await router.multicall(calls);
  await tx.wait();
  return tx.hash;
}
