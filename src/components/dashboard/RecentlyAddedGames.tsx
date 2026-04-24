import { Gamepad2, ChevronRight } from 'lucide-react';
import { PlayedGameStat } from '../../lib/dashboard';

interface RecentlyAddedGamesProps {
  games: PlayedGameStat[];
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

export default function RecentlyAddedGames({ games }: RecentlyAddedGamesProps) {
  if (games.length === 0) return null;

  return (
    <>
      {/* ── Mobile: compact rows ────────────────────────────────────────────── */}
      <div className="md:hidden space-y-1.5">
        {games.slice(0, 5).map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 p-2.5 bg-white border border-parchment-300">
            <div className="w-10 h-10 bg-parchment-100 flex-shrink-0 overflow-hidden">
              {entry.game.cover_image ? (
                <img
                  src={entry.game.cover_image}
                  alt={entry.game.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-ink-200" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-body text-[13px] font-medium text-ink-600 truncate">{entry.game.name}</div>
              <div className="font-body text-[11px] text-ink-200 mt-0.5">{getRelativeTime(entry.added_date)}</div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-ink-200 flex-shrink-0" strokeWidth={1.5} />
          </div>
        ))}
      </div>

      {/* ── Desktop: cover grid ──────────────────────────────────────────────── */}
      <div className="hidden md:block bg-white container-radius shadow-sm border border-container p-6">
        <div className="flex items-center space-x-2 mb-6">
          <h2 className="text-xl font-display font-light text-ink-600">Recently Added</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {games.map((entry) => (
            <div key={entry.id} className="group cursor-pointer">
              <div className="aspect-square container-radius overflow-hidden bg-parchment-100 mb-2 shadow-sm group-hover:shadow-md transition">
                {entry.game.cover_image ? (
                  <img
                    src={entry.game.cover_image}
                    alt={entry.game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gamepad2 className="w-12 h-12 text-ink-200" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-body font-medium text-sm text-ink-600 truncate group-hover:text-clay-400 transition">
                  {entry.game.name}
                </h3>
                <p className="font-body text-xs text-ink-200 mt-1">{getRelativeTime(entry.added_date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
