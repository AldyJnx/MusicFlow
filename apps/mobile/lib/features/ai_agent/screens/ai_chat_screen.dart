import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/features/library/providers/playlists_providers.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';
import 'package:musicflow_mobile/features/auth/providers/auth_controller.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

class AiChatScreen extends ConsumerStatefulWidget {
  const AiChatScreen({super.key});

  @override
  ConsumerState<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends ConsumerState<AiChatScreen> {
  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _lightBlue = Color(0xFF4FC3F7);
  static const Color _bgDark = Color(0xFF071A24);
  static const Color _cardSoft = Color(0xFF142631);

  final TextEditingController _controller = TextEditingController();
  bool _isSending = false;

  final List<_ChatMessage> _messages = [
    const _ChatMessage(
      text: 'Hola, soy Flow. ¿Como quieres que suene tu musica hoy?',
      isUser: false,
      time: '14:01',
      isHero: true,
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _isSending) return;
    final sentAt = _currentTime();

    setState(() {
      _isSending = true;
      _messages.add(_ChatMessage(text: text, isUser: true, time: sentAt));
    });

    _controller.clear();

    try {
      final libraryResult = await _tryCreateLibraryFromPrompt(text);
      if (libraryResult != null) {
        if (!mounted) return;
        setState(() {
          _messages.add(
            _ChatMessage(
              text: libraryResult.message,
              isUser: false,
              time: _currentTime(),
              suggestions: [
                'Biblioteca creada',
                '${libraryResult.addedCount} canciones',
              ],
            ),
          );
        });
        return;
      }

      final player = ref.read(playerControllerProvider);
      final response = await ref
          .read(aiAgentRepositoryProvider)
          .assist(prompt: text, trackId: player.currentTrack?.id);
      final suggestion = response.eq;
      final bands = suggestion?.bands.join(', ');
      final trackLines = response.tracks
          .map((track) => '• ${track.title} — ${track.artist}')
          .join('\n');
      if (!mounted) return;
      setState(() {
        _messages.add(
          _ChatMessage(
            text: [
              response.message,
              if (suggestion != null && suggestion.explanation.isNotEmpty)
                suggestion.explanation,
              if (bands != null) 'Bandas EQ: [$bands]',
              if (trackLines.isNotEmpty) trackLines,
            ].join('\n\n'),
            isUser: false,
            time: _currentTime(),
            suggestions: suggestion == null
                ? response.genres
                : [
                    'Bass ${suggestion.bassBoost}',
                    'Loudness ${suggestion.loudness}',
                    suggestion.reverbPreset,
                  ],
            requestId: response.requestId,
            bands: suggestion?.bands,
          ),
        );
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _messages.add(
          _ChatMessage(
            text: _errorMessage(error),
            isUser: false,
            time: _currentTime(),
          ),
        );
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
        });
      }
    }
  }

  String _currentTime() {
    final now = TimeOfDay.now();
    return '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
  }

  Future<_LibraryCreationResult?> _tryCreateLibraryFromPrompt(
    String prompt,
  ) async {
    final request = _extractLibraryRequest(prompt);
    if (request == null) return null;

    final tracks = await _findTracksForLibrary(request.terms);
    final playlist = await ref
        .read(playlistsRepositoryProvider)
        .createPlaylist(
          name: request.name,
          description: request.terms.isEmpty
              ? 'Creada con Flow AI'
              : 'Creada con Flow AI para: ${request.terms.join(', ')}',
        );

    var added = 0;
    for (final track in tracks.take(12)) {
      try {
        await ref
            .read(playlistsRepositoryProvider)
            .addTrack(playlistId: playlist.id, trackId: track.id);
        added++;
      } catch (_) {
        // The playlist endpoint prevents duplicates; keep adding the rest.
      }
    }

    ref.invalidate(playlistsProvider);
    final trackLines = tracks
        .take(6)
        .map((track) => '• ${track.title} — ${track.artist}')
        .join('\n');
    final exactText = request.terms.isEmpty
        ? ''
        : ' según: ${request.terms.join(', ')}';
    final message = added == 0
        ? 'Creé la biblioteca "${request.name}", pero no encontré canciones disponibles$exactText para agregar todavía.'
        : 'Listo, creé la biblioteca "${request.name}" y agregué $added canciones disponibles$exactText.\n\n$trackLines';
    return _LibraryCreationResult(
      name: request.name,
      addedCount: added,
      message: message,
    );
  }

  _LibraryRequest? _extractLibraryRequest(String prompt) {
    final normalized = prompt.toLowerCase();
    final wantsCreate =
        normalized.contains('crea') ||
        normalized.contains('crear') ||
        normalized.contains('agrega') ||
        normalized.contains('agregar') ||
        normalized.contains('genera') ||
        normalized.contains('generar') ||
        normalized.contains('generame') ||
        normalized.contains('genérame');
    final mentionsLibrary =
        normalized.contains('biblioteca') || normalized.contains('playlist');
    if (!wantsCreate || !mentionsLibrary) return null;

    final quoted = RegExp(r'["“”](.+?)["“”]').firstMatch(prompt);
    final nameMatch = RegExp(
      r'(?:llamada|llamado|nombre|como|que se llame)\s+(.+?)(?=\s+(?:de|con|para)\b|$)',
      caseSensitive: false,
    ).firstMatch(prompt);

    final name = quoted != null
        ? _cleanLibraryName(quoted.group(1))
        : nameMatch != null
        ? _cleanLibraryName(nameMatch.group(1))
        : _cleanLibraryName(
            prompt.replaceAll(
              RegExp(
                r'\b(crea|crear|agrega|agregar|genera|generar|generame|genérame|una|un|nueva|nuevo|biblioteca|playlist|a mi cuenta|en mi cuenta|por favor)\b',
                caseSensitive: false,
              ),
              ' ',
            ),
          );
    if (name == null) return null;

    final criteriaSource = nameMatch == null
        ? prompt
        : prompt.substring(nameMatch.end);
    final terms = _extractLibraryTerms(criteriaSource, name);
    return _LibraryRequest(name: name, terms: terms);
  }

  List<String> _extractLibraryTerms(String raw, String libraryName) {
    var text = raw
        .replaceAll(
          RegExp(RegExp.escape(libraryName), caseSensitive: false),
          ' ',
        )
        .replaceAll(
          RegExp(
            r'\b(crea|crear|agrega|agregar|genera|generar|generame|genérame|biblioteca|playlist|llamada|llamado|nombre|como|que se llame|musicas|músicas|musica|música|canciones|temas|de|del|para|con|a mi cuenta|en mi cuenta|por favor)\b',
            caseSensitive: false,
          ),
          ' ',
        )
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
    if (text.isEmpty) return const [];

    return text
        .split(RegExp(r'\s+(?:y|o)\s+|[,;/]+', caseSensitive: false))
        .map((term) => term.trim())
        .where((term) => term.length > 2)
        .toList(growable: false);
  }

  Future<List<Track>> _findTracksForLibrary(List<String> terms) async {
    final repo = ref.read(tracksRepositoryProvider);
    final found = <String, Track>{};
    final availableGenres = await _safeListGenres();
    final normalizedTerms = terms
        .map(_normalizeTerm)
        .where((term) {
          return term.isNotEmpty;
        })
        .toList(growable: false);

    for (final term in normalizedTerms) {
      final aliases = _termAliases(term);
      final genreAliases = _resolveGenreAliases(term, availableGenres);
      final termMatches = <String, Track>{};
      for (final genre in genreAliases) {
        final response = await repo.listTracks(genre: genre, take: 24);
        for (final track in response.tracks) {
          termMatches[track.id] = track;
        }
      }
      for (final alias in aliases) {
        final response = await repo.listTracks(search: alias, take: 24);
        for (final track in response.tracks) {
          if (_matchesAnyTerm(track, [...aliases, ...genreAliases])) {
            termMatches[track.id] = track;
          }
        }
      }
      for (final track in termMatches.values.take(4)) {
        found[track.id] = track;
      }
    }

    final catalog = await repo.listTracks(take: 160);
    for (final term in normalizedTerms) {
      final aliases = _termAliases(term);
      final genreAliases = _resolveGenreAliases(term, availableGenres);
      final scored =
          catalog.tracks
              .where((track) => !found.containsKey(track.id))
              .map(
                (track) => MapEntry(
                  track,
                  _scoreTrack(track, [...aliases, ...genreAliases]),
                ),
              )
              .where((entry) => entry.value > 0)
              .toList()
            ..sort((a, b) => b.value.compareTo(a.value));
      for (final entry in scored.take(4)) {
        found[entry.key.id] = entry.key;
      }
    }

    if (found.length < 8) {
      final scored =
          catalog.tracks
              .where((track) => !found.containsKey(track.id))
              .map(
                (track) => MapEntry(track, _scoreTrack(track, normalizedTerms)),
              )
              .where((entry) => entry.value > 0)
              .toList()
            ..sort((a, b) => b.value.compareTo(a.value));
      for (final entry in scored) {
        found[entry.key.id] = entry.key;
        if (found.length >= 12) break;
      }
    }

    if (found.isEmpty && normalizedTerms.isNotEmpty) {
      for (final term in normalizedTerms) {
        final response = await repo.listTracks(search: term, take: 4);
        for (final track in response.tracks) {
          found[track.id] = track;
        }
      }
    }

    if (found.isEmpty) {
      final fallback = await repo.listTracks(take: 8);
      for (final track in fallback.tracks) {
        found[track.id] = track;
      }
    }

    return found.values.toList(growable: false);
  }

  bool _matchesAnyTerm(Track track, List<String> terms) {
    return _scoreTrack(track, terms) > 0;
  }

  Future<List<String>> _safeListGenres() async {
    try {
      return await ref.read(tracksRepositoryProvider).listGenres();
    } catch (_) {
      return const [];
    }
  }

  List<String> _resolveGenreAliases(
    String value,
    List<String> availableGenres,
  ) {
    final aliases = _termAliases(value).map(_normalizeTerm).toSet();
    final resolved = <String>{};
    for (final genre in availableGenres) {
      final normalizedGenre = _normalizeTerm(genre);
      if (normalizedGenre.isEmpty) continue;
      if (aliases.any(
        (alias) =>
            normalizedGenre.contains(alias) || alias.contains(normalizedGenre),
      )) {
        resolved.add(genre);
      }
    }
    return resolved.toList(growable: false);
  }

  List<String> _termAliases(String value) {
    final term = _normalizeTerm(value);
    final aliases = <String>{term};
    if (term.contains('reguet') || term.contains('reggaet')) {
      aliases.addAll([
        'regueton',
        'reguetoon',
        'reggaeton',
        'reggaetón',
        'urbano',
        'latin urban',
        'musica urbana',
      ]);
    }
    if (term.contains('bachata')) {
      aliases.addAll(['bachata', 'bachatero']);
    }
    if (term.contains('salsa')) {
      aliases.addAll(['salsa', 'salsero']);
    }
    if (term.contains('merengue')) {
      aliases.addAll(['merengue']);
    }
    if (term.contains('cumbia')) {
      aliases.addAll(['cumbia']);
    }
    return aliases.where((alias) => alias.isNotEmpty).toList(growable: false);
  }

  int _scoreTrack(Track track, List<String> terms) {
    var score = 0;
    final title = _normalizeTerm(track.title);
    final artist = _normalizeTerm(track.artist);
    final album = _normalizeTerm(track.album);
    final genre = _normalizeTerm(track.genre ?? '');

    for (final raw in terms) {
      final term = _normalizeTerm(raw);
      if (term.isEmpty) continue;
      if (artist.contains(term)) score += 8;
      if (genre.contains(term)) score += 6;
      if (album.contains(term)) score += 3;
      if (title.contains(term)) score += 2;
      if (term == 'regueton' && genre.contains('reggaeton')) score += 6;
      if (term == 'reggaeton' && genre.contains('regueton')) score += 6;
    }
    return score;
  }

  String _normalizeTerm(String value) {
    return value
        .toLowerCase()
        .replaceAll('á', 'a')
        .replaceAll('é', 'e')
        .replaceAll('í', 'i')
        .replaceAll('ó', 'o')
        .replaceAll('ú', 'u')
        .replaceAll('ü', 'u')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  String? _cleanLibraryName(String? raw) {
    final name = raw
        ?.replaceAll(RegExp(r'[.?!¡¿]+$'), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
    if (name == null || name.length < 2) return null;
    return name.length > 48 ? name.substring(0, 48).trim() : name;
  }

  String _errorMessage(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (error.response?.statusCode == 503) {
        return 'El servicio de IA no respondio ahora. Verifica que el backend tenga salida a Anthropic e intenta nuevamente.';
      }
      if (data is Map) {
        final message = data['message'];
        if (message is String && message.isNotEmpty) return message;
        if (message is List && message.isNotEmpty) {
          return message.whereType<String>().join('\n');
        }
      }
      if (error.response?.statusCode == 429) {
        return 'Estas enviando solicitudes muy rapido. Intenta de nuevo en un momento.';
      }
      if (error.response?.statusCode == 403) {
        return 'Tu cuota de IA se agoto o esta funcion requiere un plan activo.';
      }
    }
    return 'No pude generar una sugerencia ahora. Revisa tu conexion o intenta con otra descripcion de sonido.';
  }

  Future<void> _applySuggestion(_ChatMessage message) async {
    final bands = message.bands;
    if (bands == null || bands.length != 10) return;

    final player = ref.read(playerControllerProvider);
    final controller = ref.read(playerControllerProvider.notifier);
    final doubleBands = bands.map((value) => value.toDouble()).toList();

    await controller.setEqualizerBands(doubleBands);
    try {
      if (player.currentTrack case final track?) {
        await ref
            .read(equalizerRepositoryProvider)
            .upsertTrackConfig(trackId: track.id, bands: bands);
        if (message.requestId != null) {
          await ref
              .read(aiAgentRepositoryProvider)
              .accept(message.requestId!, 'TRACK', appliedId: track.id);
        }
      } else if (message.requestId != null) {
        await ref
            .read(aiAgentRepositoryProvider)
            .accept(message.requestId!, 'GLOBAL');
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(const SnackBar(content: Text('EQ aplicado.')));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text('EQ aplicado, pero no se pudo guardar.'),
          ),
        );
    }
  }

  void _handleNavigation(int index) {
    final route = switch (index) {
      0 => AppRoutes.home,
      1 => AppRoutes.playlists,
      2 => AppRoutes.equalizer,
      3 => AppRoutes.aiAgent,
      4 => AppRoutes.premium,
      _ => null,
    };

    if (route == null || route == AppRoutes.aiAgent) return;
    context.go(route);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.musicFlowColors;
    final isPremium = ref.watch(authControllerProvider).user?.isPremium ?? false;

    if (!isPremium) {
      return Scaffold(
        backgroundColor: colors.background,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.workspace_premium_rounded, size: 48, color: _accentCyan),
                  const SizedBox(height: 16),
                  Text('FlowIA es exclusivo de Premium', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  const Text('Actualiza tu plan para usar el asistente de IA.'),
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: () => context.go(AppRoutes.premium),
                    child: const Text('Ver Premium'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: colors.background,
      bottomNavigationBar: Container(
        margin: const EdgeInsets.fromLTRB(10, 0, 10, 12),
        decoration: BoxDecoration(
          color: colors.surface.withValues(alpha: 0.96),
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: colors.shadow.withValues(alpha: 0.18),
              blurRadius: 18,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: 3,
          onTap: _handleNavigation,
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: colors.primary,
          unselectedItemColor: colors.textMuted,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home_rounded),
              label: 'Inicio',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.library_music_outlined),
              activeIcon: Icon(Icons.library_music_rounded),
              label: 'Biblioteca',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.equalizer_rounded),
              label: 'Ecualizador',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.auto_awesome_outlined),
              activeIcon: Icon(Icons.auto_awesome_rounded),
              label: 'IA',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.workspace_premium_outlined),
              activeIcon: Icon(Icons.workspace_premium_rounded),
              label: 'Premium',
            ),
          ],
        ),
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              colors.gradientStart,
              colors.gradientEnd,
              colors.background,
            ],
            stops: [0.0, 0.12, 0.42],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: Row(
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [Color(0xFF41312C), Color(0xFF1E1C1B)],
                        ),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.12),
                        ),
                      ),
                      child: const Icon(
                        Icons.person_rounded,
                        size: 20,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'MusicFlow',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        color: _accentCyan,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const Spacer(),
                    const Icon(
                      Icons.workspace_premium_rounded,
                      color: _accentCyan,
                      size: 22,
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(8, 8, 8, 120),
                  itemCount: _messages.length,
                  itemBuilder: (context, index) {
                    final message = _messages[index];
                    return _MessageBubble(
                      message: message,
                      onApply: message.bands == null
                          ? null
                          : () => _applySuggestion(message),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: Container(
        width: MediaQuery.of(context).size.width - 12,
        margin: const EdgeInsets.symmetric(horizontal: 6),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF2B3138).withValues(alpha: 0.96),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x44000000),
              blurRadius: 18,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              const Icon(Icons.mic_none_rounded, color: _lightBlue),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: _controller,
                  cursorColor: _accentCyan,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'Escribe tu comando...',
                    hintStyle: TextStyle(color: Colors.white38),
                    border: InputBorder.none,
                  ),
                  onSubmitted: (_) => _sendMessage(),
                ),
              ),
              GestureDetector(
                onTap: _isSending ? null : _sendMessage,
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: _accentCyan,
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x5500CFFF),
                        blurRadius: 14,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(
                    _isSending
                        ? Icons.hourglass_top_rounded
                        : Icons.send_rounded,
                    color: _bgDark,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LibraryRequest {
  const _LibraryRequest({required this.name, required this.terms});

  final String name;
  final List<String> terms;
}

class _LibraryCreationResult {
  const _LibraryCreationResult({
    required this.name,
    required this.addedCount,
    required this.message,
  });

  final String name;
  final int addedCount;
  final String message;
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message, required this.onApply});

  final _ChatMessage message;
  final VoidCallback? onApply;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final align = message.isUser
        ? CrossAxisAlignment.end
        : CrossAxisAlignment.start;
    final margin = message.isUser
        ? const EdgeInsets.fromLTRB(56, 0, 8, 14)
        : const EdgeInsets.fromLTRB(0, 0, 56, 14);

    return Padding(
      padding: margin,
      child: Column(
        crossAxisAlignment: align,
        children: [
          Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(
              message.isHero ? 16 : 18,
              message.isHero ? 16 : 18,
              18,
              18,
            ),
            decoration: BoxDecoration(
              color: message.isUser
                  ? const Color(0xFF2A2F36)
                  : _AiChatScreenState._cardSoft.withValues(alpha: 0.98),
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(28),
                topRight: const Radius.circular(28),
                bottomLeft: Radius.circular(message.isUser ? 28 : 6),
                bottomRight: Radius.circular(message.isUser ? 6 : 28),
              ),
              border: message.isHero
                  ? Border(
                      left: BorderSide(
                        color: _AiChatScreenState._lightBlue,
                        width: 3,
                      ),
                    )
                  : null,
              boxShadow: message.isHero
                  ? const [
                      BoxShadow(
                        color: Color(0x2200CFFF),
                        blurRadius: 18,
                        offset: Offset(0, 8),
                      ),
                    ]
                  : null,
            ),
            child: Column(
              crossAxisAlignment: message.isUser
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.start,
              children: [
                if (!message.isUser && message.isHero) ...[
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.auto_awesome_rounded,
                        color: _AiChatScreenState._lightBlue,
                        size: 14,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'FLOW AI',
                        style: theme.textTheme.labelLarge?.copyWith(
                          color: _AiChatScreenState._lightBlue,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                ],
                Text(
                  message.text,
                  style:
                      (message.isHero
                              ? theme.textTheme.headlineSmall
                              : theme.textTheme.titleLarge)
                          ?.copyWith(
                            color: Colors.white,
                            fontWeight: message.isHero
                                ? FontWeight.w900
                                : FontWeight.w700,
                            height: 1.3,
                          ),
                ),
                if (message.suggestions.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: message.suggestions
                        .map(
                          (suggestion) => Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.24),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              suggestion,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: Colors.white70,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
                if (onApply != null) ...[
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: onApply,
                      icon: const Icon(Icons.equalizer_rounded),
                      label: const Text('Aplicar EQ'),
                      style: FilledButton.styleFrom(
                        backgroundColor: _AiChatScreenState._accentCyan,
                        foregroundColor: _AiChatScreenState._bgDark,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${message.isUser ? 'ENVIADO' : 'FLOW AI'} · ${message.time}',
            style: theme.textTheme.labelSmall?.copyWith(
              color: message.isUser
                  ? Colors.white54
                  : _AiChatScreenState._lightBlue.withValues(alpha: 0.9),
              letterSpacing: 1,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatMessage {
  const _ChatMessage({
    required this.text,
    required this.isUser,
    required this.time,
    this.isHero = false,
    this.suggestions = const [],
    this.requestId,
    this.bands,
  });

  final String text;
  final bool isUser;
  final String time;
  final bool isHero;
  final List<String> suggestions;
  final String? requestId;
  final List<int>? bands;
}
