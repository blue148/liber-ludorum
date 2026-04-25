import '../../core/supabase_client.dart';
import '../models/library_entry.dart';
import '../models/game.dart';

class DashboardStats {
  final int totalGames;
  final int favoriteCount;
  final int totalSessions;
  final int totalWins;
  final double winRate;
  final int? totalPlaytimeMinutes;

  const DashboardStats({
    required this.totalGames,
    required this.favoriteCount,
    required this.totalSessions,
    required this.totalWins,
    required this.winRate,
    this.totalPlaytimeMinutes,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) => DashboardStats(
        totalGames: (json['total_games'] as num?)?.toInt() ?? 0,
        favoriteCount: (json['favorite_count'] as num?)?.toInt() ?? 0,
        totalSessions: (json['total_sessions'] as num?)?.toInt() ?? 0,
        totalWins: (json['total_wins'] as num?)?.toInt() ?? 0,
        winRate: (json['win_rate'] as num?)?.toDouble() ?? 0,
        totalPlaytimeMinutes:
            (json['total_playtime_minutes'] as num?)?.toInt(),
      );
}

class MonthlyActivity {
  final DateTime month;
  final int sessionCount;

  const MonthlyActivity({required this.month, required this.sessionCount});
}

abstract class DashboardService {
  static Future<DashboardStats> getStats(String userId) async {
    final data = await supabase.rpc(
      'get_dashboard_stats',
      params: {'p_user_id': userId},
    );
    return DashboardStats.fromJson(data as Map<String, dynamic>);
  }

  static Future<List<LibraryEntry>> getRecentlyAdded(
      String userId, {int limit = 6}) async {
    final data = await supabase
        .from('user_library')
        .select('*, game:shared_games(*)')
        .eq('user_id', userId)
        .order('added_date', ascending: false)
        .limit(limit);
    return data.map((e) => LibraryEntry.fromJson(e)).toList();
  }

  static Future<List<Map<String, dynamic>>> getMostPlayed(
      String userId, {int limit = 5}) async {
    final data = await supabase
        .from('user_library')
        .select('*, game:shared_games(*)')
        .eq('user_id', userId)
        .order('played_dates', ascending: false)
        .limit(limit);
    return List<Map<String, dynamic>>.from(data as List);
  }

  static Future<List<MonthlyActivity>> getPlayActivityByMonth(
      String userId) async {
    final data = await supabase.rpc(
      'get_play_activity_by_month',
      params: {'p_user_id': userId},
    );
    return (data as List)
        .map((e) => MonthlyActivity(
              month: DateTime.parse(e['month'] as String),
              sessionCount: (e['session_count'] as num).toInt(),
            ))
        .toList();
  }
}
