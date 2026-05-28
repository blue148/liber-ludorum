---
name: App Structure Overview
description: Key components, navigation architecture, and tab structure of the boardgame-library app
type: project
---

App uses React + TypeScript + Tailwind CSS. Main tabs: Dashboard, Library (Catalogue + Wishlist sub-tabs), GameNiteTools (Game Chooser, First Player, Turn Timer, Game Timer sub-tabs), Admin.

Navigation is a sticky top bar with horizontal tabs. Profile drawer in top-right. No mobile bottom nav exists yet.

Key component locations:
- App.tsx — top-level nav shell
- Dashboard.tsx — stats, QuickActions, MostPlayedGames, RecentlyAdded, PlayActivityChart
- Library.tsx — catalogue + wishlist tabs, search, filters, sort, grid/list GameCard
- GameNiteTools.tsx — horizontal 4-tab sub-nav with tool components
- dashboard/QuickActions.tsx — 3 colored action buttons (Game Picker, First Player, Turn Timer)
- dashboard/MostPlayedGames.tsx — ranked list with play bars
- components/GameCard.tsx — grid and list layouts

**Why:** Need this to understand where to add mobile bottom nav and which components to restructure.

**How to apply:** When editing navigation or layout, this is the authoritative map of the component hierarchy.
