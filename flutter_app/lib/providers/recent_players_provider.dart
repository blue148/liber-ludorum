import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/services/recent_players_service.dart';

/// The backing store for the Game Nite "First Player" recents list. Overridden
/// in tests with an in-memory implementation.
final recentPlayersStoreProvider = Provider<RecentPlayersStore>(
  (ref) => RecentPlayersService(),
);
