import 'game.dart';

class WishlistEntry {
  final String id;
  final String userId;
  final String gameId;
  final Game game;
  final String priority; // 'high' | 'medium' | 'low'
  final String? notes;
  final DateTime addedDate;
  final DateTime updatedAt;

  const WishlistEntry({
    required this.id,
    required this.userId,
    required this.gameId,
    required this.game,
    required this.priority,
    this.notes,
    required this.addedDate,
    required this.updatedAt,
  });

  factory WishlistEntry.fromJson(Map<String, dynamic> json) {
    final gameJson = json['game'] as Map<String, dynamic>?;
    return WishlistEntry(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      gameId: json['game_id'] as String,
      game: gameJson != null
          ? Game.fromJson(gameJson)
          : Game(
              id: json['game_id'] as String,
              name: 'Unknown',
              createdAt: DateTime.now(),
              updatedAt: DateTime.now(),
            ),
      priority: json['priority'] as String? ?? 'medium',
      notes: json['notes'] as String?,
      addedDate: DateTime.parse(json['added_date'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
}
