# Product Requirements Document — React Web App (Codebase-Derived)

> Derived from direct code analysis of the React/Vite web app under `src/`.
> Where intent is inferred rather than explicitly stated in code or comments,
> that is noted. Companion document: `PRD_FLUTTER_APP_CODEBASE.md`.

---

## 1. Overview

This is a browser-based application for managing a personal board game collection.
It is built with React 18, TypeScript, Vite, and Tailwind CSS, backed by a
Supabase project (PostgreSQL, Auth, Storage, Edge Functions). A companion Flutter
mobile app exists separately and shares the same backend.

The application targets two audiences. The primary audience is individual users
who own board games and want to catalog them, track plays and outcomes, and have
utility tools available at the table. The secondary audience is a small
administrative group who curate the shared game database that all users draw from
when adding games.

The core problem it solves is the friction of maintaining a physical board game
collection across multiple concerns: knowing what you own, what you want, what
you have played, how often you win, what to play next with a group, and who plays
first. These are currently managed across scattered notes, memory, and separate
apps; this application centralizes them.

---

## 2. Users and Roles

The codebase implements two distinct roles, determined by the `is_admin` boolean
on the `profiles` table. No middleware or route guard enforces this beyond a
conditional check in `App.tsx` that controls tab visibility.

### Standard authenticated user

Can see and do:
- All four standard tabs: Dashboard, My Catalogue (Library), Game Nite Tools,
  and (on mobile) Profile.
- Full CRUD on their own library entries and wishlist.
- Add games to their library via barcode scan or BGG title search.
- Log game sessions and player outcomes.
- Send and receive friend requests; accept, decline, or block users.
- Grant friends read access to their library.
- Browse friends' shared libraries.
- Edit their own profile: username, bio, avatar, password, preferences.
- Use all four Game Nite tools.

Cannot see or do:
- The Admin Panel tab.
- Other users' profiles, notes, or session data.
- Edit the shared `shared_games` catalog directly (reads only; writes go through
  the admin panel or the game-creation path that runs on add).

### Admin user

Everything a standard user can do, plus:
- An Admin Panel tab that is hidden from non-admins.
- Search, edit, and delete records in the shared `shared_games` table.
- Editable fields per game: name, publisher, year, edition, cover image URL,
  min/max players, playtime, expansion flag.
- Delete a game from `shared_games` (cascades to all user library entries).
- Add new games manually to the shared catalog.

The admin role is set directly on the database row. There is no UI to promote or
demote users from within the app.

### Unauthenticated state

The `AuthContext` checks for a Supabase session on mount. If no session exists,
`App.tsx` renders only the `AuthForm` component. No tab, tool, or data is
accessible without authentication.

---

## 3. Core Workflows

### 3.1 Sign up and sign in

`AuthForm.tsx` handles both flows. Sign-up takes a username, email, and password.
Supabase creates the auth user; a `profiles` row is inserted via a database
trigger (inferred — no explicit insert in `auth.ts`). Sign-in takes email and
password. On success, `AuthContext` receives the session, fetches the profile, and
`App.tsx` renders the main tab interface. On error, an inline message is displayed.

### 3.2 Adding a game by barcode

1. From the My Catalogue tab, the user opens the barcode scanner. `BarcodeScanner.tsx`
   requests camera access using `html5-qrcode`.
2. On a successful scan (UPC-A 12-digit or EAN-13 13-digit), the app converts
   between formats as needed and calls `getGameByBarcode()` to check the local
   `shared_games` table.
3. If found locally, the game is added to `user_library` immediately.
4. If not found, `lookupBarcodeWithBgg()` in `lib/bgg.ts` calls the
   `barcode-lookup` Supabase Edge Function. That function tries GameUPC → 
   BarcodeLookup → UPCItemDB in sequence.
5. If a title is returned, the app searches BGG via the `bgg-lookup` Edge Function,
   sorted so exact matches appear first, then prefix matches, then by year
   descending.
6. If a BGG match is found, full game data is fetched by BGG ID and a new row is
   created in `shared_games` (or the existing row is returned if it already exists
   by `bgg_id`).
7. The game is added to `user_library`.
8. If the barcode returned a BGG ID, `submitBarcodeToGameUpc()` contributes the
   mapping back to the GameUPC crowdsource database.
9. If no match is found at any step, the barcode scanner shows an error and offers
   a path to manual entry.

### 3.3 Adding a game by title search

`ManualGameEntry.tsx` presents a search field. The user types a title; the app
calls `searchBggGames()`, which proxies to BGG's search API and sorts results by
exact match, then prefix match, then year descending. The user selects a result;
the same enrichment and library-add flow from step 6 onward in §3.2 runs. If the
game already exists in `shared_games` (matched by `bgg_id`), the existing record
is reused.

### 3.4 Browsing and filtering the library

`Library.tsx` loads all `user_library` rows joined to `shared_games` via
`getUserLibrary()`. The user can switch between list and grid layout. A search
field filters by name, publisher, or barcode in real time (client-side). A filter
panel exposes publisher, game type, category, year, personal ranking, number of
plays, player count, favorites toggle, and for-sale toggle — all applied
client-side to the in-memory list. Sort options are name A–Z/Z–A, date added, and
play count. The filtered and sorted result is rendered.

From here, the user can:
- Toggle favorite (star icon, updates `is_favorite` in `user_library`).
- Toggle for-sale (dollar icon, updates `for_sale`).
- Log a play (opens `VictoryLogModal`).
- Edit library entry metadata (opens `EditGameModal`: ranking, notes, played dates).
- Remove the game from their library.

### 3.5 Logging a play session

`VictoryLogModal.tsx` opens over the library. The user fills in:
- Session date and duration.
- One or more player rows: name, winner checkbox, optional score, optional placement.
- Session notes.

On submit, the app creates a `game_sessions` row and one `session_victories` row
per player. `played_dates` on the `user_library` row is updated by appending the
session date. Victory stats (win rate, total sessions, best score, last played) are
computed by a PostgreSQL function `get_user_game_victory_stats` and returned on
subsequent library loads; they are not stored redundantly in `user_library`.

### 3.6 Wishlist

The Wishlist tab inside `Library.tsx` loads `user_wishlist` rows. The same
search, filter, and sort controls from My Catalogue are present. The user can:
- Add games via barcode or manual BGG search (same flow as §3.2/§3.3, but the
  destination table is `user_wishlist` rather than `user_library`).
- Edit priority (high/medium/low) and notes via `EditWishlistModal`.
- Move a game to the library (inserts into `user_library`, deletes from
  `user_wishlist`).
- Remove from wishlist.

### 3.7 Friends and shared libraries

From a friend management section within the Library component (rendered when the
"Friends" tab or section is active), the user can:
- Type a username to send a friend request (`sendFriendRequest()` inserts into
  `user_friends` with status `pending`).
- See incoming pending requests and accept or decline them
  (`acceptFriendRequest()` sets status to `accepted`).
- Block a user (`blockUser()` sets status to `blocked`).
- Remove an accepted friend (`removeFriend()` deletes the row).

After a friendship is established, the library owner can grant view access via
`shareLibraryWith()`, which inserts into `shared_library_access`. The viewer can
then browse the owner's games in the "Friend Libraries" section using
`getSharedLibraries()` and `getSharedLibraryGames()`. A `LibrarySelector`
component lets the viewer pick which friends' libraries to include.

### 3.8 Game Chooser

The user opens the Game Chooser tool. A filter panel accepts player count, maximum
playtime, and a mechanic (17 options). Optional victory intelligence toggles weight
the selection toward games with high win rates, away from games with recent losses,
or restrict to played-only games. The user can also include friend libraries by
selecting them from a dropdown.

Tapping "Spin" runs the weighted selection algorithm and animates a result display
showing the chosen game's cover, name, mechanics, and categories. The user can
spin again without changing filters.

### 3.9 First Player Chooser

The user manages a saved player list (stored in `profiles.preferences.players`).
Players are selected for the current round. On "Choose," a five-phase card
animation runs (flip face-down → shuffle → highlight chosen → push others away →
flip winner face-up). The winner is displayed with a glow effect. "Choose Again"
re-runs without clearing the player list. If only one player is selected, the
animation is skipped (inferred from the single-player guard in the component).

### 3.10 Turn Timer

The user sets a duration via preset buttons (30 s, 60 s, 90 s, 2 min, 3 min,
5 min) or a slider (10 s–60 min, 10 s increments). "Start" begins the countdown.
The display shows MM:SS. When 5 seconds remain, the browser plays warning beeps
via the Web Audio API (880 Hz sine wave). At zero, three alarm pulses fire (220 Hz
square wave). "Reset" returns to the configured duration without clearing it.

### 3.11 Game Timer

A stopwatch for tracking full session duration. State (started_at, stopped_at,
is_running) is persisted to `profiles.preferences.game_timer` via
`saveGameTimer()`, so the timer survives page refreshes. The timer auto-stops after
48 hours maximum. "Start" and "Stop" toggle the running state; the display shows
elapsed time.

### 3.12 Dashboard

The Dashboard loads four data sets in parallel: `getDashboardStats()`,
`getMostPlayedGames()`, `getRecentlyAddedGames()`, and `getPlayActivityByMonth()`.
It renders:
- A quick-stats bar: total games, total plays, favorites count, unplayed count,
  and overall win rate.
- Quick-action buttons that navigate to Game Nite tools.
- A horizontal bar chart of the top 5 most-played games (by `played_dates` array
  length).
- A grid of the 10 most recently added games.
- A line chart of play activity over the last 12 months (one point per month,
  counting all `played_dates` entries that fall in that month across all library
  entries).

### 3.13 Profile management

`ProfileDrawer.tsx` opens as a side drawer (desktop) or renders as a full page
(mobile). The user can edit their username, bio, upload an avatar image to
Supabase Storage, or pick from a set of DiceBear preset avatars. They can also
change their password (triggers Supabase Auth password update). A sign-out button
ends the session.

### 3.14 Admin — shared game management

The Admin Panel tab (`AdminPanel.tsx`) is visible only when `profile.is_admin` is
true. The admin can search the `shared_games` table by name, barcode, or publisher.
Search results display as a list. The admin can edit any field of a game record
(name, publisher, year, edition, cover image URL, player count, playtime,
expansion flag) or delete a game entirely (which cascades to all `user_library`
rows referencing it). The admin can also add new games manually without going
through the BGG lookup flow.

---

## 4. Functional Requirements

### Authentication
- Email/password sign-up with username.
- Email/password sign-in.
- Persistent session via Supabase Auth.
- Sign-out.
- Password change from profile.
- Auth-guarded UI: all content hidden until a session exists.

### Library management
- Add games via camera barcode scan (UPC-A and EAN-13).
- Add games via BGG title search.
- List and grid view layouts, toggle persistent.
- Real-time client-side search across name, publisher, barcode.
- Multi-facet filtering: publisher, game type, category, year, personal ranking,
  play count range, player count, favorites, for-sale.
- Sort by name (A–Z, Z–A), date added, play count.
- Toggle favorite per game.
- Toggle for-sale per game.
- Edit library entry metadata: personal ranking, notes, played dates.
- Remove game from library.
- View victory stats inline on cards: win rate, session count.

### Wishlist
- Add games to wishlist via barcode or BGG search.
- Set and edit priority per wishlist item (high/medium/low).
- Add notes per wishlist item.
- Filter, sort, and search wishlist (same controls as library).
- Move a wishlist item to the library.
- Remove from wishlist.

### Session logging
- Record a game session: date, duration, player count, notes.
- Add players per session: name, winner flag, optional score, optional placement.
- Dynamically add and remove player rows.
- Victory stats computed server-side after logging: win rate, total sessions,
  best score, last played date.

### Friends and social
- Send friend request by username.
- Accept or decline incoming requests.
- Block a user.
- Remove an accepted friend.
- Grant a friend view access to your library.
- Browse friends' shared libraries with search and filter.
- Include friend libraries in Game Chooser.

### Dashboard
- Aggregate stats: total games, total plays, favorites, unplayed, overall win rate.
- Most-played games (top 5, bar chart).
- Recently added games (10, grid).
- Play activity over the last 12 months (line chart).
- Quick-action shortcuts to Game Nite tools.

### Game Nite — Game Chooser
- Filter candidates by player count, playtime, mechanic.
- Include own library and/or selected friend libraries.
- Victory intelligence toggles: favor high win rate, avoid losing streak,
  played-only.
- Weighted random selection with animated result display.
- Re-spin without changing filters.

### Game Nite — First Player Chooser
- Manage a persistent saved player list (stored in profile preferences).
- Select players for the current round.
- Five-phase card shuffle animation with winner reveal.
- Re-choose without clearing the player selection.

### Game Nite — Turn Timer
- Preset duration buttons.
- Slider for custom duration (10 s – 60 min).
- Countdown with MM:SS display.
- Audio alerts via Web Audio API: warning beeps at 5 s remaining, alarm at zero.
- Start, pause, reset.

### Game Nite — Game Timer
- Session stopwatch with persistent state across page refreshes.
- Start and stop.
- Auto-stop safety at 48 hours.
- Elapsed time display.

### Profile
- Edit username, bio.
- Upload avatar image to Supabase Storage.
- Select avatar from DiceBear preset set.
- Change password.
- View/edit theme and notification preferences (stored in profile JSONB).
- Sign out.

### Admin (admin users only)
- Search shared game catalog by name, barcode, publisher.
- Edit any shared game record.
- Delete shared game record (cascades to all user libraries).
- Add new game to shared catalog manually.

---

## 5. Data Model

The following entities and fields are derived from `lib/supabase.ts` and the
query functions in `lib/games.ts`, `lib/sessions.ts`, and `lib/dashboard.ts`.

**profiles**
One row per authenticated user. Fields: `id` (FK to `auth.users`), `email`,
`username` (unique), `avatar_url`, `bio`, `preferences` (JSONB — theme, 
notifications_enabled, default_view, players array, game_timer object),
`total_games`, `favorite_count` (cached aggregates; source of truth is the actual
library rows), `is_admin`, `created_at`, `updated_at`.

**shared_games**
The central game catalog shared across all users. Fields: `id`, `barcode`,
`name`, `bgg_id`, `publisher`, `year`, `edition`, `cover_image`, `game_type[]`,
`game_category[]`, `game_mechanic[]`, `game_family[]`, `min_players`,
`max_players`, `playtime_minutes`, `is_expansion`, `created_at`, `updated_at`.
Games are created here when any user adds a game not already present, or by an
admin manually. Deletion cascades to `user_library`.

**user_library**
Joins a user to a game with user-specific state. Fields: `id`, `user_id` (FK
profiles), `game_id` (FK shared_games), `is_favorite`, `for_sale`,
`personal_ranking` (enum: high/medium/low, nullable), `played_dates` (TEXT array
of ISO date strings), `notes`, `added_date`, `updated_at`. Play dates are stored
here as a denormalized array; session detail lives in `game_sessions`.

**user_wishlist**
Fields: `id`, `user_id`, `game_id`, `priority` (enum: high/medium/low), `notes`,
`added_date`, `updated_at`. Games can exist in both `user_library` and
`user_wishlist` simultaneously (no constraint prevents it; the "move to library"
action deletes from wishlist on success).

**game_sessions**
One row per logged play. Fields: `id`, `user_id`, `game_id`, `session_date`,
`duration_minutes`, `player_count`, `notes`. Does not reference `user_library`
directly; the game is identified by `game_id` pointing at `shared_games`.

**session_victories**
One row per player per session. Fields: `id`, `session_id` (FK game_sessions),
`player_name`, `is_winner`, `score`, `placement`. Player names are free text;
there is no separate players table or FK to profiles. This means player history
across sessions is matched by exact string equality.

**user_friends**
Friendship edges. Fields: `id`, `user_id`, `friend_id`, `status` (enum:
pending/accepted/blocked), `created_at`. A `are_users_friends(user_a, user_b)`
database function checks for an accepted edge in either direction.

**shared_library_access**
Controls which users can view whose library. Fields: `id`, `owner_id`,
`viewer_id`, `access_level` (enum: view/suggest). Only `view` is used in the
application code; `suggest` is defined in the enum but has no corresponding UI or
query.

**Computed stats (server-side functions)**
`get_user_game_victory_stats(user_id, game_id)` returns `total_sessions`,
`total_wins`, `win_rate`, `best_score`, `last_played` — calculated live from
`game_sessions` and `session_victories`. These are not stored in `user_library`.
`get_user_overall_victory_stats(user_id)` returns the same fields aggregated
across all games for the dashboard.

---

## 6. Design Principles

The following are evident from `tailwind.config.js`, `index.css`, and the
component naming and structure.

**Named palette rooted in physical materials.** The Tailwind color config defines
seven named ramps: parchment (cream backgrounds), ink (near-black text),
clay/terracotta (primary interactive color), forest (green, secondary),
wheat (gold, tertiary), sky (teal, informational), plum (purple, creative). The
naming suggests a deliberate "warm, physical, board-game-night" aesthetic intention
rather than a generic design system. This is inferred from the names themselves
and from comments in the Flutter codebase that explicitly describe this as a
"vintage/botanical library" theme.

**Clay as the web's primary brand color.** The web app uses clay/terracotta as its
`primary` color for buttons, active states, and key interactive elements. (The
companion Flutter app uses forest green in this role — the divergence is noted in
the Flutter PRD as an open question.)

**Flat surfaces, minimal depth.** Tailwind config sets a 4 px standard border
radius. Components use thin borders over box shadows throughout. Cards and inputs
have no elevation. This is consistent with the Flutter app's documented constraint.

**Three-font system with semantic roles.** Cormorant Garamond (serif) is used for
display text and headings. Jost (sans-serif) is used for body and UI labels. DM
Mono is used for numeric data (timers, scores, counts). This is enforced by
naming conventions in the CSS classes rather than by a design token layer; the
Flutter app mirrors this structure using the same three fonts.

**Animation for physical-world metaphors only.** The two animated tools — First
Player Chooser (card shuffle) and Game Chooser (spin) — animate interactions that
mimic a physical action (shuffling cards, spinning a wheel). Other UI transitions
are absent or minimal. `index.css` includes a `prefers-reduced-motion` media query
that disables card flip animations, indicating deliberate accessibility
consideration for the animation choices.

**Shared game catalog with local ownership state.** The `shared_games` table acts
as a normalized game catalog; `user_library` and `user_wishlist` contain only the
user-specific state. This means game metadata edits by an admin propagate to all
users immediately. It also means users cannot have different cover images or names
for the same game — there is no per-user game customization layer beyond notes and
ranking.

**Audio feedback for time-based tools.** The Turn Timer uses the Web Audio API
to generate synthesized tones (sine and square waves) at specific frequencies.
There is no sound asset file — tones are generated in code. This is consistent
with a design intent of avoiding external media dependencies for utility tools.

---

## 7. Out of Scope or Known Limitations

**No routing library.** Navigation is tab-state managed in `App.tsx` via a single
`activeTab` state variable. There are no URLs for individual games, tools, or
views. A user cannot deep-link to a specific game or share a link to a filtered
view. Browser back/forward buttons do not navigate between tabs.

**No add-to-wishlist from friends' libraries.** When browsing a friend's shared
library, the user can view their games but cannot add them to their own wishlist
directly from that view. The code in `SharedLibraryView.tsx` is read-only.

**Session victories use name strings, not user accounts.** Players in
`session_victories` are stored as free-text names. There is no link to a
`profiles` row. This means the app cannot aggregate win stats across sessions if
a player's name is entered inconsistently (e.g., "Jon" vs "Jonathan"). Head-to-head
stats (`getPlayerHeadToHeadStats()` in `lib/sessions.ts`) exist as a function but
no component renders this data in the current UI.

**The `suggest` access level is unimplemented.** `shared_library_access.access_level`
accepts both `view` and `suggest`, but no UI surfaces the suggest level. It is a
placeholder with no current behavior.

**For-sale flag has no marketplace flow.** Games can be marked for sale. There is
no listing, contact, transaction, or browse-for-sale feature. The flag is
filterable in the library view but serves no further purpose in the current code.

**Play activity chart is fixed at 12 months.** `getPlayActivityByMonth()` returns
data for the last 12 months only. There is no date range picker or historical view
beyond that window.

**Avatar uploads have no size or type validation in the UI.** The profile avatar
upload sends whatever file the user selects to Supabase Storage. Validation, if
any, is enforced by Supabase storage policies rather than the application code.

**No bulk operations.** There is no way to import a game list, export the catalog,
add multiple games at once, or delete multiple library entries simultaneously.

**No offline capability.** There is no service worker, no local cache, and no
queue for offline writes. All reads and writes go directly to Supabase. If the
network is unavailable, the app shows no data and mutations fail silently or with
a toast.

**BGG sync is one-way and one-time.** When a game is added, metadata is fetched
from BGG once and stored in `shared_games`. If BGG updates the game's metadata
later (new publisher, corrected player count, updated cover image), the local
record is not updated automatically. Admin users can edit fields manually.

**`total_games` and `favorite_count` on profiles are cached aggregates.** These
fields appear to be maintained by database triggers or manual update (the
application code does not update them directly). If they drift from the actual
`user_library` counts — for instance, after a bug or a direct database
modification — the dashboard stats would be incorrect. The dashboard's
`getDashboardStats()` queries these cached values rather than counting rows.

**Admin deletion is permanent and immediate.** Deleting a game from `shared_games`
cascades to `user_library` for all users with no soft delete, no confirmation
audit log, and no recovery path beyond a database restore.
