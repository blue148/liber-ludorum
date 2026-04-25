import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/supabase_client.dart';
import '../data/models/wishlist_entry.dart';
import '../data/services/games_service.dart';
import 'library_provider.dart';

final wishlistProvider =
    AsyncNotifierProvider<WishlistNotifier, List<WishlistEntry>>(
        WishlistNotifier.new);

class WishlistNotifier extends AsyncNotifier<List<WishlistEntry>> {
  @override
  Future<List<WishlistEntry>> build() async {
    final user = supabase.auth.currentUser;
    if (user == null) return [];
    return GamesService.getUserWishlist(user.id);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(build);
  }

  Future<void> removeEntry(String entryId) async {
    final prev = state.asData?.value ?? [];
    state = AsyncData(prev.where((e) => e.id != entryId).toList());
    try {
      await GamesService.removeGameFromWishlist(entryId);
    } catch (_) {
      state = AsyncData(prev);
      rethrow;
    }
  }

  Future<void> moveToLibrary(String entryId, String gameId) async {
    final user = supabase.auth.currentUser;
    if (user == null) return;
    final prev = state.asData?.value ?? [];
    state = AsyncData(prev.where((e) => e.id != entryId).toList());
    try {
      await GamesService.moveWishlistToLibrary(user.id, gameId);
      ref.invalidate(libraryProvider);
    } catch (_) {
      state = AsyncData(prev);
      rethrow;
    }
  }
}
