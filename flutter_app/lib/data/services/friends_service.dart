import '../../core/supabase_client.dart';
import '../models/friend.dart';
import '../models/library_entry.dart';
import '../models/profile.dart';

abstract class FriendsService {
  // ── Friends ────────────────────────────────────────────────────────────────

  static Future<List<UserFriend>> getUserFriends(String userId) async {
    final data = await supabase
        .from('user_friends')
        .select('*, friend:profiles!friend_id(*)')
        .eq('user_id', userId)
        .eq('status', 'accepted');
    return data.map((e) => UserFriend.fromJson(e)).toList();
  }

  static Future<List<UserFriend>> getPendingRequests(String userId) async {
    final data = await supabase
        .from('user_friends')
        .select('*, friend:profiles!user_id(*)')
        .eq('friend_id', userId)
        .eq('status', 'pending');
    return data.map((e) => UserFriend.fromJson(e)).toList();
  }

  static Future<void> sendFriendRequest(
      String userId, String friendId) async {
    await supabase.from('user_friends').insert({
      'user_id': userId,
      'friend_id': friendId,
      'status': 'pending',
    });
  }

  static Future<void> acceptRequest(String requestId) async {
    await supabase
        .from('user_friends')
        .update({'status': 'accepted'}).eq('id', requestId);
  }

  static Future<void> removeFriend(String userId, String friendId) async {
    await supabase
        .from('user_friends')
        .delete()
        .eq('user_id', userId)
        .eq('friend_id', friendId);
  }

  static Future<void> blockUser(String userId, String blockId) async {
    await supabase
        .from('user_friends')
        .update({'status': 'blocked'})
        .eq('user_id', userId)
        .eq('friend_id', blockId);
  }

  static Future<List<AppProfile>> searchUsers(String query) async {
    final data = await supabase
        .from('profiles')
        .select()
        .ilike('username', '%$query%')
        .limit(20);
    return data.map((e) => AppProfile.fromJson(e)).toList();
  }

  // ── Library sharing ────────────────────────────────────────────────────────

  static Future<List<SharedLibraryAccess>> getSharedLibraries(
      String userId) async {
    final data = await supabase
        .from('shared_library_access')
        .select('*, owner:profiles!owner_id(*)')
        .eq('viewer_id', userId);
    return data.map((e) => SharedLibraryAccess.fromJson(e)).toList();
  }

  static Future<void> shareLibraryWith(
      String ownerId, String viewerId, String accessLevel) async {
    await supabase.from('shared_library_access').upsert({
      'owner_id': ownerId,
      'viewer_id': viewerId,
      'access_level': accessLevel,
    });
  }

  static Future<void> revokeLibraryAccess(
      String ownerId, String viewerId) async {
    await supabase
        .from('shared_library_access')
        .delete()
        .eq('owner_id', ownerId)
        .eq('viewer_id', viewerId);
  }

  static Future<List<LibraryEntry>> getSharedLibraryGames(
      String ownerId) async {
    final data = await supabase
        .from('user_library')
        .select('*, game:shared_games(*)')
        .eq('user_id', ownerId)
        .order('added_date', ascending: false);
    return data.map((e) => LibraryEntry.fromJson(e)).toList();
  }

  // ── Player name suggestions ────────────────────────────────────────────────

  /// Usernames of friends who've shared a library with [userId] — a stub
  /// source of quick-select names (e.g. for the Game Nite "First Player"
  /// picker) until a dedicated "who I play with" concept exists.
  static Future<List<String>> getConnectedFriendNames(String userId) async {
    final shared = await getSharedLibraries(userId);
    return [
      for (final access in shared)
        if (access.owner != null) access.owner!.username,
    ];
  }
}
