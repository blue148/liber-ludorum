import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/app_colors.dart';
import '../../core/supabase_client.dart';
import '../../data/models/friend.dart';
import '../../data/models/library_entry.dart';
import '../../data/models/profile.dart';
import '../../data/models/wishlist_entry.dart';
import '../../data/services/friends_service.dart';
import '../../data/models/library_filter.dart';
import '../../providers/library_provider.dart';
import '../../providers/wishlist_provider.dart';
import 'widgets/game_card.dart';
import 'widgets/library_filter_sheet.dart';
import 'widgets/log_play_sheet.dart';
import 'widgets/quick_filter_chips.dart';
import 'widgets/sort_bottom_sheet.dart';

class LibraryScreen extends ConsumerStatefulWidget {
  const LibraryScreen({super.key});

  @override
  ConsumerState<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends ConsumerState<LibraryScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  GameCardLayout _layout = GameCardLayout.list;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _tabs.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  void _showAddGameSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.parchment50,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.ink100,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text('Add a game',
                  style: GoogleFonts.cormorantGaramond(
                      fontSize: 22, color: AppColors.ink500)),
            ),
            ListTile(
              leading:
                  const Icon(Icons.qr_code_scanner, color: AppColors.clay400),
              title: Text('Scan barcode',
                  style: GoogleFonts.jost(
                      fontWeight: FontWeight.w600, color: AppColors.ink500)),
              subtitle: Text('Use your camera to scan a game',
                  style:
                      GoogleFonts.jost(fontSize: 12, color: AppColors.ink300)),
              onTap: () {
                Navigator.pop(sheetContext);
                context.push('/library/scanner');
              },
            ),
            ListTile(
              leading: const Icon(Icons.search, color: AppColors.clay400),
              title: Text('Search by title',
                  style: GoogleFonts.jost(
                      fontWeight: FontWeight.w600, color: AppColors.ink500)),
              subtitle: Text('Find a game on BoardGameGeek',
                  style:
                      GoogleFonts.jost(fontSize: 12, color: AppColors.ink300)),
              onTap: () {
                Navigator.pop(sheetContext);
                context.push('/library/manual-add');
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final onCatalogue = _tabs.index == 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Games'),
        actions: onCatalogue
            ? [
                IconButton(
                  icon: Icon(
                    _layout == GameCardLayout.grid
                        ? Icons.view_list_outlined
                        : Icons.grid_view_outlined,
                    color: AppColors.ink400,
                  ),
                  onPressed: () => setState(() => _layout =
                      _layout == GameCardLayout.grid
                          ? GameCardLayout.list
                          : GameCardLayout.grid),
                ),
              ]
            : null,
        bottom: TabBar(
          controller: _tabs,
          labelStyle: GoogleFonts.jost(
              fontSize: 13, fontWeight: FontWeight.w600, letterSpacing: 0.3),
          unselectedLabelStyle:
              GoogleFonts.jost(fontSize: 13, fontWeight: FontWeight.w400),
          labelColor: AppColors.clay400,
          unselectedLabelColor: AppColors.ink300,
          indicatorColor: AppColors.clay400,
          indicatorWeight: 2,
          tabs: const [
            Tab(text: 'My Library'),
            Tab(text: 'Wishlist'),
            Tab(text: 'Friends'),
          ],
        ),
      ),
      floatingActionButton: onCatalogue
          ? FloatingActionButton(
              onPressed: _showAddGameSheet,
              backgroundColor: AppColors.clay400,
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
      body: TabBarView(
        controller: _tabs,
        children: [
          _CatalogueTab(
            layout: _layout,
            buildCard: _buildCard,
            onRetry: () => ref.invalidate(libraryProvider),
          ),
          const _WishlistTab(),
          const _FriendsTab(),
        ],
      ),
    );
  }

  Widget _buildCard(LibraryEntry entry) => GameCard(
        key: ValueKey(entry.id),
        entry: entry,
        layout: _layout,
        onTap: () => context.push('/game/${entry.id}', extra: entry),
        onFavorite: () => ref
            .read(libraryProvider.notifier)
            .toggleFavorite(entry.id, !entry.isFavorite),
        onDelete: () => _confirmDelete(entry),
        onToggleForSale: () => ref
            .read(libraryProvider.notifier)
            .toggleForSale(entry.id, !entry.forSale),
        onLogPlay: () => showLogPlaySheet(context, entry),
      );

  void _confirmDelete(LibraryEntry entry) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('Remove game?',
            style: GoogleFonts.cormorantGaramond(fontSize: 22)),
        content: Text(
          'Remove "${entry.game.name}" from your library?',
          style: GoogleFonts.jost(fontSize: 14, color: AppColors.ink400),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              ref.read(libraryProvider.notifier).removeGame(entry.id);
            },
            child: Text('Remove',
                style: GoogleFonts.jost(color: AppColors.clay500)),
          ),
        ],
      ),
    );
  }
}

// ── My Library tab ─────────────────────────────────────────────────────────────

class _CatalogueTab extends ConsumerStatefulWidget {
  final GameCardLayout layout;
  final Widget Function(LibraryEntry) buildCard;
  final VoidCallback onRetry;

  const _CatalogueTab({
    required this.layout,
    required this.buildCard,
    required this.onRetry,
  });

  @override
  ConsumerState<_CatalogueTab> createState() => _CatalogueTabState();
}

class _CatalogueTabState extends ConsumerState<_CatalogueTab> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final layout = widget.layout;
    final buildCard = widget.buildCard;
    final onRetry = widget.onRetry;

    final searchQuery = ref.watch(librarySearchProvider);
    final libraryAsync = ref.watch(filteredLibraryProvider);
    final rawAsync = ref.watch(libraryProvider);
    final activeCount =
        ref.watch(libraryFilterProvider.select((f) => f.activeCount));
    final sort = ref.watch(libraryFilterProvider.select((f) => f.sort));

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            controller: _searchCtrl,
            onChanged: (v) => ref.read(librarySearchProvider.notifier).set(v),
            style: GoogleFonts.jost(fontSize: 14, color: AppColors.ink500),
            decoration: InputDecoration(
              hintText: 'Search games…',
              prefixIcon:
                  const Icon(Icons.search, size: 20, color: AppColors.ink200),
              suffixIcon: searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () {
                        _searchCtrl.clear();
                        ref.read(librarySearchProvider.notifier).set('');
                      },
                    )
                  : null,
            ),
          ),
        ),
        _ControlRow(activeCount: activeCount, sort: sort),
        const SizedBox(height: 8),
        const QuickFilterChips(),
        const SizedBox(height: 8),
        Expanded(
          child: libraryAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, __) => Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline,
                      color: AppColors.clay400, size: 40),
                  const SizedBox(height: 12),
                  Text('Failed to load library',
                      style: GoogleFonts.jost(color: AppColors.ink400)),
                  const SizedBox(height: 8),
                  TextButton(onPressed: onRetry, child: const Text('Retry')),
                ],
              ),
            ),
            data: (items) {
              final libraryEmpty = (rawAsync.asData?.value ?? const []).isEmpty;

              if (items.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.collections_bookmark_outlined,
                          size: 48, color: AppColors.ink100),
                      const SizedBox(height: 16),
                      Text(
                        libraryEmpty ? 'Your library is empty' : 'No results',
                        style: GoogleFonts.cormorantGaramond(
                            fontSize: 22, color: AppColors.ink300),
                      ),
                      if (libraryEmpty) ...[
                        const SizedBox(height: 8),
                        Text('Tap + to scan or search for your first game',
                            style: GoogleFonts.jost(
                                fontSize: 13, color: AppColors.ink200)),
                      ] else ...[
                        const SizedBox(height: 8),
                        Text('Try adjusting your search or filters',
                            style: GoogleFonts.jost(
                                fontSize: 13, color: AppColors.ink200)),
                      ],
                    ],
                  ),
                );
              }

              if (layout == GameCardLayout.list) {
                return RefreshIndicator(
                  onRefresh: () => ref.read(libraryProvider.notifier).refresh(),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 6),
                    itemBuilder: (_, i) => buildCard(items[i]),
                  ),
                );
              }

              return RefreshIndicator(
                onRefresh: () => ref.read(libraryProvider.notifier).refresh(),
                child: GridView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                    childAspectRatio: 0.55,
                  ),
                  itemCount: items.length,
                  itemBuilder: (_, i) => buildCard(items[i]),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// ── Catalogue control row (Sort + Filter) ──────────────────────────────────────

class _ControlRow extends ConsumerWidget {
  final int activeCount;
  final LibrarySort sort;

  const _ControlRow({required this.activeCount, required this.sort});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: _ControlButton(
              icon: Icons.swap_vert,
              label: sort.label,
              onTap: () async {
                final selected = await showSortBottomSheet<LibrarySort>(
                  context: context,
                  current: sort,
                  options: [
                    for (final s in LibrarySort.values) SortOption(s, s.label),
                  ],
                );
                if (selected != null) {
                  ref
                      .read(libraryFilterProvider.notifier)
                      .update((f) => f.copyWith(sort: selected));
                }
              },
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _ControlButton(
              icon: Icons.tune,
              label: 'Filter',
              badge: activeCount > 0 ? '$activeCount' : null,
              highlighted: activeCount > 0,
              onTap: () => showLibraryFilterSheet(context),
            ),
          ),
        ],
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? badge;
  final bool highlighted;
  final VoidCallback onTap;

  const _ControlButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.badge,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    final borderColor =
        highlighted ? AppColors.clay400 : AppColors.parchment200;
    final fgColor = highlighted ? AppColors.clay400 : AppColors.ink400;
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Container(
          height: 40,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            border: Border.all(color: borderColor),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: fgColor),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.jost(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: fgColor),
                ),
              ),
              if (badge != null) ...[
                const SizedBox(width: 6),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                  decoration: BoxDecoration(
                    color: AppColors.clay400,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(badge!,
                      style: GoogleFonts.jost(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.white)),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ── Wishlist tab ───────────────────────────────────────────────────────────────

enum WishlistSort {
  priority,
  nameAsc,
  nameDesc,
  dateAddedDesc,
  dateAddedAsc;

  String get label {
    switch (this) {
      case WishlistSort.priority:
        return 'Priority';
      case WishlistSort.nameAsc:
        return 'Name (A–Z)';
      case WishlistSort.nameDesc:
        return 'Name (Z–A)';
      case WishlistSort.dateAddedDesc:
        return 'Recently Added';
      case WishlistSort.dateAddedAsc:
        return 'Oldest First';
    }
  }
}

class _WishlistTab extends ConsumerStatefulWidget {
  const _WishlistTab();

  @override
  ConsumerState<_WishlistTab> createState() => _WishlistTabState();
}

class _WishlistTabState extends ConsumerState<_WishlistTab> {
  final _searchCtrl = TextEditingController();
  String _searchQuery = '';
  String _priorityFilter = 'all'; // 'all' | 'high' | 'medium' | 'low'
  WishlistSort _sort = WishlistSort.priority;

  static const _priorityRank = {'high': 0, 'medium': 1, 'low': 2};

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<WishlistEntry> _filtered(List<WishlistEntry> entries) {
    var result = entries;
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      result = result
          .where((e) =>
              e.game.name.toLowerCase().contains(q) ||
              (e.game.publisher?.toLowerCase().contains(q) ?? false) ||
              (e.notes?.toLowerCase().contains(q) ?? false))
          .toList();
    }
    if (_priorityFilter != 'all') {
      result = result.where((e) => e.priority == _priorityFilter).toList();
    }
    result = [...result]..sort(_compare);
    return result;
  }

  int _compare(WishlistEntry a, WishlistEntry b) {
    switch (_sort) {
      case WishlistSort.priority:
        return (_priorityRank[a.priority] ?? 3)
            .compareTo(_priorityRank[b.priority] ?? 3);
      case WishlistSort.nameAsc:
        return a.game.name.toLowerCase().compareTo(b.game.name.toLowerCase());
      case WishlistSort.nameDesc:
        return b.game.name.toLowerCase().compareTo(a.game.name.toLowerCase());
      case WishlistSort.dateAddedDesc:
        return b.addedDate.compareTo(a.addedDate);
      case WishlistSort.dateAddedAsc:
        return a.addedDate.compareTo(b.addedDate);
    }
  }

  Future<void> _openSortSheet() async {
    final selected = await showSortBottomSheet<WishlistSort>(
      context: context,
      current: _sort,
      options: [
        for (final s in WishlistSort.values) SortOption(s, s.label),
      ],
    );
    if (selected != null) setState(() => _sort = selected);
  }

  @override
  Widget build(BuildContext context) {
    final wishlistAsync = ref.watch(wishlistProvider);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: TextField(
            controller: _searchCtrl,
            onChanged: (v) => setState(() => _searchQuery = v),
            style: GoogleFonts.jost(fontSize: 14, color: AppColors.ink500),
            decoration: InputDecoration(
              hintText: 'Search wishlist…',
              prefixIcon:
                  const Icon(Icons.search, size: 20, color: AppColors.ink200),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () {
                        _searchCtrl.clear();
                        setState(() => _searchQuery = '');
                      },
                    )
                  : null,
            ),
          ),
        ),
        // Priority filter chips + sort
        Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 36,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    for (final (label, value) in [
                      ('All', 'all'),
                      ('High', 'high'),
                      ('Medium', 'medium'),
                      ('Low', 'low'),
                    ])
                      Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: Text(label,
                              style: GoogleFonts.jost(
                                fontSize: 12,
                                color: _priorityFilter == value
                                    ? Colors.white
                                    : AppColors.ink400,
                              )),
                          selected: _priorityFilter == value,
                          selectedColor: _priorityChipColor(value),
                          backgroundColor: Colors.white,
                          side: BorderSide(color: AppColors.parchment200),
                          onSelected: (_) =>
                              setState(() => _priorityFilter = value),
                          showCheckmark: false,
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          visualDensity: VisualDensity.compact,
                        ),
                      ),
                  ],
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.swap_vert, size: 20),
              color: AppColors.ink400,
              tooltip: 'Sort: ${_sort.label}',
              onPressed: _openSortSheet,
            ),
            const SizedBox(width: 4),
          ],
        ),
        const SizedBox(height: 4),
        Expanded(
          child: wishlistAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, __) => Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline,
                      color: AppColors.clay400, size: 40),
                  const SizedBox(height: 12),
                  Text('Failed to load wishlist',
                      style: GoogleFonts.jost(color: AppColors.ink400)),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => ref.invalidate(wishlistProvider),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
            data: (entries) {
              final items = _filtered(entries);
              if (items.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.favorite_border,
                          size: 48, color: AppColors.ink100),
                      const SizedBox(height: 16),
                      Text(
                        entries.isEmpty
                            ? 'Your wishlist is empty'
                            : 'No results',
                        style: GoogleFonts.cormorantGaramond(
                            fontSize: 22, color: AppColors.ink300),
                      ),
                      if (entries.isEmpty) ...[
                        const SizedBox(height: 8),
                        Text('Add games you want to your wishlist',
                            style: GoogleFonts.jost(
                                fontSize: 13, color: AppColors.ink200)),
                      ],
                    ],
                  ),
                );
              }
              return RefreshIndicator(
                onRefresh: () => ref.read(wishlistProvider.notifier).refresh(),
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 6),
                  itemBuilder: (_, i) => _WishlistItemRow(
                    entry: items[i],
                    onMoveToLibrary: () => _confirmMoveToLibrary(items[i]),
                    onDelete: () => _confirmDelete(items[i]),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Color _priorityChipColor(String value) {
    switch (value) {
      case 'high':
        return AppColors.clay400;
      case 'medium':
        return AppColors.wheat400;
      case 'low':
        return AppColors.forest400;
      default:
        return AppColors.ink400;
    }
  }

  void _confirmMoveToLibrary(WishlistEntry entry) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('Move to library?',
            style: GoogleFonts.cormorantGaramond(fontSize: 22)),
        content: Text(
          'Add "${entry.game.name}" to your library and remove from wishlist?',
          style: GoogleFonts.jost(fontSize: 14, color: AppColors.ink400),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              ref
                  .read(wishlistProvider.notifier)
                  .moveToLibrary(entry.id, entry.gameId);
            },
            child: Text('Move',
                style: GoogleFonts.jost(color: AppColors.forest500)),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(WishlistEntry entry) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('Remove from wishlist?',
            style: GoogleFonts.cormorantGaramond(fontSize: 22)),
        content: Text(
          'Remove "${entry.game.name}" from your wishlist?',
          style: GoogleFonts.jost(fontSize: 14, color: AppColors.ink400),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              ref.read(wishlistProvider.notifier).removeEntry(entry.id);
            },
            child: Text('Remove',
                style: GoogleFonts.jost(color: AppColors.clay500)),
          ),
        ],
      ),
    );
  }
}

class _WishlistItemRow extends StatelessWidget {
  final WishlistEntry entry;
  final VoidCallback onMoveToLibrary;
  final VoidCallback onDelete;

  const _WishlistItemRow({
    required this.entry,
    required this.onMoveToLibrary,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final game = entry.game;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.parchment200),
        borderRadius: BorderRadius.circular(4),
      ),
      clipBehavior: Clip.antiAlias,
      child: Row(
        children: [
          SizedBox(
            width: 72,
            height: 72,
            child: game.coverImage != null
                ? CachedNetworkImage(
                    imageUrl: game.coverImage!,
                    fit: BoxFit.cover,
                    placeholder: (_, __) =>
                        Container(color: AppColors.parchment100),
                    errorWidget: (_, __, ___) =>
                        Container(color: AppColors.parchment100),
                  )
                : Container(
                    color: AppColors.parchment100,
                    child: const Icon(Icons.menu_book_outlined,
                        size: 28, color: AppColors.ink100),
                  ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          game.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.jost(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: AppColors.ink600,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 5, vertical: 2),
                        color: _priorityColor(entry.priority),
                        child: Text(
                          _priorityLabel(entry.priority),
                          style: GoogleFonts.jost(
                              fontSize: 8,
                              color: Colors.white,
                              letterSpacing: 0.8,
                              fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  if (entry.notes != null && entry.notes!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      entry.notes!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.jost(
                          fontSize: 11, color: AppColors.ink300),
                    ),
                  ],
                  if (game.playerCountLabel.isNotEmpty ||
                      game.playtimeMinutes != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        if (game.playerCountLabel.isNotEmpty) ...[
                          const Icon(Icons.people_outline,
                              size: 12, color: AppColors.ink200),
                          const SizedBox(width: 3),
                          Text(game.playerCountLabel,
                              style: GoogleFonts.jost(
                                  fontSize: 11, color: AppColors.ink300)),
                          const SizedBox(width: 10),
                        ],
                        if (game.playtimeMinutes != null) ...[
                          const Icon(Icons.timer_outlined,
                              size: 12, color: AppColors.ink200),
                          const SizedBox(width: 3),
                          Text('${game.playtimeMinutes} min',
                              style: GoogleFonts.jost(
                                  fontSize: 11, color: AppColors.ink300)),
                        ],
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
          PopupMenuButton<String>(
            icon:
                const Icon(Icons.more_vert, size: 16, color: AppColors.ink200),
            padding: EdgeInsets.zero,
            itemBuilder: (_) => [
              PopupMenuItem(
                value: 'move',
                child: _menuItem(
                    Icons.collections_bookmark_outlined, 'Move to Library'),
              ),
              const PopupMenuDivider(),
              PopupMenuItem(
                value: 'delete',
                child: _menuItem(Icons.delete_outline, 'Remove',
                    color: AppColors.clay500),
              ),
            ],
            onSelected: (action) {
              if (action == 'move') onMoveToLibrary();
              if (action == 'delete') onDelete();
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
    );
  }

  String _priorityLabel(String priority) {
    switch (priority) {
      case 'high':
        return 'HIGH';
      case 'medium':
        return 'MED';
      case 'low':
        return 'LOW';
      default:
        return priority.toUpperCase();
    }
  }

  Color _priorityColor(String priority) {
    switch (priority) {
      case 'high':
        return AppColors.clay400;
      case 'medium':
        return AppColors.wheat400;
      case 'low':
        return AppColors.forest400;
      default:
        return AppColors.ink300;
    }
  }

  Widget _menuItem(IconData icon, String label, {Color? color}) => Row(
        children: [
          Icon(icon, size: 16, color: color ?? AppColors.ink400),
          const SizedBox(width: 10),
          Text(label,
              style: GoogleFonts.jost(
                  fontSize: 13, color: color ?? AppColors.ink500)),
        ],
      );
}

// ── Friends tab ────────────────────────────────────────────────────────────────

class _FriendsTab extends ConsumerStatefulWidget {
  const _FriendsTab();

  @override
  ConsumerState<_FriendsTab> createState() => _FriendsTabState();
}

class _FriendsTabState extends ConsumerState<_FriendsTab> {
  List<UserFriend> _friends = [];
  List<UserFriend> _pending = [];
  bool _loading = true;

  final _findCtrl = TextEditingController();
  String _findQuery = '';
  List<AppProfile> _searchResults = [];
  bool _searching = false;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _findCtrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    final user = supabase.auth.currentUser;
    if (user == null) return;
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        FriendsService.getUserFriends(user.id),
        FriendsService.getPendingRequests(user.id),
      ]);
      if (mounted) {
        setState(() {
          _friends = results[0];
          _pending = results[1];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onFindChanged(String value) {
    setState(() {
      _findQuery = value;
      if (value.length < 2) _searchResults = [];
    });
    _debounce?.cancel();
    if (value.length >= 2) {
      _debounce = Timer(const Duration(milliseconds: 400), _searchUsers);
    }
  }

  Future<void> _searchUsers() async {
    if (_findQuery.length < 2) return;
    setState(() => _searching = true);
    try {
      final results = await FriendsService.searchUsers(_findQuery);
      final friendIds = {
        ..._friends.map((f) => f.friendId),
        supabase.auth.currentUser?.id ?? '',
      };
      if (mounted) {
        setState(() {
          _searchResults =
              results.where((u) => !friendIds.contains(u.id)).toList();
          _searching = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _searching = false);
    }
  }

  Future<void> _sendRequest(String friendId) async {
    final user = supabase.auth.currentUser;
    if (user == null) return;
    try {
      await FriendsService.sendFriendRequest(user.id, friendId);
      setState(() {
        _searchResults.removeWhere((u) => u.id == friendId);
      });
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to send friend request')),
        );
      }
    }
  }

  Future<void> _acceptRequest(String requestId) async {
    try {
      await FriendsService.acceptRequest(requestId);
      await _load();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to accept request')),
        );
      }
    }
  }

  Future<void> _confirmRemoveFriend(UserFriend friendship) async {
    final name = friendship.friend?.username ?? 'this user';
    final ok = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('Remove friend?',
            style: GoogleFonts.cormorantGaramond(fontSize: 22)),
        content: Text('Remove $name as a friend?',
            style: GoogleFonts.jost(fontSize: 14, color: AppColors.ink400)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text('Remove',
                style: GoogleFonts.jost(color: AppColors.clay500)),
          ),
        ],
      ),
    );
    if (ok == true) {
      final user = supabase.auth.currentUser;
      if (user == null) return;
      await FriendsService.removeFriend(user.id, friendship.friendId);
      await _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final showSearch = _findQuery.isNotEmpty;

    return Column(
      children: [
        // Find friends search bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            controller: _findCtrl,
            onChanged: _onFindChanged,
            style: GoogleFonts.jost(fontSize: 14, color: AppColors.ink500),
            decoration: InputDecoration(
              hintText: 'Find friends by username…',
              prefixIcon: const Icon(Icons.person_search,
                  size: 20, color: AppColors.ink200),
              suffixIcon: _findQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () {
                        _findCtrl.clear();
                        setState(() {
                          _findQuery = '';
                          _searchResults = [];
                        });
                      },
                    )
                  : null,
            ),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            child: showSearch ? _buildSearchResults() : _buildFriendsList(),
          ),
        ),
      ],
    );
  }

  Widget _buildSearchResults() {
    if (_searching) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_findQuery.length < 2) {
      return Center(
        child: Text('Type at least 2 characters',
            style: GoogleFonts.jost(fontSize: 13, color: AppColors.ink300)),
      );
    }
    if (_searchResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.search_off, size: 48, color: AppColors.ink100),
            const SizedBox(height: 12),
            Text('No users found',
                style: GoogleFonts.cormorantGaramond(
                    fontSize: 22, color: AppColors.ink300)),
          ],
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
      itemCount: _searchResults.length,
      separatorBuilder: (_, __) => const SizedBox(height: 1),
      itemBuilder: (_, i) {
        final user = _searchResults[i];
        return _FriendRow(
          username: user.username,
          avatarUrl: user.avatarUrl,
          totalGames: user.totalGames,
          trailing: FilledButton(
            onPressed: () => _sendRequest(user.id),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.plum400,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Text('Add',
                style: GoogleFonts.jost(fontSize: 13, color: Colors.white)),
          ),
        );
      },
    );
  }

  Widget _buildFriendsList() {
    final hasContent = _pending.isNotEmpty || _friends.isNotEmpty;
    if (!hasContent) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.people_outline, size: 48, color: AppColors.ink100),
            const SizedBox(height: 16),
            Text('No friends yet',
                style: GoogleFonts.cormorantGaramond(
                    fontSize: 22, color: AppColors.ink300)),
            const SizedBox(height: 8),
            Text('Search above to find and add friends',
                style: GoogleFonts.jost(fontSize: 13, color: AppColors.ink200)),
          ],
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
      children: [
        // Pending requests section
        if (_pending.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 6),
            child: Text('REQUESTS (${_pending.length})',
                style: GoogleFonts.jost(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.5,
                    color: AppColors.clay400)),
          ),
          ..._pending.map((req) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: _FriendRow(
                  username: req.friend?.username ?? 'Unknown',
                  avatarUrl: req.friend?.avatarUrl,
                  totalGames: req.friend?.totalGames ?? 0,
                  subtitle: 'Wants to be friends',
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.check_circle_outline,
                            color: AppColors.forest500, size: 22),
                        onPressed: () => _acceptRequest(req.id),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                ),
              )),
          const SizedBox(height: 8),
        ],

        // Friends section
        if (_friends.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.only(top: 4, bottom: 6),
            child: Text('FRIENDS (${_friends.length})',
                style: GoogleFonts.jost(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.5,
                    color: AppColors.ink300)),
          ),
          ..._friends.map((f) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: _FriendRow(
                  username: f.friend?.username ?? 'Unknown',
                  avatarUrl: f.friend?.avatarUrl,
                  totalGames: f.friend?.totalGames ?? 0,
                  trailing: PopupMenuButton<String>(
                    icon: const Icon(Icons.more_horiz,
                        size: 18, color: AppColors.ink300),
                    padding: EdgeInsets.zero,
                    itemBuilder: (_) => [
                      PopupMenuItem(
                        value: 'remove',
                        child: Row(children: [
                          const Icon(Icons.person_remove_outlined,
                              size: 16, color: AppColors.clay500),
                          const SizedBox(width: 10),
                          Text('Remove friend',
                              style: GoogleFonts.jost(
                                  fontSize: 13, color: AppColors.clay500)),
                        ]),
                      ),
                    ],
                    onSelected: (_) => _confirmRemoveFriend(f),
                  ),
                ),
              )),
        ],
      ],
    );
  }
}

class _FriendRow extends StatelessWidget {
  final String username;
  final String? avatarUrl;
  final int totalGames;
  final String? subtitle;
  final Widget? trailing;

  const _FriendRow({
    required this.username,
    required this.avatarUrl,
    required this.totalGames,
    this.subtitle,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.parchment200),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        children: [
          // Avatar
          _Avatar(username: username, avatarUrl: avatarUrl),
          const SizedBox(width: 12),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(username,
                    style: GoogleFonts.jost(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: AppColors.ink600)),
                Text(
                  subtitle ?? '$totalGames games',
                  style:
                      GoogleFonts.jost(fontSize: 12, color: AppColors.ink300),
                ),
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final String username;
  final String? avatarUrl;

  const _Avatar({required this.username, required this.avatarUrl});

  @override
  Widget build(BuildContext context) {
    if (avatarUrl != null) {
      return ClipOval(
        child: CachedNetworkImage(
          imageUrl: avatarUrl!,
          width: 40,
          height: 40,
          fit: BoxFit.cover,
          errorWidget: (_, __, ___) => _initials(),
        ),
      );
    }
    return _initials();
  }

  Widget _initials() {
    final initial = username.isNotEmpty ? username[0].toUpperCase() : '?';
    return Container(
      width: 40,
      height: 40,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [AppColors.plum300, AppColors.plum500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(initial,
            style: GoogleFonts.jost(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white)),
      ),
    );
  }
}
