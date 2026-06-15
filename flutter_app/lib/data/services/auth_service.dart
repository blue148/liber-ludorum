import '../../core/supabase_client.dart';
import '../models/profile.dart';

abstract class AuthService {
  static Future<void> signIn({
    required String email,
    required String password,
  }) async {
    await supabase.auth.signInWithPassword(email: email, password: password);
  }

  static Future<void> signUp({
    required String email,
    required String password,
    required String username,
  }) async {
    await supabase.auth.signUp(
      email: email,
      password: password,
      data: {'username': username},
    );
  }

  static Future<void> signOut() async {
    await supabase.auth.signOut();
  }

  /// Permanently deletes the current user's account and all associated data
  /// via the `delete-account` edge function, then clears the local session
  /// (which triggers the router redirect back to the auth screen).
  static Future<void> deleteAccount() async {
    final response = await supabase.functions.invoke('delete-account');
    if (response.status != 200) {
      throw Exception('Failed to delete account. Please try again.');
    }
    await supabase.auth.signOut();
  }

  static Future<AppProfile?> getProfile(String userId) async {
    final data = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .maybeSingle();
    return data == null ? null : AppProfile.fromJson(data);
  }

  static Future<AppProfile> updateProfile(
      String userId, Map<String, dynamic> updates) async {
    final data = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    return AppProfile.fromJson(data);
  }
}
