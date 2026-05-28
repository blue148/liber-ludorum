import { Trophy, Target, TrendingUp, Calendar } from 'lucide-react';

interface VictoryStatsCardProps {
  victoryStats: {
    totalSessions: number;
    totalWins: number;
    winRate: number;
    gamesPlayed: number;
    lastSession?: string;
  };
}

export default function VictoryStatsCard({ victoryStats }: VictoryStatsCardProps) {
  const { totalSessions, totalWins, winRate, gamesPlayed, lastSession } = victoryStats;

  const formatLastSession = (dateStr?: string) => {
    if (!dateStr) return 'Never';

    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch {
      return 'Unknown';
    }
  };

  const getWinRateColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (totalSessions === 0) {
    return (
      <div className="bg-cream linen-texture border thin-rule rule-line p-6 text-center">
        <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-3" strokeWidth={1} />
        <h3 className="text-lg font-display font-light text-slate-900 mb-2">Victory Tracking</h3>
        <p className="text-sm font-body text-slate-600 mb-4">
          Start logging game sessions with winners to see your victory statistics here.
        </p>
        <div className="text-xs font-body text-slate-500 uppercase tracking-wider">
          No sessions recorded yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream linen-texture border thin-rule rule-line">
      <div className="border-b thin-rule rule-line p-4">
        <h3 className="text-xs font-body text-slate-500 uppercase tracking-widest mb-1">Victory Statistics</h3>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gold-500" strokeWidth={1.5} />
          <span className="text-lg font-display font-light text-slate-900">
            {totalWins} Win{totalWins !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Win Rate */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className="w-4 h-4 text-slate-500 mr-1" strokeWidth={1.5} />
            <span className="text-xs font-body text-slate-500 uppercase tracking-wider">Win Rate</span>
          </div>
          <div className={`text-xl font-display font-medium ${getWinRateColor(winRate)}`}>
            {winRate.toFixed(0)}%
          </div>
          <div className="text-xs font-body text-slate-600">
            {totalWins} of {totalSessions}
          </div>
        </div>

        {/* Games Played */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-slate-500 mr-1" strokeWidth={1.5} />
            <span className="text-xs font-body text-slate-500 uppercase tracking-wider">Games</span>
          </div>
          <div className="text-xl font-display font-medium text-slate-900">
            {gamesPlayed}
          </div>
          <div className="text-xs font-body text-slate-600">
            different games
          </div>
        </div>

        {/* Total Sessions */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4 text-slate-500 mr-1" strokeWidth={1.5} />
            <span className="text-xs font-body text-slate-500 uppercase tracking-wider">Sessions</span>
          </div>
          <div className="text-xl font-display font-medium text-slate-900">
            {totalSessions}
          </div>
          <div className="text-xs font-body text-slate-600">
            total sessions
          </div>
        </div>

        {/* Last Session */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="w-4 h-4 rounded-full bg-slate-400 mr-1" />
            <span className="text-xs font-body text-slate-500 uppercase tracking-wider">Last</span>
          </div>
          <div className="text-sm font-display font-medium text-slate-900">
            {formatLastSession(lastSession)}
          </div>
          <div className="text-xs font-body text-slate-600">
            session played
          </div>
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="border-t thin-rule rule-line p-3">
        <div className="flex items-center justify-center gap-2">
          {winRate >= 60 && (
            <>
              <Trophy className="w-4 h-4 text-gold-500" strokeWidth={1.5} />
              <span className="text-xs font-body text-gold-600 uppercase tracking-wider">
                Strong Performance
              </span>
            </>
          )}
          {winRate >= 40 && winRate < 60 && (
            <>
              <Target className="w-4 h-4 text-slate-600" strokeWidth={1.5} />
              <span className="text-xs font-body text-slate-600 uppercase tracking-wider">
                Balanced Player
              </span>
            </>
          )}
          {winRate < 40 && totalSessions >= 5 && (
            <>
              <TrendingUp className="w-4 h-4 text-terracotta-600" strokeWidth={1.5} />
              <span className="text-xs font-body text-terracotta-600 uppercase tracking-wider">
                Room to Grow
              </span>
            </>
          )}
          {totalSessions < 5 && (
            <span className="text-xs font-body text-slate-500 uppercase tracking-wider">
              Building History
            </span>
          )}
        </div>
      </div>
    </div>
  );
}