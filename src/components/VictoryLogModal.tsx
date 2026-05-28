import { useState, useEffect } from 'react';
import { X, Plus, Minus, Trophy, Clock, Users, Calendar, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createGameSessionWithVictories } from '../lib/sessions';
import { Game } from '../lib/supabase';
import { toast } from 'sonner';

interface VictoryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedGame?: Game;
  onSessionLogged?: () => void;
}

interface Player {
  id: string;
  name: string;
  isWinner: boolean;
  score?: number;
  placement?: number;
}

export default function VictoryLogModal({ isOpen, onClose, preSelectedGame, onSessionLogged }: VictoryLogModalProps) {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<Game | null>(preSelectedGame || null);
  const [sessionDate, setSessionDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  });
  const [duration, setDuration] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Me', isWinner: false, score: undefined, placement: undefined }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preSelectedGame) {
      setSelectedGame(preSelectedGame);
    }
  }, [preSelectedGame]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setSelectedGame(preSelectedGame || null);
      setSessionDate(() => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offset).toISOString().slice(0, 16);
      });
      setDuration('');
      setNotes('');
      setPlayers([
        { id: '1', name: 'Me', isWinner: false, score: undefined, placement: undefined }
      ]);
    }
  }, [isOpen, preSelectedGame]);

  const addPlayer = () => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: '',
      isWinner: false,
      score: undefined,
      placement: undefined
    };
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = (playerId: string) => {
    if (players.length > 1) {
      setPlayers(players.filter(p => p.id !== playerId));
    }
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setPlayers(players.map(p =>
      p.id === playerId ? { ...p, ...updates } : p
    ));
  };

  const toggleWinner = (playerId: string) => {
    setPlayers(players.map(p => ({
      ...p,
      isWinner: p.id === playerId ? !p.isWinner : p.isWinner
    })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedGame) {
      toast.error('Missing required information');
      return;
    }

    // Validate players
    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length === 0) {
      toast.error('Please add at least one player');
      return;
    }

    // Check if we have at least one winner (optional validation)
    const winners = validPlayers.filter(p => p.isWinner);
    if (winners.length === 0) {
      const confirm = window.confirm('No winners selected. Continue anyway?');
      if (!confirm) return;
    }

    setLoading(true);

    try {
      const sessionData = {
        session_date: sessionDate,
        duration_minutes: duration ? Number(duration) : undefined,
        player_count: validPlayers.length,
        notes: notes.trim() || undefined,
      };

      const victories = validPlayers.map((player) => ({
        player_name: player.name.trim(),
        is_winner: player.isWinner,
        score: player.score || undefined,
        placement: player.placement || undefined,
      }));

      await createGameSessionWithVictories(user.id, selectedGame.id, sessionData, victories);

      toast.success('Game session logged successfully!');
      onSessionLogged?.();
      onClose();
    } catch (error) {
      console.error('Error logging game session:', error);
      toast.error('Failed to log game session');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-container">
          <h2 className="text-xl font-display font-light text-slate-900">Log Game Session</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(90vh-140px)]">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Game Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Game
              </label>
              {selectedGame ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  {selectedGame.cover_image && (
                    <img
                      src={selectedGame.cover_image}
                      alt={selectedGame.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-medium text-slate-900">{selectedGame.name}</p>
                    {selectedGame.publisher && (
                      <p className="text-sm text-slate-600">{selectedGame.publisher}</p>
                    )}
                  </div>
                  {!preSelectedGame && (
                    <button
                      type="button"
                      onClick={() => setSelectedGame(null)}
                      className="ml-auto p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-lg">
                  <p className="text-slate-600">Game selection coming soon...</p>
                  <p className="text-sm text-slate-500 mt-1">For now, trigger this modal from a specific game card</p>
                </div>
              )}
            </div>

            {/* Session Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date & Time */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Clock className="w-4 h-4" />
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Players Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Users className="w-4 h-4" />
                  Players ({players.length})
                </label>
                <button
                  type="button"
                  onClick={addPlayer}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Player
                </button>
              </div>

              <div className="space-y-3">
                {players.map((player, index) => (
                  <div key={player.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    {/* Player Name */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
                        placeholder={index === 0 ? "Me" : "Player name"}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>

                    {/* Winner Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleWinner(player.id)}
                      className={`flex items-center gap-1 px-3 py-2 rounded text-sm font-medium transition ${
                        player.isWinner
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      <Trophy className="w-4 h-4" />
                      {player.isWinner ? 'Winner' : 'Player'}
                    </button>

                    {/* Score */}
                    <div className="w-20">
                      <input
                        type="number"
                        value={player.score || ''}
                        onChange={(e) => updatePlayer(player.id, {
                          score: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        placeholder="Score"
                        className="w-full px-2 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* Placement */}
                    <div className="w-16">
                      <input
                        type="number"
                        min="1"
                        value={player.placement || ''}
                        onChange={(e) => updatePlayer(player.id, {
                          placement: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        placeholder="#"
                        className="w-full px-2 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* Remove Player */}
                    {players.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePlayer(player.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <FileText className="w-4 h-4" />
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this game session..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-container bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedGame}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4" />
                  Log Session
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}