import { useState } from 'react';
import { Star, Trash2, CreditCard as Edit, DollarSign, Users, Clock, Plus, MoreVertical, BookOpen, Trophy, UserCheck } from 'lucide-react';
import { UserLibraryEntry, UserLibraryEntryWithStats, Game, Profile } from '../lib/supabase';
import Tooltip from './Tooltip';

interface GameCardProps {
  entry: (UserLibraryEntry | UserLibraryEntryWithStats) & { game: Game };
  onToggleFavorite: (entryId: string, isFavorite: boolean) => void;
  onToggleForSale?: (entryId: string, forSale: boolean) => void;
  onDelete: (entryId: string) => void;
  onEdit: (entry: (UserLibraryEntry | UserLibraryEntryWithStats) & { game: Game }) => void;
  onAddPlay?: (entryId: string) => void;
  layout?: 'grid' | 'list';
  isShared?: boolean;
  owner?: Profile;
}

export default function GameCard({ entry, onToggleFavorite, onToggleForSale, onDelete, onEdit, onAddPlay, layout = 'grid', isShared = false, owner }: GameCardProps) {
  const { game } = entry;
  const playCount = entry.played_dates?.length || 0;
  const [showMenu, setShowMenu] = useState(false);

  const victoryStats = 'victory_stats' in entry ? entry.victory_stats : undefined;
  const hasVictoryStats = victoryStats && victoryStats.total_sessions > 0;

  // ── List layout ───────────────────────────────────────────────────────────────
  if (layout === 'list') {
    return (
      <div className="bg-white border border-parchment-200 hover:border-parchment-300 hover:shadow-sm transition group flex relative">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-parchment-100 flex-shrink-0 overflow-hidden rounded-l-[2px]">
          {game.cover_image ? (
            <img src={game.cover_image} alt={game.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-200">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="flex-1 p-3 sm:p-4 flex items-center min-w-0">
          <div className="flex-1 min-w-0 mr-2 sm:mr-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-body font-medium text-ink-600 truncate text-sm sm:text-base">{game.name}</h3>
              {game.is_expansion && (
                <span className="flex-shrink-0 px-1.5 py-0.5 bg-parchment-100 text-ink-300 text-xs font-body border border-parchment-300 rounded-sm">EXP</span>
              )}
              {isShared && owner && (
                <span className="flex-shrink-0 px-1.5 py-0.5 bg-plum-50 text-plum-400 text-xs font-body border border-plum-100 rounded-sm flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  <span className="hidden sm:inline">{owner.username}</span>
                  <span className="sm:hidden">{owner.username.charAt(0).toUpperCase()}</span>
                </span>
              )}
              {entry.for_sale && (
                <span className="flex-shrink-0 px-1.5 py-0.5 bg-forest-50 text-forest-500 text-xs font-body border border-forest-100 rounded-sm flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span className="hidden sm:inline">Sale</span>
                </span>
              )}
            </div>
            {(game.min_players || game.max_players) && (
              <div className="flex items-center gap-2 text-xs font-body text-ink-300 mb-1">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={1.5} />
                <span>
                  {game.min_players === game.max_players
                    ? `${game.min_players} player${game.min_players && game.min_players > 1 ? 's' : ''}`
                    : `${game.min_players || '?'}-${game.max_players || '?'} players`}
                </span>
                {game.year && <><span className="hidden sm:inline text-ink-100">·</span><span className="hidden sm:inline">{game.year}</span></>}
              </div>
            )}
            <div className="flex items-center gap-2 sm:gap-3 text-xs font-body text-ink-300 flex-wrap">
              {game.playtime_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" strokeWidth={1.5} />
                  <span className="hidden sm:inline">{game.playtime_minutes} min</span>
                  <span className="sm:hidden">{game.playtime_minutes}m</span>
                </div>
              )}
              {hasVictoryStats && (
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-wheat-400" strokeWidth={1.5} />
                  <span>{victoryStats.win_rate.toFixed(0)}% win</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <div className="relative">
              <Tooltip content="More options">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 sm:p-2 bg-parchment-100 text-ink-300 hover:bg-parchment-200 hover:text-ink-500 transition"
                >
                  <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.5} />
                </button>
              </Tooltip>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowMenu(false)} />
                  <div className="absolute left-0 mt-1 w-40 bg-cream border border-parchment-300 shadow-lg py-1 z-[101]">
                    {!isShared && (
                      <>
                        <button onClick={() => { setShowMenu(false); onEdit(entry); }}
                          className="w-full px-4 py-2 text-left text-xs font-body text-ink-400 hover:bg-parchment-100 flex items-center gap-2">
                          <Edit className="w-3.5 h-3.5" strokeWidth={1.5} /><span>Edit Details</span>
                        </button>
                        {onAddPlay && (
                          <button onClick={() => { setShowMenu(false); onAddPlay(entry.id); }}
                            className="w-full px-4 py-2 text-left text-xs font-body text-ink-400 hover:bg-parchment-100 flex items-center gap-2">
                            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} /><span>Log Play ({playCount})</span>
                          </button>
                        )}
                        {onToggleForSale && (
                          <button onClick={() => { setShowMenu(false); onToggleForSale(entry.id, !entry.for_sale); }}
                            className="w-full px-4 py-2 text-left text-xs font-body text-ink-400 hover:bg-parchment-100 flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5" strokeWidth={1.5} /><span>{entry.for_sale ? 'Remove Sale' : 'Mark for Sale'}</span>
                          </button>
                        )}
                        <button onClick={() => { setShowMenu(false); onDelete(entry.id); }}
                          className="w-full px-4 py-2 text-left text-xs font-body text-clay-500 hover:bg-clay-50 flex items-center gap-2">
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} /><span>Remove</span>
                        </button>
                      </>
                    )}
                    {isShared && owner && (
                      <div className="px-4 py-3 text-xs font-body text-ink-300 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <UserCheck className="w-3.5 h-3.5" /><span className="font-medium">{owner.username}'s</span>
                        </div>
                        <p className="text-[10px] text-ink-200 uppercase tracking-wider">Read-only</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {!isShared && (
              <Tooltip content={entry.is_favorite ? 'Unstar' : 'Star'}>
                <button
                  onClick={() => onToggleFavorite(entry.id, !entry.is_favorite)}
                  className={`p-1.5 sm:p-2 transition ${entry.is_favorite ? 'bg-wheat-50 text-wheat-400' : 'bg-parchment-100 text-ink-200 hover:bg-wheat-50 hover:text-wheat-400'}`}
                >
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={entry.is_favorite ? 'currentColor' : 'none'} strokeWidth={1.5} />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Grid layout — minimal Herbarium style ─────────────────────────────────────
  return (
    <div className="bg-white border border-parchment-200 hover:border-parchment-300 transition flex flex-col overflow-hidden relative group">
      {/* Cover */}
      <div className="aspect-[3/4] bg-parchment-100 relative overflow-hidden">
        {game.cover_image ? (
          <img src={game.cover_image} alt={game.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-200">
            <BookOpen className="w-8 h-8" strokeWidth={1} />
          </div>
        )}

        {/* Fav star — top-left, visible when active */}
        {entry.is_favorite && (
          <div className="absolute top-1.5 left-1.5">
            <Star className="w-3.5 h-3.5 text-wheat-400 drop-shadow-sm" fill="currentColor" strokeWidth={0} />
          </div>
        )}

        {/* For-sale badge — top-right */}
        {entry.for_sale && (
          <div className="absolute top-1.5 right-1.5 bg-forest-600 text-cream px-1.5 py-0.5">
            <span className="text-[9px] font-body uppercase tracking-wider leading-none">Sale</span>
          </div>
        )}

        {/* Play count badge — bottom-right */}
        {playCount > 0 && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/70 rounded-full px-1.5 py-0.5">
            <span className="font-body text-[9px] font-semibold text-white leading-none">{playCount}×</span>
          </div>
        )}

        {/* Shared owner badge */}
        {isShared && owner && (
          <div className="absolute bottom-1.5 left-1.5 right-1.5">
            <div className="bg-plum-500/80 backdrop-blur-sm text-white px-2 py-0.5 text-center">
              <span className="text-[9px] font-body">{owner.username}</span>
            </div>
          </div>
        )}
      </div>

      {/* Minimal info area */}
      <div className="px-1.5 pt-1.5 pb-1 flex-1 flex flex-col">
        <div className="flex items-start gap-1 mb-1">
          <h3 className="flex-1 font-body text-[11px] font-medium text-ink-600 leading-snug line-clamp-2 min-w-0">
            {game.name}
          </h3>
          {/* ⋮ menu */}
          <div className="relative flex-shrink-0 -mt-0.5">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-5 h-5 flex items-center justify-center text-ink-200 hover:text-ink-400 transition"
            >
              <MoreVertical className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-0.5 w-40 bg-cream border border-parchment-300 shadow-lg py-1 z-[101]">
                  {!isShared && (
                    <>
                      <button onClick={() => { setShowMenu(false); onEdit(entry); }}
                        className="w-full px-3 py-2 text-left text-xs font-body text-ink-400 hover:bg-parchment-100 flex items-center gap-2">
                        <Edit className="w-3.5 h-3.5" strokeWidth={1.5} /><span>Edit</span>
                      </button>
                      <button onClick={() => { setShowMenu(false); onToggleFavorite(entry.id, !entry.is_favorite); }}
                        className="w-full px-3 py-2 text-left text-xs font-body text-ink-400 hover:bg-parchment-100 flex items-center gap-2">
                        <Star className="w-3.5 h-3.5" strokeWidth={1.5} fill={entry.is_favorite ? 'currentColor' : 'none'} />
                        <span>{entry.is_favorite ? 'Unstar' : 'Star'}</span>
                      </button>
                      {onAddPlay && (
                        <button onClick={() => { setShowMenu(false); onAddPlay(entry.id); }}
                          className="w-full px-3 py-2 text-left text-xs font-body text-ink-400 hover:bg-parchment-100 flex items-center gap-2">
                          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} /><span>Log Play</span>
                        </button>
                      )}
                      {onToggleForSale && (
                        <button onClick={() => { setShowMenu(false); onToggleForSale(entry.id, !entry.for_sale); }}
                          className="w-full px-3 py-2 text-left text-xs font-body text-ink-400 hover:bg-parchment-100 flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5" strokeWidth={1.5} /><span>{entry.for_sale ? 'Remove Sale' : 'For Sale'}</span>
                        </button>
                      )}
                      <button onClick={() => { setShowMenu(false); onDelete(entry.id); }}
                        className="w-full px-3 py-2 text-left text-xs font-body text-clay-500 hover:bg-clay-50 flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} /><span>Remove</span>
                      </button>
                    </>
                  )}
                  {isShared && owner && (
                    <div className="px-3 py-2 text-xs font-body text-ink-300 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /><span>{owner.username}'s</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Players + time */}
        <div className="flex items-center gap-2 mt-auto">
          {(game.min_players || game.max_players) && (
            <span className="flex items-center gap-0.5 font-body text-[9px] text-ink-200">
              <Users className="w-2.5 h-2.5" strokeWidth={1.5} />
              {game.min_players === game.max_players
                ? `${game.min_players}p`
                : `${game.min_players || '?'}–${game.max_players || '?'}p`}
            </span>
          )}
          {game.playtime_minutes && (
            <span className="flex items-center gap-0.5 font-body text-[9px] text-ink-200">
              <Clock className="w-2.5 h-2.5" strokeWidth={1.5} />
              {game.playtime_minutes}m
            </span>
          )}
          {hasVictoryStats && (
            <span className="flex items-center gap-0.5 font-body text-[9px] text-wheat-400 ml-auto">
              <Trophy className="w-2.5 h-2.5" strokeWidth={1.5} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
