import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats, getMostPlayedGames, getRecentlyAddedGames, getPlayActivityByMonth, DashboardStats, PlayedGameStat, PlayActivity } from '../lib/dashboard';
import QuickStats from './dashboard/QuickStats';
import QuickActions from './dashboard/QuickActions';
import MostPlayedGames from './dashboard/MostPlayedGames';
import RecentlyAddedGames from './dashboard/RecentlyAddedGames';
import PlayActivityChart from './dashboard/PlayActivityChart';
import { toast } from 'sonner';

interface DashboardProps {
  onNavigate?: (tab: 'library' | 'gameNiteTools', params?: { tool?: 'game-chooser' | 'first-player' | 'turn-timer' | 'game-timer' }) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [mostPlayed, setMostPlayed] = useState<PlayedGameStat[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<PlayedGameStat[]>([]);
  const [playActivity, setPlayActivity] = useState<PlayActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    if (!user) return;

    try {
      const [dashboardStats, mostPlayedGames, recentGames, activity] = await Promise.all([
        getDashboardStats(user.id),
        getMostPlayedGames(user.id, 5),
        getRecentlyAddedGames(user.id, 10),
        getPlayActivityByMonth(user.id, 12),
      ]);
      setStats(dashboardStats);
      setMostPlayed(mostPlayedGames);
      setRecentlyAdded(recentGames);
      setPlayActivity(activity);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const handleRefresh = async () => {
    await loadDashboard();
    toast.success('Dashboard refreshed');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-sm text-slate-600">Failed to load statistics</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-slate-900 text-cream font-body text-sm hover:bg-slate-800 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-12">
        {/*
          Mobile order:  Quick Actions → Most Played → Stats → Recently Added → Chart
          Desktop order: Stats → Quick Actions → Most Played → Recently Added → Chart
          Achieved with flex-col + responsive order classes.
        */}
        <div className="flex flex-col">

          {/* Quick Stats — order-3 on mobile, order-1 on desktop */}
          <div className="order-3 md:order-1 mt-8 md:mt-0">
            <QuickStats stats={stats} />
          </div>

          {stats.totalGames > 0 && (
            <div className="order-1 md:order-2 md:mt-8">
              <h2 className="text-xs font-body text-slate-500 tracking-widest mb-4">Quick Actions</h2>
              <QuickActions
                onNavigateToGameNiteTools={(tool) => {
                  if (onNavigate) {
                    onNavigate('gameNiteTools', { tool });
                  } else {
                    toast.info('Switch to the Game Nite Tools tab');
                  }
                }}
              />
            </div>
          )}

          {stats.totalGames > 0 && (
            <div className="order-2 md:order-3 mt-8 md:mt-12">
              <MostPlayedGames
                games={mostPlayed}
                maxPlayCount={mostPlayed[0]?.playCount || 0}
              />
            </div>
          )}

          {stats.totalGames > 0 && recentlyAdded.length > 0 && (
            <div className="order-4 mt-8 md:mt-12">
              <RecentlyAddedGames games={recentlyAdded} />
            </div>
          )}

          {stats.totalGames > 0 && playActivity.length > 0 && (
            <div className="order-5 mt-8 md:mt-12">
              <PlayActivityChart activity={playActivity} />
            </div>
          )}

          {stats.totalGames === 0 && (
            <div className="order-1 mt-12 bg-cream linen-texture border thin-rule rule-line p-16 text-center">
            <div className="max-w-md mx-auto">
              <BookOpen className="w-16 h-16 text-terracotta-400 mx-auto mb-6" strokeWidth={1} />
              <h2 className="text-2xl font-display font-light text-slate-900 mb-3">Begin Your Collection</h2>
              <p className="text-sm font-body text-slate-600 mb-8 leading-relaxed">
                Add games to your library to see statistics about your collection and play history.
              </p>
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('library');
                  } else {
                    toast.info('Switch to the Library tab to add games');
                  }
                }}
                className="px-6 py-3 bg-slate-900 text-cream font-body text-sm uppercase tracking-wider hover:bg-slate-800 transition"
              >
                Visit Library
              </button>
            </div>
          </div>
        )}

        </div>{/* end flex flex-col */}
      </div>
    </div>
  );
}
