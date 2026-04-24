import { BookOpen, TrendingUp, Star, Clock, Trophy, Target } from 'lucide-react';
import StatCard from './StatCard';
import VictoryStatsCard from './VictoryStatsCard';
import { DashboardStats } from '../../lib/dashboard';

interface QuickStatsProps {
  stats: DashboardStats;
}

export default function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="space-y-6">
      {/* Main Collection Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0.5">
        <StatCard
          icon={<BookOpen className="w-5 h-5" strokeWidth={1.5} />}
          label="Total Entries"
          value={stats.totalGames}
          gradient={true}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" strokeWidth={1.5} />}
          label="Total Sessions"
          value={stats.totalPlays}
          gradient={true}
        />
        <StatCard
          icon={<Star className="w-5 h-5" strokeWidth={1.5} />}
          label="Starred"
          value={stats.favoriteCount}
        />
        <StatCard
          icon={<Clock className="w-5 h-5" strokeWidth={1.5} />}
          label="Unplayed"
          value={stats.unplayedCount}
          sublabel={stats.totalGames > 0 ? `${Math.round((stats.unplayedCount / stats.totalGames) * 100)}% of collection` : undefined}
        />
      </div>

      {/* Victory Statistics */}
      {stats.victoryStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0.5">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-0.5">
            <StatCard
              icon={<Trophy className="w-5 h-5 text-gold-500" strokeWidth={1.5} />}
              label="Victory Sessions"
              value={stats.victoryStats.totalSessions}
              sublabel={`${stats.victoryStats.gamesPlayed} different games`}
              gradient={true}
            />
            <StatCard
              icon={<Target className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />}
              label="Win Rate"
              value={`${stats.victoryStats.winRate.toFixed(0)}%`}
              sublabel={`${stats.victoryStats.totalWins} wins total`}
              gradient={true}
            />
          </div>
          <VictoryStatsCard victoryStats={stats.victoryStats} />
        </div>
      )}
    </div>
  );
}
