import { useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const SEARCH_THRESHOLD = 20;

export default function MultiSelectDropdown({
  title,
  options,
  selected,
  onToggle,
  onClear,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const showSearch = options.length > SEARCH_THRESHOLD;
  const visibleOptions = showSearch && search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleClose = () => { setIsOpen(false); setSearch(''); };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-body font-medium text-ink-400 uppercase tracking-wider">{title}</h4>
        {selected.length > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-body text-ink-300 hover:text-ink-500 underline"
          >
            Clear
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); if (isOpen) setSearch(''); }}
        className="w-full px-3 py-2 text-left bg-cream border border-parchment-300 text-xs font-body text-ink-400 hover:bg-parchment-100 transition flex items-center justify-between"
      >
        <span className="truncate">
          {selected.length === 0
            ? options.length > 0 ? `All (${options.length})` : 'No options available'
            : `${selected.length} of ${options.length} selected`}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 ml-2 transition-transform text-ink-200 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={handleClose} />
          <div className="absolute z-[101] w-full mt-1 bg-cream border border-parchment-300 shadow-lg">
            {showSearch && (
              <div className="flex items-center gap-2 px-3 py-2 border-b border-parchment-300 bg-cream">
                <Search className="w-3.5 h-3.5 text-ink-200 flex-shrink-0" strokeWidth={1.5} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${title.toLowerCase()}…`}
                  className="flex-1 text-xs font-body bg-transparent focus:outline-none text-ink-600 placeholder:text-ink-200"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
                {search && (
                  <button onClick={(e) => { e.stopPropagation(); setSearch(''); }}>
                    <X className="w-3 h-3 text-ink-200 hover:text-ink-400 transition" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            )}
            <div className="max-h-56 overflow-y-auto">
              {visibleOptions.length === 0 ? (
                <div className="px-4 py-2 text-xs font-body text-ink-300">
                  {options.length === 0 ? 'No options available' : 'No matches'}
                </div>
              ) : (
                visibleOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-parchment-100 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(option)}
                      onChange={() => onToggle(option)}
                      className="w-3.5 h-3.5 border-parchment-300 text-ink-500 focus:ring-ink-400 cursor-pointer"
                    />
                    <span className="text-xs font-body text-ink-400">{option}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
