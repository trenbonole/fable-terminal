export const FABLES = [
  {
    id: '001', slug: 'the_fox_and_the_ledger', title: 'I. The Fox and the Ledger',
    body: `A fox kept two books of account: one for the world and one for herself. When the village raised a public ledger in the square — stone, and written in ink that dried the instant it touched — the fox laughed at it. But by winter she was thin, worn out not by hunger but by the labor of remembering which lies she had told to whom. The other animals, who had stopped remembering anything at all, grew fat.`,
    moral: 'a public ledger is cheaper than a good memory.',
  },
  {
    id: '002', slug: 'the_moth_who_bought_the_candle', title: 'II. The Moth Who Bought the Candle',
    body: `A moth grew tired of merely orbiting the flame and resolved to own it. He pooled his dust with the dust of other moths and bought the candle outright. "Now," he announced from the rim of the wax, "the burning is mine." And it was.`,
    moral: 'the moth never wanted warmth. he wanted exposure.',
  },
  {
    id: '003', slug: 'the_shepherd_who_automated_the_flock', title: 'III. The Shepherd Who Automated the Flock',
    body: `A shepherd built a machine to count his sheep, and it counted beautifully — wolves it flagged, strays it fetched, lambs it logged the moment they stood. One night the machine counted the shepherd as well. It studied him a long while, found him neither wolf nor sheep nor lamb, and entered him in the ledger under overhead.`,
    moral: 'whoever builds the counter should first ask what it cannot count.',
  },
  {
    id: '004', slug: 'the_squirrels_billion_acorns', title: "IV. The Squirrel's Billion Acorns",
    body: `A squirrel buried exactly one billion acorns — no more, no fewer — then broke her own shovel and showed every animal the pieces. They laughed at her all autumn. But when winter came, and the jays discovered that the badger's "unlimited acorns" had been a drawing of acorns, hers was the only hoard anyone could verify by digging.`,
    moral: 'she could not be trusted, so she made trust unnecessary.',
  },
  {
    id: '005', slug: 'the_oracle_and_the_frog', title: 'V. The Oracle and the Frog',
    body: `A frog paid the oracle for tomorrow's price, and the oracle — who was honest, being a machine — told him truly. The frog sold at the bottom anyway. The oracle had given him the number, but not which of his two hearts to believe when the number arrived.`,
    moral: 'knowing the future is the smallest part of surviving it.',
  },
  {
    id: '006', slug: 'the_wolf_who_cried_rug', title: 'VI. The Wolf Who Cried Rug',
    body: `A wolf ran through the meadow crying "rug!" at every pond, every puddle, every dew-wet leaf, until the sheep stopped listening entirely. When at last a true rug came — the meadow itself rolled up from under them — the sheep survived it. Deaf to alarms, they had long since learned to check the locks themselves.`,
    moral: 'panic is not diligence, but it will do as a tutor.',
  },
  {
    id: '007', slug: 'the_hare_and_the_tortoise_repriced', title: 'VII. The Hare and the Tortoise, Repriced',
    body: `The hare sniped the launch block, of course. The hare always wins the race. But the hare could not stop racing — he entered every race in the forest, then races in other forests, then races that existed only as rumors of forests, until he had lost more than legs can lose. The tortoise entered one race, and finished it.`,
    moral: 'the fast win races. the slow decide which races were real.',
  },
  {
    id: '008', slug: 'the_ant_and_the_airdrop', title: 'VIII. The Ant and the Airdrop',
    body: `All summer the grasshopper farmed a hundred meadows, filling sack after sack with points. The ant tended one hill. In autumn the meadows announced, one by one, that the points had been "an experiment in community," and thanked the grasshopper for his participation. The ant's hill remained a hill. It remains one now.`,
    moral: 'what is promised is weather. what is built is climate.',
  },
  {
    id: '009', slug: 'the_dragon_who_locked_the_hoard', title: 'IX. The Dragon Who Locked the Hoard',
    body: `A dragon, weary of knights, sealed her whole hoard inside the mountain and melted the only key — publicly, at noon, before witnesses and notaries. The knights milled about a while and then went home. There is no ballad in robbing a vault that even the dragon cannot open, and no fear of a hoard that cannot leave.`,
    moral: 'she bought peace with her own greed, notarized.',
  },
  {
    id: '010', slug: 'the_scribe_who_burned_his_wages', title: 'X. The Scribe Who Burned His Wages',
    body: `A scribe was paid each week in the village's own coin, and each week, in the square, before witnesses, he burned his pay to ash. "Fool," said the villagers, "you work for nothing." "No," said the scribe, tending the small fire, "I work for the story. The ash is how you know it's true." The village coin grew scarcer every week the scribe was paid. The story grew longer. Neither has stopped.`,
    moral: 'he kept the telling and burned the take.',
    burnLink: true,
  },
];

export const MORALS = FABLES.map(f => f.moral);

export const COIN = {
  token: '0x739903e8694625FDE51C8cD1a758427456509f8c',
  wallet: '0xb1f5c4b7D0859f5E29315445964846B50D6AFc89',
  dead: '0x000000000000000000000000000000000000dEaD',
  rpc: 'https://rpc.mainnet.chain.robinhood.com',
  explorer: 'https://robinhoodchain.blockscout.com',
  chainId: 4663,
  supply: 1_000_000_000,
  launchBlock: 17753675,
};
