import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Filter, Grid3x3, List, X, Star, Search, ChevronDown, Check } from 'lucide-react';
import { SharedLibrary, UserLibraryEntry, Game } from '../lib/supabase';
import { getSharedLibraryGames, searchSharedLibrary } from '../lib/games';
import { useAuth } from '../contexts/AuthContext';
import GameCard from './GameCard';
import Tooltip from './Tooltip';

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
  const [showSortMenu, setShowSortMenu] = useState(false);

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
    <>
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={onBack}
              className="p-2 bg-parchment-100 text-ink-300 hover:bg-parchment-200 hover:text-ink-500 transition"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
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
                <h1 className="text-2xl font-display font-light text-ink-600 truncate">
                  {library.owner.username}'s Library
                </h1>
                <p className="text-ink-400 text-sm font-body">
                  {library.game_count} {library.game_count === 1 ? 'game' : 'games'}
                </p>
              </div>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="space-y-3 sm:space-y-6">
            <div className="flex border border-parchment-300 overflow-hidden">
              <div className="flex-1 flex items-center gap-2 px-3 bg-cream">
                <Search className="w-4 h-4 text-ink-200 flex-shrink-0" strokeWidth={1.5} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={`Search ${library.owner.username}'s games…`}
                  className="flex-1 py-2.5 text-sm font-body bg-transparent focus:outline-none text-ink-600 placeholder:text-ink-200"
                />
                {searchQuery && (
                  <button onClick={() => handleSearch('')}>
                    <X className="w-4 h-4 text-ink-200 hover:text-ink-400 transition" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:flex-wrap sm:gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 border text-xs font-body uppercase tracking-wider transition flex-shrink-0 ${
                    showFilters || activeFiltersCount > 0
                      ? 'bg-clay-400 text-cream border-clay-500'
                      : 'bg-cream text-ink-400 border-parchment-300 hover:bg-parchment-100'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-white/25 text-cream text-xs leading-none px-1.5 py-0.5">{activeFiltersCount}</span>
                  )}
                </button>

                <button
                  onClick={() => setFilters(prev => ({ ...prev, favoriteOnly: !prev.favoriteOnly }))}
                  className={`flex items-center gap-2 px-4 py-2 border text-xs font-body uppercase tracking-wider transition ${
                    filters.favoriteOnly
                      ? 'bg-wheat-50 text-wheat-400 border-wheat-200'
                      : 'bg-cream text-ink-400 border-parchment-300 hover:bg-parchment-100'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" fill={filters.favoriteOnly ? 'currentColor' : 'none'} strokeWidth={1.5} />
                  <span>Favorites</span>
                </button>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-body text-ink-300 hover:text-ink-500 underline px-1"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center justify-between gap-2 w-full bg-cream border border-parchment-300 px-3 py-2 text-xs font-body text-ink-400 hover:bg-parchment-100 transition"
                  >
                    <span>{({'name-asc':'Name (A–Z)','name-desc':'Name (Z–A)','date-added-desc':'Recently Added','date-added-asc':'Oldest First'} as Record<string,string>)[sortBy]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-ink-200 flex-shrink-0" strokeWidth={1.5} />
                  </button>
                  {showSortMenu && (
                    <>
                      <div className="fixed inset-0 z-[100]" onClick={() => setShowSortMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-cream border border-parchment-300 shadow-lg py-1 z-[101]">
                        {([
                          { value: 'name-asc', label: 'Name (A–Z)' },
                          { value: 'name-desc', label: 'Name (Z–A)' },
                          { value: 'date-added-desc', label: 'Recently Added' },
                          { value: 'date-added-asc', label: 'Oldest First' },
                        ] as const).map(({ value, label }) => (
                          <button key={value} onClick={() => { setSortBy(value); setShowSortMenu(false); }}
                            className="w-full px-4 py-2 text-left text-xs font-body text-ink-400 hover:bg-parchment-100 flex items-center gap-2">
                            <Check className={`w-3.5 h-3.5 flex-shrink-0 ${sortBy === value ? 'opacity-100' : 'opacity-0'}`} strokeWidth={2} />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex border border-parchment-300 overflow-hidden">
                  <Tooltip content="Grid view">
                    <button
                      onClick={() => { setUserLayout('grid'); if (window.innerWidth > 480) { setLayout('grid'); } }}
                      className={`p-2 transition ${layout === 'grid' ? 'bg-clay-400 text-cream' : 'bg-cream text-ink-300 hover:bg-parchment-100'}`}
                    >
                      <Grid3x3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="List view">
                    <button
                      onClick={() => { setUserLayout('list'); setLayout('list'); }}
                      className={`p-1.5 sm:p-2 border-l border-parchment-300 transition ${layout === 'list' ? 'bg-clay-400 text-cream' : 'bg-cream text-ink-300 hover:bg-parchment-100'}`}
                    >
                      <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-cream border border-parchment-300 p-3 sm:p-6 space-y-4 sm:space-y-6 mt-6">
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
            <div className="bg-parchment-100 w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Grid3x3 className="w-10 h-10 text-ink-200" strokeWidth={1} />
            </div>
            <h3 className="text-xl font-display font-light text-ink-600 mb-2">
              {searchQuery ? 'No matching games' : 'No games found'}
            </h3>
            <p className="text-ink-400 font-body">
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
                  className="px-6 py-2 bg-cream border border-parchment-300 text-xs font-body text-ink-400 uppercase tracking-wider hover:bg-parchment-100 transition disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More Games'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
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
                  className="px-6 py-2 bg-cream border border-parchment-300 text-xs font-body text-ink-400 uppercase tracking-wider hover:bg-parchment-100 transition disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More Games'}
                </button>
              </div>
            )}
          </div>
        )}
    </>
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