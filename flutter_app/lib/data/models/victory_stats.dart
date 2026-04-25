class VictoryStats {
  final int totalSessions;
  final int totalWins;
  final double winRate;
  final int? bestScore;
  final DateTime? lastPlayed;

  const VictoryStats({
    required this.totalSessions,
    required this.totalWins,
    required this.winRate,
    this.bestScore,
    this.lastPlayed,
  });

  factory VictoryStats.fromJson(Map<String, dynamic> json) => VictoryStats(
        totalSessions: (json['total_sessions'] as num).toInt(),
        totalWins: (json['total_wins'] as num).toInt(),
        winRate: (json['win_rate'] as num).toDouble(),
        bestScore: json['best_score'] as int?,
        lastPlayed: json['last_played'] != null
            ? DateTime.parse(json['last_played'] as String)
            : null,
      );
}
