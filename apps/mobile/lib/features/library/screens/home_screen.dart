import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/providers/app_settings_provider.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/core/widgets/app_bottom_navigation.dart';
import 'package:musicflow_mobile/core/widgets/floating_ai_bubble.dart';
import 'package:musicflow_mobile/core/widgets/mini_player_bar.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/features/auth/providers/auth_controller.dart';
import 'package:musicflow_mobile/features/library/providers/followed_artists_provider.dart';
import 'package:musicflow_mobile/features/library/providers/tracks_providers.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final _tracksQueryProvider = StateProvider.autoDispose<String>((ref) => '');

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _lightBlue = Color(0xFF4FC3F7);
  static const Color _cardSoft = Color(0xFF132F3F);

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _searchController = TextEditingController();
  final Set<String> _preloadedImageUrls = <String>{};
  Timer? _debounce;
  Timer? _secondaryLoadTimer;
  bool _loadSecondaryContent = false;

  @override
  void initState() {
    super.initState();
    unawaited(ref.read(authControllerProvider.notifier).refreshCurrentUser());
    _secondaryLoadTimer = Timer(const Duration(milliseconds: 180), () {
      if (mounted) setState(() => _loadSecondaryContent = true);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    _secondaryLoadTimer?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    if (value.trim().isEmpty) {
      ref.read(_tracksQueryProvider.notifier).state = '';
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 160), () {
      if (mounted) {
        ref.read(_tracksQueryProvider.notifier).state = value.trim();
      }
    });
  }

  void _clearSearch() {
    _debounce?.cancel();
    _searchController.clear();
    ref.read(_tracksQueryProvider.notifier).state = '';
  }

  void _openPlaylistScreen(BuildContext context) {
    context.push(AppRoutes.playlists);
  }

  Future<void> _toggleFavorite({
    required Track track,
    required bool isSaved,
    required String savedIdsKey,
  }) async {
    final repo = ref.read(tracksRepositoryProvider);
    try {
      if (isSaved) {
        await repo.unsaveTrack(track.id);
      } else {
        await repo.saveTrack(track.id);
      }
      ref.invalidate(savedTrackIdsProvider(savedIdsKey));
      ref.invalidate(savedTracksListProvider(const TracksQuery(take: 5)));
      ref.invalidate(homeRecommendationsProvider);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo actualizar favoritos.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.musicFlowColors;
    final authState = ref.watch(authControllerProvider);
    final username = authState.user?.username ?? 'Oyente';
    final isPremium = authState.user?.isPremium ?? false;
    final searchQuery = ref.watch(_tracksQueryProvider);
    final tracksQuery = TracksQuery(
      search: searchQuery.isEmpty ? null : searchQuery,
      take: searchQuery.isEmpty ? 24 : 8,
    );
    final tracksAsync = ref.watch(tracksListProvider(tracksQuery));
    final carouselTracksAsync = searchQuery.isEmpty
        ? ref.watch(homeRecommendationsProvider)
        : tracksAsync;
    final recentlyPlayedAsync = _loadSecondaryContent && searchQuery.isEmpty
        ? ref.watch(recentlyPlayedTracksProvider(5))
        : const AsyncValue<List<Track>>.data(<Track>[]);
    final followedArtists = ref.watch(followedArtistsProvider);

    return Scaffold(
      backgroundColor: colors.background,
      bottomNavigationBar: const AppBottomNavigation(
        currentRoute: AppRoutes.home,
      ),
      bottomSheet: const MiniPlayerBar(),
      body: _withAiBubble(
        context,
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                colors.gradientStart,
                colors.gradientEnd,
                colors.background,
              ],
            ),
          ),
          child: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 118),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Align(
                    alignment: Alignment.centerRight,
                    child: _buildPlanPill(context, theme, isPremium),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Hola $username',
                              style: theme.textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              'Descubre tu musica de hoy',
                              style: theme.textTheme.bodyLarge?.copyWith(
                                color: Colors.white70,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(
                          Icons.notifications_none_rounded,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Search
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: colors.border),
                    ),
                    child: TextField(
                      controller: _searchController,
                      style: const TextStyle(color: Colors.white),
                      onChanged: _onSearchChanged,
                      decoration: InputDecoration(
                        icon: const Icon(
                          Icons.search_rounded,
                          color: Colors.white70,
                        ),
                        hintText: '¿Que quieres escuchar hoy?',
                        hintStyle: const TextStyle(color: Colors.white54),
                        border: InputBorder.none,
                        suffixIcon: searchQuery.isEmpty
                            ? null
                            : IconButton(
                                onPressed: _clearSearch,
                                icon: const Icon(Icons.close_rounded),
                                color: Colors.white70,
                                tooltip: 'Limpiar busqueda',
                              ),
                      ),
                      textInputAction: TextInputAction.search,
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (searchQuery.isNotEmpty) ...[
                    _buildSearchResults(
                      context,
                      theme,
                      searchQuery,
                      tracksAsync,
                    ),
                    const SizedBox(height: 24),
                  ] else ...[
                    const SizedBox(height: 24),
                    SizedBox(
                      height: 258,
                      child: carouselTracksAsync.when(
                        loading: () => Center(
                          child: CircularProgressIndicator(
                            color: colors.primary,
                          ),
                        ),
                        error: (_, _) => const _SongsLoadMessage(
                          message: 'No se pudo cargar el destacado semanal.',
                        ),
                        data: (response) => _WeeklyFeaturedCarousel(
                          tracks: response.tracks
                              .take(8)
                              .toList(growable: false),
                          onPlay: (index) => ref
                              .read(playerControllerProvider.notifier)
                              .playTrackList(
                                response.tracks,
                                startIndex: index,
                              ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),
                  ],
                  // Songs from API
                  _SectionHeader(
                    title: 'Recomendado para ti',
                    onSeeAll: () => _openPlaylistScreen(context),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 176,
                    child: carouselTracksAsync.when(
                      loading: () => Center(
                        child: CircularProgressIndicator(color: colors.primary),
                      ),
                      error: (error, _) => _SongsLoadMessage(
                        message:
                            'No se pudo conectar con tu biblioteca. Revisa la API.',
                        onRetry: () => searchQuery.isEmpty
                            ? ref.invalidate(homeRecommendationsProvider)
                            : ref.invalidate(tracksListProvider(tracksQuery)),
                      ),
                      data: (response) {
                        final tracks =
                            (searchQuery.isEmpty
                                    ? response.tracks
                                    : _prioritizeFollowedArtists(
                                        response.tracks,
                                        followedArtists,
                                      ))
                                .take(6)
                                .toList(growable: false);
                        _precacheTrackImages(tracks);
                        if (tracks.isEmpty) {
                          return const _SongsLoadMessage(
                            message: 'Aun no hay canciones disponibles.',
                          );
                        }
                        final savedIdsKey = tracks
                            .map((track) => track.id)
                            .join('|');
                        final savedIds = ref
                            .watch(savedTrackIdsProvider(savedIdsKey))
                            .maybeWhen(
                              data: (ids) => ids,
                              orElse: () => const <String>{},
                            );

                        return ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: tracks.length,
                          separatorBuilder: (_, _) => const SizedBox(width: 14),
                          itemBuilder: (context, index) {
                            final track = tracks[index];
                            return _SongPreviewCard(
                              track: track,
                              isSaved: savedIds.contains(track.id),
                              onPlay: () async {
                                await ref
                                    .read(playerControllerProvider.notifier)
                                    .playTrackList(tracks, startIndex: index);
                              },
                              onFavorite: () => _toggleFavorite(
                                track: track,
                                isSaved: savedIds.contains(track.id),
                                savedIdsKey: savedIdsKey,
                              ),
                              onEqualizer: () async {
                                await ref
                                    .read(playerControllerProvider.notifier)
                                    .playTrackList(tracks, startIndex: index);
                                if (context.mounted) {
                                  context.push(AppRoutes.equalizer);
                                }
                              },
                            );
                          },
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 28),
                  // Tracks section header
                  _SectionHeader(
                    title: searchQuery.isEmpty
                        ? 'Escuchado recientemente'
                        : 'Resultados de búsqueda',
                    onSeeAll: () {},
                  ),
                  const SizedBox(height: 12),
                  if (searchQuery.isEmpty)
                    recentlyPlayedAsync.when(
                      loading: _buildTrackListLoading,
                      error: (_, _) => _buildTrackListError(
                        context,
                        theme,
                        message:
                            'No se pudo cargar tu historial de escucha reciente.',
                        onRetry: () =>
                            ref.invalidate(recentlyPlayedTracksProvider(5)),
                      ),
                      data: (tracks) => _buildVerticalTrackList(
                        theme: theme,
                        tracks: tracks,
                        emptyMessage:
                            'Aun no tienes canciones escuchadas recientemente.',
                      ),
                    )
                  else
                    tracksAsync.when(
                      loading: _buildTrackListLoading,
                      error: (_, _) => _buildTrackListError(
                        context,
                        theme,
                        message: 'No se pudieron cargar las canciones.',
                        onRetry: () =>
                            ref.invalidate(tracksListProvider(tracksQuery)),
                      ),
                      data: (response) {
                        final tracks = _prioritizeFollowedArtists(
                          response.tracks,
                          followedArtists,
                        );
                        _precacheTrackImages(tracks);
                        return _buildVerticalTrackList(
                          theme: theme,
                          tracks: tracks,
                          emptyMessage:
                              'No se encontraron canciones para "$searchQuery".',
                        );
                      },
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _withAiBubble(BuildContext context, Widget child) {
    final assistantEnabled = ref.watch(appSettingsProvider).aiAssistantEnabled;
    final isPremium =
        ref.watch(authControllerProvider).user?.isPremium ?? false;

    return LayoutBuilder(
      builder: (context, constraints) {
        return Stack(
          children: [
            Positioned.fill(child: child),
            if (isPremium && assistantEnabled)
              FloatingAIBubble(
                boundsSize: constraints.biggest,
                onTap: () => context.push(AppRoutes.aiAgent),
                padding: const EdgeInsets.fromLTRB(16, 56, 16, 154),
              ),
          ],
        );
      },
    );
  }

  Widget _buildPlanPill(BuildContext context, ThemeData theme, bool isPremium) {
    return SizedBox(
      width: 182,
      child: InkWell(
        onTap: () {
          context.push(AppRoutes.premium);
        },
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                isPremium
                    ? Icons.workspace_premium_rounded
                    : Icons.workspace_premium_outlined,
                size: 16,
                color: isPremium
                    ? const Color(0xFFFFD66B)
                    : HomeScreen._accentCyan.withValues(alpha: 0.95),
              ),
              const SizedBox(width: 8),
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'PLAN',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: Colors.white54,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1,
                    ),
                  ),
                  Text(
                    isPremium ? 'PREMIUM' : 'GRATUITO',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.4,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTrackListLoading() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 32),
        child: CircularProgressIndicator(color: HomeScreen._accentCyan),
      ),
    );
  }

  Widget _buildTrackListError(
    BuildContext context,
    ThemeData theme, {
    required String message,
    required VoidCallback onRetry,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        children: [
          Text(
            message,
            style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white54),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: onRetry,
            child: const Text(
              'Reintentar',
              style: TextStyle(color: HomeScreen._lightBlue),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerticalTrackList({
    required ThemeData theme,
    required List<Track> tracks,
    required String emptyMessage,
  }) {
    if (tracks.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Center(
          child: Text(
            emptyMessage,
            style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white54),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return ListView.separated(
      itemCount: tracks.length,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final track = tracks[index];
        return _TrackCard(
          track: track,
          onPlay: () async {
            await ref
                .read(playerControllerProvider.notifier)
                .playTrackList(tracks, startIndex: index);
          },
        );
      },
    );
  }

  List<Track> _prioritizeFollowedArtists(
    List<Track> tracks,
    Set<String> followedArtists,
  ) {
    final copy = _dailyShuffle(tracks);
    if (followedArtists.isEmpty) return copy;
    final normalizedFollowed = followedArtists
        .map((artist) => artist.toLowerCase().trim())
        .toSet();
    copy.sort((a, b) {
      final aFollowed = normalizedFollowed.contains(a.artist.toLowerCase());
      final bFollowed = normalizedFollowed.contains(b.artist.toLowerCase());
      if (aFollowed == bFollowed) return 0;
      return aFollowed ? -1 : 1;
    });
    return copy;
  }

  List<Track> _dailyShuffle(List<Track> tracks) {
    final copy = [...tracks];
    final now = DateTime.now();
    final seed = now.year * 10000 + now.month * 100 + now.day;
    copy.sort((a, b) {
      final aHash = (a.id.hashCode ^ seed) & 0x7fffffff;
      final bHash = (b.id.hashCode ^ seed) & 0x7fffffff;
      return aHash.compareTo(bHash);
    });
    return copy;
  }

  Widget _buildSearchResults(
    BuildContext context,
    ThemeData theme,
    String query,
    AsyncValue<TracksListResponse> tracksAsync,
  ) {
    final normalizedQuery = query.toLowerCase();
    final artists = tracksAsync.maybeWhen(
      data: (response) {
        _precacheTrackImages(response.tracks);
        final byArtist = <String, _ArtistSearchResult>{};
        for (final track in response.tracks) {
          final artist = track.artist.trim();
          if (artist.isEmpty) continue;
          if (!artist.toLowerCase().contains(normalizedQuery)) continue;

          final key = artist.toLowerCase();
          final image = _bestArtistImage(track);
          final existing = byArtist[key];
          if (existing == null) {
            byArtist[key] = _ArtistSearchResult(name: artist, imageUrl: image);
          } else if ((existing.imageUrl == null ||
                  existing.imageUrl!.isEmpty) &&
              image != null &&
              image.isNotEmpty) {
            byArtist[key] = _ArtistSearchResult(
              name: existing.name,
              imageUrl: image,
            );
          }
        }
        return byArtist.values.take(4).toList(growable: false);
      },
      orElse: () => const <_ArtistSearchResult>[],
    );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: HomeScreen._cardSoft.withValues(alpha: 0.82),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: HomeScreen._accentCyan.withValues(alpha: 0.12),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (tracksAsync.isLoading)
            const LinearProgressIndicator(
              minHeight: 2,
              color: HomeScreen._accentCyan,
              backgroundColor: Colors.white10,
            ),
          if (artists.isNotEmpty) ...[
            Text(
              'Artistas',
              style: theme.textTheme.titleSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 10),
            ...artists.map(
              (artist) => _SearchResultTile(
                icon: Icons.person_rounded,
                title: artist.name,
                subtitle: 'Perfil del artista',
                coverArt: artist.imageUrl,
                onTap: () {
                  context.push(AppRoutes.artistDetail(artist.name));
                },
              ),
            ),
            const SizedBox(height: 12),
          ],
          Text(
            'Canciones',
            style: theme.textTheme.titleSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),
          tracksAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (_, _) => const Text(
              'No se pudieron buscar canciones.',
              style: TextStyle(color: Colors.white60),
            ),
            data: (response) {
              final tracks = response.tracks;
              if (tracks.isEmpty && artists.isEmpty) {
                return const Text(
                  'No encontramos artistas ni canciones.',
                  style: TextStyle(color: Colors.white60),
                );
              }
              if (tracks.isEmpty) {
                return const Text(
                  'No hay canciones con ese nombre.',
                  style: TextStyle(color: Colors.white60),
                );
              }
              return Column(
                children: List.generate(tracks.length, (index) {
                  final track = tracks[index];
                  return _SearchResultTile(
                    icon: Icons.music_note_rounded,
                    title: track.title,
                    subtitle: track.artist,
                    coverArt: track.coverArt,
                    onTap: () {
                      ref
                          .read(playerControllerProvider.notifier)
                          .playTrackList(tracks, startIndex: index);
                    },
                  );
                }),
              );
            },
          ),
        ],
      ),
    );
  }

  String? _bestArtistImage(Track track) {
    final artistImage = track.artistImage;
    if (artistImage != null && artistImage.isNotEmpty) return artistImage;
    final coverArt = track.coverArt;
    if (coverArt != null && coverArt.isNotEmpty) return coverArt;
    return null;
  }

  void _precacheTrackImages(List<Track> tracks) {
    final urls = tracks
        .take(8)
        .expand((track) => [track.coverArt, track.artistImage])
        .whereType<String>()
        .where((url) => url.isNotEmpty && _preloadedImageUrls.add(url))
        .toList(growable: false);
    if (urls.isEmpty) return;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      for (final url in urls) {
        precacheImage(
          ResizeImage.resizeIfNeeded(320, 320, NetworkImage(url)),
          context,
        );
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Track card
// ---------------------------------------------------------------------------

class _ArtistSearchResult {
  const _ArtistSearchResult({required this.name, this.imageUrl});

  final String name;
  final String? imageUrl;
}

class _SongPreviewCard extends StatelessWidget {
  const _SongPreviewCard({
    required this.track,
    required this.isSaved,
    required this.onPlay,
    required this.onFavorite,
    required this.onEqualizer,
  });

  final Track track;
  final bool isSaved;
  final Future<void> Function() onPlay;
  final Future<void> Function() onFavorite;
  final Future<void> Function() onEqualizer;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onPlay,
      borderRadius: BorderRadius.circular(24),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Container(
          width: 158,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF12384A), Color(0xFF0A1B25)],
            ),
            border: Border.all(
              color: HomeScreen._accentCyan.withValues(alpha: 0.14),
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x2200CFFF),
                blurRadius: 18,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (track.coverArt != null && track.coverArt!.isNotEmpty)
                Image.network(
                  track.coverArt!,
                  fit: BoxFit.cover,
                  cacheWidth: 320,
                  cacheHeight: 320,
                  filterQuality: FilterQuality.low,
                  errorBuilder: (_, _, _) => const _SongIcon(),
                )
              else
                const _SongIcon(),
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.08),
                      const Color(0xFF071A24).withValues(alpha: 0.86),
                    ],
                    stops: const [0.32, 1],
                  ),
                ),
              ),
              Positioned(
                top: 10,
                left: 10,
                child: _RoundCardAction(
                  icon: isSaved
                      ? Icons.favorite_rounded
                      : Icons.favorite_border_rounded,
                  color: isSaved ? const Color(0xFFFF4F7A) : Colors.white,
                  onTap: onFavorite,
                ),
              ),
              Positioned(
                top: 10,
                right: 10,
                child: _RoundCardAction(
                  icon: Icons.equalizer_rounded,
                  color: HomeScreen._accentCyan,
                  onTap: onEqualizer,
                ),
              ),
              Positioned(
                left: 14,
                right: 14,
                bottom: 14,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      track.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        height: 1.08,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      track.artist,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SearchResultTile extends StatelessWidget {
  const _SearchResultTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.coverArt,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final String? coverArt;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: SizedBox(
                width: 44,
                height: 44,
                child: coverArt != null && coverArt!.isNotEmpty
                    ? Image.network(
                        coverArt!,
                        fit: BoxFit.cover,
                        cacheWidth: 96,
                        cacheHeight: 96,
                        filterQuality: FilterQuality.low,
                        errorBuilder: (_, _, _) => _SearchFallback(icon),
                      )
                    : _SearchFallback(icon),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white60, fontSize: 12),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Colors.white38),
          ],
        ),
      ),
    );
  }
}

class _SearchFallback extends StatelessWidget {
  const _SearchFallback(this.icon);

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1E90FF), HomeScreen._accentCyan],
        ),
      ),
      child: Icon(icon, color: Colors.white, size: 24),
    );
  }
}

class _RoundCardAction extends StatelessWidget {
  const _RoundCardAction({
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final Future<void> Function() onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.28),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: () {
          onTap();
        },
        child: SizedBox(
          width: 34,
          height: 34,
          child: Icon(icon, color: color, size: 19),
        ),
      ),
    );
  }
}

class _SongIcon extends StatelessWidget {
  const _SongIcon();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Icon(Icons.graphic_eq_rounded, color: Colors.white),
    );
  }
}

class _SongsLoadMessage extends StatelessWidget {
  const _SongsLoadMessage({required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.white54),
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 8),
            TextButton(
              onPressed: onRetry,
              child: const Text(
                'Reintentar',
                style: TextStyle(color: HomeScreen._accentCyan),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _WeeklyFeaturedCarousel extends StatefulWidget {
  const _WeeklyFeaturedCarousel({required this.tracks, required this.onPlay});

  final List<Track> tracks;
  final Future<void> Function(int index) onPlay;

  @override
  State<_WeeklyFeaturedCarousel> createState() =>
      _WeeklyFeaturedCarouselState();
}

class _WeeklyFeaturedCarouselState extends State<_WeeklyFeaturedCarousel> {
  final PageController _controller = PageController(viewportFraction: 0.93);
  Timer? _timer;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted || widget.tracks.length < 2) return;
      _index = (_index + 1) % widget.tracks.length;
      _controller.animateToPage(
        _index,
        duration: const Duration(milliseconds: 420),
        curve: Curves.easeOutCubic,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    if (widget.tracks.isEmpty) {
      return const _SongsLoadMessage(
        message: 'Aún no hay destacados esta semana.',
      );
    }
    return Column(
      children: [
        Expanded(
          child: PageView.builder(
            controller: _controller,
            itemCount: widget.tracks.length,
            onPageChanged: (value) => setState(() => _index = value),
            itemBuilder: (context, index) {
              final track = widget.tracks[index];
              return Padding(
                padding: const EdgeInsets.only(right: 10),
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    gradient: LinearGradient(
                      colors: [
                        colors.cardGradientEnd,
                        colors.cardGradientStart,
                      ],
                    ),
                    image: track.coverArt?.isNotEmpty == true
                        ? DecorationImage(
                            image: NetworkImage(track.coverArt!),
                            fit: BoxFit.cover,
                            opacity: 0.24,
                          )
                        : null,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'DESTACADO DE LA SEMANA',
                        style: Theme.of(context).textTheme.labelMedium
                            ?.copyWith(
                              color: colors.primary,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.1,
                            ),
                      ),
                      const Spacer(),
                      Text(
                        track.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.headlineSmall
                            ?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        track.artist,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 12),
                      FilledButton.icon(
                        onPressed: () => widget.onPlay(index),
                        icon: const Icon(Icons.play_arrow_rounded),
                        label: const Text('Reproducir'),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            widget.tracks.length,
            (index) => AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _index == index ? 18 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: _index == index ? colors.primary : Colors.white24,
                borderRadius: BorderRadius.circular(99),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _TrackCard extends StatelessWidget {
  const _TrackCard({required this.track, required this.onPlay});

  final Track track;
  final Future<void> Function() onPlay;

  static const Color _primaryBlue = Color(0xFF1E90FF);
  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _cardDark = Color(0xFF102734);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: () {
        onPlay();
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: _cardDark.withValues(alpha: 0.92),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
        ),
        child: Row(
          children: [
            // Cover art
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: SizedBox(
                width: 56,
                height: 56,
                child: track.coverArt != null && track.coverArt!.isNotEmpty
                    ? Image.network(
                        track.coverArt!,
                        fit: BoxFit.cover,
                        cacheWidth: 112,
                        cacheHeight: 112,
                        filterQuality: FilterQuality.low,
                        errorBuilder: (ctx, err, st) => _coverPlaceholder(),
                      )
                    : _coverPlaceholder(),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    track.title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    track.artist,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.white60,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (track.album.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      track.album,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.white38,
                        fontSize: 11,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            Text(
              _formatDuration(track.durationMs),
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.white60),
            ),
            IconButton(
              onPressed: onPlay,
              icon: const Icon(Icons.play_circle_fill_rounded),
              color: _accentCyan,
            ),
          ],
        ),
      ),
    );
  }

  Widget _coverPlaceholder() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [_primaryBlue, _accentCyan],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Icon(Icons.music_note_rounded, color: Colors.white),
    );
  }

  String _formatDuration(int ms) {
    final total = ms ~/ 1000;
    final minutes = total ~/ 60;
    final seconds = total % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }
}

// ---------------------------------------------------------------------------
// Shared widgets
// ---------------------------------------------------------------------------

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.onSeeAll});

  final String title;
  final VoidCallback onSeeAll;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
        ),
        TextButton(
          onPressed: onSeeAll,
          child: const Text(
            'Ver todo',
            style: TextStyle(
              color: HomeScreen._accentCyan,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}
