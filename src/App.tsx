import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';
import Library from './components/Library';
import AdminPanel from './components/AdminPanel';
import GameNiteTools from './components/GameNiteTools';
import Dashboard from './components/Dashboard';
import ProfileDrawer from './components/ProfileDrawer';
import { Shield, BookOpen, Sparkles, BarChart3 } from 'lucide-react';

type Tool = 'game-chooser' | 'first-player' | 'turn-timer' | 'game-timer';

const MeepleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="5" r="3" />
    <path d="M6 9.5C4 9.5 3.5 11.5 5 13L6.5 16L4 22H9.5V17.5H14.5V22H20L17.5 16L19 13C20.5 11.5 20 9.5 18 9.5H6Z" />
  </svg>
);

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'library' | 'gameNiteTools' | 'admin'>('dashboard');
  const [selectedTool, setSelectedTool] = useState<Tool | undefined>(undefined);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={() => {}} />;
  }

  const isAdmin = profile?.is_admin || false;

  const discColors: Record<string, { base: string; light: string; dark: string }> = {
    dashboard:    { base: '#b85c28', light: '#d4855a', dark: '#6b3412' }, // terracotta
    library:      { base: '#3a7040', light: '#5d9560', dark: '#163720' }, // forest
    gameNiteTools:{ base: '#2e8282', light: '#52a5a5', dark: '#0d3e3e' }, // sky
    admin:        { base: '#74389a', light: '#9a62b8', dark: '#2e0d46' }, // plum
  };

  const woodenDisc = (tab: string, pos?: React.CSSProperties) => {
    const c = discColors[tab];
    const discW = 22;
    const topH = 12;  // ellipse height (squashed to simulate ~40° viewing angle)
    const sideH = 7;  // visible side/rim thickness below the equator
    const wrapH = Math.floor(topH / 2) + sideH;

    const defaultPos: React.CSSProperties = {
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%) translateY(50%)',
    };

    return (
      <span
        className="pointer-events-none z-10"
        style={{ position: 'absolute', width: discW, height: wrapH, ...(pos ?? defaultPos) }}
      >
        {/* Visible side/rim — rendered first so top face overlaps it */}
        <span
          style={{
            position: 'absolute',
            top: Math.floor(topH / 2),
            left: 0,
            right: 0,
            height: sideH,
            background: `linear-gradient(to bottom, ${c.dark} 0%, rgba(8,3,1,0.88) 100%)`,
            borderRadius: `0 0 ${discW / 2}px ${discW / 2}px / 0 0 ${Math.ceil(sideH * 0.45)}px ${Math.ceil(sideH * 0.45)}px`,
            boxShadow: '0 4px 8px rgba(0,0,0,0.55)',
          }}
        />
        {/* Top face — ellipse with wood grain texture */}
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: topH,
            borderRadius: '50%',
            background: [
              'repeating-linear-gradient(82deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 3px)',
              `radial-gradient(ellipse at 40% 32%, ${c.light} 0%, ${c.base} 52%, ${c.dark} 100%)`,
            ].join(', '),
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.20)',
            zIndex: 1,
          }}
        />
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white overflow-visible">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2 py-4">
                <MeepleIcon className="w-8 h-8 text-slate-900" />
                <h1 className="text-2xl font-bold text-slate-900 font-display">
                  Libre Ludorum
                </h1>
              </div>

              <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`relative flex items-center space-x-2 px-6 py-4 font-medium transition ${
                  activeTab === 'dashboard' ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Dashboard</span>
                {activeTab === 'dashboard' && woodenDisc('dashboard')}
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`relative flex items-center space-x-2 px-6 py-4 font-medium transition ${
                  activeTab === 'library' ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span>My Catalogue</span>
                {activeTab === 'library' && woodenDisc('library', { top: 7, right: 18 })}
              </button>
              <button
                onClick={() => setActiveTab('gameNiteTools')}
                className={`relative flex items-center space-x-2 px-6 py-4 font-medium transition ${
                  activeTab === 'gameNiteTools' ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span>Game Nite Tools</span>
                {activeTab === 'gameNiteTools' && woodenDisc('gameNiteTools', { bottom: 11, left: 50 })}
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`relative flex items-center space-x-2 px-6 py-4 font-medium transition ${
                    activeTab === 'admin' ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span>Admin</span>
                  {activeTab === 'admin' && woodenDisc('admin')}
                </button>
              )}
              </div>
            </div>

            {profile && (
              <button
                onClick={() => setIsProfileDrawerOpen(true)}
                className="flex items-center space-x-2 px-6 py-4 font-medium transition text-slate-600 hover:text-slate-900"
              >
                <MeepleIcon className="w-5 h-5" />
                <span className="hidden sm:inline">{profile.username}</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      <ProfileDrawer isOpen={isProfileDrawerOpen} onClose={() => setIsProfileDrawerOpen(false)} />

      {activeTab === 'dashboard' && (
        <Dashboard
          onNavigate={(tab, params) => {
            setActiveTab(tab);
            if (tab === 'gameNiteTools' && params?.tool) {
              setSelectedTool(params.tool);
            }
          }}
        />
      )}
      {activeTab === 'library' && <Library />}
      {activeTab === 'gameNiteTools' && <GameNiteTools initialTool={selectedTool} />}
      {activeTab === 'admin' && <AdminPanel />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
