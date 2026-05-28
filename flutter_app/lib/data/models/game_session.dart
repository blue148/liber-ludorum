import 'game.dart';
import 'session_victory.dart';

class GameSession {
  final String id;
  final String userId;
  final String gameId;
  final Game? game;
  final DateTime sessionDate;
  final int? durationMinutes;
  final int? playerCount;
  final String? notes;
  final List<SessionVictory> victories;
  final DateTime createdAt;
  final DateTime updatedAt;

  const GameSession({
    required this.id,
    required this.userId,
    required this.gameId,
    this.game,
    required this.sessionDate,
    this.durationMinutes,
    this.playerCount,
    this.notes,
    this.victories = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  factory GameSession.fromJson(Map<String, dynamic> json) => GameSession(
        id: json['id'] as String,
        userId: json['user_id'] as String,
        gameId: json['game_id'] as String,
        game: json['game'] != null
            ? Game.fromJson(json['game'] as Map<String, dynamic>)
            : null,
        sessionDate: DateTime.parse(json['session_date'] as String),
        durationMinutes: json['duration_minutes'] as int?,
        playerCount: json['player_count'] as int?,
        notes: json['notes'] as String?,
        victories: ((json['victories'] as List<dynamic>?) ?? [])
            .map((v) => SessionVictory.fromJson(v as Map<String, dynamic>))
            .toList(),
        createdAt: DateTime.parse(json['created_at'] as String),
        updatedAt: DateTime.parse(json['updated_at'] as String),
      );
}
