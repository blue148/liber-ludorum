// Normalizes the long tail of BGG mechanic/category strings into a small,
// curated set of "parent" game types that are useful as a filter facet.
//
// Single source of truth shared by:
//   - the `bgg-lookup` edge function (runs for every newly added game)
//   - the `normalize-game-types` backfill script (existing rows)
//
// The normalized labels are written to `shared_games.game_type[]`. Raw BGG data
// stays in `game_mechanic[]` / `game_category[]`.
//
// Plain TypeScript with no imports so it loads cleanly under both Deno (edge
// function) and Node/tsx (backfill script).

export interface ParentCategory {
  value: string;
  label: string;
}

/** The 18 curated parent game types, in canonical display order. */
export const PARENT_CATEGORIES: ParentCategory[] = [
  { value: 'worker-placement', label: 'Worker Placement' },
  { value: 'engine-building', label: 'Engine Building' },
  { value: 'auction-bidding', label: 'Auction / Bidding' },
  { value: 'trading-negotiation', label: 'Trading / Negotiation' },
  { value: 'deck-building', label: 'Deck Building' },
  { value: 'hand-management', label: 'Hand Management' },
  { value: 'drafting', label: 'Drafting' },
  { value: 'trick-taking', label: 'Trick-Taking' },
  { value: 'set-collection', label: 'Set Collection' },
  { value: 'area-control', label: 'Area Control / Majority' },
  { value: 'tile-placement', label: 'Tile Placement' },
  { value: 'route-building', label: 'Route / Network Building' },
  { value: 'dice-rolling', label: 'Dice Rolling / Placement' },
  { value: 'push-your-luck', label: 'Push Your Luck' },
  { value: 'action-points', label: 'Action Point Allowance' },
  { value: 'roll-and-write', label: 'Roll-and-Write' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'hidden-role', label: 'Hidden Role / Deduction' },
];

const VALUE_TO_LABEL: Record<string, string> = Object.fromEntries(
  PARENT_CATEGORIES.map((c) => [c.value, c.label]),
);
const PARENT_ORDER: Record<string, number> = Object.fromEntries(
  PARENT_CATEGORIES.map((c, i) => [c.value, i]),
);

/** Look up the display label for a parent value (e.g. 'drafting' -> 'Drafting'). */
export function labelForParent(value: string): string | undefined {
  return VALUE_TO_LABEL[value];
}

// Exact BGG `boardgamemechanic` link value -> parent value.
// Keys are matched case-insensitively and after light punctuation/space
// normalization (see `canon`), so minor BGG formatting drift still maps.
const MECHANIC_TO_PARENT: Record<string, string> = {
  // worker-placement
  'worker placement': 'worker-placement',
  'worker placement different worker types': 'worker-placement',
  'worker placement with dice workers': 'worker-placement',

  // engine-building
  'engine building': 'engine-building',
  'tableau building': 'engine-building',
  'income': 'engine-building',
  'tech trees tech tracks': 'engine-building',

  // auction-bidding (most "Auction*" handled by prefix rule below too)
  'auction bidding': 'auction-bidding',
  'auction': 'auction-bidding',
  'closed economy auction': 'auction-bidding',
  'constrained bidding': 'auction-bidding',
  'selection order bid': 'auction-bidding',
  'bids as wagers': 'auction-bidding',

  // trading-negotiation
  'trading': 'trading-negotiation',
  'trade': 'trading-negotiation',
  'negotiation': 'trading-negotiation',
  'bribery': 'trading-negotiation',

  // deck-building
  'deck bag and pool building': 'deck-building',
  'deck construction': 'deck-building',
  'deck building': 'deck-building',
  'deckbuilding': 'deck-building',

  // hand-management
  'hand management': 'hand-management',

  // drafting (most "*Drafting" handled by substring rule below too)
  'open drafting': 'drafting',
  'closed drafting': 'drafting',
  'card drafting': 'drafting',
  'action drafting': 'drafting',
  'drafting': 'drafting',

  // trick-taking
  'trick taking': 'trick-taking',
  'predictive bid': 'trick-taking',

  // set-collection
  'set collection': 'set-collection',
  'melding and splaying': 'set-collection',

  // area-control
  'area majority influence': 'area-control',
  'area control': 'area-control',
  'enclosure': 'area-control',
  'king of the hill': 'area-control',

  // tile-placement
  'tile placement': 'tile-placement',
  'grid coverage': 'tile-placement',
  'polyomino': 'tile-placement',

  // route-building
  'network and route building': 'route-building',
  'route network building': 'route-building',
  'connections': 'route-building',

  // dice-rolling / placement
  'dice rolling': 'dice-rolling',
  'die icon resolution': 'dice-rolling',
  're rolling and locking': 'dice-rolling',
  'different dice movement': 'dice-rolling',
  'roll spin and move': 'dice-rolling',
  'dice placement': 'dice-rolling',

  // push-your-luck
  'push your luck': 'push-your-luck',

  // action-points
  'action points': 'action-points',
  'action point allowance system': 'action-points',

  // roll-and-write
  'roll and write': 'roll-and-write',
  'flip and write': 'roll-and-write',
  'paper and pencil': 'roll-and-write',

  // cooperative
  'cooperative game': 'cooperative',
  'semi cooperative game': 'cooperative',

  // hidden-role / deduction
  'hidden roles': 'hidden-role',
  'traitor game': 'hidden-role',
  'deduction': 'hidden-role',
  'induction': 'hidden-role',
  'roles with asymmetric information': 'hidden-role',
  'hidden movement': 'hidden-role',
};

// A few BGG `boardgamecategory` values carry game-type signal that the
// mechanic links miss. Kept deliberately small to avoid false positives.
const CATEGORY_TO_PARENT: Record<string, string> = {
  'deduction': 'hidden-role',
  'bluffing': 'hidden-role',
  'negotiation': 'trading-negotiation',
};

// Lowercase, strip HTML entities, collapse punctuation/whitespace so that
// "Re-rolling and Locking", "Auction/Bidding", "Tech Trees / Tech Tracks" etc.
// reduce to stable dictionary keys.
function canon(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&amp;/g, ' ')
    .replace(/&#0?39;|&rsquo;|&lsquo;/g, "'")
    .replace(/[^a-z0-9']+/g, ' ')
    .replace(/'/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function classifyMechanic(raw: string): string | undefined {
  const key = canon(raw);
  if (MECHANIC_TO_PARENT[key]) return MECHANIC_TO_PARENT[key];
  // Prefix / substring fallbacks for BGG's many sub-variants.
  if (key.startsWith('auction')) return 'auction-bidding';
  if (key.startsWith('worker placement')) return 'worker-placement';
  if (key.includes('drafting')) return 'drafting';
  if (key.includes('roll and write') || key.includes('flip and write')) {
    return 'roll-and-write';
  }
  if (key.includes('trick taking')) return 'trick-taking';
  return undefined;
}

/**
 * Maps raw BGG mechanics + categories to the curated parent game-type labels.
 *
 * Returns deduplicated parent **labels** (e.g. "Worker Placement"), ordered to
 * match {@link PARENT_CATEGORIES}, suitable for writing straight into
 * `shared_games.game_type[]` and rendering in the existing filter chips.
 */
export function normalizeGameTypes(
  mechanics: readonly string[] | null | undefined,
  categories: readonly string[] | null | undefined = [],
): string[] {
  const parents = new Set<string>();

  for (const m of mechanics ?? []) {
    const p = classifyMechanic(m);
    if (p) parents.add(p);
  }
  for (const c of categories ?? []) {
    const p = CATEGORY_TO_PARENT[canon(c)];
    if (p) parents.add(p);
  }

  return [...parents]
    .sort((a, b) => PARENT_ORDER[a] - PARENT_ORDER[b])
    .map((v) => VALUE_TO_LABEL[v]);
}
