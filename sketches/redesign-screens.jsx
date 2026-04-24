// redesign-screens.jsx
// Libre Ludorum — Mobile-First Redesign · Screen Components
const { useState } = React;

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  cream:   '#fdf8f0', parch:  '#f7eed8',  border: '#ddc898', bdStr: '#9e9180',
  ink:     '#1a1610', ink2:   '#352e22',  ink3:   '#574e3e', ink4:  '#7a6e5c', ink5: '#9e9180',
  clay:    '#b85c28', clay2:  '#8f3e14',
  forest:  '#245230', forest2:'#163720',
  sky:     '#2e8282', sky2:   '#1a5f5f',
  plum:    '#74389a', plum2:  '#4f1f72',
  wheat:   '#c49018', wheat2: '#8e640a',
  white:   '#ffffff',
};
const F = {
  serif: "'Cormorant Garamond', Georgia, serif",
  sans:  "'Jost', system-ui, sans-serif",
};

// ── SVG icon set (Lucide-style, 1.5px stroke) ─────────────────────────────────
const Ic = {
  BarChart:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect x="7" y="9" width="3" height="9" rx="1"/><rect x="12" y="5" width="3" height="13" rx="1"/><rect x="17" y="12" width="3" height="6" rx="1"/></svg>,
  BookOpen:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Sparkles:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>,
  SparklesSm:   () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/><path d="M5 3v3m11 15v3M3 5h3m15 11h3"/></svg>,
  Search:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Camera:       () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
  CameraSm:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
  Star:         ({ filled }) => <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Plus:         () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  PlusSm:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Filter:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Users:        () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Clock:        () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  ClockMd:      () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Dice:         () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/><circle cx="16" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/></svg>,
  Timer:        () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="10" y1="2" x2="14" y2="2"/><line x1="12" y1="14" x2="12" y2="9"/><circle cx="12" cy="14" r="8"/></svg>,
  ChevronRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevronDown:  () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  ArrowLeft:    () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  X:            () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Trophy:       () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 0h1.5a2.5 2.5 0 0 0 0-5H18m-14 20h16M10 15v2c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22m7-7v2c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  MoreVert:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="19" r="1.2" fill="currentColor"/></svg>,
  Heart:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  UsersGroup:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

const MeepleIcon = ({ size = 20, color = C.ink }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <circle cx="12" cy="5" r="3"/>
    <path d="M6 9.5C4 9.5 3.5 11.5 5 13L6.5 16L4 22H9.5V17.5H14.5V22H20L17.5 16L19 13C20.5 11.5 20 9.5 18 9.5H6Z"/>
  </svg>
);

// ── Status bar ────────────────────────────────────────────────────────────────
function StatusBar({ bg = C.cream }) {
  return (
    <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', background: bg, flexShrink: 0, zIndex: 1 }}>
      <span style={{ fontFamily: F.sans, fontSize: 15, fontWeight: 600, color: C.ink, letterSpacing: '-0.01em' }}>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: C.ink }}>
        {/* Signal */}
        <svg width="17" height="12" viewBox="0 0 17 12">
          <rect x="0" y="6" width="3" height="6" rx="1" fill={C.ink}/>
          <rect x="4.5" y="4" width="3" height="8" rx="1" fill={C.ink}/>
          <rect x="9" y="2" width="3" height="10" rx="1" fill={C.ink}/>
          <rect x="13.5" y="0" width="3" height="12" rx="1" fill={C.ink} opacity="0.3"/>
        </svg>
        {/* WiFi */}
        <svg width="16" height="11" viewBox="0 0 16 11">
          <circle cx="8" cy="10" r="1.5" fill={C.ink}/>
          <path d="M4.5 6.8C5.5 5.7 6.7 5 8 5s2.5.7 3.5 1.8" stroke={C.ink} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M1.5 3.5C3.2 1.4 5.5 0 8 0s4.8 1.4 6.5 3.5" stroke={C.ink} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4"/>
        </svg>
        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12">
          <rect x=".5" y=".5" width="21" height="11" rx="2.5" stroke={C.ink} strokeWidth="1" fill="none"/>
          <rect x="2" y="2" width="15" height="8" rx="1.5" fill={C.ink}/>
          <path d="M23 4v4a2 2 0 0 0 0-4z" fill={C.ink} opacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

// ── Bottom navigation ─────────────────────────────────────────────────────────
function BottomNav({ active = 'dashboard' }) {
  const navColors = { dashboard: C.clay, library: C.forest, gamenite: C.plum, profile: C.sky };
  const items = [
    { id: 'dashboard', label: 'Dashboard', Icon: Ic.BarChart  },
    { id: 'library',   label: 'My Games',  Icon: Ic.BookOpen  },
    { id: 'gamenite',  label: 'Game Night',Icon: Ic.Sparkles  },
    { id: 'profile',   label: 'Profile',   Icon: null         },
  ];
  return (
    <div style={{ height: 80, background: C.white, borderTop: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'stretch', flexShrink: 0 }}>
      {items.map(({ id, label, Icon }) => {
        const isActive = active === id;
        const color = navColors[id];
        return (
          <div key={id} style={{ flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', paddingBottom: 14, gap: 3,
            color: isActive ? color : C.ink5, position: 'relative', cursor: 'pointer' }}>
            {isActive && <div style={{ position: 'absolute', top: 0, left: 8, right: 8, height: 2,
              background: color, borderRadius: '0 0 99px 99px' }}/>}
            {id === 'profile'
              ? <MeepleIcon size={20} color={isActive ? color : C.ink5}/>
              : <Icon />}
            <span style={{ fontFamily: F.sans, fontSize: 10, fontWeight: isActive ? 600 : 400,
              letterSpacing: '0.01em' }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Phone frame wrapper ───────────────────────────────────────────────────────
function PhoneScreen({ children, active, headerBg = C.cream }) {
  return (
    <div style={{ width: 390, height: 844, background: C.cream, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', fontFamily: F.sans, position: 'relative' }}>
      <StatusBar bg={headerBg}/>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {children}
        {/* Scroll fade — suggests more content below */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
          background: `linear-gradient(to bottom, transparent, ${C.cream})`, pointerEvents: 'none' }}/>
      </div>
      <BottomNav active={active}/>
    </div>
  );
}

// ── Small reusables ───────────────────────────────────────────────────────────
function SectionLabel({ children, px = 16 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: `14px ${px}px 8px` }}>
      <span style={{ fontFamily: F.sans, fontSize: 10, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: C.ink5, fontWeight: 500, flexShrink: 0 }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: C.border }}/>
    </div>
  );
}

function Cover({ color, abbr, size = 52 }) {
  return (
    <div style={{ width: size, height: size, background: color, borderRadius: 4, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: F.sans, fontSize: Math.max(9, size * 0.21), fontWeight: 700,
      color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em' }}>
      {abbr}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 1 — Dashboard
// ─────────────────────────────────────────────────────────────────────────────
function DashboardScreen() {
  const quickActions = [
    { label: 'Game Picker',   Icon: Ic.SparklesSm, from: '#7c3aed', to: '#4c1d95' },
    { label: 'First Player',  Icon: Ic.Dice,        from: '#e11d48', to: '#881337' },
    { label: 'Turn Timer',    Icon: Ic.Timer,        from: '#0284c7', to: '#075985' },
  ];
  const stats = [
    { label: 'Games',    value: '47' },
    { label: 'Sessions', value: '83' },
    { label: 'Starred',  value: '12' },
    { label: 'Unplayed', value: '15' },
  ];
  const mostPlayed = [
    { abbr: 'Ca', color: '#b85c28', name: 'Carcassonne',   plays: 12 },
    { abbr: 'W',  color: '#2d5a27', name: 'Wingspan',       plays: 8  },
    { abbr: 'TtR',color: '#c2410c', name: 'Ticket to Ride', plays: 7  },
    { abbr: 'TM', color: '#7c2d12', name: 'Terraforming…',  plays: 6  },
    { abbr: 'Az', color: '#1e40af', name: 'Azul',           plays: 4  },
  ];
  const recentGames = [
    { abbr: 'G',  color: '#1e293b', name: 'Gloomhaven: Jaws of the Lion', when: '2 days ago'  },
    { abbr: 'Cs', color: '#2e8282', name: 'Cascadia',                      when: '4 days ago'  },
  ];

  return (
    <PhoneScreen active="dashboard" headerBg={C.white}>
      {/* App bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px 12px', borderBottom: `1px solid ${C.border}`,
        background: C.white, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MeepleIcon size={22} color={C.ink}/>
          <span style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 300, color: C.ink, letterSpacing: '0.01em' }}>
            Libre Ludorum
          </span>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.clay,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: C.cream, fontFamily: F.sans, fontSize: 14, fontWeight: 600 }}>A</span>
        </div>
      </div>

      {/* Quick Actions */}
      <SectionLabel>Quick Actions</SectionLabel>
      <div style={{ display: 'flex', gap: 8, padding: '0 16px' }}>
        {quickActions.map(({ label, Icon, from, to }) => (
          <button key={label} style={{
            flex: 1, height: 70, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6,
            background: `linear-gradient(160deg, ${from}, ${to})`,
            border: 'none', borderRadius: 6, cursor: 'pointer',
            boxShadow: `0 4px 14px ${from}55`,
          }}>
            <div style={{ color: 'white' }}><Icon/></div>
            <span style={{ fontFamily: F.sans, fontSize: 10, color: 'rgba(255,255,255,0.9)',
              fontWeight: 500, textAlign: 'center', lineHeight: 1.2, paddingInline: 4 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <SectionLabel>Your Collection</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: '0 16px' }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{ background: C.white, padding: '14px 16px',
            border: `1px solid ${C.border}`, borderRadius: 4 }}>
            <div style={{ fontFamily: F.serif, fontSize: 34, fontWeight: 300, color: C.ink, lineHeight: 1 }}>{value}</div>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: C.ink5, marginTop: 4,
              textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Most Played */}
      <SectionLabel>Most Played</SectionLabel>
      <div style={{ display: 'flex', gap: 12, padding: '0 16px 4px', overflowX: 'hidden' }}>
        {mostPlayed.map(({ abbr, color, name, plays }) => (
          <div key={name} style={{ flexShrink: 0, width: 66, textAlign: 'center' }}>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Cover color={color} abbr={abbr} size={66}/>
              <div style={{ position: 'absolute', bottom: -7, right: -5,
                background: C.clay, borderRadius: 99, padding: '2px 7px',
                border: `2px solid ${C.cream}` }}>
                <span style={{ fontFamily: F.sans, fontSize: 9, fontWeight: 700, color: C.cream }}>{plays}×</span>
              </div>
            </div>
            <span style={{ fontFamily: F.sans, fontSize: 9, color: C.ink4, lineHeight: 1.3, display: 'block', marginTop: 10 }}>
              {name.length > 10 ? name.slice(0, 10) + '…' : name}
            </span>
          </div>
        ))}
      </div>

      {/* Recently Added */}
      <SectionLabel>Recently Added</SectionLabel>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {recentGames.map(({ abbr, color, name, when }) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
            background: C.white, borderRadius: 4, border: `1px solid ${C.border}` }}>
            <Cover color={color} abbr={abbr} size={40}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 500, color: C.ink,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
              <div style={{ fontFamily: F.sans, fontSize: 11, color: C.ink5, marginTop: 2 }}>{when}</div>
            </div>
            <div style={{ color: C.ink5, flexShrink: 0 }}><Ic.ChevronRight/></div>
          </div>
        ))}
      </div>
    </PhoneScreen>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 2 — Library: My Catalogue
// ─────────────────────────────────────────────────────────────────────────────
function LibraryScreen() {
  const games = [
    { abbr: 'Az', color: '#1e40af', name: 'Azul',               players: '2–4', time: 45,  plays: 4,  fav: true  },
    { abbr: 'Ca', color: '#b85c28', name: 'Carcassonne',         players: '2–5', time: 35,  plays: 12, fav: true  },
    { abbr: 'Cs', color: '#2e8282', name: 'Cascadia',            players: '1–4', time: 40,  plays: 5,  fav: false },
    { abbr: 'G',  color: '#1e293b', name: 'Gloomhaven: JotL',   players: '1–4', time: 60,  plays: 8,  fav: false },
    { abbr: 'P',  color: '#9f1239', name: 'Pandemic',            players: '2–4', time: 60,  plays: 3,  fav: false },
    { abbr: 'TM', color: '#7c2d12', name: 'Terraforming Mars',  players: '1–5', time: 120, plays: 6,  fav: true  },
    { abbr: 'TtR',color: '#c2410c', name: 'Ticket to Ride',     players: '2–5', time: 60,  plays: 7,  fav: false },
  ];
  const tabs = ['My Catalogue', 'Wishlist', 'Friends'];

  return (
    <PhoneScreen active="library" headerBg={C.white}>
      {/* Header + tabs */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px 0' }}>
          <span style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 300, color: C.ink }}>My Games</span>
          <span style={{ fontFamily: F.sans, fontSize: 11, color: C.ink5 }}>47 entries</span>
        </div>
        <div style={{ display: 'flex', marginTop: 8 }}>
          {tabs.map((tab, i) => (
            <button key={tab} style={{
              padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
              borderBottom: i === 0 ? `2px solid ${C.forest}` : '2px solid transparent',
              fontFamily: F.sans, fontSize: 12, letterSpacing: '0.02em',
              fontWeight: i === 0 ? 600 : 400,
              color: i === 0 ? C.forest : C.ink4,
            }}>
              {i === 1 && <span style={{ marginRight: 4, color: C.clay }}><Ic.Heart/></span>}
              {i === 2 && <span style={{ marginRight: 4 }}><Ic.UsersGroup/></span>}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar (with inline scan CTA) */}
      <div style={{ padding: '10px 16px', background: C.white, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0,
          background: C.cream, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 12px', gap: 8 }}>
            <div style={{ color: C.ink5, flexShrink: 0 }}><Ic.Search/></div>
            <span style={{ flex: 1, fontFamily: F.sans, fontSize: 13, color: C.ink5 }}>Search catalogue…</span>
          </div>
          <button style={{ height: 42, paddingInline: 14, background: C.clay, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, borderLeft: `1px solid ${C.clay2}` }}>
            <div style={{ color: C.cream }}><Ic.CameraSm/></div>
            <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 600, color: C.cream, letterSpacing: '0.04em' }}>SCAN</span>
          </button>
        </div>
      </div>

      {/* Filter / sort bar */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', background: C.cream,
        borderBottom: `1px solid ${C.border}`, alignItems: 'center', flexShrink: 0 }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
          background: C.white, border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer',
          fontFamily: F.sans, fontSize: 11, color: C.ink3 }}>
          <Ic.Filter/><span>Filters</span>
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
          background: C.white, border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer',
          fontFamily: F.sans, fontSize: 11, color: C.ink3 }}>
          <div style={{ color: C.wheat }}><Ic.Star filled={false}/></div><span>Starred</span>
        </button>
        <div style={{ flex: 1 }}/>
        <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px',
          background: C.white, border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer',
          fontFamily: F.sans, fontSize: 11, color: C.ink3 }}>
          <span>A–Z</span><Ic.ChevronDown/>
        </button>
      </div>

      {/* Games list */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {games.map(({ abbr, color, name, players, time, plays, fav }, i) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 16px', borderBottom: `1px solid ${C.border}`,
            background: i % 2 === 0 ? C.white : C.cream }}>
            <Cover color={color} abbr={abbr} size={48}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 500, color: C.ink,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>{name}</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: C.ink4, fontSize: 11, fontFamily: F.sans }}>
                  <Ic.Users/>{players}p
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: C.ink4, fontSize: 11, fontFamily: F.sans }}>
                  <Ic.Clock/>{time}m
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ color: fav ? C.wheat : C.border, display: 'flex' }}><Ic.Star filled={fav}/></div>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px',
                border: `1px solid ${C.border}`, borderRadius: 4, background: 'transparent',
                cursor: 'pointer', fontFamily: F.sans, fontSize: 12, color: C.ink3 }}>
                <div style={{ color: C.forest, display: 'flex' }}><Ic.PlusSm/></div>
                <span>{plays}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAB: Add/Scan */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
        <button style={{ width: 54, height: 54, borderRadius: '50%',
          background: `linear-gradient(145deg, ${C.clay}, ${C.clay2})`,
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 18px ${C.clay}66, 0 2px 6px rgba(0,0,0,0.2)`, color: C.cream }}>
          <Ic.Camera/>
        </button>
      </div>
    </PhoneScreen>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 3 — Library: Filter Bottom Sheet
// ─────────────────────────────────────────────────────────────────────────────
function LibraryFilterScreen() {
  const playerCounts = [1, 2, 3, 4, 5, '6+'];
  const gameTypes    = ['Strategy', 'Family', 'Party', 'Cooperative', 'Thematic'];
  const sortOptions  = ['Name A–Z', 'Recently Added', 'Most Played', 'Least Played'];
  const activeIdx    = new Set([1, 2]);       // 2- and 3-player selected
  const activeType   = new Set(['Strategy']); // Strategy selected

  return (
    <div style={{ width: 390, height: 844, background: C.cream, position: 'relative',
      overflow: 'hidden', fontFamily: F.sans }}>
      <StatusBar bg={C.white}/>

      {/* Dimmed library behind */}
      <div style={{ height: 400, background: C.cream, padding: '12px 16px', overflow: 'hidden', opacity: 0.45 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 300, color: C.ink }}>My Games</span>
          <span style={{ fontFamily: F.sans, fontSize: 11, color: C.ink5 }}>47 entries</span>
        </div>
        {[['Az','#1e40af','Azul'],['Ca','#b85c28','Carcassonne'],['Cs','#2e8282','Cascadia'],['G','#1e293b','Gloomhaven: JotL']].map(([abbr,color,name]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
            <Cover color={color} abbr={abbr} size={44}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 500, color: C.ink }}>{name}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,22,16,0.48)', zIndex: 10, top: 44 }}/>

      {/* Bottom Sheet */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
        background: C.white, borderRadius: '14px 14px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', maxHeight: 590 }}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 6px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: C.border }}/>
        </div>

        {/* Sheet header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 20px 14px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 400, color: C.ink }}>Filters</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: F.sans, fontSize: 11, color: C.clay, fontWeight: 500 }}>3 active</span>
            <button style={{ color: C.ink4, background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', padding: 4 }}><Ic.X/></button>
          </div>
        </div>

        {/* Scrollable filter body */}
        <div style={{ padding: '16px 20px', overflow: 'hidden' }}>

          {/* Players */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: F.sans, fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: C.ink5, marginBottom: 10 }}>Players</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {playerCounts.map((n, i) => (
                <div key={n} style={{
                  width: 44, height: 44, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${activeIdx.has(i) ? C.sky : C.border}`,
                  background: activeIdx.has(i) ? C.sky : C.cream,
                  color: activeIdx.has(i) ? C.white : C.ink3,
                  fontFamily: F.sans, fontSize: 13, fontWeight: activeIdx.has(i) ? 600 : 400, cursor: 'pointer',
                }}>{n}</div>
              ))}
            </div>
          </div>

          {/* Game Type */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: F.sans, fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: C.ink5, marginBottom: 10 }}>Game Type</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {gameTypes.map((t) => (
                <div key={t} style={{
                  padding: '7px 14px', borderRadius: 99, cursor: 'pointer',
                  border: `1px solid ${activeType.has(t) ? C.forest : C.border}`,
                  background: activeType.has(t) ? C.forest : C.cream,
                  color: activeType.has(t) ? C.cream : C.ink3,
                  fontFamily: F.sans, fontSize: 12,
                }}>{t}</div>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: C.ink5, marginBottom: 10 }}>Sort By</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {sortOptions.map((opt, i) => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 0', cursor: 'pointer', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${i === 0 ? C.forest : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {i === 0 && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.forest }}/>}
                  </div>
                  <span style={{ fontFamily: F.sans, fontSize: 13, color: i === 0 ? C.ink : C.ink3 }}>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 10, padding: '14px 20px 24px', borderTop: `1px solid ${C.border}` }}>
          <button style={{ flex: 1, height: 46, background: C.cream, border: `1px solid ${C.border}`,
            borderRadius: 4, fontFamily: F.sans, fontSize: 13, color: C.ink3, cursor: 'pointer' }}>
            Clear All
          </button>
          <button style={{ flex: 2, height: 46, background: C.forest, border: 'none',
            borderRadius: 4, fontFamily: F.sans, fontSize: 13, fontWeight: 600, color: C.cream, cursor: 'pointer' }}>
            Apply Filters (3)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 4 — Game Night Tools
// ─────────────────────────────────────────────────────────────────────────────
function GameNightScreen() {
  const tools = [
    { label: 'Game Chooser', sub: 'Spin the wheel to pick a game', Icon: Ic.SparklesSm, from: '#7c3aed', to: '#4c1d95', glow: '#7c3aed' },
    { label: 'First Player',  sub: 'Randomly pick who goes first',  Icon: Ic.Dice,        from: '#e11d48', to: '#881337', glow: '#e11d48' },
    { label: 'Turn Timer',    sub: 'Countdown each player\'s turn', Icon: Ic.Timer,        from: '#0284c7', to: '#075985', glow: '#0284c7' },
    { label: 'Game Timer',    sub: 'Track a full game session',     Icon: Ic.ClockMd,     from: '#b45309', to: '#78350f', glow: '#b45309' },
  ];

  return (
    <PhoneScreen active="gamenite" headerBg={C.white}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px 14px', borderBottom: `1px solid ${C.border}`,
        background: C.white, flexShrink: 0 }}>
        <div style={{ color: '#7c3aed' }}><Ic.Sparkles/></div>
        <span style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 300, color: C.ink }}>Game Night</span>
      </div>

      {/* Tool rows */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tools.map(({ label, sub, Icon, from, to, glow }) => (
          <button key={label} style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '20px 20px',
            background: `linear-gradient(130deg, ${from} 0%, ${to} 100%)`,
            border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
            boxShadow: `0 4px 18px ${glow}44`,
          }}>
            <div style={{ color: 'rgba(255,255,255,0.92)', flexShrink: 0 }}><Icon/></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.sans, fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{label}</div>
              <div style={{ fontFamily: F.sans, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{sub}</div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}><Ic.ChevronRight/></div>
          </button>
        ))}
      </div>
    </PhoneScreen>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 5 — Add Game / Scan
// ─────────────────────────────────────────────────────────────────────────────
function ScanScreen() {
  const cornerColor = C.clay;
  const cW = 3, cL = 22;

  return (
    <div style={{ width: 390, height: 720, background: C.cream, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', fontFamily: F.sans }}>
      <StatusBar bg={C.white}/>

      {/* Nav header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px 12px',
        borderBottom: `1px solid ${C.border}`, background: C.white, flexShrink: 0 }}>
        <button style={{ color: C.ink3, background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, display: 'flex' }}><Ic.ArrowLeft/></button>
        <span style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 300, color: C.ink }}>Add Game</span>
      </div>

      {/* Camera area */}
      <div style={{ flex: 1, background: '#0d1117', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 20, position: 'relative' }}>

        {/* Subtle radial vignette */}
        <div style={{ position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none' }}/>

        {/* Viewfinder */}
        <div style={{ width: 250, height: 160, position: 'relative' }}>
          {/* corners */}
          {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h]) => (
            <div key={v+h} style={{ position: 'absolute', [v]: 0, [h]: 0, width: cL+cW, height: cL+cW }}>
              <div style={{ position: 'absolute', [v]: 0, [h]: 0, width: cL, height: cW,
                background: cornerColor, borderRadius: 1 }}/>
              <div style={{ position: 'absolute', [v]: 0, [h]: 0, width: cW, height: cL,
                background: cornerColor, borderRadius: 1 }}/>
            </div>
          ))}
          {/* Scan line */}
          <div style={{ position: 'absolute', top: '45%', left: 8, right: 8, height: 2,
            background: cornerColor, opacity: 0.9,
            boxShadow: `0 0 10px ${cornerColor}, 0 0 20px ${cornerColor}88` }}/>
        </div>

        <p style={{ fontFamily: F.sans, fontSize: 12, color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.08em', textTransform: 'uppercase', zIndex: 1 }}>
          Point camera at barcode
        </p>
      </div>

      {/* Lower options */}
      <div style={{ background: C.white, padding: '20px 16px 24px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: C.border }}/>
          <span style={{ fontFamily: F.sans, fontSize: 11, color: C.ink5, letterSpacing: '0.06em' }}>
            or search by name
          </span>
          <div style={{ flex: 1, height: 1, background: C.border }}/>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.cream,
          border: `1px solid ${C.border}`, borderRadius: 4, padding: '0 12px', height: 46, marginBottom: 10 }}>
          <div style={{ color: C.ink5, flexShrink: 0 }}><Ic.Search/></div>
          <span style={{ fontFamily: F.sans, fontSize: 13, color: C.ink5, flex: 1 }}>
            Search BoardGameGeek…
          </span>
        </div>

        <button style={{ width: '100%', height: 46, background: 'transparent',
          border: `1px solid ${C.border}`, borderRadius: 4, fontFamily: F.sans, fontSize: 13,
          color: C.ink3, cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8 }}>
          <span>Enter Details Manually</span>
          <Ic.ChevronRight/>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 6a — Library: 3-Column Grid
// ─────────────────────────────────────────────────────────────────────────────
function LibraryGridScreen3() {
  const games = [
    { abbr: 'Az',  color: '#1e40af', name: 'Azul',               players: '2–4', time: 45,  plays: 4,  fav: true  },
    { abbr: 'Ca',  color: '#b85c28', name: 'Carcassonne',         players: '2–5', time: 35,  plays: 12, fav: true  },
    { abbr: 'Cs',  color: '#2e8282', name: 'Cascadia',            players: '1–4', time: 40,  plays: 5,  fav: false },
    { abbr: 'G',   color: '#1e293b', name: 'Gloomhaven: JotL',   players: '1–4', time: 60,  plays: 8,  fav: false },
    { abbr: 'P',   color: '#9f1239', name: 'Pandemic',            players: '2–4', time: 60,  plays: 3,  fav: false },
    { abbr: 'TM',  color: '#7c2d12', name: 'Terraforming Mars',  players: '1–5', time: 120, plays: 6,  fav: true  },
    { abbr: 'TtR', color: '#c2410c', name: 'Ticket to Ride',     players: '2–5', time: 60,  plays: 7,  fav: false },
    { abbr: 'W',   color: '#2d5a27', name: 'Wingspan',            players: '1–5', time: 90,  plays: 8,  fav: true  },
    { abbr: 'Cl',  color: '#4338ca', name: 'Clank!',              players: '2–4', time: 75,  plays: 2,  fav: false },
  ];
  const colW = (390 - 2 * 2) / 3; // 3 cols, 2px gaps

  return (
    <PhoneScreen active="library" headerBg={C.white}>
      {/* Header + tabs */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 0' }}>
          <span style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 300, color: C.ink }}>My Games</span>
          <span style={{ fontFamily: F.sans, fontSize: 11, color: C.ink5 }}>47 entries</span>
        </div>
        <div style={{ display: 'flex', marginTop: 8 }}>
          {['My Catalogue', 'Wishlist', 'Friends'].map((tab, i) => (
            <button key={tab} style={{
              padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
              borderBottom: i === 0 ? `2px solid ${C.forest}` : '2px solid transparent',
              fontFamily: F.sans, fontSize: 12, letterSpacing: '0.02em',
              fontWeight: i === 0 ? 600 : 400, color: i === 0 ? C.forest : C.ink4,
            }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Search + filter bar */}
      <div style={{ padding: '10px 16px', background: C.white, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0,
          background: C.cream, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 12px', gap: 8 }}>
            <div style={{ color: C.ink5, flexShrink: 0 }}><Ic.Search/></div>
            <span style={{ flex: 1, fontFamily: F.sans, fontSize: 13, color: C.ink5 }}>Search catalogue…</span>
          </div>
          <button style={{ height: 42, paddingInline: 14, background: C.clay, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, borderLeft: `1px solid ${C.clay2}` }}>
            <div style={{ color: C.cream }}><Ic.CameraSm/></div>
            <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 600, color: C.cream, letterSpacing: '0.04em' }}>SCAN</span>
          </button>
        </div>
      </div>

      {/* Filter row with grid/list toggle */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', background: C.cream,
        borderBottom: `1px solid ${C.border}`, alignItems: 'center', flexShrink: 0 }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
          background: C.white, border: `1px solid ${C.border}`, borderRadius: 4,
          fontFamily: F.sans, fontSize: 11, color: C.ink3, cursor: 'pointer' }}>
          <Ic.Filter/><span>Filters</span>
        </button>
        <div style={{ flex: 1 }}/>
        <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px',
          background: C.white, border: `1px solid ${C.border}`, borderRadius: 4,
          fontFamily: F.sans, fontSize: 11, color: C.ink3, cursor: 'pointer' }}>
          <span>A–Z</span><Ic.ChevronDown/>
        </button>
        {/* Layout toggle — grid active */}
        <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
          {/* Grid icon — active */}
          <button style={{ width: 32, height: 30, background: C.ink, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="0" y="0" width="5.5" height="5.5" rx="1" fill={C.cream}/>
              <rect x="7.5" y="0" width="5.5" height="5.5" rx="1" fill={C.cream}/>
              <rect x="0" y="7.5" width="5.5" height="5.5" rx="1" fill={C.cream}/>
              <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1" fill={C.cream}/>
            </svg>
          </button>
          {/* List icon — inactive */}
          <button style={{ width: 32, height: 30, background: C.white, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${C.border}` }}>
            <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
              <rect x="0" y="0" width="13" height="2.5" rx="1" fill={C.ink4}/>
              <rect x="0" y="4.25" width="13" height="2.5" rx="1" fill={C.ink4}/>
              <rect x="0" y="8.5" width="13" height="2.5" rx="1" fill={C.ink4}/>
            </svg>
          </button>
        </div>
      </div>

      {/* 3-col grid */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: 2 }}>
          {games.map(({ abbr, color, name, players, time, plays, fav }) => (
            <div key={name} style={{ background: C.white, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Cover — 3:4 ratio */}
              <div style={{ position: 'relative', aspectRatio: '3/4', background: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: F.sans, fontSize: 18, fontWeight: 700,
                  color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.02em' }}>{abbr}</span>
                {fav && (
                  <div style={{ position: 'absolute', top: 6, left: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={C.wheat} stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                )}
                {/* Play count pill */}
                <div style={{ position: 'absolute', bottom: 6, right: 6,
                  background: 'rgba(26,22,16,0.72)', borderRadius: 99, padding: '2px 7px' }}>
                  <span style={{ fontFamily: F.sans, fontSize: 9, fontWeight: 600, color: '#fff' }}>{plays}×</span>
                </div>
              </div>
              {/* Name + meta */}
              <div style={{ padding: '6px 7px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 500, color: C.ink,
                  lineHeight: 1.25, overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2,
                    color: C.ink5, fontSize: 9, fontFamily: F.sans }}>
                    <Ic.Users/>{players}p
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2,
                    color: C.ink5, fontSize: 9, fontFamily: F.sans }}>
                    <Ic.Clock/>{time}m
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
        <button style={{ width: 54, height: 54, borderRadius: '50%',
          background: `linear-gradient(145deg, ${C.clay}, ${C.clay2})`,
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 18px ${C.clay}66, 0 2px 6px rgba(0,0,0,0.2)`, color: C.cream }}>
          <Ic.Camera/>
        </button>
      </div>
    </PhoneScreen>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 6b — Library: 2-Column Grid
// ─────────────────────────────────────────────────────────────────────────────
function LibraryGridScreen2() {
  const games = [
    { abbr: 'Az',  color: '#1e40af', name: 'Azul',               players: '2–4', time: 45,  plays: 4,  fav: true  },
    { abbr: 'Ca',  color: '#b85c28', name: 'Carcassonne',         players: '2–5', time: 35,  plays: 12, fav: true  },
    { abbr: 'Cs',  color: '#2e8282', name: 'Cascadia',            players: '1–4', time: 40,  plays: 5,  fav: false },
    { abbr: 'G',   color: '#1e293b', name: 'Gloomhaven: JotL',   players: '1–4', time: 60,  plays: 8,  fav: false },
    { abbr: 'P',   color: '#9f1239', name: 'Pandemic',            players: '2–4', time: 60,  plays: 3,  fav: false },
    { abbr: 'TM',  color: '#7c2d12', name: 'Terraforming Mars',  players: '1–5', time: 120, plays: 6,  fav: true  },
  ];

  return (
    <PhoneScreen active="library" headerBg={C.white}>
      {/* Header + tabs — same as grid3 */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 0' }}>
          <span style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 300, color: C.ink }}>My Games</span>
          <span style={{ fontFamily: F.sans, fontSize: 11, color: C.ink5 }}>47 entries</span>
        </div>
        <div style={{ display: 'flex', marginTop: 8 }}>
          {['My Catalogue', 'Wishlist', 'Friends'].map((tab, i) => (
            <button key={tab} style={{
              padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
              borderBottom: i === 0 ? `2px solid ${C.forest}` : '2px solid transparent',
              fontFamily: F.sans, fontSize: 12, fontWeight: i === 0 ? 600 : 400,
              color: i === 0 ? C.forest : C.ink4,
            }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding: '10px 16px', background: C.white, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0,
          background: C.cream, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 12px', gap: 8 }}>
            <div style={{ color: C.ink5, flexShrink: 0 }}><Ic.Search/></div>
            <span style={{ flex: 1, fontFamily: F.sans, fontSize: 13, color: C.ink5 }}>Search catalogue…</span>
          </div>
          <button style={{ height: 42, paddingInline: 14, background: C.clay, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, borderLeft: `1px solid ${C.clay2}` }}>
            <div style={{ color: C.cream }}><Ic.CameraSm/></div>
            <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 600, color: C.cream, letterSpacing: '0.04em' }}>SCAN</span>
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', background: C.cream,
        borderBottom: `1px solid ${C.border}`, alignItems: 'center', flexShrink: 0 }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
          background: C.white, border: `1px solid ${C.border}`, borderRadius: 4,
          fontFamily: F.sans, fontSize: 11, color: C.ink3, cursor: 'pointer' }}>
          <Ic.Filter/><span>Filters</span>
        </button>
        <div style={{ flex: 1 }}/>
        <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px',
          background: C.white, border: `1px solid ${C.border}`, borderRadius: 4,
          fontFamily: F.sans, fontSize: 11, color: C.ink3, cursor: 'pointer' }}>
          <span>A–Z</span><Ic.ChevronDown/>
        </button>
        <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
          <button style={{ width: 32, height: 30, background: C.ink, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="0" y="0" width="5.5" height="5.5" rx="1" fill={C.cream}/>
              <rect x="7.5" y="0" width="5.5" height="5.5" rx="1" fill={C.cream}/>
              <rect x="0" y="7.5" width="5.5" height="5.5" rx="1" fill={C.cream}/>
              <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1" fill={C.cream}/>
            </svg>
          </button>
          <button style={{ width: 32, height: 30, background: C.white, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${C.border}` }}>
            <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
              <rect x="0" y="0" width="13" height="2.5" rx="1" fill={C.ink4}/>
              <rect x="0" y="4.25" width="13" height="2.5" rx="1" fill={C.ink4}/>
              <rect x="0" y="8.5" width="13" height="2.5" rx="1" fill={C.ink4}/>
            </svg>
          </button>
        </div>
      </div>

      {/* 2-col grid */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, padding: 2 }}>
          {games.map(({ abbr, color, name, players, time, plays, fav }) => (
            <div key={name} style={{ background: C.white, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Cover — 3:4 ratio */}
              <div style={{ position: 'relative', aspectRatio: '3/4', background: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: F.sans, fontSize: 26, fontWeight: 700,
                  color: 'rgba(255,255,255,0.65)', letterSpacing: '-0.02em' }}>{abbr}</span>
                {fav && (
                  <div style={{ position: 'absolute', top: 8, left: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={C.wheat} stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 8, right: 8,
                  background: 'rgba(26,22,16,0.72)', borderRadius: 99, padding: '3px 8px' }}>
                  <span style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 600, color: '#fff' }}>{plays}×</span>
                </div>
              </div>
              {/* Info row */}
              <div style={{ padding: '8px 10px 10px' }}>
                <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 500, color: C.ink,
                  lineHeight: 1.3, marginBottom: 5,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: C.ink4, fontSize: 10, fontFamily: F.sans }}>
                    <Ic.Users/>{players}p
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: C.ink4, fontSize: 10, fontFamily: F.sans }}>
                    <Ic.Clock/>{time}m
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
        <button style={{ width: 54, height: 54, borderRadius: '50%',
          background: `linear-gradient(145deg, ${C.clay}, ${C.clay2})`,
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 18px ${C.clay}66`, color: C.cream }}>
          <Ic.Camera/>
        </button>
      </div>
    </PhoneScreen>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME SYSTEM
// Two dark theme directions for serious game enthusiasts
// ─────────────────────────────────────────────────────────────────────────────

// Theme A — "The Ledger": dark ink + terracotta primary
const TA = {
  name:      'The Ledger',
  bg:        '#1c1710',
  surface:   '#251e14',
  surface2:  '#2e2518',
  border:    '#3d3020',
  borderLt:  '#524030',
  text:      '#f7eed8',
  text2:     '#c9b090',
  text3:     '#8a7660',
  primary:   '#b85c28',
  primaryDk: '#8f3e14',
  primaryLt: '#d47d4a',
  gold:      '#c49018',
  tools: [
    { surface: '#2a1f3d', icon: '#7a62a8', label: 'Game Chooser', sub: 'Spin the wheel to pick a game', Icon: 'SparklesSm' },
    { surface: '#3d1a20', icon: '#a05060', label: 'First Player',  sub: 'Randomly pick who goes first',  Icon: 'Dice'       },
    { surface: '#1a2535', icon: '#4a7a9e', label: 'Turn Timer',    sub: 'Countdown each player\'s turn', Icon: 'Timer'      },
    { surface: '#352010', icon: '#8e6420', label: 'Game Timer',    sub: 'Track a full game session',     Icon: 'ClockMd'    },
  ],
};

// Theme B — "The Folio": dark forest + green primary
const TB = {
  name:      'The Folio',
  bg:        '#141c12',
  surface:   '#1c2619',
  surface2:  '#243020',
  border:    '#2e3d28',
  borderLt:  '#3d5234',
  text:      '#f7eed8',
  text2:     '#b8c8b0',
  text3:     '#6a8060',
  primary:   '#3a7040',
  primaryDk: '#245230',
  primaryLt: '#5d9560',
  gold:      '#c49018',
  tools: [
    { surface: '#28203d', icon: '#6a58a0', label: 'Game Chooser', sub: 'Spin the wheel to pick a game', Icon: 'SparklesSm' },
    { surface: '#3a1e24', icon: '#906070', label: 'First Player',  sub: 'Randomly pick who goes first',  Icon: 'Dice'       },
    { surface: '#182030', icon: '#407898', label: 'Turn Timer',    sub: 'Countdown each player\'s turn', Icon: 'Timer'      },
    { surface: '#302010', icon: '#806018', label: 'Game Timer',    sub: 'Track a full game session',     Icon: 'ClockMd'    },
  ],
};

// ── Shared themed atoms ───────────────────────────────────────────────────────
function ThemedStatusBar({ t }) {
  return (
    <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', background: t.surface, flexShrink: 0 }}>
      <span style={{ fontFamily: F.sans, fontSize: 15, fontWeight: 600, color: t.text, letterSpacing: '-0.01em' }}>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="17" height="12" viewBox="0 0 17 12">
          <rect x="0" y="6" width="3" height="6" rx="1" fill={t.text}/>
          <rect x="4.5" y="4" width="3" height="8" rx="1" fill={t.text}/>
          <rect x="9" y="2" width="3" height="10" rx="1" fill={t.text}/>
          <rect x="13.5" y="0" width="3" height="12" rx="1" fill={t.text} opacity="0.3"/>
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11">
          <circle cx="8" cy="10" r="1.5" fill={t.text}/>
          <path d="M4.5 6.8C5.5 5.7 6.7 5 8 5s2.5.7 3.5 1.8" stroke={t.text} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M1.5 3.5C3.2 1.4 5.5 0 8 0s4.8 1.4 6.5 3.5" stroke={t.text} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4"/>
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12">
          <rect x=".5" y=".5" width="21" height="11" rx="2" stroke={t.text} strokeWidth="1" fill="none"/>
          <rect x="2" y="2" width="15" height="8" rx="1.5" fill={t.text}/>
          <path d="M23 4v4a2 2 0 0 0 0-4z" fill={t.text} opacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

function ThemedBottomNav({ t, active = 'dashboard' }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', Icon: Ic.BarChart },
    { id: 'library',   label: 'My Games',  Icon: Ic.BookOpen },
    { id: 'gamenite',  label: 'Game Night',Icon: Ic.Sparkles },
    { id: 'profile',   label: 'Profile',   Icon: null        },
  ];
  return (
    <div style={{ height: 80, background: t.surface, borderTop: `1px solid ${t.border}`,
      display: 'flex', alignItems: 'stretch', flexShrink: 0 }}>
      {items.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <div key={id} style={{ flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', paddingBottom: 14, gap: 3,
            color: isActive ? t.primary : t.text3, position: 'relative', cursor: 'pointer' }}>
            {isActive && <div style={{ position: 'absolute', top: 0, left: 8, right: 8, height: 2,
              background: t.primary, borderRadius: '0 0 99px 99px' }}/>}
            {id === 'profile'
              ? <MeepleIcon size={20} color={isActive ? t.primary : t.text3}/>
              : <Icon />}
            <span style={{ fontFamily: F.sans, fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ThemedPhoneScreen({ t, active, children }) {
  return (
    <div style={{ width: 390, height: 844, background: t.bg, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', fontFamily: F.sans, position: 'relative' }}>
      <ThemedStatusBar t={t}/>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {children}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
          background: `linear-gradient(to bottom, transparent, ${t.bg})`, pointerEvents: 'none' }}/>
      </div>
      <ThemedBottomNav t={t} active={active}/>
    </div>
  );
}

function ThemedSectionLabel({ t, children }) {
  return (
    <div style={{ padding: '20px 16px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontFamily: F.serif, fontSize: 14, fontStyle: 'italic',
        fontWeight: 300, color: t.text3, flexShrink: 0 }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: t.border }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THEMED DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function ThemedDashboard({ t }) {
  const stats = [
    { label: 'Games',    value: '47' },
    { label: 'Sessions', value: '83' },
    { label: 'Starred',  value: '12' },
    { label: 'Unplayed', value: '15' },
  ];
  const mostPlayed = [
    { abbr: 'Ca', color: '#6b3412', name: 'Carcassonne',   plays: 12 },
    { abbr: 'W',  color: '#2d5a27', name: 'Wingspan',       plays: 8  },
    { abbr: 'TtR',color: '#7c2d12', name: 'Ticket to Ride', plays: 7  },
    { abbr: 'TM', color: '#4a1a0a', name: 'Terraforming…',  plays: 6  },
    { abbr: 'Az', color: '#1e3070', name: 'Azul',           plays: 4  },
  ];
  const recentGames = [
    { abbr: 'G',  color: '#101820', name: 'Gloomhaven: Jaws of the Lion', when: '2 days ago' },
    { abbr: 'Cs', color: '#184040', name: 'Cascadia',                      when: '4 days ago' },
  ];

  // Quick action buttons — same dark surface, primary-colored icon
  const actions = [
    { label: 'Game Picker',  Icon: Ic.SparklesSm },
    { label: 'First Player', Icon: Ic.Dice        },
    { label: 'Turn Timer',   Icon: Ic.Timer        },
  ];

  return (
    <ThemedPhoneScreen t={t} active="dashboard">
      {/* App bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px 14px', borderBottom: `1px solid ${t.border}`,
        background: t.surface, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MeepleIcon size={22} color={t.text}/>
          <span style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 300,
            color: t.text, letterSpacing: '0.02em' }}>Libre Ludorum</span>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: t.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: C.cream, fontFamily: F.sans, fontSize: 14, fontWeight: 600 }}>A</span>
        </div>
      </div>

      {/* Quick Actions */}
      <ThemedSectionLabel t={t}>Quick Actions</ThemedSectionLabel>
      <div style={{ display: 'flex', gap: 8, padding: '0 16px' }}>
        {actions.map(({ label, Icon }) => (
          <button key={label} style={{ flex: 1, height: 72, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 7,
            background: t.surface2, border: `1px solid ${t.border}`,
            borderRadius: 4, cursor: 'pointer' }}>
            <div style={{ color: t.primary }}><Icon/></div>
            <span style={{ fontFamily: F.sans, fontSize: 10, color: t.text2, fontWeight: 500,
              textAlign: 'center', lineHeight: 1.2, paddingInline: 4 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <ThemedSectionLabel t={t}>Your Collection</ThemedSectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: '0 16px' }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{ background: t.surface, padding: '16px 18px',
            border: `1px solid ${t.border}`, borderRadius: 4 }}>
            <div style={{ fontFamily: F.serif, fontSize: 42, fontWeight: 300,
              color: t.text, lineHeight: 1 }}>{value}</div>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: t.text3, marginTop: 6,
              textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Most Played */}
      <ThemedSectionLabel t={t}>Most Played</ThemedSectionLabel>
      <div style={{ display: 'flex', gap: 12, padding: '0 16px 4px' }}>
        {mostPlayed.map(({ abbr, color, name, plays }) => (
          <div key={name} style={{ flexShrink: 0, width: 62, textAlign: 'center' }}>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <div style={{ width: 62, height: 62, background: color, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: F.sans, fontSize: 13, fontWeight: 700,
                color: 'rgba(255,255,255,0.7)' }}>{abbr}</div>
              <div style={{ position: 'absolute', bottom: -7, right: -5,
                background: t.primary, borderRadius: 99, padding: '2px 7px',
                border: `2px solid ${t.bg}` }}>
                <span style={{ fontFamily: F.sans, fontSize: 9, fontWeight: 700,
                  color: C.cream }}>{plays}×</span>
              </div>
            </div>
            <span style={{ fontFamily: F.sans, fontSize: 9, color: t.text3, lineHeight: 1.3,
              display: 'block', marginTop: 10 }}>
              {name.length > 10 ? name.slice(0, 10) + '…' : name}
            </span>
          </div>
        ))}
      </div>

      {/* Recently Added */}
      <ThemedSectionLabel t={t}>Recently Added</ThemedSectionLabel>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {recentGames.map(({ abbr, color, name, when }) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', background: t.surface, borderRadius: 4,
            border: `1px solid ${t.border}` }}>
            <div style={{ width: 40, height: 40, background: color, borderRadius: 4, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{abbr}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 500, color: t.text,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
              <div style={{ fontFamily: F.sans, fontSize: 11, color: t.text3, marginTop: 2 }}>{when}</div>
            </div>
            <div style={{ color: t.text3 }}><Ic.ChevronRight/></div>
          </div>
        ))}
      </div>
    </ThemedPhoneScreen>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THEMED LIBRARY (3-col grid)
// ─────────────────────────────────────────────────────────────────────────────
function ThemedLibrary({ t }) {
  const isDark = t.bg.startsWith('#1') || t.bg.startsWith('#0');
  const games = isDark ? [
    { abbr: 'Az',  color: '#1e3070', name: 'Azul',               players: '2–4', time: 45,  plays: 4,  fav: true  },
    { abbr: 'Ca',  color: '#6b3412', name: 'Carcassonne',         players: '2–5', time: 35,  plays: 12, fav: true  },
    { abbr: 'Cs',  color: '#184040', name: 'Cascadia',            players: '1–4', time: 40,  plays: 5,  fav: false },
    { abbr: 'G',   color: '#101820', name: 'Gloomhaven: JotL',   players: '1–4', time: 60,  plays: 8,  fav: false },
    { abbr: 'P',   color: '#5a1020', name: 'Pandemic',            players: '2–4', time: 60,  plays: 3,  fav: false },
    { abbr: 'TM',  color: '#4a1a0a', name: 'Terraforming Mars',  players: '1–5', time: 120, plays: 6,  fav: true  },
    { abbr: 'TtR', color: '#7c2d12', name: 'Ticket to Ride',     players: '2–5', time: 60,  plays: 7,  fav: false },
    { abbr: 'W',   color: '#2d5a27', name: 'Wingspan',            players: '1–5', time: 90,  plays: 8,  fav: true  },
    { abbr: 'Cl',  color: '#1c1a4a', name: 'Clank!',              players: '2–4', time: 75,  plays: 2,  fav: false },
  ] : [
    { abbr: 'Az',  color: '#1e40af', name: 'Azul',               players: '2–4', time: 45,  plays: 4,  fav: true  },
    { abbr: 'Ca',  color: '#b85c28', name: 'Carcassonne',         players: '2–5', time: 35,  plays: 12, fav: true  },
    { abbr: 'Cs',  color: '#2e8282', name: 'Cascadia',            players: '1–4', time: 40,  plays: 5,  fav: false },
    { abbr: 'G',   color: '#2d3748', name: 'Gloomhaven: JotL',   players: '1–4', time: 60,  plays: 8,  fav: false },
    { abbr: 'P',   color: '#9f1239', name: 'Pandemic',            players: '2–4', time: 60,  plays: 3,  fav: false },
    { abbr: 'TM',  color: '#7c2d12', name: 'Terraforming Mars',  players: '1–5', time: 120, plays: 6,  fav: true  },
    { abbr: 'TtR', color: '#c2410c', name: 'Ticket to Ride',     players: '2–5', time: 60,  plays: 7,  fav: false },
    { abbr: 'W',   color: '#2d5a27', name: 'Wingspan',            players: '1–5', time: 90,  plays: 8,  fav: true  },
    { abbr: 'Cl',  color: '#4338ca', name: 'Clank!',              players: '2–4', time: 75,  plays: 2,  fav: false },
  ];

  return (
    <ThemedPhoneScreen t={t} active="library">
      {/* Header + tabs */}
      <div style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px 0' }}>
          <span style={{ fontFamily: F.serif, fontSize: 26, fontWeight: 300,
            color: t.text, letterSpacing: '0.01em' }}>My Games</span>
          <span style={{ fontFamily: F.sans, fontSize: 11, color: t.text3 }}>47 entries</span>
        </div>
        <div style={{ display: 'flex', marginTop: 8 }}>
          {['My Catalogue', 'Wishlist', 'Friends'].map((tab, i) => (
            <button key={tab} style={{
              padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
              borderBottom: i === 0 ? `2px solid ${t.primary}` : `2px solid transparent`,
              fontFamily: F.sans, fontSize: 12, letterSpacing: '0.02em',
              fontWeight: i === 0 ? 600 : 400,
              color: i === 0 ? t.primary : t.text3,
            }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Search + scan */}
      <div style={{ padding: '10px 16px', background: t.surface,
        borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: t.bg,
          border: `1px solid ${t.border}`, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 12px', gap: 8 }}>
            <div style={{ color: t.text3 }}><Ic.Search/></div>
            <span style={{ flex: 1, fontFamily: F.sans, fontSize: 13, color: t.text3 }}>Search catalogue…</span>
          </div>
          <button style={{ height: 42, paddingInline: 14, background: t.primary, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, borderLeft: `1px solid ${t.primaryDk}` }}>
            <div style={{ color: C.cream }}><Ic.CameraSm/></div>
            <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 600,
              color: C.cream, letterSpacing: '0.04em' }}>SCAN</span>
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', background: t.bg,
        borderBottom: `1px solid ${t.border}`, alignItems: 'center', flexShrink: 0 }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 4,
          fontFamily: F.sans, fontSize: 11, color: t.text2, cursor: 'pointer' }}>
          <Ic.Filter/><span>Filters</span>
        </button>
        <div style={{ flex: 1 }}/>
        <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px',
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 4,
          fontFamily: F.sans, fontSize: 11, color: t.text2, cursor: 'pointer' }}>
          <span>A–Z</span><Ic.ChevronDown/>
        </button>
        {/* Grid/list toggle */}
        <div style={{ display: 'flex', border: `1px solid ${t.border}`, borderRadius: 4, overflow: 'hidden' }}>
          <button style={{ width: 32, height: 30, background: t.primary, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="0" y="0" width="5.5" height="5.5" rx="1" fill={C.cream}/>
              <rect x="7.5" y="0" width="5.5" height="5.5" rx="1" fill={C.cream}/>
              <rect x="0" y="7.5" width="5.5" height="5.5" rx="1" fill={C.cream}/>
              <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1" fill={C.cream}/>
            </svg>
          </button>
          <button style={{ width: 32, height: 30, background: t.surface, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderLeft: `1px solid ${t.border}` }}>
            <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
              <rect x="0" y="0" width="13" height="2.5" rx="1" fill={t.text3}/>
              <rect x="0" y="4.25" width="13" height="2.5" rx="1" fill={t.text3}/>
              <rect x="0" y="8.5" width="13" height="2.5" rx="1" fill={t.text3}/>
            </svg>
          </button>
        </div>
      </div>

      {/* 3-col grid */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: 2 }}>
          {games.map(({ abbr, color, name, players, time, plays, fav }) => (
            <div key={name} style={{ background: t.surface, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ position: 'relative', aspectRatio: '3/4', background: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: F.sans, fontSize: 18, fontWeight: 700,
                  color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.02em' }}>{abbr}</span>
                {fav && (
                  <div style={{ position: 'absolute', top: 6, left: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={t.gold} stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 5, right: 5,
                  background: 'rgba(0,0,0,0.7)', borderRadius: 99, padding: '2px 6px' }}>
                  <span style={{ fontFamily: F.sans, fontSize: 9, fontWeight: 600, color: '#fff' }}>{plays}×</span>
                </div>
              </div>
              <div style={{ padding: '6px 7px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 500, color: t.text,
                  lineHeight: 1.25, overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2,
                    color: t.text3, fontSize: 9, fontFamily: F.sans }}>
                    <Ic.Users/>{players}p
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2,
                    color: t.text3, fontSize: 9, fontFamily: F.sans }}>
                    <Ic.Clock/>{time}m
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
        <button style={{ width: 54, height: 54, borderRadius: '50%',
          background: t.primary, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 20px ${t.primary}88`, color: C.cream }}>
          <Ic.Camera/>
        </button>
      </div>
    </ThemedPhoneScreen>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THEMED GAME NIGHT
// ─────────────────────────────────────────────────────────────────────────────
function ThemedGameNight({ t }) {
  const ts = t.toolStyle || { text: '#f7eed8', sub: 'rgba(247,238,216,0.45)', border: 'rgba(255,255,255,0.06)' };
  return (
    <ThemedPhoneScreen t={t} active="gamenite">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px 16px', borderBottom: `1px solid ${t.border}`,
        background: t.surface, flexShrink: 0 }}>
        <div style={{ color: t.primary }}><Ic.Sparkles/></div>
        <span style={{ fontFamily: F.serif, fontSize: 26, fontWeight: 300,
          color: t.text, letterSpacing: '0.02em' }}>Game Night</span>
      </div>

      {/* Tool rows */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {t.tools.map(({ surface, icon, label, sub, Icon: iconKey }) => {
          const IconComp = Ic[iconKey];
          return (
            <button key={label} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '18px 18px',
              background: surface, border: `1px solid ${ts.border}`,
              borderRadius: 4, cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ color: icon, flexShrink: 0 }}><IconComp/></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 400,
                  color: ts.text, marginBottom: 3, letterSpacing: '0.01em' }}>{label}</div>
                <div style={{ fontFamily: F.sans, fontSize: 11, color: ts.sub }}>{sub}</div>
              </div>
              <div style={{ color: ts.sub, opacity: 0.6 }}><Ic.ChevronRight/></div>
            </button>
          );
        })}
      </div>
    </ThemedPhoneScreen>
  );
}

// Theme C — "Botanical": light parchment + sage green primary
const TC = {
  name:      'Botanical',
  bg:        '#fdf8f0',
  surface:   '#ffffff',
  surface2:  '#f7eed8',
  border:    '#ddc898',
  borderLt:  '#ecdcb8',
  text:      '#1a1610',
  text2:     '#574e3e',
  text3:     '#9e9180',
  primary:   '#3a7040',
  primaryDk: '#245230',
  primaryLt: '#5d9560',
  gold:      '#c49018',
  toolStyle: { text: '#1a1610', sub: '#9e9180', border: '#ddc898' },
  tools: [
    { surface: '#f3eff8', icon: '#7a6896', label: 'Game Chooser', sub: 'Spin the wheel to pick a game', Icon: 'SparklesSm' },
    { surface: '#f8efef', icon: '#a06868', label: 'First Player',  sub: 'Randomly pick who goes first',  Icon: 'Dice'       },
    { surface: '#eff5ef', icon: '#5a8060', label: 'Turn Timer',    sub: 'Countdown each player\'s turn', Icon: 'Timer'      },
    { surface: '#f5f0e4', icon: '#8e6420', label: 'Game Timer',    sub: 'Track a full game session',     Icon: 'ClockMd'    },
  ],
};

// Theme D — "Herbarium": light parchment + terracotta primary
const TD = {
  name:      'Herbarium',
  bg:        '#fdf8f0',
  surface:   '#ffffff',
  surface2:  '#f7eed8',
  border:    '#ddc898',
  borderLt:  '#ecdcb8',
  text:      '#1a1610',
  text2:     '#574e3e',
  text3:     '#9e9180',
  primary:   '#b85c28',
  primaryDk: '#8f3e14',
  primaryLt: '#d47d4a',
  gold:      '#c49018',
  toolStyle: { text: '#1a1610', sub: '#9e9180', border: '#ddc898' },
  tools: [
    { surface: '#f3eff8', icon: '#7a6896', label: 'Game Chooser', sub: 'Spin the wheel to pick a game', Icon: 'SparklesSm' },
    { surface: '#f8efef', icon: '#a06868', label: 'First Player',  sub: 'Randomly pick who goes first',  Icon: 'Dice'       },
    { surface: '#eff5ef', icon: '#5a8060', label: 'Turn Timer',    sub: 'Countdown each player\'s turn', Icon: 'Timer'      },
    { surface: '#f5f0e4', icon: '#8e6420', label: 'Game Timer',    sub: 'Track a full game session',     Icon: 'ClockMd'    },
  ],
};
const TADashboard  = () => <ThemedDashboard t={TA}/>;
const TALibrary    = () => <ThemedLibrary t={TA}/>;
const TAGameNight  = () => <ThemedGameNight t={TA}/>;
const TBDashboard  = () => <ThemedDashboard t={TB}/>;
const TBLibrary    = () => <ThemedLibrary t={TB}/>;
const TBGameNight  = () => <ThemedGameNight t={TB}/>;
const TCDashboard  = () => <ThemedDashboard t={TC}/>;
const TCLibrary    = () => <ThemedLibrary t={TC}/>;
const TCGameNight  = () => <ThemedGameNight t={TC}/>;
const TDDashboard  = () => <ThemedDashboard t={TD}/>;
const TDLibrary    = () => <ThemedLibrary t={TD}/>;
const TDGameNight  = () => <ThemedGameNight t={TD}/>;

// ── Export to window for the main canvas file ─────────────────────────────────
Object.assign(window, {
  DashboardScreen, LibraryScreen, LibraryFilterScreen,
  GameNightScreen, ScanScreen,
  LibraryGridScreen3, LibraryGridScreen2,
  TADashboard, TALibrary, TAGameNight,
  TBDashboard, TBLibrary, TBGameNight,
  TCDashboard, TCLibrary, TCGameNight,
  TDDashboard, TDLibrary, TDGameNight,
});
