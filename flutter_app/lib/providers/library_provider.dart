import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/library_entry.dart';
import '../data/services/games_service.dart';
import 'auth_provider.dart';

class LibraryNotifier extends AsyncNotifier<List<LibraryEntry>> {
  @override
  Future<List<LibraryEntry>> build() async {
    final user = ref.watch(currentUserProvider);
    if (user == null) return [];
    return GamesService.getUserLibrary(user.id);
  }

  Future<void> toggleFavorite(String entryId, bool isFavorite) async {
    final current = state.asData?.value ?? [];
    state = AsyncData(
      current
          .map((e) => e.id == entryId ? e.copyWith(isFavorite: isFavorite) : e)
          .toList(),
    );
    try {
      await GamesService.updateLibraryEntry(entryId, {'is_favorite': isFavorite});
    } catch (_) {
      state = AsyncData(current);
      rethrow;
    }
  }

  Future<void> toggleForSale(String entryId, bool forSale) async {
    final current = state.asData?.value ?? [];
    state = AsyncData(
      current
          .map((e) => e.id == entryId ? e.copyWith(forSale: forSale) : e)
          .toList(),
    );
    try {
      await GamesService.updateLibraryEntry(entryId, {'for_sale': forSale});
    } catch (_) {
      state = AsyncData(current);
      rethrow;
    }
  }

  Future<void> removeGame(String entryId) async {
    final current = state.asData?.value ?? [];
    state = AsyncData(current.where((e) => e.id != entryId).toList());
    try {
      await GamesService.removeGameFromLibrary(entryId);
    } catch (_) {
      state = AsyncData(current);
      rethrow;
    }
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
  }
}

final libraryProvider =
    AsyncNotifierProvider<LibraryNotifier, List<LibraryEntry>>(
  LibraryNotifier.new,
);
