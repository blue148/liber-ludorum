import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/app_colors.dart';
import '../../data/services/auth_service.dart';
import '../../providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider);
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Could not load profile')),
        data: (profile) => ListView(
          padding: const EdgeInsets.all(24),
          children: [
            // Avatar + name
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: AppColors.forest100,
                    backgroundImage: profile?.avatarUrl != null
                        ? NetworkImage(profile!.avatarUrl!)
                        : null,
                    child: profile?.avatarUrl == null
                        ? Text(
                            (profile?.username ?? user?.email ?? 'U')
                                .substring(0, 1)
                                .toUpperCase(),
                            style: GoogleFonts.cormorantGaramond(
                              fontSize: 32,
                              color: AppColors.forest500,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    profile?.username ?? user?.email ?? '',
                    style: GoogleFonts.cormorantGaramond(
                      fontSize: 26,
                      color: AppColors.ink600,
                    ),
                  ),
                  if (profile?.bio != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      profile!.bio!,
                      style: GoogleFonts.jost(
                          fontSize: 13, color: AppColors.ink300),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 32),
            const Divider(),

            // Stats summary
            if (profile != null) ...[
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _Stat(label: 'Games', value: '${profile.totalGames}'),
                  _Stat(label: 'Favourites', value: '${profile.favoriteCount}'),
                ],
              ),
              const SizedBox(height: 24),
              const Divider(),
            ],

            // Menu items
            const SizedBox(height: 8),
            _MenuItem(
              icon: Icons.list_alt_outlined,
              label: 'Wishlist',
              onTap: () {}, // TODO: navigate to wishlist
            ),
            _MenuItem(
              icon: Icons.people_outline,
              label: 'Friends',
              onTap: () {}, // TODO: navigate to friends
            ),
            _MenuItem(
              icon: Icons.share_outlined,
              label: 'Shared Libraries',
              onTap: () {}, // TODO: navigate to shared libraries
            ),
            _MenuItem(
              icon: Icons.settings_outlined,
              label: 'Settings',
              onTap: () {}, // TODO: navigate to settings
            ),

            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 8),

            // Sign out
            _MenuItem(
              icon: Icons.logout,
              label: 'Sign Out',
              color: AppColors.clay500,
              onTap: () => _confirmSignOut(context, ref),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmSignOut(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Sign out?',
            style: GoogleFonts.cormorantGaramond(fontSize: 22)),
        content: Text('You will need to sign in again to access your library.',
            style: GoogleFonts.jost(fontSize: 14, color: AppColors.ink400)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await AuthService.signOut();
            },
            child: Text('Sign Out',
                style: GoogleFonts.jost(color: AppColors.clay500)),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;

  const _Stat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value,
            style: GoogleFonts.cormorantGaramond(
                fontSize: 28, color: AppColors.ink600)),
        Text(label,
            style: GoogleFonts.jost(fontSize: 11, color: AppColors.ink300)),
      ],
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.ink500;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 0),
      leading: Icon(icon, color: c, size: 22),
      title: Text(label,
          style: GoogleFonts.jost(fontSize: 15, color: c)),
      trailing: color == null
          ? const Icon(Icons.chevron_right, color: AppColors.ink200)
          : null,
      onTap: onTap,
    );
  }
}
