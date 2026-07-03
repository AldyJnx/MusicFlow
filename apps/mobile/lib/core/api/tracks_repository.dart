import 'package:musicflow_mobile/core/api/dio_client.dart';
import 'package:musicflow_mobile/shared/models/lyrics.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

class TracksRepository {
  TracksRepository(this._client);

  final DioClient _client;
  final Map<String, _CacheEntry<Object>> _cache = {};
  final Map<String, Future<Object>> _inFlight = {};

  static const _tracksTtl = Duration(minutes: 2);
  static const _searchTtl = Duration(seconds: 45);
  static const _savedTtl = Duration(seconds: 45);
  static const _metadataTtl = Duration(minutes: 5);

  Future<TracksListResponse> listTracks({
    String? search,
    String? artist,
    String? album,
    String? genre,
    int skip = 0,
    int take = 50,
  }) async {
    final normalizedSearch = search?.trim();
    final key = _key('tracks', {
      'search': normalizedSearch,
      'artist': artist,
      'album': album,
      'genre': genre,
      'skip': skip,
      'take': take,
    });
    final ttl = normalizedSearch == null || normalizedSearch.isEmpty
        ? _tracksTtl
        : _searchTtl;

    return _cached(key, ttl, () async {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/library/tracks',
        queryParameters: {
          if (normalizedSearch != null && normalizedSearch.isNotEmpty)
            'search': normalizedSearch,
          if (artist != null && artist.isNotEmpty) 'artist': artist,
          if (album != null && album.isNotEmpty) 'album': album,
          if (genre != null && genre.isNotEmpty) 'genre': genre,
          'skip': skip,
          'take': take,
        },
      );
      return TracksListResponse.fromJson(res.data!);
    });
  }

  Future<T> _cached<T extends Object>(
    String key,
    Duration ttl,
    Future<T> Function() load,
  ) async {
    final cached = _cache[key];
    final now = DateTime.now();
    if (cached != null && now.difference(cached.createdAt) < ttl) {
      return cached.value as T;
    }

    final active = _inFlight[key];
    if (active != null) return active as Future<T>;

    final future = load().then<Object>((value) {
      _cache[key] = _CacheEntry<Object>(value, DateTime.now());
      return value;
    });
    _inFlight[key] = future;
    try {
      return await future as T;
    } finally {
      _inFlight.remove(key);
    }
  }

  String _key(String scope, Map<String, Object?> values) {
    final parts = values.entries
        .where((entry) => entry.value != null && '${entry.value}'.isNotEmpty)
        .map((entry) => '${entry.key}=${entry.value}')
        .join('&');
    return '$scope?$parts';
  }

  void _clearSavedCaches() {
    _cache.removeWhere(
      (key, _) => key.startsWith('saved?') || key.startsWith('savedIds?'),
    );
  }

  Future<TracksListResponse> listSavedTracks({
    String? search,
    int skip = 0,
    int take = 5,
  }) async {
    final normalizedSearch = search?.trim();
    final key = _key('saved', {
      'search': normalizedSearch,
      'skip': skip,
      'take': take,
    });
    return _cached(key, _savedTtl, () async {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/library/saves',
        queryParameters: {
          if (normalizedSearch != null && normalizedSearch.isNotEmpty)
            'search': normalizedSearch,
          'skip': skip,
          'take': take,
        },
      );
      return TracksListResponse.fromJson(res.data!);
    });
  }

  Future<Track> getTrack(String id) async {
    return _cached('track?$id', _metadataTtl, () async {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/library/tracks/$id',
      );
      return Track.fromJson(res.data!);
    });
  }

  Future<LyricsResponse> getLyrics(String trackId) async {
    return _cached('lyrics?$trackId', _metadataTtl, () async {
      final res = await _client.dio.get<Map<String, dynamic>>(
        '/library/tracks/$trackId/lyrics',
      );
      return LyricsResponse.fromJson(res.data!);
    });
  }

  Future<Set<String>> getSavedTrackIds(List<String> trackIds) async {
    if (trackIds.isEmpty) return {};
    final idsKey = [...trackIds]..sort();
    final key = _key('savedIds', {'ids': idsKey.join(',')});
    return _cached(key, _savedTtl, () async {
      final res = await _client.dio.post<Map<String, dynamic>>(
        '/library/saves/check',
        data: {'trackIds': trackIds},
      );
      final ids = res.data?['savedTrackIds'];
      return ids is List ? ids.cast<String>().toSet() : <String>{};
    });
  }

  Future<void> saveTrack(String trackId) async {
    await _client.dio.post('/library/saves/$trackId');
    _clearSavedCaches();
  }

  Future<void> unsaveTrack(String trackId) async {
    await _client.dio.delete('/library/saves/$trackId');
    _clearSavedCaches();
  }

  Future<List<String>> listArtists() async {
    return _cached('artists', _metadataTtl, () async {
      final res = await _client.dio.get<dynamic>('/library/tracks/artists');
      final artists = <String>{};
      for (final item in _listPayload(res.data, 'artists')) {
        final name = _artistName(item);
        if (name != null && name.isNotEmpty) artists.add(name);
      }
      return artists.toList(growable: false);
    });
  }

  Future<List<String>> listGenres() async {
    return _cached('genres', _metadataTtl, () async {
      final res = await _client.dio.get<dynamic>('/library/tracks/genres');
      return _listPayload(res.data, 'genres')
          .map(_stringValue)
          .whereType<String>()
          .where((genre) => genre.isNotEmpty)
          .toList(growable: false);
    });
  }

  String? _artistName(Object? value) {
    if (value is String) return value.trim();
    if (value is Map<String, dynamic>) {
      return _firstString(value, const ['name', 'artist', 'title', 'label']);
    }
    return _stringValue(value);
  }

  String? _stringValue(Object? value) {
    if (value == null) return null;
    if (value is String) return value.trim();
    if (value is num || value is bool) return value.toString();
    return null;
  }

  String? _firstString(Map<String, dynamic> json, List<String> keys) {
    for (final key in keys) {
      final value = _stringValue(json[key]);
      if (value != null && value.isNotEmpty) return value;
    }
    return null;
  }

  List<dynamic> _listPayload(Object? data, String key) {
    if (data is List) return data;
    if (data is Map<String, dynamic>) {
      final keyed = data[key];
      if (keyed is List) return keyed;
      final items = data['items'];
      if (items is List) return items;
      final dataItems = data['data'];
      if (dataItems is List) return dataItems;
    }
    return const <dynamic>[];
  }
}

class _CacheEntry<T extends Object> {
  const _CacheEntry(this.value, this.createdAt);

  final T value;
  final DateTime createdAt;
}
