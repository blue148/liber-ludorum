import { useState } from 'react';
import GameChooser from './GameChooser';
import FirstPlayerChooser from './FirstPlayerChooser';
import TurnTimer from './TurnTimer';
import GameTimer from './GameTimer';
import { Sparkles, Dice6, Timer, Clock } from 'lucide-react';

type Tool = 'game-chooser' | 'first-player' | 'turn-timer' | 'game-timer';

interface GameNiteToolsProps {
  initialTool?: Tool;
}

const tools = [
  { id: 'game-chooser' as Tool, label: 'Game Chooser', sublabel: 'Spin the wheel to pick a game', Icon: Sparkles, iconColor: 'text-plum-400'  },
  { id: 'first-player' as Tool, label: 'First Player',  sublabel: 'Randomly pick who goes first',  Icon: Dice6,    iconColor: 'text-clay-400'  },
  { id: 'turn-timer'   as Tool, label: 'Turn Timer',    sublabel: 'Countdown each player turn',    Icon: Timer,    iconColor: 'text-sky-400'   },
  { id: 'game-timer'   as Tool, label: 'Game Timer',    sublabel: 'Track a game session',          Icon: Clock,    iconColor: 'text-wheat-400' },
];

export default function GameNiteTools({ initialTool }: GameNiteToolsProps) {
  // Which tool is active (used by desktop tabs and mobile tool view)
  const [activeTool, setActiveTool] = useState<Tool>(initialTool ?? 'game-chooser');
  // Mobile-only: 'grid' shows the 4 cards, 'tool' shows the selected tool
  const [mobileView, setMobileView] = useState<'grid' | 'tool'>(initialTool ? 'tool' : 'grid');
  // Controls the fade/slide animation between views on mobile
  const [isVisible, setIsVisible] = useState(true);

  const transitionToTool = (tool: Tool) => {
    setIsVisible(false);
    setTimeout(() => {
      setActiveTool(tool);
      setMobileView('tool');
      setIsVisible(true);
    }, 180);
  };

  const transitionToGrid = () => {
    setIsVisible(false);
    setTimeout(() => {
      setMobileView('grid');
      setIsVisible(true);
    }, 180);
  };

  const activeDef = tools.find(t => t.id === activeTool)!;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">

      {/* ── Desktop header ─────────────────────────────────────────────────── */}
      <div className="hidden md:block mb-8">
        <h1 className="text-3xl font-display font-light text-slate-900 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-600" />
          Game Nite Tools
        </h1>
        <p className="text-slate-600 mt-2">Make your game night planning easy and fun!</p>
      </div>

      {/* ── Desktop tab bar ─────────────────────────────────────────────────── */}
      <div className="hidden md:block mb-8 bg-white rounded-lg shadow-sm border border-container">
        <div className="flex border-b border-container">
          {tools.map(({ id, label, sublabel, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTool(id)}
              className={`flex-1 px-6 py-4 text-center font-medium transition-all ${
                activeTool === id
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </div>
              <p className="text-xs mt-1 opacity-75">{sublabel}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Mobile animated nav ─────────────────────────────────────────────── */}
      <div
        className="md:hidden"
        style={{
          transition: 'opacity 180ms ease, transform 180ms ease',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(6px)',
        }}
      >
        {mobileView === 'grid' ? (
          /* 2×2 card grid */
          <div className="grid grid-cols-2 gap-3">
            {tools.map(({ id, label, sublabel, Icon, iconColor }) => (
              <button
                key={id}
                onClick={() => transitionToTool(id)}
                className="flex flex-col items-start gap-3 p-4 bg-white border thin-rule rule-line hover:bg-slate-50 active:bg-slate-100 transition text-left"
              >
                <Icon className={`w-6 h-6 ${iconColor}`} />
                <div>
                  <div className="font-medium text-sm leading-tight text-slate-900">{label}</div>
                  <div className="text-xs mt-1 text-slate-500">{sublabel}</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Tool heading with quick-switch row */
          <div className="mb-5">
            {/* 3 quick-switch buttons for the other tools */}
            <div className="flex gap-2 mb-5">
              {tools
                .filter(t => t.id !== activeTool)
                .map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => transitionToTool(id)}
                    className="flex-1 py-2 px-2 text-xs font-body text-slate-600 bg-white border thin-rule rule-line hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 transition"
                  >
                    {label}
                  </button>
                ))}
            </div>
            {/* Active tool heading */}
            <div className="flex items-center gap-3">
              <activeDef.Icon className={`w-6 h-6 ${activeDef.iconColor}`} />
              <h2 className="text-2xl font-display font-light text-slate-900">{activeDef.label}</h2>
            </div>
          </div>
        )}
      </div>

      {/* ── Tool content ───────────────────────────────────────────────────── */}
      {/* Single instance — hidden on mobile when the grid is showing */}
      <div className={mobileView === 'grid' ? 'hidden md:block' : ''}>
        {activeTool === 'game-chooser' && <GameChooser />}
        {activeTool === 'first-player' && <FirstPlayerChooser />}
        {activeTool === 'turn-timer'   && <TurnTimer />}
        {activeTool === 'game-timer'   && <GameTimer />}
      </div>
    </div>
  );
}
