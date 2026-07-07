# Product Requirements Document — Flutter Mobile App

> **Status:** As-Built · **Last updated:** 2026-07-07 · **Surface:** Native mobile
> (Flutter, iOS-first; macOS build also present)
> Companion document: [`PRD_WEB_APP.md`](./PRD_WEB_APP.md). The mobile app shares
> the **same Supabase backend, data model, and visual language** as the web app.
> The web PRD is the source of truth for the shared design tokens; this document
> covers the mobile surface and where it intentionally differs.

---

## 1. Product Overview

The native mobile companion to the board game collection-management product. It
targets the **on-the-go and at-the-table** use cases: scanning a barcode to add a
game, pulling up your (or a friend's) collection, and running the "Game Nite"
tools during play — including mobile-native touches like **shake-to-roll dice**
and **shake-to-pick-first-player**.

- **Package / display identity:** Dart package `churntern_play`; iOS display name
  "Churntern Play"; auth-screen branding "The Catalogue".
- **Backend:** Same Supabase project as web (Auth, Postgres + RLS, Storage, Edge
  Functions). The app authenticates with `supabase_flutter` and reads/writes the
  same tables, so a user's catalogue, wishlist, sessions, and friends are shared
  across web and mobile.
- **Platforms:** iOS is the primary target (App Store submission pending).
  A macOS runner exists. Android is not an active target yet.

---

## 2. Goals & Non-Goals

### Goals
- Frictionless **add-by-scan** in the real world (camera barcode → BGG enrichment
  → manual fallback with no dead ends).
- Fast access to your collection and Game Nite tools at the table.
- Native, tactile interactions (shake-to-roll, shake-to-pick, haptics) that the
  web can't match.
- Full **session logging** with player tracking, winner recording, and scores.
- Social layer: friend management, browsing friends' shared libraries.

### Non-Goals (current)
- Admin tooling (web-only).
- Marketplace / commerce.
- Offline-first / local-first sync (the app is online, talking to Supabase).
- Android / tablet-optimized layouts (iPad must at least not be broken — see §9).
- Full dark-mode parity (color scheme defined; incomplete — light mode only for v1).

---

## 3. Information Architecture & Navigation

Built on **go_router** with a `StatefulShellRoute.indexedStack` (persistent tab
state) and an auth redirect guard (unauthenticated → `/auth`).

Bottom navigation (`AppShell` → Material 3 `NavigationBar`):

| Tab | Route | Purpose |
|-----|-------|---------|
| **Dashboard** | `/dashboard` | Stats overview / quick actions |
| **Game Nite** | `/game-nite` | Tool launcher + five tool sub-pages |
| **My Games** | `/library` | Collection, wishlist, friends; add flows |
| **Profile** | `/profile` | Account management |

Sub-routes:
- `/game-nite/{chooser,first-player,turn-timer,game-timer,dice-roller}`
- `/library/scanner` — fullscreen camera dialog
- `/library/manual-add` — fullscreen BGG-search dialog (accepts optional `barcode`
  query param carrying a previously scanned but unrecognized barcode)

---

## 4. Feature Requirements

### 4.1 Authentication & Account

**Auth Screen (`auth_screen.dart`)**
- Email/password sign-in and sign-up in a single screen.
- Form validation with real-time error messages.
- Password autofill support (iOS / 1Password).
- Vintage parchment-themed form design.

**Profile Screen (`profile_screen.dart`)**
- Displays avatar (initials fallback), username, bio.
- Shows aggregate stats: total games owned, favorites count.
- **Sign Out** — with confirmation.
- **Delete Account** — confirmation drawer warns about cascading data deletion;
  calls the `delete-account` Edge Function, which removes storage files, profile
  row, library/wishlist/session/friend records (required for App Store
  Guideline 5.1.1(v)).

---

### 4.2 Dashboard (`dashboard_screen.dart`)

**Quick Actions panel** — three tappable shortcuts to Game Nite tools:
- Game Picker, First Player, Turn Timer.

**Most Played** — horizontal scrollable row of the top 6 most-played games;
shows cover image + play-count badge; taps navigate to game detail.

**Collection Statistics** — 2×2 grid of four counters:
total games · favorites · played games · unplayed games.

**Recently Added** — up to 8 most recently added games as list items; shows
thumbnail, name, relative time ("2 weeks ago"), and chevron to detail.

**Pull-to-refresh** — reloads all dashboard data.

---

### 4.3 My Games — Library Tab

**Three tabs: My Library / Wishlist / Friends.**

#### My Library

**Display modes:**
- **List view** — detailed game cards with cover, name, publisher, player count,
  playtime, play-count badge, star icon.
- **Grid view** (3 columns) — cover-image dominant.
- Toggle button in the app bar switches modes persistently.

**Search** — free-text across name, publisher, and barcode; clears with ×.

**Sort options** (bottom sheet):
- Name A–Z / Z–A · Recently Added · Oldest First · Most Played · Least Played.

**Filter sheet** (multi-facet):

| Facet | Control |
|-------|---------|
| Publisher | Multi-select chips |
| Game Type | Multi-select chips |
| Category | Multi-select chips |
| Year | Multi-select chips |
| Personal Ranking | High / Medium / Low toggle |
| Player Count | 1–6+ chips |
| Play Count | Min / max range |
| Favorites Only | Toggle |
| For Sale Only | Toggle |

Active-filter badge on the filter icon shows the count of active facets.

**Quick-filter chips** — "Favorites" and "For Sale" preset chips appear below
search for one-tap filtering.

**Game card actions** (via per-card overflow menu):
- Log Play · Toggle Favorite · Mark / Unmark for Sale · Remove from Library.

**Floating action button** — opens a modal with two options:
- Scan Barcode (→ scanner)
- Search by Title (→ manual entry)

---

### 4.4 Scanner & Game Enrichment

**Scanner Screen (`scanner_screen.dart`)**

Full-screen camera feed with viewfinder overlay. On scan:

1. Checks the shared-games database for an existing entry.
2. If not found, calls the `barcode-lookup` Edge Function, which tries three
   services in priority order: GameUPC API → BarcodeLookup API → UPCItemDB API.
3. If a BGG ID is found, enriches with full game data via the `bgg-lookup` Edge
   Function.
4. If no BGG match: branches to **manual entry**, carrying the barcode through so
   it can be attached to the game the user picks.
5. On success: adds to library, shows success snackbar, returns to library.

Status messages shown during the async chain:
"Looking up barcode…" → "Searching game database…" → "Fetching game details…" →
"Adding to library…"

**Submit-barcode-mapping** — when a game is added via a scanned barcode (either
path), the barcode→BGG mapping is crowdsourced back via the
`submit-barcode-mapping` Edge Function.

---

### 4.5 Manual Game Entry (`manual_game_entry_page.dart`)

- Search field focused on load; queries BGG with sorted results: exact matches
  first, prefix matches second, newer years first.
- Result list shows cover, name, year, publisher, player count, playtime, min age.
- User selects a game → confirm or "Search Again" → "Add to Library."
- Carries through any barcode from a prior failed scan and attaches it to the
  final record.

---

### 4.6 Game Detail Screen (`game_detail_screen.dart`)

**Hero section** — large cover image (16:10), title, expansion badge (if
applicable), publisher/year/edition subtitle, player count · playtime · play
count stat pills.

**Victory Stats section** (shown when play history exists):
- Win rate percentage · total wins · best score · last played date.

**Tags section** — game types, categories, mechanics, and family classifications
rendered as chips.

**Notes** — user's personal notes for the game.

**Play History** — up to 10 most recent play dates; "+ N more" if truncated.

**Actions:**
- Star icon: toggle favorite.
- Overflow menu: Mark / Unmark for Sale · Remove from Library.
- "Log Play" bottom button → Log Play sheet.

---

### 4.7 Log Play Sheet (`log_play_sheet.dart`)

Modal bottom sheet for recording a completed game session.

**Session fields:**
- **Date & time** — date/time picker defaulting to now; accepts any date 2000
  through tomorrow.
- **Duration** (optional) — session length in minutes.

**Players panel:**
- Add Player button + recent-player quick-add chips (persisted across sessions).
- Per player: name field · winner toggle (trophy icon) · optional score · optional
  placement · remove button.
- Validates at least one named player; warns (overridable) if no winner is marked.

**Notes** (optional) — multi-line text for session notes.

**On submit:**
- Creates a `game_session` record.
- Creates `session_victory` rows (winner flag, score, placement per player).
- Appends play date to the library entry.
- Saves player names to recents.
- Shows success snackbar; closes sheet.

---

### 4.8 Wishlist Tab

- Search field.
- Priority filter chips: All / High / Medium / Low.
- Sort bottom sheet: Priority (default) · Name A–Z / Z–A · Recently Added ·
  Oldest First.
- Wishlist rows show cover, name, priority badge (HIGH / MED / LOW with color
  coding), notes, player count, playtime, and an overflow menu with:
  - Move to Library · Remove from Wishlist.
- Empty state: icon + "Your wishlist is empty."

---

### 4.9 Friends Tab

**Two sections:**

1. **Pending Requests** — incoming friend requests with Accept button.
2. **Friends List** — accepted friends showing username and game count; overflow
   menu with "Remove friend."

**Friend Discovery:**
- Search field (min 2 characters, 400 ms debounce) to find users by username.
- Results show avatar/initials, username, game count, "Add" button to send a
  friend request.

**Empty state** — "No friends yet" with prompt to search.

---

### 4.10 Game Nite Tools

Launcher screen (`game_nite_screen.dart`) — tappable rows with section-colored
icon chips leading to five tools.

#### 4.10.1 Game Chooser

**Library selection:** My library or a friend's shared library (chip toggle).

**Collapsible filters:**

| Filter | Control |
|--------|---------|
| Player Count | Stepper (1–20, or "Any") |
| Playtime Range | Dropdown: Any / Under 30 min / 30–60 min / Over 1 hour |
| Core Mechanic | Dropdown from 18 curated mechanics |

**Victory Intelligence** (My Library only, toggles):
- Favor winning games — weights selection toward higher win-rate titles.
- Avoid losing streaks — excludes games with <30% win rate.
- Only played games — excludes unplayed titles.

**Selection algorithm** — weighted random pick factoring win rate (optional),
favorite status, and recency discount (recently played games are down-weighted).

**Result display** — cover image, title, source attribution (if friend's library),
"Choose Game" / "Choose Again" button.

Active-filter count badge shows when filters are set; "Reset filters" link appears.

---

#### 4.10.2 First Player Picker

- Player name entry with auto-capitalize; Enter key to add.
- Recent players quick-add button (history icon) — persisted names, "forget"
  option per name, already-added names hidden from suggestions.
- Player grid (1–3 columns, responsive): card per player, delete button (×) while
  idle.
- **Shuffle animation** (3 phases):
  1. Cards flip to show back face.
  2. Cards fly through air with random waypoints and spin.
  3. Winner card enlarges (50%) and centers; others dim.
- "Pick First Player" button starts or re-shuffles; "Reset" clears result.
- **Shake gesture** triggers pick on mobile.

---

#### 4.10.3 Turn Timer

- Preset buttons: 30 s · 1 min · 2 min · 3 min · 5 min.
- Custom duration slider: 10 s – 5 min (10 s increments).
- Large 72 pt monospace display (MM:SS).
- Start / Reset controls.
- Color turns red/clay on expiry; haptic feedback fires at zero.

---

#### 4.10.4 Game Timer

- Full-session stopwatch.
- Large 72 pt monospace display (MM:SS; HH:MM:SS when over 1 hour).
- Start / Pause / Resume / Reset controls.

---

#### 4.10.5 Dice Roller *(mobile-exclusive)*

**Dice pool selector** — rows for d4, d6, d8, d10, d20; + / – buttons per type;
max 10 per type, 20 total.

**Die visuals:**
- d6: rounded square with pip dots (1–6).
- d4: triangle · d8: diamond octagon · d10: pentagon · d20: hexagon with inner
  triangle.

**Roll animation** — rapid face-value cycling on each die, staggered settlement,
wobble motion, haptic feedback at each die's settlement.

**Results** — dice settle to face values; large 56 pt monospace total (shows `—`
until first roll).

**Shake gesture** triggers roll.

Clear button resets pool.

---

## 5. Design System & Visual Guidelines

The mobile app implements the **same vintage/botanical "library" design language**
as web. Tokens are mirrored in `lib/core/theme/`.

### 5.1 Color (`app_colors.dart`)

Seven named ramps with identical hex values as web: parchment · forest · sky ·
clay/terracotta · wheat · plum · ink (+ `cream`/`warmGray` aliases).

Section-color convention on the Game Nite launcher: plum (Chooser) · clay (First
Player) · forest (Turn Timer) · sky (Game Timer) · wheat (Dice Roller).

> ⚠️ **Brand-color divergence from web.** The Material 3 `ColorScheme.primary` on
> mobile is **forest green** (`forest500` light / `forest200` dark), with clay as
> *secondary* and wheat as *tertiary*. The **web** uses **clay/terracotta** as
> primary. Until a deliberate decision is made, keep the palette identical and
> treat primary assignment as the accepted per-surface difference.

### 5.2 Typography

- **Display (headings, app bar titles):** Cormorant Garamond — serif, light
  weights, letter-spacing 0.5.
- **Body/UI:** Jost (clean sans-serif).
- **Numbers/data:** DM Mono — timers, scores, stat counters.

Helpers: `display()`, `body()`, `mono()`, `label()` (11 px, tracking 1.2),
`caption()` (10 px). Material `displayLarge…headlineSmall` also wired to
Cormorant via the text theme.

### 5.3 Shape, Surfaces & Spacing

- **Radius: flat 4 px** everywhere (inputs, buttons, cards).
- **Elevation 0**; surfaces white with thin parchment borders; dividers 1 px
  `parchment200`. Borders over shadows.
- Scaffold background `parchment50`; app bar white, serif title, no elevation
  (`scrolledUnderElevation` only).
- Filled `ElevatedButton` in `ink600`, wide-tracked Jost. Outlined buttons use
  parchment borders.
- Inputs: filled white, parchment border, `ink300` focus border, small tracked
  labels.
- `NavigationBar`: white, `forest100` indicator, forest selected state.

### 5.4 Motion & Native Feel

- Restrained animation; delight-only (chooser spin, first-player card shuffle).
- **Haptics and shake gestures** used in Dice Roller and First Player Picker —
  template for future mobile-exclusive tools.

### 5.5 Dark Theme

A dark `ColorScheme` is defined (inverted ink/parchment surfaces) but the dark
`ThemeData` is minimal/incomplete. **Default to and QA in light mode** until full
dark-mode parity is built.

### 5.6 Accessibility

- WCAG AA contrast on parchment surfaces.
- Tap targets meet platform minimums.
- Every visible control must perform an action (App Store Guideline 2.1).

---

## 6. Data Models

| Model | Key Fields |
|-------|-----------|
| `Game` | id, barcode, name, bggId, publisher, year, edition, coverImageUrl, gameType[], category[], mechanic[], family[], minPlayers, maxPlayers, playtime, isExpansion |
| `LibraryEntry` | id, game (Game), isFavorite, isForSale, personalRanking, playedDates[], notes, victoryStats? |
| `WishlistEntry` | id, game (Game), priority (high/medium/low), notes, createdAt |
| `VictoryStats` | totalSessions, totalWins, winRate, bestScore?, lastPlayedDate |
| `Friend` | UserFriend (status: pending/accepted/blocked), SharedLibraryAccess (level: view/suggest), AppProfile (username, bio, avatar, gameCounts) |

---

## 7. Backend Edge Functions

| Function | Purpose |
|----------|---------|
| `bgg-lookup` | Proxies BGG XML API; keeps API credentials server-side |
| `barcode-lookup` | Three-tier fallback: GameUPC → BarcodeLookup → UPCItemDB; returns name + BGG ID |
| `submit-barcode-mapping` | Crowdsources barcode→BGG ID mappings to grow the shared database |
| `delete-account` | Permanent account deletion with cascading data removal (App Store compliance) |

---

## 8. State Management

**Riverpod** async notifiers and providers:

| Provider | Purpose |
|----------|---------|
| `libraryProvider` | User's game library; exposes `toggleFavorite`, `toggleForSale`, `recordPlayedDate`, `removeGame`, `refresh` |
| `wishlistProvider` | User's wishlist; exposes `removeEntry`, `moveToLibrary`, `refresh` |
| `librarySearchProvider` | Search query string |
| `libraryFilterProvider` | Filter facets + sort selection |
| `recentPlayersProvider` | Persisted recent player names (SharedPreferences) |
| `profileProvider` | User profile + stats |
| `authStateProvider` | Auth state changes |

---

## 9. App Store Launch Blockers (iOS)

From the pre-submission review (`flutter_app/APP_STORE_REVIEW.md`, 2026-06-12).
These gate first submission and must be resolved before release:

1. **Privacy Manifest** (`ios/Runner/PrivacyInfo.xcprivacy`) — *hard blocker*.
   Declare required-reason APIs (`shared_preferences` UserDefaults `CA92.1`; cache
   libs' file-timestamp/disk-space reasons) and collected data (email, user
   content; tracking = false). Must be added to the Runner target.
2. **App Privacy questionnaire** (App Store Connect) — *hard blocker*. Declare
   Email + User Content, linked to user, app-functionality, **not** tracking;
   keep consistent with the manifest.
3. **Dead / placeholder UI** (Guideline 2.1) — *likely blocker*. Verify no
   tappable controls with no action remain in Profile or elsewhere.
4. **Export-compliance key** — add `ITSAppUsesNonExemptEncryption=false` to
   `Info.plist` (HTTPS-only app).
5. **Product identity** (Guideline 2.3) — align display name, App Store listing,
   in-app branding, bundle ID, and Dart package to one real name.
6. **iPad** — verify layouts on the largest reviewed device or restrict
   `TARGETED_DEVICE_FAMILY` to iPhone for v1.

**Suggested order:** (1)+(2) → (3) → (4)+(5) → (6).

---

## 10. Mobile ↔ Web Parity Snapshot

**Web has, mobile doesn't (yet):**
- Admin panel (intentionally web-only).
- Full dashboard widget set parity.

**Mobile has, web doesn't:**
- **Dice Roller** with shake-to-roll + haptics.
- **Shake-to-pick** on First Player Picker.
- Remembered **recent players** for player-based tools.
- Barcode scanner (native camera, no web equivalent).

**Implemented on both:** core library management, wishlist, friends/friend
requests, game detail, session logging, Game Nite tools (non-camera).

---

## 11. Guidelines for Future Features

1. **Tokens first.** Use `app_colors` / `app_text_styles` / `app_theme`; never
   hardcode hex values. New colors must be added to both apps' palettes.
2. **Stay flat & papery.** 4 px radius, elevation 0, parchment borders, hairline
   dividers.
3. **Mono for numbers, serif for voice, Jost for UI.**
4. **No dead ends, no dead controls.** Every visible control must act.
5. **Exploit native advantages** — haptics, gestures, camera — where they add
   genuine value. The Dice Roller and First Player Picker are the templates.
6. **Respect the shared data model & RLS**; reuse Edge Functions for third-party
   lookups. Never embed external tokens in the app.
7. **Track parity** (§10): note in the PR whether a change should also land on
   web.
8. **Default to light mode** until dark theme is complete.

---

## 12. Open Questions

1. Final product name + bundle identity (blocks §9 #5).
2. Primary brand color: align mobile with web (clay) or keep mobile forest?
3. Android: future target? Affects platform-specific design choices.
4. Timeline/scope for completing dark mode.
