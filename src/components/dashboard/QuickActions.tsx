import { Dice6, Timer, Loader } from 'lucide-react';

type Tool = 'game-chooser' | 'first-player' | 'turn-timer' | 'game-timer';

interface QuickActionsProps {
  onNavigateToGameNiteTools: (tool?: Tool) => void;
}

export default function QuickActions({ onNavigateToGameNiteTools }: QuickActionsProps) {
  const actions = [
    {
      tool: 'game-chooser' as Tool,
      label: 'Game Picker',
      Icon: Loader,
      gradient: 'from-violet-500 to-purple-700',
      shadow: '0 1px 0 inset rgba(255,255,255,0.25), 0 -1px 0 inset rgba(0,0,0,0.2), 0 4px 6px -1px rgba(109,40,217,0.5), 0 10px 24px -4px rgba(109,40,217,0.35), 0 2px 4px rgba(0,0,0,0.25)',
      hoverShadow: '0 1px 0 inset rgba(255,255,255,0.25), 0 -1px 0 inset rgba(0,0,0,0.2), 0 6px 10px -1px rgba(109,40,217,0.6), 0 16px 32px -4px rgba(109,40,217,0.45), 0 4px 8px rgba(0,0,0,0.3)',
    },
    {
      tool: 'first-player' as Tool,
      label: 'Choose First Player',
      Icon: Dice6,
      gradient: 'from-pink-500 to-rose-700',
      shadow: '0 1px 0 inset rgba(255,255,255,0.25), 0 -1px 0 inset rgba(0,0,0,0.2), 0 4px 6px -1px rgba(225,29,72,0.5), 0 10px 24px -4px rgba(225,29,72,0.35), 0 2px 4px rgba(0,0,0,0.25)',
      hoverShadow: '0 1px 0 inset rgba(255,255,255,0.25), 0 -1px 0 inset rgba(0,0,0,0.2), 0 6px 10px -1px rgba(225,29,72,0.6), 0 16px 32px -4px rgba(225,29,72,0.45), 0 4px 8px rgba(0,0,0,0.3)',
    },
    {
      tool: 'turn-timer' as Tool,
      label: 'Turn Timer',
      Icon: Timer,
      gradient: 'from-sky-400 to-blue-600',
      shadow: '0 1px 0 inset rgba(255,255,255,0.25), 0 -1px 0 inset rgba(0,0,0,0.2), 0 4px 6px -1px rgba(37,99,235,0.5), 0 10px 24px -4px rgba(37,99,235,0.35), 0 2px 4px rgba(0,0,0,0.25)',
      hoverShadow: '0 1px 0 inset rgba(255,255,255,0.25), 0 -1px 0 inset rgba(0,0,0,0.2), 0 6px 10px -1px rgba(37,99,235,0.6), 0 16px 32px -4px rgba(37,99,235,0.45), 0 4px 8px rgba(0,0,0,0.3)',
    },
  ];

  return (
    <div className="flex gap-2 sm:flex-wrap sm:gap-3">
      {actions.map(({ tool, label, Icon, gradient, shadow, hoverShadow }) => (
        <button
          key={tool}
          onClick={() => onNavigateToGameNiteTools(tool)}
          style={{ boxShadow: shadow }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = hoverShadow)}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = shadow)}
          className={`group flex flex-1 sm:flex-none flex-col items-center justify-center gap-1.5 sm:gap-2 h-16 sm:w-32 sm:h-24 bg-gradient-to-b ${gradient} container-radius hover:brightness-110 transition border-0`}
        >
          <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform" />
          <span className="text-white text-sm text-center leading-tight px-2">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
