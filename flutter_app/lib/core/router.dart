import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../data/models/library_entry.dart';
import '../features/auth/auth_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/game_nite/dice_roller_page.dart';
import '../features/game_nite/game_nite_screen.dart';
import '../features/library/game_detail_screen.dart';
import '../features/library/library_screen.dart';
import '../features/library/manual_game_entry_page.dart';
import '../features/profile/profile_screen.dart';
import '../features/scanner/scanner_screen.dart';
import '../features/shell/app_shell.dart';
import '../providers/auth_provider.dart';
import 'supabase_client.dart';

// ChangeNotifier that triggers router refresh when auth state changes
class _AuthChangeNotifier extends ChangeNotifier {
  _AuthChangeNotifier() {
    supabase.auth.onAuthStateChange.listen((_) => notifyListeners());
  }
}

final _authChangeNotifier = _AuthChangeNotifier();

final routerProvider = Provider<GoRouter>((ref) {
  // Watch auth so the provider rebuilds if needed (belt-and-suspenders)
  ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/dashboard',
    refreshListenable: _authChangeNotifier,
    redirect: (context, state) {
      final isAuthenticated = supabase.auth.currentSession != null;
      final onAuth = state.matchedLocation == '/auth';

      if (!isAuthenticated && !onAuth) return '/auth';
      if (isAuthenticated && onAuth) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(
        path: '/auth',
        builder: (_, __) => const AuthScreen(),
      ),
      GoRoute(
        path: '/game/:entryId',
        builder: (_, state) => GameDetailScreen(
          entryId: state.pathParameters['entryId']!,
          initialEntry: state.extra as LibraryEntry?,
        ),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/dashboard',
                builder: (_, __) => const DashboardScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/game-nite',
              builder: (_, __) => const GameNiteScreen(),
              routes: [
                GoRoute(
                  path: 'chooser',
                  builder: (_, __) => const GameChooserPage(),
                ),
                GoRoute(
                  path: 'first-player',
                  builder: (_, __) => const FirstPlayerPage(),
                ),
                GoRoute(
                  path: 'turn-timer',
                  builder: (_, __) => const TurnTimerPage(),
                ),
                GoRoute(
                  path: 'game-timer',
                  builder: (_, __) => const GameTimerPage(),
                ),
                GoRoute(
                  path: 'dice-roller',
                  builder: (_, __) => const DiceRollerPage(),
                ),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/library',
              builder: (_, __) => const LibraryScreen(),
              routes: [
                GoRoute(
                  path: 'scanner',
                  pageBuilder: (_, __) => const MaterialPage(
                    fullscreenDialog: true,
                    child: ScannerScreen(),
                  ),
                ),
                GoRoute(
                  path: 'manual-add',
                  pageBuilder: (_, state) => MaterialPage(
                    fullscreenDialog: true,
                    child: ManualGameEntryPage(barcode: state.extra as String?),
                  ),
                ),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/profile', builder: (_, __) => const ProfileScreen()),
          ]),
        ],
      ),
    ],
  );
});
