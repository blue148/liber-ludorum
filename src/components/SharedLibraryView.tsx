import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Filter, Grid3x3, List, ArrowUpDown, X, Star } from 'lucide-react';
import { SharedLibrary, UserLibraryEntry, Game } from '../lib/supabase';
import { getSharedLibraryGames, searchSharedLibrary } from '../lib/games';
import { useAuth } from '../contexts/AuthContext';
import GameCard from './GameCard';

interface SharedLibraryViewProps {
  library: SharedLibrary;
  onBack: () => void;
}

type SortOption = 'name-asc' | 'name-desc' | 'date-added-desc' | 'date-added-asc';

export default function SharedLibraryView({ library, onBack }: SharedLibraryViewProps) {
  const { user } = useAuth();
  const [games, setGames] = useState<(UserLibraryEntry & { game: Game })[]>([]);
  const [filteredGames, setFilteredGames] = useState<(UserLibraryEntry & { game: Game })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [userLayout, setUserLayout] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50;

  // Filters
  const [filters, setFilters] = useState({
    publishers: [] as string[],
    gameTypes: [] as string[],
    gameCategories: [] as string[],
    years: [] as string[],
    playerCounts: [] as number[],
    favoriteOnly: false,
  });

  useEffect(() => {
    loadGames(true);
  }, [library, user]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        setLayout('list');
      } else {
        setLayout(userLayout);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [userLayout]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [games, searchQuery, filters, sortBy]);

  const loadGames = async (reset: boolean = false) => {
    if (!user) return;

    try {
      const pageToLoad = reset ? 0 : currentPage;
      const isFirstLoad = reset || pageToLoad === 0;

      if (isFirstLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      let newGames: (UserLibraryEntry & { game: Game })[] = [];

      if (searchQuery.trim()) {
        // Search mode - load all matching results
        newGames = await searchSharedLibrary(library.owner.id, user.id, searchQuery.trim());
      } else {
        // Normal pagination mode
        newGames = await getSharedLibraryGames(
          library.owner.id,
          user.id,
          PAGE_SIZE,
          pageToLoad * PAGE_SIZE
        );
      }

      if (reset) {
        setGames(newGames);
        setCurrentPage(0);
      } else {
        setGames(prev => [...prev, ...newGames]);
        setCurrentPage(pageToLoad + 1);
      }

      setHasMore(newGames.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading shared library games:', error);
      setError(error instanceof Error ? error.message : 'Failed to load games');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !searchQuery) {
      loadGames(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() !== searchQuery.trim()) {
      loadGames(true);
    }
  };

  const availableFilters = useMemo(() => {
    const publishers = new Set<string>();
    const gameTypes = new Set<string>();
    const gameCategories = new Set<string>();
    const years = new Set<string>();

    games.forEach((entry) => {
      if (entry.game.publisher) publishers.add(entry.game.publisher);
      if (entry.game.year) years.add(entry.game.year);
      entry.game.game_type?.forEach((type) => gameTypes.add(type));
      entry.game.game_category?.forEach((cat) => gameCategories.add(cat));
    });

    return {
      publishers: Array.from(publishers).sort(),
      gameTypes: Array.from(gameTypes).sort(),
      gameCategories: Array.from(gameCategories).sort(),
      years: Array.from(years).sort(),
    };
  }, [games]);

  const applyFiltersAndSort = () => {
    let filtered = [...games];

    if (filters.favoriteOnly) {
      filtered = filtered.filter((entry) => entry.is_favorite);
    }

    if (filters.publishers.length > 0) {
      filtered = filtered.filter(
        (entry) => entry.game.publisher && filters.publishers.includes(entry.game.publisher)
      );
    }

    if (filters.gameTypes.length > 0) {
      filtered = filtered.filter((entry) =>
        entry.game.game_type?.some((type) => filters.gameTypes.includes(type))
      );
    }

    if (filters.gameCategories.length > 0) {
      filtered = filtered.filter((entry) =>
        entry.game.game_category?.some((cat) => filters.gameCategories.includes(cat))
      );
    }

    if (filters.years.length > 0) {
      filtered = filtered.filter((entry) => entry.game.year && filters.years.includes(entry.game.year));
    }

    if (filters.playerCounts.length > 0) {
      filtered = filtered.filter((entry) => {
        const minPlayers = entry.game.min_players;
        const maxPlayers = entry.game.max_players;

        if (!minPlayers && !maxPlayers) return false;

        return filters.playerCounts.some((count) => {
          if (count === 6) {
            if (!minPlayers && maxPlayers) return maxPlayers >= 6;
            if (minPlayers && !maxPlayers) return true;
            return (maxPlayers && maxPlayers >= 6) || (minPlayers && minPlayers >= 6);
          }

          if (!minPlayers && maxPlayers) return count <= maxPlayers;
          if (minPlayers && !maxPlayers) return count >= minPlayers;
          return minPlayers && maxPlayers && count >= minPlayers && count <= maxPlayers;
        });
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.game.name.localeCompare(b.game.name, 'en', {
            sensitivity: 'base',
            numeric: true,
            ignorePunctuation: false
          });
        case 'name-desc':
          return b.game.name.localeCompare(a.game.name, 'en', {
            sensitivity: 'base',
            numeric: true,
            ignorePunctuation: false
          });
        case 'date-added-desc':
          return new Date(b.added_date).getTime() - new Date(a.added_date).getTime();
        case 'date-added-asc':
          return new Date(a.added_date).getTime() - new Date(b.added_date).getTime();
        default:
          return 0;
      }
    });

    setFilteredGames(filtered);
  };

  const toggleFilterValue = (category: keyof typeof filters, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[category] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [category]: newValues };
    });
  };

  const clearAllFilters = () => {
    setFilters({
      publishers: [],
      gameTypes: [],
      gameCategories: [],
      years: [],
      playerCounts: [],
      favoriteOnly: false,
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.favoriteOnly) count++;
    count += filters.publishers.length;
    count += filters.gameTypes.length;
    count += filters.gameCategories.length;
    count += filters.years.length;
    count += filters.playerCounts.length;
    return count;
  }, [filters]);

  if (loading && games.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
            </button>

            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {library.owner.avatar_url ? (
                <img
                  src={library.owner.avatar_url}
                  alt={library.owner.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {library.owner.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-display font-light text-slate-900 truncate">
                  {library.owner.username}'s Library
                </h1>
                <p className="text-slate-600 text-sm">
                  {library.game_count} {library.game_count === 1 ? 'game' : 'games'}
                </p>
              </div>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="space-y-4 sm:space-y-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={`Search ${library.owner.username}'s games...`}
                className="w-full px-4 py-3 text-sm font-body bg-cream border thin-rule rule-line focus:outline-none focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
            </div>

            <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:flex-wrap sm:gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 border thin-rule rule-line transition text-xs font-body uppercase tracking-wider ${
                    showFilters || activeFiltersCount > 0
                      ? 'bg-slate-900 text-cream'
                      : 'bg-cream text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-terracotta-500 text-cream text-xs px-1.5 py-0.5">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setFilters(prev => ({ ...prev, favoriteOnly: !prev.favoriteOnly }))}
                  className={`flex items-center gap-2 px-4 py-2 border thin-rule rule-line transition text-xs font-body uppercase tracking-wider ${
                    filters.favoriteOnly
                      ? 'bg-gold-500 text-slate-900'
                      : 'bg-cream text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" fill={filters.favoriteOnly ? 'currentColor' : 'none'} strokeWidth={1.5} />
                  <span>Favorites</span>
                </button>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs sm:text-sm text-slate-600 hover:text-slate-900 underline px-1"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none bg-white border border-slate-300 rounded-lg pl-2 sm:pl-3 pr-7 sm:pr-8 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none w-full"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="date-added-desc">Recently Added</option>
                    <option value="date-added-asc">Oldest First</option>
                  </select>
                  <ArrowUpDown className="absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
                </div>

                <div className="flex items-center space-x-0.5 sm:space-x-1 border border-slate-300 rounded-lg p-0.5 sm:p-1">
                  <button
                    onClick={() => {
                      setUserLayout('grid');
                      if (window.innerWidth > 480) {
                        setLayout('grid');
                      }
                    }}
                    className={`p-1.5 sm:p-2 rounded transition ${
                      layout === 'grid'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Grid3x3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setUserLayout('list');
                      setLayout('list');
                    }}
                    className={`p-1.5 sm:p-2 rounded transition ${
                      layout === 'list'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white rounded-lg border border-container p-3 sm:p-6 space-y-4 sm:space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {availableFilters.publishers.length > 0 && (
                  <FilterSection
                    title="Publisher"
                    options={availableFilters.publishers}
                    selected={filters.publishers}
                    onToggle={(value) => toggleFilterValue('publishers', value)}
                  />
                )}

                {availableFilters.gameTypes.length > 0 && (
                  <FilterSection
                    title="Game Type"
                    options={availableFilters.gameTypes}
                    selected={filters.gameTypes}
                    onToggle={(value) => toggleFilterValue('gameTypes', value)}
                  />
                )}

                {availableFilters.gameCategories.length > 0 && (
                  <FilterSection
                    title="Category"
                    options={availableFilters.gameCategories}
                    selected={filters.gameCategories}
                    onToggle={(value) => toggleFilterValue('gameCategories', value)}
                  />
                )}

                {availableFilters.years.length > 0 && (
                  <FilterSection
                    title="Year"
                    options={availableFilters.years}
                    selected={filters.years}
                    onToggle={(value) => toggleFilterValue('years', value)}
                  />
                )}

                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-3">Number of Players</h4>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((count) => (
                      <label key={count} className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.playerCounts.includes(count)}
                          onChange={() => {
                            setFilters((prev) => ({
                              ...prev,
                              playerCounts: prev.playerCounts.includes(count)
                                ? prev.playerCounts.filter((c) => c !== count)
                                : [...prev.playerCounts, count],
                            }));
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700 group-hover:text-slate-900">
                          {count === 6 ? '6+' : count} {count === 1 ? 'player' : 'players'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Games Grid/List */}
        {error ? (
          <div className="text-center py-20">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-display font-light text-red-900 mb-2">Access Error</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => loadGames(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid3x3 className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-display font-light text-slate-900 mb-2">
              {searchQuery ? 'No matching games' : 'No games found'}
            </h3>
            <p className="text-slate-600">
              {searchQuery ? 'Try a different search term' : `${library.owner.username}'s library appears to be empty`}
            </p>
          </div>
        ) : layout === 'list' ? (
          <div className="space-y-3">
            {filteredGames.map((entry) => (
              <GameCard
                key={entry.id}
                entry={entry}
                layout="list"
                isShared={true}
                owner={library.owner}
                onToggleFavorite={() => {}} // Read-only for shared libraries
                onToggleForSale={() => {}}   // Read-only for shared libraries
                onDelete={() => {}}          // Read-only for shared libraries
                onEdit={() => {}}            // Read-only for shared libraries
                onAddPlay={() => {}}         // Read-only for shared libraries
              />
            ))}

            {/* Load More Button */}
            {hasMore && !searchQuery && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-slate-900 text-cream hover:bg-slate-800 transition-colors font-body text-sm disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More Games'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0.5">
              {filteredGames.map((entry) => (
                <GameCard
                  key={entry.id}
                  entry={entry}
                  layout="grid"
                  isShared={true}
                  owner={library.owner}
                  onToggleFavorite={() => {}} // Read-only for shared libraries
                  onToggleForSale={() => {}}   // Read-only for shared libraries
                  onDelete={() => {}}          // Read-only for shared libraries
                  onEdit={() => {}}            // Read-only for shared libraries
                  onAddPlay={() => {}}         // Read-only for shared libraries
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && !searchQuery && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-slate-900 text-cream hover:bg-slate-800 transition-colors font-body text-sm disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More Games'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Filter Section Component (reused from Library.tsx)
function FilterSection({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayOptions = showAll ? options : options.slice(0, 5);

  return (
    <div>
      <h4 className="text-sm font-medium text-slate-900 mb-3">{title}</h4>
      <div className="space-y-2">
        {displayOptions.map((option) => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
            />
            <span className="text-sm text-slate-700 group-hover:text-slate-900 capitalize">
              {option}
            </span>
          </label>
        ))}
        {options.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-slate-600 hover:text-slate-900 underline"
          >
            {showAll ? 'Show less' : `Show ${options.length - 5} more`}
          </button>
        )}
      </div>
    </div>
  );
}