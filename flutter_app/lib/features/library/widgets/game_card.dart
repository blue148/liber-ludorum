import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/library_entry.dart';

enum GameCardLayout { grid, list }

class GameCard extends StatelessWidget {
  final LibraryEntry entry;
  final GameCardLayout layout;
  final VoidCallback onFavorite;
  final VoidCallback onDelete;
  final VoidCallback? onEdit;
  final VoidCallback? onLogPlay;
  final VoidCallback? onToggleForSale;

  const GameCard({
    super.key,
    required this.entry,
    this.layout = GameCardLayout.grid,
    required this.onFavorite,
    required this.onDelete,
    this.onEdit,
    this.onLogPlay,
    this.onToggleForSale,
  });

  @override
  Widget build(BuildContext context) {
    return layout == GameCardLayout.list
        ? _ListCard(entry: entry, onFavorite: onFavorite, onDelete: onDelete, onEdit: onEdit, onLogPlay: onLogPlay, onToggleForSale: onToggleForSale)
        : _GridCard(entry: entry, onFavorite: onFavorite, onDelete: onDelete, onEdit: onEdit, onLogPlay: onLogPlay, onToggleForSale: onToggleForSale);
  }
}

// ── Grid card ────────────────────────────────────────────────────────────────

class _GridCard extends StatelessWidget {
  final LibraryEntry entry;
  final VoidCallback onFavorite;
  final VoidCallback onDelete;
  final VoidCallback? onEdit;
  final VoidCallback? onLogPlay;
  final VoidCallback? onToggleForSale;

  const _GridCard({
    required this.entry,
    required this.onFavorite,
    required this.onDelete,
    this.onEdit,
    this.onLogPlay,
    this.onToggleForSale,
  });

  @override
  Widget build(BuildContext context) {
    final game = entry.game;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.parchment200),
        borderRadius: BorderRadius.circular(4),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Cover image — fills available height, info row takes what it needs
          Expanded(
            child: Stack(
                fit: StackFit.expand,
                children: [
                  _CoverImage(url: game.coverImage, name: game.name),
                  // Favorite star — top left
                  if (entry.isFavorite)
                    const Positioned(
                      top: 6, left: 6,
                      child: Icon(Icons.star, size: 14, color: AppColors.wheat400),
                    ),
                  // For sale badge — top right
                  if (entry.forSale)
                    Positioned(
                      top: 6, right: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                        color: AppColors.forest600,
                        child: Text(
                          'SALE',
                          style: GoogleFonts.jost(fontSize: 8, color: Colors.white, letterSpacing: 1),
                        ),
                      ),
                    ),
                  // Play count — bottom right
                  if (entry.playCount > 0)
                    Positioned(
                      bottom: 6, right: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.65),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '${entry.playCount}×',
                          style: GoogleFonts.jost(
                            fontSize: 9,
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

          // Info row
          Padding(
            padding: const EdgeInsets.fromLTRB(6, 6, 2, 6),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        game.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.jost(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: AppColors.ink600,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          if (game.playerCountLabel.isNotEmpty) ...[
                            const Icon(Icons.people_outline, size: 10, color: AppColors.ink200),
                            const SizedBox(width: 2),
                            Text(game.playerCountLabel, style: GoogleFonts.jost(fontSize: 9, color: AppColors.ink200)),
                            const SizedBox(width: 6),
                          ],
                          if (game.playtimeMinutes != null) ...[
                            const Icon(Icons.timer_outlined, size: 10, color: AppColors.ink200),
                            const SizedBox(width: 2),
                            Text('${game.playtimeMinutes}m', style: GoogleFonts.jost(fontSize: 9, color: AppColors.ink200)),
                          ],
                          if (entry.hasVictoryStats)
                            const Padding(
                              padding: EdgeInsets.only(left: 4),
                              child: Icon(Icons.emoji_events_outlined, size: 10, color: AppColors.wheat400),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                _MenuButton(entry: entry, onFavorite: onFavorite, onDelete: onDelete, onEdit: onEdit, onLogPlay: onLogPlay, onToggleForSale: onToggleForSale),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── List card ─────────────────────────────────────────────────────────────────

class _ListCard extends StatelessWidget {
  final LibraryEntry entry;
  final VoidCallback onFavorite;
  final VoidCallback onDelete;
  final VoidCallback? onEdit;
  final VoidCallback? onLogPlay;
  final VoidCallback? onToggleForSale;

  const _ListCard({
    required this.entry,
    required this.onFavorite,
    required this.onDelete,
    this.onEdit,
    this.onLogPlay,
    this.onToggleForSale,
  });

  @override
  Widget build(BuildContext context) {
    final game = entry.game;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.parchment200),
        borderRadius: BorderRadius.circular(4),
      ),
      clipBehavior: Clip.antiAlias,
      child: Row(
        children: [
          // Thumbnail
          SizedBox(
            width: 72,
            height: 72,
            child: _CoverImage(url: game.coverImage, name: game.name),
          ),

          // Info
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          game.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.jost(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: AppColors.ink600,
                          ),
                        ),
                      ),
                      if (game.isExpansion)
                        Container(
                          margin: const EdgeInsets.only(left: 6),
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                          decoration: BoxDecoration(
                            border: Border.all(color: AppColors.parchment300),
                            borderRadius: BorderRadius.circular(2),
                          ),
                          child: Text('EXP', style: GoogleFonts.jost(fontSize: 9, color: AppColors.ink300)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      if (game.playerCountLabel.isNotEmpty) ...[
                        const Icon(Icons.people_outline, size: 12, color: AppColors.ink200),
                        const SizedBox(width: 3),
                        Text(game.playerCountLabel, style: GoogleFonts.jost(fontSize: 11, color: AppColors.ink300)),
                        const SizedBox(width: 10),
                      ],
                      if (game.playtimeMinutes != null) ...[
                        const Icon(Icons.timer_outlined, size: 12, color: AppColors.ink200),
                        const SizedBox(width: 3),
                        Text('${game.playtimeMinutes} min', style: GoogleFonts.jost(fontSize: 11, color: AppColors.ink300)),
                      ],
                    ],
                  ),
                  if (entry.hasVictoryStats) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.emoji_events_outlined, size: 12, color: AppColors.wheat400),
                        const SizedBox(width: 3),
                        Text(
                          '${entry.victoryStats!.winRate.toStringAsFixed(0)}% win rate',
                          style: GoogleFonts.jost(fontSize: 11, color: AppColors.wheat500),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),

          // Actions
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: Icon(
                  entry.isFavorite ? Icons.star : Icons.star_border,
                  size: 18,
                  color: entry.isFavorite ? AppColors.wheat400 : AppColors.ink200,
                ),
                onPressed: onFavorite,
                padding: const EdgeInsets.all(8),
                constraints: const BoxConstraints(),
              ),
              _MenuButton(
                entry: entry,
                onFavorite: onFavorite,
                onDelete: onDelete,
                onEdit: onEdit,
                onLogPlay: onLogPlay,
                onToggleForSale: onToggleForSale,
              ),
            ],
          ),
          const SizedBox(width: 4),
        ],
      ),
    );
  }
}

// ── Shared widgets ────────────────────────────────────────────────────────────

class _CoverImage extends StatelessWidget {
  final String? url;
  final String name;

  const _CoverImage({required this.url, required this.name});

  @override
  Widget build(BuildContext context) {
    if (url == null) {
      return Container(
        color: AppColors.parchment100,
        child: const Center(
          child: Icon(Icons.menu_book_outlined, size: 28, color: AppColors.ink100),
        ),
      );
    }
    return CachedNetworkImage(
      imageUrl: url!,
      fit: BoxFit.cover,
      placeholder: (_, __) => Container(color: AppColors.parchment100),
      errorWidget: (_, __, ___) => Container(
        color: AppColors.parchment100,
        child: const Icon(Icons.broken_image_outlined, color: AppColors.ink100),
      ),
    );
  }
}

class _MenuButton extends StatelessWidget {
  final LibraryEntry entry;
  final VoidCallback onFavorite;
  final VoidCallback onDelete;
  final VoidCallback? onEdit;
  final VoidCallback? onLogPlay;
  final VoidCallback? onToggleForSale;

  const _MenuButton({
    required this.entry,
    required this.onFavorite,
    required this.onDelete,
    this.onEdit,
    this.onLogPlay,
    this.onToggleForSale,
  });

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_vert, size: 16, color: AppColors.ink200),
      padding: EdgeInsets.zero,
      itemBuilder: (_) => [
        if (onEdit != null)
          PopupMenuItem(value: 'edit', child: _menuItem(Icons.edit_outlined, 'Edit')),
        PopupMenuItem(
          value: 'favorite',
          child: _menuItem(
            entry.isFavorite ? Icons.star : Icons.star_border,
            entry.isFavorite ? 'Unstar' : 'Star',
          ),
        ),
        if (onLogPlay != null)
          PopupMenuItem(
            value: 'log',
            child: _menuItem(Icons.add_circle_outline, 'Log Play (${entry.playCount})'),
          ),
        if (onToggleForSale != null)
          PopupMenuItem(
            value: 'sale',
            child: _menuItem(
              Icons.sell_outlined,
              entry.forSale ? 'Remove Sale' : 'For Sale',
            ),
          ),
        const PopupMenuDivider(),
        PopupMenuItem(
          value: 'delete',
          child: _menuItem(Icons.delete_outline, 'Remove', color: AppColors.clay500),
        ),
      ],
      onSelected: (action) {
        switch (action) {
          case 'edit': onEdit?.call();
          case 'favorite': onFavorite();
          case 'log': onLogPlay?.call();
          case 'sale': onToggleForSale?.call();
          case 'delete': onDelete();
        }
      },
    );
  }

  Widget _menuItem(IconData icon, String label, {Color? color}) => Row(
        children: [
          Icon(icon, size: 16, color: color ?? AppColors.ink400),
          const SizedBox(width: 10),
          Text(
            label,
            style: GoogleFonts.jost(fontSize: 13, color: color ?? AppColors.ink500),
          ),
        ],
      );
}
