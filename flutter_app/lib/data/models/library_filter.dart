import 'library_entry.dart';

/// Sort options for a library/collection list. Mirrors the web app's
/// `SortOption` union in `src/components/Library.tsx`.
enum LibrarySort {
  nameAsc,
  nameDesc,
  dateAddedDesc,
  dateAddedAsc,
  playsDesc,
  playsAsc;

  String get label {
    switch (this) {
      case LibrarySort.nameAsc:
        return 'Name (A–Z)';
      case LibrarySort.nameDesc:
        return 'Name (Z–A)';
      case LibrarySort.dateAddedDesc:
        return 'Recently Added';
      case LibrarySort.dateAddedAsc:
        return 'Oldest First';
      case LibrarySort.playsDesc:
        return 'Most Played';
      case LibrarySort.playsAsc:
        return 'Least Played';
    }
  }
}

/// Immutable description of the active filters + sort for the library list.
///
/// Ports the filter state from the web `Library.tsx` component. Multi-select
/// facets are kept as ordered [Set]s; play-count bounds are inclusive, with a
/// null [maxPlays] meaning "no upper limit".
class LibraryFilter {
  final Set<String> publishers;
  final Set<String> gameTypes;
  final Set<String> categories;
  final Set<String> years;
  final Set<String> rankings; // 'high' | 'medium' | 'low'
  final Set<int> playerCounts; // 1..6, where 6 means "6+"
  final int minPlays;
  final int? maxPlays;
  final bool favoritesOnly;
  final bool forSaleOnly;
  final LibrarySort sort;

  const LibraryFilter({
    this.publishers = const {},
    this.gameTypes = const {},
    this.categories = const {},
    this.years = const {},
    this.rankings = const {},
    this.playerCounts = const {},
    this.minPlays = 0,
    this.maxPlays,
    this.favoritesOnly = false,
    this.forSaleOnly = false,
    this.sort = LibrarySort.nameAsc,
  });

  /// Number of active *filter* constraints (excludes sort). Drives the badge
  /// on the Filter button.
  int get activeCount {
    var count = 0;
    count += publishers.length;
    count += gameTypes.length;
    count += categories.length;
    count += years.length;
    count += rankings.length;
    count += playerCounts.length;
    if (minPlays > 0) count++;
    if (maxPlays != null) count++;
    if (favoritesOnly) count++;
    if (forSaleOnly) count++;
    return count;
  }

  bool get hasActiveFilters => activeCount > 0;

  LibraryFilter copyWith({
    Set<String>? publishers,
    Set<String>? gameTypes,
    Set<String>? categories,
    Set<String>? years,
    Set<String>? rankings,
    Set<int>? playerCounts,
    int? minPlays,
    Object? maxPlays = _sentinel,
    bool? favoritesOnly,
    bool? forSaleOnly,
    LibrarySort? sort,
  }) {
    return LibraryFilter(
      publishers: publishers ?? this.publishers,
      gameTypes: gameTypes ?? this.gameTypes,
      categories: categories ?? this.categories,
      years: years ?? this.years,
      rankings: rankings ?? this.rankings,
      playerCounts: playerCounts ?? this.playerCounts,
      minPlays: minPlays ?? this.minPlays,
      maxPlays:
          maxPlays == _sentinel ? this.maxPlays : maxPlays as int?,
      favoritesOnly: favoritesOnly ?? this.favoritesOnly,
      forSaleOnly: forSaleOnly ?? this.forSaleOnly,
      sort: sort ?? this.sort,
    );
  }

  /// Clears every filter facet but preserves the chosen [sort].
  LibraryFilter cleared() => LibraryFilter(sort: sort);

  /// Toggles a value within one of the [String] multi-select facets.
  LibraryFilter toggleString(Set<String> facet, String value) {
    final next = Set<String>.from(facet);
    next.contains(value) ? next.remove(value) : next.add(value);
    return _replaceStringFacet(facet, next);
  }

  LibraryFilter togglePlayerCount(int count) {
    final next = Set<int>.from(playerCounts);
    next.contains(count) ? next.remove(count) : next.add(count);
    return copyWith(playerCounts: next);
  }

  LibraryFilter _replaceStringFacet(Set<String> facet, Set<String> next) {
    if (identical(facet, publishers)) return copyWith(publishers: next);
    if (identical(facet, gameTypes)) return copyWith(gameTypes: next);
    if (identical(facet, categories)) return copyWith(categories: next);
    if (identical(facet, years)) return copyWith(years: next);
    if (identical(facet, rankings)) return copyWith(rankings: next);
    return this;
  }

  /// Applies all active filters then sorts. Mirrors the filtering `useEffect`
  /// in `Library.tsx` (search is handled separately by the screen).
  List<LibraryEntry> apply(List<LibraryEntry> entries) {
    var result = entries.where(_matches).toList();
    result.sort(_compare);
    return result;
  }

  bool _matches(LibraryEntry e) {
    if (favoritesOnly && !e.isFavorite) return false;
    if (forSaleOnly && !e.forSale) return false;

    if (publishers.isNotEmpty &&
        (e.game.publisher == null || !publishers.contains(e.game.publisher))) {
      return false;
    }
    if (gameTypes.isNotEmpty &&
        !e.game.gameType.any(gameTypes.contains)) {
      return false;
    }
    if (categories.isNotEmpty &&
        !e.game.gameCategory.any(categories.contains)) {
      return false;
    }
    if (rankings.isNotEmpty &&
        (e.personalRanking == null ||
            !rankings.contains(e.personalRanking))) {
      return false;
    }
    if (years.isNotEmpty &&
        (e.game.year == null || !years.contains(e.game.year))) {
      return false;
    }

    final plays = e.playCount;
    if (minPlays > 0 && plays < minPlays) return false;
    if (maxPlays != null && plays > maxPlays!) return false;

    if (playerCounts.isNotEmpty && !_matchesPlayerCount(e)) return false;

    return true;
  }

  /// Ports the player-count matching logic from `Library.tsx`, including the
  /// "6+" (count == 6) open-ended upper bound.
  bool _matchesPlayerCount(LibraryEntry e) {
    final min = e.game.minPlayers;
    final max = e.game.maxPlayers;
    if (min == null && max == null) return false;

    return playerCounts.any((count) {
      if (count == 6) {
        if (min == null && max != null) return max >= 6;
        if (min != null && max == null) return true;
        return (max != null && max >= 6) || (min != null && min >= 6);
      }
      if (min == null && max != null) return count <= max;
      if (min != null && max == null) return count >= min;
      return min != null && max != null && count >= min && count <= max;
    });
  }

  int _compare(LibraryEntry a, LibraryEntry b) {
    switch (sort) {
      case LibrarySort.nameAsc:
        return _compareName(a.game.name, b.game.name);
      case LibrarySort.nameDesc:
        return _compareName(b.game.name, a.game.name);
      case LibrarySort.dateAddedDesc:
        return b.addedDate.compareTo(a.addedDate);
      case LibrarySort.dateAddedAsc:
        return a.addedDate.compareTo(b.addedDate);
      case LibrarySort.playsDesc:
        return b.playCount.compareTo(a.playCount);
      case LibrarySort.playsAsc:
        return a.playCount.compareTo(b.playCount);
    }
  }

  // Case-insensitive comparison to match the web's localeCompare(sensitivity:
  // 'base').
  int _compareName(String a, String b) =>
      a.toLowerCase().compareTo(b.toLowerCase());

  static const _sentinel = Object();
}
