import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/supabase_client.dart';
import '../data/models/profile.dart';
import '../data/services/auth_service.dart';

final authStateProvider = StreamProvider<AuthState>((ref) {
  return supabase.auth.onAuthStateChange;
});

final currentUserProvider = Provider<User?>((ref) {
  return supabase.auth.currentUser;
});

final profileProvider = FutureProvider.autoDispose<AppProfile?>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return null;
  return AuthService.getProfile(user.id);
});
