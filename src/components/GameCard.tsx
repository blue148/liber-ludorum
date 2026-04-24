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

  // Check if entry has victory stats
  const victoryStats = 'victory_stats' in entry ? entry.victory_stats : undefined;
  const hasVictoryStats = victoryStats && victoryStats.total_sessions > 0;

  if (layout === 'list') {
    return (
      <div className="bg-white container-radius shadow-sm border border-container hover:shadow-md transition group flex relative">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 flex-shrink-0 overflow-hidden rounded-l-[2px]">
          {game.cover_image ? (
            <img
              src={game.cover_image}
              alt={game.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          )}
        </div>

        <div className="flex-1 p-3 sm:p-4 flex items-center min-w-0">
          <div className="flex-1 min-w-0 mr-2 sm:mr-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 truncate text-sm sm:text-base">{game.name}</h3>
              {game.is_expansion && (
                <span className="flex-shrink-0 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  EXP
                </span>
              )}
              {isShared && owner && (
                <span className="flex-shrink-0 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  <span className="hidden sm:inline">{owner.username}</span>
                  <span className="sm:hidden">{owner.username.charAt(0).toUpperCase()}</span>
                </span>
              )}
              {entry.for_sale && (
                <span className="flex-shrink-0 px-1.5 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span className="hidden sm:inline">Sale</span>
                </span>
              )}
            </div>
            {(game.min_players || game.max_players) && (
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-600 mb-1">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>
                    {game.min_players === game.max_players
                      ? `${game.min_players} player${game.min_players && game.min_players > 1 ? 's' : ''}`
                      : `${game.min_players || '?'}-${game.max_players || '?'} players`}
                  </span>
                </div>
                {game.year && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{game.year}</span>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-600 flex-wrap">
              {game.playtime_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="hidden sm:inline">{game.playtime_minutes} min</span>
                  <span className="sm:hidden">{game.playtime_minutes}m</span>
                </div>
              )}
              {entry.personal_ranking && (
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    entry.personal_ranking === 'high'
                      ? 'bg-green-100 text-green-800'
                      : entry.personal_ranking === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {entry.personal_ranking}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <div className="relative">
              <Tooltip content="More options">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 sm:p-2 bg-slate-100 text-slate-700 container-radius hover:bg-slate-200 transition"
                >
                  <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </Tooltip>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute left-0 mt-1 w-40 bg-white container-radius shadow-lg border border-container py-1 z-[101]">
                    {!isShared && (
                      <>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onEdit(entry);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit Details</span>
                        </button>
                        {onToggleForSale && (
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              onToggleForSale(entry.id, !entry.for_sale);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>{entry.for_sale ? 'Unmark Sale' : 'Mark for Sale'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onDelete(entry.id);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      </>
                    )}
                    {isShared && owner && (
                      <div className="px-4 py-3 text-sm text-slate-600 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <UserCheck className="w-4 h-4" />
                          <span className="font-medium">{owner.username}'s Game</span>
                        </div>
                        <p className="text-xs text-slate-500">Read-only view</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            {!isShared && (
              <Tooltip content={entry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}>
                <button
                  onClick={() => onToggleFavorite(entry.id, !entry.is_favorite)}
                  className={`p-1.5 sm:p-2 container-radius transition ${
                    entry.is_favorite
                      ? 'bg-yellow-400 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-yellow-400 hover:text-white'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={entry.is_favorite ? 'currentColor' : 'none'} />
                </button>
              </Tooltip>
            )}
            {onAddPlay && (
              <Tooltip content="Log a play">
                <button
                  onClick={() => onAddPlay(entry.id)}
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-50 text-blue-700 container-radius hover:bg-blue-100 transition font-medium"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-semibold">{playCount}</span>
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream linen-texture border thin-rule rule-line hover:shadow-sm transition group flex flex-col overflow-hidden">
      <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden border-b thin-rule rule-line">
        {game.cover_image ? (
          <img
            src={game.cover_image}
            alt={game.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <BookOpen className="w-12 h-12" strokeWidth={1} />
          </div>
        )}

        {entry.for_sale && (
          <div className="absolute top-2 right-2 bg-forest-700 text-cream px-2 py-1">
            <span className="text-xs font-body uppercase tracking-wider">Sale</span>
          </div>
        )}

        {entry.is_favorite && (
          <div className="absolute top-2 left-2">
            <Star className="w-4 h-4 text-gold-500" fill="currentColor" strokeWidth={0} />
          </div>
        )}

        {isShared && owner && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-purple-600/90 backdrop-blur-sm text-white px-2 py-1 rounded text-center">
              <div className="flex items-center justify-center gap-1">
                <UserCheck className="w-3 h-3" />
                <span className="text-xs font-body">{owner.username}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1 relative">
        <h3 className="text-sm font-display font-medium text-slate-900 line-clamp-2 leading-tight mb-2">{game.name}</h3>

        <div className="space-y-1 mb-3">
          {game.year && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-body text-slate-400 uppercase tracking-wider">Year</span>
              <span className="text-xs font-body text-slate-700">{game.year}</span>
            </div>
          )}
          {(game.min_players || game.max_players) && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-body text-slate-400 uppercase tracking-wider">Players</span>
              <span className="text-xs font-body text-slate-700">
                {game.min_players === game.max_players
                  ? game.min_players
                  : `${game.min_players || '?'}–${game.max_players || '?'}`}
              </span>
            </div>
          )}
          {game.playtime_minutes && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-body text-slate-400 uppercase tracking-wider">Time</span>
              <span className="text-xs font-body text-slate-700">{game.playtime_minutes} min</span>
            </div>
          )}
          {hasVictoryStats && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-body text-slate-400 uppercase tracking-wider">Wins</span>
              <span className="text-xs font-body text-slate-700">
                {victoryStats.total_wins}/{victoryStats.total_sessions} ({victoryStats.win_rate.toFixed(0)}%)
              </span>
              <Trophy className="w-3 h-3 text-gold-500" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t thin-rule rule-line">
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-slate-600" strokeWidth={1.5} />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-[100]"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute left-0 bottom-full mb-1 w-40 bg-cream border thin-rule rule-line shadow-lg py-1 z-[101]">
                  {!isShared && (
                    <>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEdit(entry);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-body text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Edit className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>Edit</span>
                      </button>
                      {onToggleForSale && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onToggleForSale(entry.id, !entry.for_sale);
                          }}
                          className="w-full px-3 py-2 text-left text-xs font-body text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <DollarSign className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>{entry.for_sale ? 'Remove Sale' : 'Mark Sale'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete(entry.id);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-body text-terracotta-700 hover:bg-terracotta-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>Remove</span>
                      </button>
                    </>
                  )}
                  {isShared && owner && (
                    <div className="px-3 py-3 text-xs font-body text-slate-600 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="font-medium">{owner.username}'s</span>
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Read-only</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {!isShared && (
            <button
              onClick={() => onToggleFavorite(entry.id, !entry.is_favorite)}
              className="p-1.5 hover:bg-slate-100 transition-colors"
            >
              <Star
                className={`w-4 h-4 ${entry.is_favorite ? 'text-gold-500' : 'text-slate-300'}`}
                fill={entry.is_favorite ? 'currentColor' : 'none'}
                strokeWidth={1.5}
              />
            </button>
          )}

          {onAddPlay && (
            <button
              onClick={() => onAddPlay(entry.id)}
              className="flex items-center gap-1.5 px-2 py-1 border thin-rule rule-line hover:bg-slate-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.5} />
              <span className="text-xs font-body text-slate-700">{playCount}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
