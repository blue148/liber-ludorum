import '../../core/supabase_client.dart';
import '../models/game_session.dart';
import '../models/session_victory.dart';
import '../models/victory_stats.dart';

abstract class SessionsService {
  static Future<GameSession> createSession({
    required String userId,
    required String gameId,
    required DateTime sessionDate,
    int? durationMinutes,
    int? playerCount,
    String? notes,
  }) async {
    final data = await supabase
        .from('game_sessions')
        .insert({
          'user_id': userId,
          'game_id': gameId,
          'session_date': sessionDate.toIso8601String(),
          'duration_minutes': durationMinutes,
          'player_count': playerCount,
          'notes': notes,
        })
        .select('*, game:shared_games(*)')
        .single();
    return GameSession.fromJson(data);
  }

  static Future<void> updateSession(
      String sessionId, Map<String, dynamic> updates) async {
    await supabase.from('game_sessions').update(updates).eq('id', sessionId);
  }

  static Future<void> deleteSession(String sessionId) async {
    await supabase.from('game_sessions').delete().eq('id', sessionId);
  }

  static Future<List<GameSession>> getUserSessions(String userId) async {
    final data = await supabase
        .from('game_sessions')
        .select('*, game:shared_games(*), victories:session_victories(*)')
        .eq('user_id', userId)
        .order('session_date', ascending: false);
    return data.map((e) => GameSession.fromJson(e)).toList();
  }

  static Future<SessionVictory> addVictory(
      String sessionId, SessionVictory victory) async {
    final data = await supabase
        .from('session_victories')
        .insert(victory.toInsertJson(sessionId))
        .select()
        .single();
    return SessionVictory.fromJson(data);
  }

  static Future<void> addMultipleVictories(
      String sessionId, List<SessionVictory> victories) async {
    if (victories.isEmpty) return;
    await supabase.from('session_victories').insert(
          victories.map((v) => v.toInsertJson(sessionId)).toList(),
        );
  }

  static Future<VictoryStats> getGameVictoryStats(
      String userId, String gameId) async {
    final data = await supabase.rpc(
      'get_user_game_victory_stats',
      params: {'p_user_id': userId, 'p_game_id': gameId},
    );
    return VictoryStats.fromJson(data as Map<String, dynamic>);
  }

  static Future<VictoryStats> getOverallVictoryStats(String userId) async {
    final data = await supabase.rpc(
      'get_user_overall_victory_stats',
      params: {'p_user_id': userId},
    );
    return VictoryStats.fromJson(data as Map<String, dynamic>);
  }
}
