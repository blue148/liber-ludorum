import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/services/friend_suggestions_service.dart';

/// The backing source for friend-name suggestions in the Game Nite "First
/// Player" recents list. Overridden in tests with a fake list.
final friendSuggestionsStoreProvider = Provider<FriendSuggestionsStore>(
  (ref) => FriendSuggestionsService(),
);
