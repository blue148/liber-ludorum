import { useState } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { UserWishlistEntry, Game } from '../lib/supabase';

interface EditWishlistModalProps {
  entry: UserWishlistEntry & { game: Game };
  onSave: (entryId: string, updates: Partial<UserWishlistEntry>) => void;
  onClose: () => void;
  onDelete: (entryId: string) => void;
}

export default function EditWishlistModal({ entry, onSave, onClose, onDelete }: EditWishlistModalProps) {
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(entry.priority);
  const [notes, setNotes] = useState(entry.notes || '');
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(entry.id, {
      priority,
      notes: notes.trim() || undefined,
    });
  };

  const handleDelete = () => {
    if (confirm(`Remove "${entry.game.name}" from your wishlist?`)) {
      onDelete(entry.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-cream border thin-rule rule-line shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-cream border-b thin-rule rule-line p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-light text-slate-900 tracking-wide">Edit Wishlist Item</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 transition"
              title="Close"
            >
              <X className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-slate-50 border thin-rule rule-line p-4">
            <h3 className="font-display font-medium text-slate-900 mb-2">{entry.game.name}</h3>
            {entry.game.publisher && (
              <p className="text-sm font-body text-slate-600">{entry.game.publisher}</p>
            )}
            {entry.game.year && (
              <p className="text-sm font-body text-slate-600">{entry.game.year}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-body font-medium text-slate-900 mb-2">
              Priority
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                className="flex items-center justify-between gap-2 w-full bg-cream border border-parchment-300 px-4 py-2 text-xs font-body text-ink-400 hover:bg-parchment-100 transition"
              >
                <span>{priority === 'high' ? 'High Priority' : priority === 'medium' ? 'Medium Priority' : 'Low Priority'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-ink-200 flex-shrink-0" strokeWidth={1.5} />
              </button>
              {showPriorityMenu && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowPriorityMenu(false)} />
                  <div className="absolute left-0 top-full mt-1 w-full bg-cream border border-parchment-300 shadow-lg py-1 z-[101]">
                    {(['high', 'medium', 'low'] as const).map((p) => (
                      <button key={p} type="button" onClick={() => { setPriority(p); setShowPriorityMenu(false); }}
                        className="w-full px-4 py-2 text-left text-xs font-body text-ink-400 hover:bg-parchment-100 flex items-center gap-2">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 ${priority === p ? 'opacity-100' : 'opacity-0'}`} strokeWidth={2} />
                        <span>{p === 'high' ? 'High Priority' : p === 'medium' ? 'Medium Priority' : 'Low Priority'}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <p className="text-xs font-body text-slate-600 mt-1">
              How much do you want this game?
            </p>
          </div>

          <div>
            <label className="block text-sm font-body font-medium text-slate-900 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why do you want this game? Where did you hear about it?"
              rows={4}
              className="w-full px-3 py-2 border thin-rule rule-line bg-cream focus:outline-none focus:bg-white transition-colors text-sm font-body resize-none"
            />
            <p className="text-xs font-body text-slate-600 mt-1">
              Optional notes about this game
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t thin-rule rule-line">
            <button
              type="submit"
              className="flex-1 bg-slate-900 text-cream py-3 hover:bg-slate-800 transition font-body text-sm uppercase tracking-wider"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-3 border thin-rule border-terracotta-300 text-terracotta-700 hover:bg-terracotta-50 transition font-body text-sm uppercase tracking-wider"
            >
              Remove
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}