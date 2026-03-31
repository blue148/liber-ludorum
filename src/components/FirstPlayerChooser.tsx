import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPlayers, addPlayer, removePlayer } from '../lib/players';
import { Dice6, Plus, X, Users } from 'lucide-react';

type AnimationPhase = 'idle' | 'flipping-down' | 'shuffling' | 'choosing' | 'pushing-away' | 'revealing';

export default function FirstPlayerChooser() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<string[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [winner, setWinner] = useState<string | null>(null);
  const [showWinner, setShowWinner] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, [user]);

  async function loadPlayers() {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getPlayers(user.id);
      setPlayers(data);
    } catch (err) {
      setError('Failed to load players');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPlayer() {
    if (!user || !newPlayerName.trim()) return;

    try {
      setError(null);
      const updatedPlayers = await addPlayer(user.id, newPlayerName);
      setPlayers(updatedPlayers);
      setNewPlayerName('');
      // Auto-select newly added player
      setSelectedPlayers(prev => new Set([...prev, newPlayerName.trim()]));
    } catch (err: any) {
      setError(err.message || 'Failed to add player');
      console.error(err);
    }
  }

  async function handleRemovePlayer(playerName: string) {
    if (!user) return;

    try {
      setError(null);
      const updatedPlayers = await removePlayer(user.id, playerName);
      setPlayers(updatedPlayers);
      // Remove from selection if selected
      setSelectedPlayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerName);
        return newSet;
      });
    } catch (err) {
      setError('Failed to remove player');
      console.error(err);
    }
  }

  function togglePlayerSelection(playerName: string) {
    setSelectedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerName)) {
        newSet.delete(playerName);
      } else {
        newSet.add(playerName);
      }
      return newSet;
    });
  }

  function handleChooseFirstPlayer() {
    if (selectedPlayers.size === 0) return;

    const selectedArray = Array.from(selectedPlayers);

    // If only one player, skip animation
    if (selectedArray.length === 1) {
      setWinner(selectedArray[0]);
      setShowWinner(true);
      return;
    }

    // Select random winner upfront
    const randomIndex = Math.floor(Math.random() * selectedArray.length);
    const selectedWinner = selectedArray[randomIndex];
    setWinner(selectedWinner);
    setShowWinner(false);

    // Animation sequence
    // Phase 1: Flip all cards face-down (800ms)
    setAnimationPhase('flipping-down');

    setTimeout(() => {
      // Phase 2: Shuffle cards (2000ms)
      setAnimationPhase('shuffling');

      setTimeout(() => {
        // Phase 3: Choose one card - highlight it (500ms)
        setAnimationPhase('choosing');

        setTimeout(() => {
          // Phase 4: Push other cards away (800ms)
          setAnimationPhase('pushing-away');

          setTimeout(() => {
            // Phase 5: Flip chosen card face-up to reveal (600ms)
            setAnimationPhase('revealing');

            setTimeout(() => {
              // Show final winner state
              setShowWinner(true);
              setAnimationPhase('idle');
            }, 600);
          }, 800);
        }, 500);
      }, 2000);
    }, 800);
  }

  function handleChooseAgain() {
    setWinner(null);
    setShowWinner(false);
    setAnimationPhase('idle');
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleAddPlayer();
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const selectedArray = Array.from(selectedPlayers);
  const canChoose = selectedArray.length > 0 && animationPhase === 'idle' && !showWinner;
  const isAnimating = animationPhase !== 'idle';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="hidden md:flex items-center gap-3 mb-6">
        <Dice6 className="w-8 h-8 text-purple-600" />
        <h2 className="text-3xl font-display font-light text-slate-900">First Player Chooser</h2>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Player Management Section */}
      <div className="bg-white rounded-lg shadow-sm border border-container p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-display font-light text-slate-900">Manage Players</h3>
        </div>

        {/* Add Player Input */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter player name..."
            maxLength={30}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
          <button
            onClick={handleAddPlayer}
            disabled={!newPlayerName.trim()}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Player
          </button>
        </div>

        {/* Player List */}
        {players.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No players saved yet. Add players to get started!</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-600 mb-3">
              Select players participating tonight ({selectedArray.length} selected)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {players.map(player => (
                <div
                  key={player}
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                >
                  <input
                    type="checkbox"
                    id={`player-${player}`}
                    checked={selectedPlayers.has(player)}
                    onChange={() => togglePlayerSelection(player)}
                    className="w-4 h-4 text-purple-600 focus:ring-2 focus:ring-purple-500 rounded"
                  />
                  <label
                    htmlFor={`player-${player}`}
                    className="flex-1 cursor-pointer text-slate-900 truncate"
                    title={player}
                  >
                    {player}
                  </label>
                  <button
                    onClick={() => handleRemovePlayer(player)}
                    className="p-1 text-slate-400 hover:text-red-600 transition"
                    aria-label={`Remove ${player}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Card Display and Animation Area */}
      {selectedArray.length > 0 && !showWinner && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-sm border border-purple-200 p-8 mb-6">
          <div
            className="relative min-h-[280px] flex items-center justify-center mb-8 overflow-hidden"
            role="region"
            aria-label="Player cards"
            style={{ perspective: '1500px' }}
          >
            <div className="flex flex-wrap gap-4 justify-center" style={{ transformStyle: 'preserve-3d' }}>
              {selectedArray.map((player, index) => {
                const isWinnerCard = winner === player;
                // Only apply card-face-down AFTER the initial flip animation completes
                const hasFlippedDown = ['shuffling', 'choosing', 'pushing-away', 'revealing'].includes(animationPhase);
                const isRevealing = animationPhase === 'revealing' && isWinnerCard;

                const cardClasses = [
                  'player-card',
                  // Keep cards face-down after initial flip, unless it's the winner revealing
                  hasFlippedDown && !isRevealing && 'card-face-down',
                  animationPhase === 'flipping-down' && 'card-flip-down',
                  animationPhase === 'shuffling' && 'card-shuffle',
                  animationPhase === 'choosing' && (isWinnerCard ? 'card-chosen' : 'card-not-chosen'),
                  animationPhase === 'pushing-away' && (isWinnerCard ? 'card-winner-stay' : 'card-push-away'),
                  animationPhase === 'revealing' && (isWinnerCard ? 'card-flip-up' : 'card-stay-away'),
                ].filter(Boolean).join(' ');

                return (
                  <div
                    key={player}
                    className={cardClasses}
                    style={{
                      animationDelay: `${index * 0.03}s`,
                      '--shuffle-x': `${(Math.random() - 0.5) * 600}px`,
                      '--shuffle-y': `${(Math.random() - 0.5) * 400}px`,
                      '--shuffle-x2': `${(Math.random() - 0.5) * 600}px`,
                      '--shuffle-y2': `${(Math.random() - 0.5) * 400}px`,
                      '--shuffle-rotate': `${(Math.random() - 0.5) * 120}deg`,
                      '--push-x': `${(index % 2 === 0 ? -1 : 1) * (300 + index * 50)}px`,
                      '--push-y': `${((index % 3) - 1) * 200}px`,
                    } as React.CSSProperties}
                  >
                    <div className="card-face card-front">
                      <div className="bg-white rounded-lg shadow-lg p-6 text-center border-2 border-purple-300 h-32 w-32 flex items-center justify-center">
                        <p className="text-lg font-bold text-slate-900 truncate px-2" title={player}>
                          {player}
                        </p>
                      </div>
                    </div>
                    <div className="card-face card-back">
                      <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg h-32 w-32 flex items-center justify-center border-2 border-purple-700">
                        <Dice6 className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Choose Button */}
          <div className="text-center">
            <button
              onClick={handleChooseFirstPlayer}
              disabled={!canChoose}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {isAnimating ? 'Shuffling Cards...' : 'Choose First Player! 🎲'}
            </button>
          </div>
        </div>
      )}

      {/* Winner Display */}
      {showWinner && winner && (
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg shadow-lg border-2 border-purple-300 p-8 mb-6 animate-[fadeIn_0.5s_ease-in]">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-display font-light text-slate-900 mb-2">First Player Chosen!</h3>
          </div>

          <div className="winner-card bg-white rounded-xl shadow-2xl p-12 text-center border-4 border-purple-400 mb-6">
            <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
              {winner}
            </p>
            <p className="text-xl text-slate-600">goes first!</p>
          </div>

          <div className="text-center">
            <button
              onClick={handleChooseAgain}
              className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition transform hover:scale-105 active:scale-95"
            >
              Choose Again 🔄
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
