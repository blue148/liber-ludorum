import { useState } from 'react';

export default function FilterSection({
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
      <h4 className="text-xs font-body font-medium text-ink-400 uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-2">
        {displayOptions.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="w-3.5 h-3.5 border-parchment-300 text-ink-500 focus:ring-ink-400 cursor-pointer"
            />
            <span className="text-xs font-body text-ink-400 group-hover:text-ink-600 capitalize">
              {option}
            </span>
          </label>
        ))}
        {options.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-body text-ink-300 hover:text-ink-500 underline"
          >
            {showAll ? 'Show less' : `Show ${options.length - 5} more`}
          </button>
        )}
      </div>
    </div>
  );
}
