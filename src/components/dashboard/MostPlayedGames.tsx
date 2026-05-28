import { Trophy, Gamepad2 } from 'lucide-react';
import { PlayedGameStat } from '../../lib/dashboard';

interface MostPlayedGamesProps {
  games: PlayedGameStat[];
  maxPlayCount: number;
}

export default function MostPlayedGames({ games, maxPlayCount }: MostPlayedGamesProps) {
  const playedGames = games.filter(game => game.playCount > 0);

  if (playedGames.length === 0) {
    return (
      <div className="bg-white container-radius shadow-sm border border-container p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="p-4 bg-parchment-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8 text-clay-400" />
          </div>
          <h3 className="text-xl font-display font-light text-ink-600 mb-2">No Plays Yet</h3>
          <p className="font-body text-sm text-ink-300">
            Start logging plays to see your most played games here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile: horizontal scroll row ───────────────────────────────────── */}
      <div className="md:hidden -mx-1 overflow-x-auto pb-1">
        <div className="flex gap-3 px-1" style={{ width: 'max-content' }}>
          {playedGames.map((entry) => (
            <div key={entry.id} className="flex-shrink-0 w-[62px] text-center">
              <div className="relative mb-2">
                <div className="w-[62px] h-[62px] bg-parchment-100 overflow-hidden">
                  {entry.game.cover_image ? (
                    <img
                      src={entry.game.cover_image}
                      alt={entry.game.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gamepad2 className="w-6 h-6 text-ink-200" />
                    </div>
                  )}
                </div>
                <div
                  className="absolute -bottom-[7px] -right-[5px] bg-clay-400 rounded-full px-[7px] py-[2px] border-2 border-cream"
                >
                  <span className="font-body text-[9px] font-bold text-cream leading-none">
                    {entry.playCount}×
                  </span>
                </div>
              </div>
              <span className="font-body text-[9px] text-ink-200 leading-tight block mt-3">
                {entry.game.name.length > 10 ? entry.game.name.slice(0, 10) + '…' : entry.game.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Desktop: list with progress bars ────────────────────────────────── */}
      <div className="hidden md:block bg-white container-radius shadow-sm border border-container p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Trophy className="w-5 h-5 text-clay-400" />
          <h2 className="text-xl font-display font-light text-ink-600">Most Played Games</h2>
        </div>

        <div className="space-y-4">
          {playedGames.map((entry, index) => {
            const percentage = maxPlayCount > 0 ? (entry.playCount / maxPlayCount) * 100 : 0;
            return (
              <div key={entry.id} className="flex items-center space-x-4 p-3 container-radius hover:bg-parchment-100 transition">
                <div className="flex-shrink-0 w-8 text-center">
                  <span className={`text-lg font-bold ${
                    index === 0 ? 'text-wheat-400' :
                    index === 1 ? 'text-ink-200'   :
                    index === 2 ? 'text-clay-400'  :
                    'text-ink-300'
                  }`}>
                    {index + 1}
                  </span>
                </div>
                <div className="flex-shrink-0 w-16 h-16 container-radius overflow-hidden bg-parchment-100">
                  {entry.game.cover_image ? (
                    <img src={entry.game.cover_image} alt={entry.game.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gamepad2 className="w-8 h-8 text-ink-200" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-body font-medium text-ink-600 truncate">{entry.game.name}</h3>
                  <p className="font-body text-sm text-ink-300 truncate">
                    {entry.game.publisher}{entry.game.year && ` · ${entry.game.year}`}
                  </p>
                </div>
                <div className="flex-shrink-0 w-32">
                  <div className="flex items-center justify-end space-x-2 mb-1">
                    <span className="font-body text-sm font-semibold text-ink-600">{entry.playCount}</span>
                    <span className="font-body text-xs text-ink-200">
                      {entry.playCount === 1 ? 'play' : 'plays'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-parchment-200 overflow-hidden">
                    <div
                      className="h-full bg-clay-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
