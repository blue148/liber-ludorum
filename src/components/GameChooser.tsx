import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserLibraryWithVictoryStats, getSharedLibraries, getSharedLibraryGames } from '../lib/games';
import { UserLibraryEntryWithStats, Game, SharedLibrary, Profile } from '../lib/supabase';
import { Sparkles, Users, Clock, Grid3x3, Trophy, Target, TrendingDown, ChevronDown, ChevronUp, BookOpen, UserCheck, Check } from 'lucide-react';

// Extended game entry type with owner information
interface ExtendedGameEntry extends UserLibraryEntryWithStats {
  game: Game;
  owner: Profile;
  source: 'own' | 'shared';
}

export default function GameChooser() {
  const { user } = useAuth();
  const [library, setLibrary] = useState<ExtendedGameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Shared library state
  const [sharedLibraries, setSharedLibraries] = useState<SharedLibrary[]>([]);
  const [selectedLibraries, setSelectedLibraries] = useState<Set<string>>(new Set());
  const [librarySelectionOpen, setLibrarySelectionOpen] = useState(false);
  const [loadingSharedLibraries, setLoadingSharedLibraries] = useState(false);

  // Filters
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [maxPlaytime, setMaxPlaytime] = useState<number | null>(null);
  const [selectedMechanic, setSelectedMechanic] = useState<string>('');
  const [showMechanicMenu, setShowMechanicMenu] = useState(false);

  // Victory-based filters
  const [favorVictories, setFavorVictories] = useState<boolean>(false);
  const [avoidRecentLosses, setAvoidRecentLosses] = useState<boolean>(false);
  const [onlyPlayedGames, setOnlyPlayedGames] = useState<boolean>(false);

  // Wheel state
  const [isSpinning, setIsSpinning] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ExtendedGameEntry | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);

  useEffect(() => {
    if (user) {
      loadLibrary();
      loadSharedLibraries();
    }
  }, [user]);

  useEffect(() => {
    if (selectedLibraries.size > 0) {
      loadAllLibraries();
    }
  }, [selectedLibraries]);

  async function loadLibrary() {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getUserLibraryWithVictoryStats(user.id);

      // Convert to extended format with owner info
      const extendedLibrary: ExtendedGameEntry[] = data.map(entry => ({
        ...entry,
        owner: {
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'You',
          avatar_url: user.user_metadata?.avatar_url,
          preferences: {
            theme: 'light' as const,
            notifications_enabled: true,
            default_view: 'grid' as const
          }
        } as Profile,
        source: 'own' as const
      }));

      setLibrary(extendedLibrary);
    } catch (err) {
      setError('Failed to load your library');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSharedLibraries() {
    if (!user) return;

    try {
      const libraries = await getSharedLibraries(user.id);
      setSharedLibraries(libraries);
    } catch (err) {
      console.error('Failed to load shared libraries:', err);
    }
  }

  async function loadAllLibraries() {
    if (!user) return;

    try {
      setLoadingSharedLibraries(true);

      // Start with user's own library
      const ownLibrary = await getUserLibraryWithVictoryStats(user.id);
      const extendedOwnLibrary: ExtendedGameEntry[] = ownLibrary.map(entry => ({
        ...entry,
        owner: {
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'You',
          avatar_url: user.user_metadata?.avatar_url,
          preferences: {
            theme: 'light' as const,
            notifications_enabled: true,
            default_view: 'grid' as const
          }
        } as Profile,
        source: 'own' as const
      }));

      // Load selected shared libraries
      const sharedLibraryGames: ExtendedGameEntry[] = [];

      for (const libraryId of selectedLibraries) {
        const library = sharedLibraries.find(lib => lib.owner.id === libraryId);
        if (!library) continue;

        try {
          const games = await getSharedLibraryGames(library.owner.id, user.id);
          const extendedGames: ExtendedGameEntry[] = games.map(entry => ({
            ...entry,
            // No victory stats for shared libraries (only available for own games)
            victory_stats: undefined,
            owner: library.owner,
            source: 'shared' as const
          }));
          sharedLibraryGames.push(...extendedGames);
        } catch (err) {
          console.error(`Failed to load games from ${library.owner.username}'s library:`, err);
        }
      }

      // Combine all libraries
      setLibrary([...extendedOwnLibrary, ...sharedLibraryGames]);
    } catch (err) {
      setError('Failed to load libraries');
      console.error(err);
    } finally {
      setLoadingSharedLibraries(false);
    }
  }

  // Get all unique game mechanics from library
  const allMechanics = useMemo(() => {
    const mechanics = new Set<string>();
    library.forEach(entry => {
      entry.game?.game_mechanic?.forEach(mechanic => mechanics.add(mechanic));
    });
    return Array.from(mechanics).sort();
  }, [library]);

  // Filter games based on criteria
  const filteredGames = useMemo(() => {
    return library.filter(entry => {
      const game = entry.game;
      if (!game) return false;

      // Player count filter
      if (playerCount) {
        const minPlayers = game.min_players || 1;
        const maxPlayers = game.max_players || 99;
        if (playerCount < minPlayers || playerCount > maxPlayers) {
          return false;
        }
      }

      // Playtime filter
      if (maxPlaytime && game.playtime_minutes) {
        if (game.playtime_minutes > maxPlaytime) {
          return false;
        }
      }

      // Game mechanic filter
      if (selectedMechanic) {
        if (!game.game_mechanic || !game.game_mechanic.includes(selectedMechanic)) {
          return false;
        }
      }

      // Victory-based filters
      const victoryStats = entry.victory_stats;

      // Only played games filter (only applies to own games)
      if (onlyPlayedGames && entry.source === 'own') {
        const hasPlays = (entry.played_dates && entry.played_dates.length > 0) ||
                        (victoryStats && victoryStats.total_sessions > 0);
        if (!hasPlays) return false;
      }

      // Avoid recent losses filter (only applies to own games)
      if (avoidRecentLosses && entry.source === 'own' && victoryStats && victoryStats.total_sessions > 0) {
        // If win rate is less than 30% and they've played recently, filter out
        if (victoryStats.win_rate < 30) return false;
      }

      return true;
    });
  }, [library, playerCount, maxPlaytime, selectedMechanic, onlyPlayedGames, avoidRecentLosses]);

  function spinWheel() {
    if (filteredGames.length === 0) {
      setError('No games match your criteria!');
      return;
    }

    setError(null);

    // If there's already a selected entry, animate it out first
    if (selectedEntry) {
      setIsTransitioning(true);
      setSelectedEntry(null);

      // Wait for fade-out animation before spinning
      setTimeout(() => {
        setIsTransitioning(false);
        startSpin();
      }, 500);
    } else {
      startSpin();
    }
  }

  // Calculate a score for each game based on various factors
  function calculateGameScore(entry: ExtendedGameEntry): number {
    let score = Math.random(); // Base randomness (0-1)

    const victoryStats = entry.victory_stats;

    // Victory-based adjustments (only for own games)
    if (favorVictories && entry.source === 'own' && victoryStats && victoryStats.total_sessions > 0) {
      // Boost games with good win rates
      score += (victoryStats.win_rate / 100) * 0.3;

      // Slightly favor games we've won recently
      if (victoryStats.last_played) {
        try {
          const daysSinceLastPlay = (Date.now() - new Date(victoryStats.last_played).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLastPlay < 30) score += 0.1;
        } catch (e) {
          // Invalid date, ignore
        }
      }
    }

    // Boost favorites (only for own games)
    if (entry.source === 'own' && entry.is_favorite) {
      score += 0.15;
    }

    // Slightly reduce score for games played very recently (encourage variety) - only for own games
    if (entry.source === 'own' && entry.played_dates && entry.played_dates.length > 0) {
      try {
        const lastPlayedDate = new Date(entry.played_dates[0]);
        const daysSinceLastPlay = (Date.now() - lastPlayedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastPlay < 3) score -= 0.1;
      } catch (e) {
        // Invalid date, ignore
      }
    }

    return Math.max(0, score); // Ensure non-negative
  }

  function startSpin() {
    setIsSpinning(true);

    // Intelligent game selection with weighted scoring
    const gamesWithScores = filteredGames.map(game => ({
      entry: game,
      score: calculateGameScore(game)
    }));

    // Sort by score (highest first) and add some randomness
    gamesWithScores.sort((a, b) => b.score - a.score);

    // Use weighted random selection (favor higher scores)
    let totalScore = gamesWithScores.reduce((sum, item) => sum + item.score, 0);
    let randomValue = Math.random() * totalScore;
    let chosen = gamesWithScores[0].entry; // fallback

    for (const item of gamesWithScores) {
      randomValue -= item.score;
      if (randomValue <= 0) {
        chosen = item.entry;
        break;
      }
    }

    // Spin animation (3-5 full rotations + random offset)
    const spins = 3 + Math.random() * 2;
    const finalRotation = rotationDegrees + (360 * spins);
    setRotationDegrees(finalRotation);

    // Show result after animation
    setTimeout(() => {
      setSelectedEntry(chosen);
      setIsSpinning(false);
    }, 3000);
  }

  function resetFilters() {
    setPlayerCount(null);
    setMaxPlaytime(null);
    setSelectedMechanic('');
    setFavorVictories(false);
    setAvoidRecentLosses(false);
    setOnlyPlayedGames(false);
    setSelectedEntry(null);
  }

  function toggleLibrarySelection(libraryId: string) {
    setSelectedLibraries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(libraryId)) {
        newSet.delete(libraryId);
      } else {
        newSet.add(libraryId);
      }
      return newSet;
    });
  }

  function toggleSelectAllFriends() {
    if (selectedLibraries.size === sharedLibraries.length) {
      // Deselect all
      setSelectedLibraries(new Set());
    } else {
      // Select all
      setSelectedLibraries(new Set(sharedLibraries.map(lib => lib.owner.id)));
    }
  }

  // Calculate game counts by library
  const ownGameCount = library.filter(entry => entry.source === 'own').length;
  const selectedLibraryGameCounts = sharedLibraries
    .filter(lib => selectedLibraries.has(lib.owner.id))
    .reduce((acc, lib) => {
      const count = library.filter(entry => entry.source === 'shared' && entry.owner.id === lib.owner.id).length;
      acc[lib.owner.id] = count;
      return acc;
    }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Library Selection Section */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-container p-6">
        <button
          onClick={() => setLibrarySelectionOpen(!librarySelectionOpen)}
          className="flex items-center justify-between w-full text-left mb-4 focus:outline-none group"
        >
          <h2 className="text-lg font-display font-light text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Game Libraries
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">
              {ownGameCount + Object.values(selectedLibraryGameCounts).reduce((a, b) => a + b, 0)} games from {1 + selectedLibraries.size} {1 + selectedLibraries.size === 1 ? 'library' : 'libraries'}
            </span>
            {librarySelectionOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            )}
          </div>
        </button>

        {librarySelectionOpen && (
          <div className="space-y-4 animate-[fadeIn_0.3s_ease-in]">
            {/* User's own library - always selected */}
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">My Games</div>
                  <div className="text-sm text-slate-600">{ownGameCount} games</div>
                </div>
              </div>
              <div className="text-xs font-medium text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
                Always Included
              </div>
            </div>

            {/* Friends' libraries */}
            {sharedLibraries.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-700">Friends' Libraries</h3>
                  <button
                    onClick={toggleSelectAllFriends}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
                  >
                    {selectedLibraries.size === sharedLibraries.length ? 'Deselect All' : 'Select All Friends'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sharedLibraries.map(library => {
                    const isSelected = selectedLibraries.has(library.owner.id);
                    const gameCount = selectedLibraryGameCounts[library.owner.id] || library.game_count;

                    return (
                      <label
                        key={library.owner.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-green-50 border-green-300 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleLibrarySelection(library.owner.id)}
                          className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          {library.owner.avatar_url ? (
                            <img
                              src={library.owner.avatar_url}
                              alt={library.owner.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                              <UserCheck className="w-4 h-4 text-slate-600" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-slate-900">
                              {library.owner.username}'s Games
                            </div>
                            <div className="text-sm text-slate-600">
                              {isSelected && gameCount !== library.game_count
                                ? `${gameCount} loaded`
                                : `${library.game_count} games`
                              }
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">
                            Selected
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {sharedLibraries.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <UserCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No friends have shared their libraries with you yet.</p>
                <p className="text-xs mt-1">Connect with friends to access their game collections!</p>
              </div>
            )}

            {loadingSharedLibraries && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-sm text-slate-600">Loading libraries...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-container p-6">
        <h2 className="text-lg font-display font-light text-slate-900 mb-4">Game Criteria</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Player Count */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Users className="w-4 h-4" />
              Number of Players
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={playerCount || ''}
              onChange={(e) => setPlayerCount(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Any"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Max Playtime */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Clock className="w-4 h-4" />
              Max Playtime (minutes)
            </label>
            <input
              type="number"
              min="5"
              step="5"
              value={maxPlaytime || ''}
              onChange={(e) => setMaxPlaytime(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Any"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Game Mechanics */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Grid3x3 className="w-4 h-4" />
              Core Mechanic
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMechanicMenu(!showMechanicMenu)}
                className="flex items-center justify-between gap-2 w-full bg-cream border border-parchment-300 px-4 py-2 text-xs font-body text-ink-400 hover:bg-parchment-100 transition"
              >
                <span>{selectedMechanic || 'Any'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-ink-200 flex-shrink-0" strokeWidth={1.5} />
              </button>
              {showMechanicMenu && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowMechanicMenu(false)} />
                  <div className="absolute left-0 top-full mt-1 w-full bg-cream border border-parchment-300 shadow-lg py-1 z-[101] max-h-60 overflow-y-auto">
                    {(['', ...allMechanics] as string[]).map((m) => (
                      <button key={m || '__any'} type="button" onClick={() => { setSelectedMechanic(m); setShowMechanicMenu(false); }}
                        className="w-full px-4 py-2 text-left text-xs font-body text-ink-400 hover:bg-parchment-100 flex items-center gap-2">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 ${selectedMechanic === m ? 'opacity-100' : 'opacity-0'}`} strokeWidth={2} />
                        <span>{m || 'Any'}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Victory-Based Filters */}
        <div className="mt-6 pt-6 border-t border-container">
          <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Victory Intelligence
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={favorVictories}
                onChange={(e) => setFavorVictories(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-600" />
                <span className="text-sm text-slate-700">Favor winning games</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={avoidRecentLosses}
                onChange={(e) => setAvoidRecentLosses(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm text-slate-700">Avoid losing streaks</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyPlayedGames}
                onChange={(e) => setOnlyPlayedGames(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-slate-700">Only played games</span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-container mt-4">
          <p className="text-sm text-slate-600">
            {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'} match your criteria
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Wheel Section */}
      <div className="bg-white rounded-lg shadow-sm border border-container p-8">
        <div className="flex flex-col items-center">
          {/* Wheel or Card Container */}
          <div className="mb-8 min-h-[320px] flex items-center justify-center">
            {/* Wheel Container */}
            {(!selectedEntry || isSpinning) && (
              <div className={`relative w-80 h-80 transition-all duration-500 ${
                isSpinning ? 'opacity-100 scale-100' : selectedEntry ? 'opacity-0 scale-0' : 'opacity-100 scale-100 animate-[fadeIn_0.5s_ease-in]'
              }`}>
                <div
                  className={`absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 shadow-lg transition-transform duration-[3000ms] ease-out ${
                    isSpinning ? 'scale-105' : 'scale-100'
                  }`}
                  style={{
                    transform: `rotate(${rotationDegrees}deg)`,
                  }}
                >
                  {/* Wheel segments decoration */}
                  <div className="absolute inset-4 rounded-full bg-white/10 backdrop-blur-sm"></div>
                  <div className="absolute inset-8 rounded-full bg-white/10 backdrop-blur-sm"></div>
                  <div className="absolute inset-12 rounded-full bg-white/10 backdrop-blur-sm"></div>

                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-white" />
                  </div>
                </div>

                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-slate-900 z-10"></div>
              </div>
            )}

            {/* Selected Game Display */}
            {selectedEntry && !isSpinning && (
              <div className="w-full max-w-md bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg overflow-hidden border-2 border-purple-300 shadow-xl animate-[fadeIn_0.5s_ease-in]">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <h3 className="text-2xl font-display font-light text-white text-center">
                    Your Game Tonight!
                  </h3>
                </div>

                <div className="p-6">
                  {/* Game Card */}
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {selectedEntry.game.cover_image ? (
                      <img
                        src={selectedEntry.game.cover_image}
                        alt={selectedEntry.game.name}
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 bg-slate-100 flex items-center justify-center">
                        <div className="text-slate-400 text-center">
                          <Grid3x3 className="w-16 h-16 mx-auto mb-2" />
                          <p className="text-sm">No image available</p>
                        </div>
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-2xl font-display font-light text-slate-900">
                          {selectedEntry.game.name}
                        </h4>
                        {selectedEntry.source === 'shared' && (
                          <div className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                            <UserCheck className="w-3 h-3" />
                            {selectedEntry.owner.username}
                          </div>
                        )}
                      </div>

                      {selectedEntry.game.publisher && (
                        <p className="text-sm text-slate-600 mb-3">
                          by {selectedEntry.game.publisher}
                          {selectedEntry.game.year && ` (${selectedEntry.game.year})`}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 text-sm mb-3">
                        {(selectedEntry.game.min_players || selectedEntry.game.max_players) && (
                          <div className="flex items-center gap-1 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-full">
                            <Users className="w-4 h-4" />
                            <span>
                              {selectedEntry.game.min_players === selectedEntry.game.max_players
                                ? `${selectedEntry.game.min_players} players`
                                : `${selectedEntry.game.min_players || '?'}-${selectedEntry.game.max_players || '?'} players`}
                            </span>
                          </div>
                        )}

                        {selectedEntry.game.playtime_minutes && (
                          <div className="flex items-center gap-1 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-full">
                            <Clock className="w-4 h-4" />
                            <span>{selectedEntry.game.playtime_minutes} min</span>
                          </div>
                        )}
                      </div>

                      {selectedEntry.game.game_mechanic && selectedEntry.game.game_mechanic.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-slate-600 mb-1">Core Mechanics:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedEntry.game.game_mechanic.slice(0, 5).map(mechanic => (
                              <span
                                key={mechanic}
                                className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium"
                              >
                                {mechanic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedEntry.game.game_type && selectedEntry.game.game_type.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">Types:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedEntry.game.game_type.slice(0, 3).map(type => (
                              <span
                                key={type}
                                className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-full font-medium"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Spin Button */}
          <button
            onClick={spinWheel}
            disabled={isSpinning || isTransitioning || filteredGames.length === 0}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            {isSpinning ? 'Spinning...' : isTransitioning ? 'Spinning...' : selectedEntry ? 'Spin Again!' : 'Spin the Wheel!'}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
