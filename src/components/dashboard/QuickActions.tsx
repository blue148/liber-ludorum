import { Sparkles, Dice6, Timer } from 'lucide-react';

type Tool = 'game-chooser' | 'first-player' | 'turn-timer' | 'game-timer';

interface QuickActionsProps {
  onNavigateToGameNiteTools: (tool?: Tool) => void;
}

const actions = [
  { tool: 'game-chooser' as Tool, label: 'Game Picker',  Icon: Sparkles },
  { tool: 'first-player' as Tool, label: 'First Player', Icon: Dice6    },
  { tool: 'turn-timer'   as Tool, label: 'Turn Timer',   Icon: Timer    },
];

export default function QuickActions({ onNavigateToGameNiteTools }: QuickActionsProps) {
  return (
    <div className="flex gap-2">
      {actions.map(({ tool, label, Icon }) => (
        <button
          key={tool}
          onClick={() => onNavigateToGameNiteTools(tool)}
          className="flex-1 flex flex-col items-center justify-center gap-2 h-[72px] bg-parchment-100 border border-parchment-300 hover:bg-parchment-200 active:bg-parchment-300 transition"
        >
          <Icon className="w-5 h-5 text-clay-400" strokeWidth={1.5} />
          <span className="text-[10px] font-body text-ink-400 font-medium text-center leading-tight px-1">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
