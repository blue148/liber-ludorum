class SessionVictory {
  final String id;
  final String sessionId;
  final String playerName;
  final bool isWinner;
  final int? score;
  final int? placement;
  final DateTime createdAt;

  const SessionVictory({
    required this.id,
    required this.sessionId,
    required this.playerName,
    required this.isWinner,
    this.score,
    this.placement,
    required this.createdAt,
  });

  factory SessionVictory.fromJson(Map<String, dynamic> json) => SessionVictory(
        id: json['id'] as String,
        sessionId: json['session_id'] as String,
        playerName: json['player_name'] as String,
        isWinner: json['is_winner'] as bool? ?? false,
        score: json['score'] as int?,
        placement: json['placement'] as int?,
        createdAt: DateTime.parse(json['created_at'] as String),
      );

  Map<String, dynamic> toInsertJson(String sessionId) => {
        'session_id': sessionId,
        'player_name': playerName,
        'is_winner': isWinner,
        'score': score,
        'placement': placement,
      };
}
