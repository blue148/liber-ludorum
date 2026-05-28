import { useState, useEffect, useMemo } from 'react';
import { Filter, Grid3x3, List, X, ArrowUpDown, Heart, Search, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserWishlist,
  getWishlistEntry,
  getGameByBarcode,
  getGameByBggId,
  createSharedGame,
  addGameToWishlist,
  updateWishlistEntry,
  removeGameFromWishlist,
  moveGameFromWishlistToLibrary,
  checkGameInUserCollections,
} from '../lib/games';
import { lookupBarcodeWithBgg, submitBarcodeToGameUpc } from '../lib/bgg';
import { UserWishlistEntry, Game } from '../lib/supabase';
import WishlistCard from './WishlistCard';
import BarcodeScanner from './BarcodeScanner';
import EditWishlistModal from './EditWishlistModal';
import Tooltip from './Tooltip';
import MultiSelectDropdown from './MultiSelectDropdown';
import FilterSection from './FilterSection';

type SortOption = 'name-asc' | 'name-desc' | 'date-added-desc' | 'date-added-asc' | 'priority-desc' | 'priority-asc';

interface CatalogueFilters {
  publishers: string[];
  gameTypes: string[];
  gameCategories: string[];
  years: string[];
}

export default function Wishlist({ catalogueFilters }: { catalogueFilters?: CatalogueFilters }) {
  const { user, refreshProfile } = useAuth();
  const [wishlist, setWishlist] = useState<(UserWishlistEntry & { game: Game })[]>([]);
  const [filteredWishlist, setFilteredWishlist] = useState<(UserWishlistEntry & { game: Game })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [editingWishlistItem, setEditingWishlistItem] = useState<(UserWishlistEntry & { game: Game }) | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{ inLibrary: boolean; inWishlist: boolean }>({ inLibrary: false, inWishlist: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [userLayout, setUserLayout] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('priority-desc');
  const [priorityFilter, setPriorityFilter] = useState<'high' | 'medium' | 'low' | 'all'>('all');
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const [filters, setFilters] = useState({
    publishers: [] as string[],
    gameTypes: [] as string[],
    gameCategories: [] as string[],
    years: [] as string[],
    rankings: [] as string[],
    playerCounts: [] as number[],
    minPlays: 0,
    maxPlays: Infinity,
  });

  const availableFilters = useMemo(() => {
    const publishers = new Set<string>();
    const gameTypes = new Set<string>();
    const gameCategories = new Set<string>();
    const years = new Set<string>();

    wishlist.forEach((entry) => {
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
  }, [wishlist]);

  const toggleFilterValue = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v: string) => v !== value)
        : [...prev[key], value],
    }));
  };

  useEffect(() => {
    if (user) {
      loadWishlist();
    }
  }, [user]);

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
    let filtered = [...wishlist];

    if (searchQuery) {
      filtered = filtered.filter(
        (entry) =>
          entry.game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.game.publisher?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.game.barcode.includes(searchQuery) ||
          entry.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((entry) => entry.priority === priorityFilter);
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
        const min = entry.game.min_players;
        const max = entry.game.max_players;
        if (!min && !max) return false;
        return filters.playerCounts.some((count) => {
          if (count === 6) return max != null && max >= 6;
          return min != null && max != null && count >= min && count <= max;
        });
      });
    }

    const priorityOrder = { high: 3, medium: 2, low: 1 };

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
        case 'priority-desc':
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'priority-asc':
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        default:
          return 0;
      }
    });

    setFilteredWishlist(filtered);
  }, [wishlist, searchQuery, priorityFilter, filters, sortBy]);

  const loadWishlist = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserWishlist(user.id);
      setWishlist(data);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  // const handleGameAdded = async () => {
  //   await loadWishlist();
  //   await refreshProfile();
  // };

  const handleScanBarcode = async (barcode: string, addToWishlist: boolean = true) => {
    if (!user) return;

    try {
      let game = await getGameByBarcode(barcode);

      if (!game) {
        try {
          const gameData = await lookupBarcodeWithBgg(barcode);

          if (gameData.bgg_id) {
            const existingGame = await getGameByBggId(gameData.bgg_id);
            if (existingGame) {
              game = existingGame;
              console.log(`Game already exists with BGG ID ${gameData.bgg_id}, using existing entry`);
            }
          }

          if (!game) {
            game = await createSharedGame({
              barcode,
              name: gameData.name || 'Unknown Game',
              bgg_id: gameData.bgg_id,
              publisher: gameData.publisher,
              year: gameData.year?.toString(),
              cover_image: gameData.cover_image,
              min_players: gameData.min_players,
              max_players: gameData.max_players,
              playtime_minutes: gameData.playtime_minutes,
              game_type: gameData.game_type,
              game_category: gameData.game_category,
              game_mechanic: gameData.game_mechanic,
              game_family: gameData.game_family,
            });
          }

          if (gameData.source !== 'gameupc' && gameData.bgg_id) {
            submitBarcodeToGameUpc(barcode, gameData.bgg_id).catch((err) => {
              console.error('Failed to submit barcode mapping (non-fatal):', err);
            });
          }
        } catch (lookupError) {
          console.error('Barcode lookup failed:', lookupError);
          setShowScanner(false);
          alert('Could not find game information for this barcode. Please try manual entry.');
          return;
        }
      }

      // Check if game is already in user's collections
      const collections = await checkGameInUserCollections(user.id, game.id);
      if (collections.inLibrary || collections.inWishlist) {
        setDuplicateInfo({ inLibrary: collections.inLibrary, inWishlist: collections.inWishlist });
        setShowScanner(false);
        setShowDuplicateModal(true);
        return;
      }

      if (addToWishlist) {
        await addGameToWishlist(user.id, game.id);
        await loadWishlist();
      }

      await refreshProfile();
      setShowScanner(false);
    } catch (error) {
      console.error('Error adding game:', error);
      alert('Failed to add game. Please try again.');
    }
  };

  const handleMoveToLibrary = async (wishlistEntryId: string) => {
    if (!user) return;

    try {
      await moveGameFromWishlistToLibrary(user.id, wishlistEntryId);
      await loadWishlist();
      await refreshProfile();
    } catch (error) {
      console.error('Error moving game to library:', error);
      alert('Failed to move game to library. Please try again.');
    }
  };

  const handleDeleteWishlistItem = async (entryId: string) => {
    const entry = wishlist.find((e) => e.id === entryId);
    const gameName = entry?.game.name || 'this game';

    if (!confirm(`Are you sure you want to remove "${gameName}" from your wishlist?`)) {
      return;
    }

    try {
      await removeGameFromWishlist(entryId);
      await loadWishlist();
      await refreshProfile();
    } catch (error) {
      console.error('Error deleting wishlist item:', error);
    }
  };

  const handleSaveEdit = async (entryId: string, updates: Partial<UserWishlistEntry>) => {
    try {
      await updateWishlistEntry(entryId, updates);
      const updatedEntry = await getWishlistEntry(entryId);
      setWishlist((prev) => prev.map((entry) => (entry.id === entryId ? updatedEntry : entry)));
      await refreshProfile();
      setEditingWishlistItem(null);
    } catch (error) {
      console.error('Error updating wishlist item:', error);
    }
  };

  // const toggleFilterValue = (category: keyof typeof filters, value: string) => {
  //   setFilters((prev) => {
  //     const currentValues = prev[category] as string[];
  //     const newValues = currentValues.includes(value)
  //       ? currentValues.filter((v) => v !== value)
  //       : [...currentValues, value];
  //     return { ...prev, [category]: newValues };
  //   });
  // };

  const clearAllFilters = () => {
    setFilters({
      publishers: [],
      gameTypes: [],
      gameCategories: [],
      years: [],
      rankings: [],
      playerCounts: [],
      minPlays: 0,
      maxPlays: Infinity,
    });
    setPriorityFilter('all');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (priorityFilter !== 'all') count++;
    count += filters.publishers.length;
    count += filters.gameTypes.length;
    count += filters.gameCategories.length;
    count += filters.years.length;
    count += filters.rankings.length;
    count += filters.playerCounts.length;
    if (filters.minPlays > 0) count++;
    if (filters.maxPlays !== Infinity) count++;
    return count;
  }, [priorityFilter, filters]);

  return (
    <>
        <div className="mb-8 sm:mb-12 space-y-3 sm:space-y-6">
          <div className="flex border border-parchment-300 overflow-hidden">
            <div className="flex-1 flex items-center gap-2 px-3 bg-cream">
              <Search className="w-4 h-4 text-ink-200 flex-shrink-0" strokeWidth={1.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wishlist…"
                className="flex-1 py-2.5 text-sm font-body bg-transparent focus:outline-none text-ink-600 placeholder:text-ink-200"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-4 h-4 text-ink-200 hover:text-ink-400 transition" strokeWidth={1.5} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 bg-ink-600 text-cream px-6 hover:bg-ink-500 transition font-body text-sm border-l border-ink-500"
            >
              <Heart className="w-4 h-4" strokeWidth={1.5} />
              <span>Add to Wishlist</span>
            </button>
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

              <div className="relative">
                <button
                  onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                  className={`flex items-center gap-2 px-4 py-2 border text-xs font-body uppercase tracking-wider transition ${
                    priorityFilter !== 'all'
                      ? 'bg-clay-400 text-cream border-clay-500'
                      : 'bg-cream text-ink-400 border-parchment-300 hover:bg-parchment-100'
                  }`}
                >
                  <span>{priorityFilter === 'all' ? 'All Priorities' : priorityFilter === 'high' ? 'High Priority' : priorityFilter === 'medium' ? 'Medium Priority' : 'Low Priority'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 ${priorityFilter !== 'all' ? 'text-cream/70' : 'text-ink-200'}`} strokeWidth={1.5} />
                </button>
                {showPriorityMenu && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setShowPriorityMenu(false)} />
                    <div className="absolute left-0 top-full mt-1 w-44 bg-cream border border-parchment-300 shadow-lg py-1 z-[101]">
                      {([
                        { value: 'all', label: 'All Priorities' },
                        { value: 'high', label: 'High Priority' },
                        { value: 'medium', label: 'Medium Priority' },
                        { value: 'low', label: 'Low Priority' },
                      ] as const).map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => { setPriorityFilter(value); setShowPriorityMenu(false); }}
                          className="w-full px-4 py-2 text-left text-xs font-body text-ink-400 hover:bg-parchment-100 flex items-center gap-2"
                        >
                          <Check className={`w-3.5 h-3.5 flex-shrink-0 ${priorityFilter === value ? 'opacity-100' : 'opacity-0'}`} strokeWidth={2} />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

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
                  <span>{({'priority-desc':'High Priority First','priority-asc':'Low Priority First','name-asc':'Name (A–Z)','name-desc':'Name (Z–A)','date-added-desc':'Recently Added','date-added-asc':'Oldest First'} as Record<string,string>)[sortBy]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-200 flex-shrink-0" strokeWidth={1.5} />
                </button>
                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setShowSortMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-cream border border-parchment-300 shadow-lg py-1 z-[101]">
                      {([
                        { value: 'priority-desc', label: 'High Priority First' },
                        { value: 'priority-asc', label: 'Low Priority First' },
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

          {showFilters && (
            <div className="bg-cream border border-parchment-300 p-3 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <MultiSelectDropdown
                  title="Publisher"
                  options={catalogueFilters?.publishers ?? availableFilters.publishers}
                  selected={filters.publishers}
                  onToggle={(value) => toggleFilterValue('publishers', value)}
                  onClear={() => setFilters({ ...filters, publishers: [] })}
                />
                <MultiSelectDropdown
                  title="Game Type"
                  options={catalogueFilters?.gameTypes ?? availableFilters.gameTypes}
                  selected={filters.gameTypes}
                  onToggle={(value) => toggleFilterValue('gameTypes', value)}
                  onClear={() => setFilters({ ...filters, gameTypes: [] })}
                />
                <MultiSelectDropdown
                  title="Category"
                  options={catalogueFilters?.gameCategories ?? availableFilters.gameCategories}
                  selected={filters.gameCategories}
                  onToggle={(value) => toggleFilterValue('gameCategories', value)}
                  onClear={() => setFilters({ ...filters, gameCategories: [] })}
                />
                <MultiSelectDropdown
                  title="Year"
                  options={catalogueFilters?.years ?? availableFilters.years}
                  selected={filters.years}
                  onToggle={(value) => toggleFilterValue('years', value)}
                  onClear={() => setFilters({ ...filters, years: [] })}
                />
                <FilterSection
                  title="Ranking"
                  options={['high', 'medium', 'low']}
                  selected={filters.rankings}
                  onToggle={(value) => toggleFilterValue('rankings', value)}
                />
                <div>
                  <h4 className="text-xs font-body font-medium text-ink-400 uppercase tracking-wider mb-3">Number of Plays</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-body text-ink-300">Minimum</label>
                      <input type="number" min="0" value={filters.minPlays}
                        onChange={(e) => setFilters({ ...filters, minPlays: parseInt(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-2 border border-parchment-300 bg-cream text-xs font-body text-ink-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-body text-ink-300">Maximum</label>
                      <input type="number" min="0" value={filters.maxPlays === Infinity ? '' : filters.maxPlays}
                        onChange={(e) => setFilters({ ...filters, maxPlays: e.target.value ? parseInt(e.target.value) : Infinity })}
                        placeholder="No limit"
                        className="w-full mt-1 px-3 py-2 border border-parchment-300 bg-cream text-xs font-body text-ink-400 focus:outline-none placeholder:text-ink-200" />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-body font-medium text-ink-400 uppercase tracking-wider mb-3">Number of Players</h4>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((count) => (
                      <label key={count} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox"
                          checked={filters.playerCounts.includes(count)}
                          onChange={() => setFilters(prev => ({
                            ...prev,
                            playerCounts: prev.playerCounts.includes(count)
                              ? prev.playerCounts.filter(c => c !== count)
                              : [...prev.playerCounts, count],
                          }))}
                          className="w-3.5 h-3.5 border-parchment-300 text-ink-500 focus:ring-ink-400 cursor-pointer" />
                        <span className="text-xs font-body text-ink-400 group-hover:text-ink-600">
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-400"></div>
          </div>
        ) : filteredWishlist.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-parchment-100 w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-ink-200" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-display font-light text-ink-600 mb-2">
              {wishlist.length === 0 ? 'No wishlist items yet' : 'No games match your search'}
            </h3>
            <p className="text-ink-400 mb-6">
              {wishlist.length === 0
                ? 'Start building your wishlist by scanning a barcode or searching by title'
                : 'Try adjusting your search or filters'}
            </p>
            <button
              onClick={() => setShowScanner(true)}
              className="inline-flex items-center gap-2 bg-cream border border-parchment-300 text-xs font-body text-ink-400 uppercase tracking-wider px-6 py-2 hover:bg-parchment-100 transition"
            >
              <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{wishlist.length === 0 ? 'Add Your First Wishlist Item' : 'Add to Wishlist'}</span>
            </button>
          </div>
        ) : layout === 'list' ? (
          <div className="space-y-3">
            {filteredWishlist.map((entry) => (
              <WishlistCard
                key={entry.id}
                entry={entry}
                onEdit={setEditingWishlistItem}
                onDelete={handleDeleteWishlistItem}
                onMoveToLibrary={handleMoveToLibrary}
                layout="list"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {filteredWishlist.map((entry) => (
              <WishlistCard
                key={entry.id}
                entry={entry}
                onEdit={setEditingWishlistItem}
                onDelete={handleDeleteWishlistItem}
                onMoveToLibrary={handleMoveToLibrary}
                layout="grid"
              />
            ))}
          </div>
        )}
      {showScanner && (
        <BarcodeScanner
          onScan={(barcode, addToWishlist) => handleScanBarcode(barcode, addToWishlist ?? true)}
          onClose={() => setShowScanner(false)}
          onManualEntry={() => {
            setShowScanner(false);
            alert('Manual entry is not yet implemented for wishlist. Please use the main catalogue.');
          }}
        />
      )}

      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Game Already Added</h2>
            <p className="text-slate-700 mb-6">
              {duplicateInfo.inLibrary && duplicateInfo.inWishlist
                ? 'This game is already in both your library and wishlist.'
                : duplicateInfo.inLibrary
                ? 'This game is already in your library.'
                : 'This game is already in your wishlist.'}
            </p>
            <button
              onClick={() => setShowDuplicateModal(false)}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {editingWishlistItem && (
        <EditWishlistModal
          entry={editingWishlistItem}
          onSave={handleSaveEdit}
          onClose={() => setEditingWishlistItem(null)}
          onDelete={handleDeleteWishlistItem}
        />
      )}
    </>
  );
}