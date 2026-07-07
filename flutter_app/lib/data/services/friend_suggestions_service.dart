import '../../core/supabase_client.dart';
import 'friends_service.dart';

/// Source of friend-name suggestions for the Game Nite "First Player" picker.
/// Abstracted so the UI can depend on the behaviour while tests swap in a
/// fake list instead of hitting Supabase.
abstract interface class FriendSuggestionsStore {
  /// Usernames of friends connected to the current user (e.g. via a shared
  /// library), most useful as-is since there's no meaningful order yet.
  Future<List<String>> load();
}

/// A stub: pulls names from friends who've shared a library with the current
/// user. There's no dedicated "who I play with" concept yet, so shared
/// libraries stand in for "people connected to me" until one exists.
class FriendSuggestionsService implements FriendSuggestionsStore {
  @override
  Future<List<String>> load() async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) return const [];
    return FriendsService.getConnectedFriendNames(userId);
  }
}
