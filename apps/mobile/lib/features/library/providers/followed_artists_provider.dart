import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/features/library/providers/tracks_providers.dart';
import 'package:musicflow_mobile/shared/models/catalog.dart';

class FollowedArtistsController extends StateNotifier<Set<String>> {
  FollowedArtistsController(this._ref) : super(<String>{}) {
    _load();
  }

  final Ref _ref;
  final Map<String, CatalogArtist> _artistsByName = {};

  bool isFollowing(String artist) => _findExisting(artist) != null;

  Future<void> toggle(String artist) async {
    final normalized = artist.trim();
    if (normalized.isEmpty) return;
    final catalogArtist = await _resolveArtist(normalized);
    if (catalogArtist == null) return;

    final existing = _findExisting(normalized);
    final wasFollowing = existing != null;
    final previous = state;
    state = wasFollowing
        ? ({...state}..remove(existing))
        : {...state, catalogArtist.name};
    try {
      final repository = _ref.read(catalogRepositoryProvider);
      if (wasFollowing) {
        await repository.unfollowArtist(catalogArtist.id);
      } else {
        await repository.followArtist(catalogArtist.id);
      }
      _ref.invalidate(homeRecommendationsProvider);
    } catch (_) {
      state = previous;
      rethrow;
    }
  }

  Future<void> refresh() => _load();

  Future<void> _load() async {
    try {
      final rows = await _ref
          .read(authRepositoryProvider)
          .listFollowedArtists();
      final names = <String>{};
      for (final row in rows) {
        final artist = CatalogArtist.fromJson(row);
        _artistsByName[artist.name.toLowerCase()] = artist;
        names.add(artist.name);
      }
      if (mounted) state = names;
    } catch (_) {
      // Preserve the last confirmed state during temporary network failures.
    }
  }

  Future<CatalogArtist?> _resolveArtist(String name) async {
    final key = name.toLowerCase();
    final cached = _artistsByName[key];
    if (cached != null) return cached;
    final artists = await _ref.read(catalogRepositoryProvider).listArtists();
    for (final artist in artists) {
      _artistsByName[artist.name.toLowerCase()] = artist;
    }
    return _artistsByName[key];
  }

  String? _findExisting(String artist) {
    final key = artist.toLowerCase().trim();
    for (final item in state) {
      if (item.toLowerCase() == key) return item;
    }
    return null;
  }
}

final followedArtistsProvider =
    StateNotifierProvider<FollowedArtistsController, Set<String>>((ref) {
      return FollowedArtistsController(ref);
    });
