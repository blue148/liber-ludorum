import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/library_entry.dart';
import '../../providers/library_provider.dart';

// ── Landing menu ───────────────────────────────────────────────────────────────

class GameNiteScreen extends StatelessWidget {
  const GameNiteScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Game Nite')),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 12),
        children: [
          _ToolRow(
            icon: Icons.shuffle,
            iconBg: AppColors.plum100,
            iconColor: AppColors.plum400,
            title: 'Game Chooser',
            subtitle: 'Spin the wheel to pick a game',
            onTap: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const _GameChooserPage())),
          ),
          _ToolRow(
            icon: Icons.people_outline,
            iconBg: AppColors.clay50,
            iconColor: AppColors.clay400,
            title: 'First Player',
            subtitle: 'Randomly pick who goes first',
            onTap: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const _FirstPlayerPage())),
          ),
          _ToolRow(
            icon: Icons.timer_outlined,
            iconBg: AppColors.forest50,
            iconColor: AppColors.forest400,
            title: 'Turn Timer',
            subtitle: 'Countdown each player\'s turn',
            onTap: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const _TurnTimerPage())),
          ),
          _ToolRow(
            icon: Icons.hourglass_bottom_outlined,
            iconBg: AppColors.wheat50,
            iconColor: AppColors.wheat500,
            title: 'Game Timer',
            subtitle: 'Track a full game session',
            onTap: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const _GameTimerPage())),
          ),
        ],
      ),
    );
  }
}

class _ToolRow extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ToolRow({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
          leading: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          title: Text(title,
              style: GoogleFonts.jost(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: AppColors.ink600)),
          subtitle: Text(subtitle,
              style: GoogleFonts.jost(fontSize: 12, color: AppColors.ink300)),
          trailing:
              const Icon(Icons.chevron_right, color: AppColors.ink200, size: 20),
          onTap: onTap,
        ),
        const Divider(height: 1, indent: 84),
      ],
    );
  }
}

// ── Game Chooser ───────────────────────────────────────────────────────────────

class _GameChooserPage extends ConsumerStatefulWidget {
  const _GameChooserPage();

  @override
  ConsumerState<_GameChooserPage> createState() => _GameChooserPageState();
}

class _GameChooserPageState extends ConsumerState<_GameChooserPage> {
  LibraryEntry? _chosen;

  void _pick() {
    final library = ref.read(libraryProvider).asData?.value ?? [];
    if (library.isEmpty) return;
    setState(() => _chosen = library[Random().nextInt(library.length)]);
    HapticFeedback.mediumImpact();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Game Chooser')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_chosen != null) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: _chosen!.game.coverImage != null
                      ? Image.network(_chosen!.game.coverImage!,
                          width: 160, height: 213, fit: BoxFit.cover)
                      : Container(
                          width: 160, height: 213,
                          color: AppColors.parchment100,
                          child: const Icon(Icons.menu_book_outlined,
                              size: 48, color: AppColors.ink100)),
                ),
                const SizedBox(height: 20),
                Text(_chosen!.game.name,
                    style: GoogleFonts.cormorantGaramond(
                        fontSize: 26, color: AppColors.ink600),
                    textAlign: TextAlign.center),
                const SizedBox(height: 32),
              ] else ...[
                const Icon(Icons.casino_outlined, size: 72, color: AppColors.ink100),
                const SizedBox(height: 24),
                Text('Pick a random game\nfrom your library',
                    style: GoogleFonts.cormorantGaramond(
                        fontSize: 22, color: AppColors.ink300),
                    textAlign: TextAlign.center),
                const SizedBox(height: 32),
              ],
              FilledButton.icon(
                onPressed: _pick,
                icon: const Icon(Icons.shuffle),
                label: Text(_chosen == null ? 'Choose Game' : 'Choose Again'),
                style: FilledButton.styleFrom(
                    backgroundColor: AppColors.forest500,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 28, vertical: 14)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── First Player ───────────────────────────────────────────────────────────────

class _FirstPlayerPage extends StatefulWidget {
  const _FirstPlayerPage();

  @override
  State<_FirstPlayerPage> createState() => _FirstPlayerPageState();
}

class _FirstPlayerPageState extends State<_FirstPlayerPage> {
  final _players = <String>[];
  final _ctrl = TextEditingController();
  String? _winner;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _addPlayer() {
    final name = _ctrl.text.trim();
    if (name.isEmpty) return;
    setState(() { _players.add(name); _winner = null; });
    _ctrl.clear();
  }

  void _pick() {
    if (_players.isEmpty) return;
    setState(() => _winner = _players[Random().nextInt(_players.length)]);
    HapticFeedback.heavyImpact();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('First Player')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(children: [
              Expanded(
                child: TextField(
                  controller: _ctrl,
                  decoration: const InputDecoration(hintText: 'Player name'),
                  style: GoogleFonts.jost(fontSize: 14),
                  onSubmitted: (_) => _addPlayer(),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: _addPlayer,
                icon: const Icon(Icons.add),
                style: IconButton.styleFrom(backgroundColor: AppColors.forest500),
              ),
            ]),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.builder(
                itemCount: _players.length,
                itemBuilder: (_, i) => ListTile(
                  title: Text(_players[i], style: GoogleFonts.jost(fontSize: 14)),
                  trailing: IconButton(
                    icon: const Icon(Icons.close, size: 18, color: AppColors.ink200),
                    onPressed: () => setState(() => _players.removeAt(i)),
                  ),
                ),
              ),
            ),
            if (_winner != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.forest50,
                  border: Border.all(color: AppColors.forest200),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Column(children: [
                  Text('FIRST PLAYER',
                      style: GoogleFonts.jost(
                          fontSize: 10, letterSpacing: 2, color: AppColors.forest400)),
                  const SizedBox(height: 6),
                  Text(_winner!,
                      style: GoogleFonts.cormorantGaramond(
                          fontSize: 32, color: AppColors.forest600)),
                ]),
              ),
              const SizedBox(height: 16),
            ],
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _players.isEmpty ? null : _pick,
                icon: const Icon(Icons.shuffle),
                label: const Text('Pick First Player'),
                style: FilledButton.styleFrom(
                    backgroundColor: AppColors.forest500,
                    padding: const EdgeInsets.symmetric(vertical: 14)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Turn Timer ─────────────────────────────────────────────────────────────────

class _TurnTimerPage extends StatefulWidget {
  const _TurnTimerPage();

  @override
  State<_TurnTimerPage> createState() => _TurnTimerPageState();
}

class _TurnTimerPageState extends State<_TurnTimerPage> {
  int _seconds = 60;
  int _remaining = 60;
  bool _running = false;
  StreamSubscription<int>? _sub;

  @override
  void dispose() { _sub?.cancel(); super.dispose(); }

  void _start() {
    setState(() { _remaining = _seconds; _running = true; });
    _sub = Stream.periodic(const Duration(seconds: 1), (i) => i).listen((_) {
      if (!mounted) return;
      setState(() {
        if (_remaining > 0) {
          _remaining--;
        } else {
          _running = false;
          _sub?.cancel();
          HapticFeedback.vibrate();
        }
      });
    });
  }

  void _reset() {
    _sub?.cancel();
    setState(() { _remaining = _seconds; _running = false; });
  }

  String get _display {
    final m = _remaining ~/ 60;
    final s = _remaining % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Turn Timer')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_display,
                  style: GoogleFonts.dmMono(
                      fontSize: 72,
                      color: _remaining == 0
                          ? AppColors.clay400
                          : AppColors.ink600,
                      fontWeight: FontWeight.w300)),
              const SizedBox(height: 24),
              if (!_running) ...[
                Text('Duration: $_seconds seconds',
                    style: GoogleFonts.jost(fontSize: 13, color: AppColors.ink300)),
                Slider(
                  value: _seconds.toDouble(),
                  min: 10, max: 300, divisions: 29,
                  activeColor: AppColors.forest500,
                  onChanged: (v) => setState(() {
                    _seconds = v.toInt(); _remaining = _seconds;
                  }),
                ),
                const SizedBox(height: 16),
              ],
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (_running)
                    OutlinedButton(onPressed: _reset, child: const Text('Reset'))
                  else
                    FilledButton.icon(
                      onPressed: _start,
                      icon: const Icon(Icons.play_arrow),
                      label: const Text('Start'),
                      style: FilledButton.styleFrom(
                          backgroundColor: AppColors.forest500,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 32, vertical: 14)),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Game Timer ─────────────────────────────────────────────────────────────────

class _GameTimerPage extends StatefulWidget {
  const _GameTimerPage();

  @override
  State<_GameTimerPage> createState() => _GameTimerPageState();
}

class _GameTimerPageState extends State<_GameTimerPage> {
  int _elapsed = 0;
  bool _running = false;
  StreamSubscription<int>? _sub;

  @override
  void dispose() { _sub?.cancel(); super.dispose(); }

  void _toggle() {
    if (_running) {
      _sub?.cancel();
      setState(() => _running = false);
    } else {
      setState(() => _running = true);
      _sub = Stream.periodic(const Duration(seconds: 1), (i) => i).listen((_) {
        if (mounted) setState(() => _elapsed++);
      });
    }
  }

  void _reset() {
    _sub?.cancel();
    setState(() { _elapsed = 0; _running = false; });
  }

  String get _display {
    final h = _elapsed ~/ 3600;
    final m = (_elapsed % 3600) ~/ 60;
    final s = _elapsed % 60;
    return h > 0
        ? '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}'
        : '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Game Timer')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_display,
                  style: GoogleFonts.dmMono(
                      fontSize: 72,
                      color: AppColors.ink600,
                      fontWeight: FontWeight.w300)),
              const SizedBox(height: 40),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  FilledButton.icon(
                    onPressed: _toggle,
                    icon: Icon(_running ? Icons.pause : Icons.play_arrow),
                    label: Text(_running ? 'Pause' : (_elapsed == 0 ? 'Start' : 'Resume')),
                    style: FilledButton.styleFrom(
                        backgroundColor: AppColors.forest500,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 28, vertical: 14)),
                  ),
                  if (_elapsed > 0) ...[
                    const SizedBox(width: 12),
                    OutlinedButton(onPressed: _reset, child: const Text('Reset')),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
