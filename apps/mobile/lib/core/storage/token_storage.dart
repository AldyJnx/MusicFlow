import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persists access + refresh tokens using OS keychain / keystore.
class TokenStorage {
  TokenStorage({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;
  String? _accessToken;
  String? _refreshToken;

  static const _accessKey = 'mf_access_token';
  static const _refreshKey = 'mf_refresh_token';

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    await _storage.write(key: _accessKey, value: accessToken);
    await _storage.write(key: _refreshKey, value: refreshToken);
  }

  Future<String?> readAccessToken() async {
    final cached = _accessToken;
    if (cached != null) return cached;
    return _accessToken = await _storage.read(key: _accessKey);
  }

  Future<String?> readRefreshToken() async {
    final cached = _refreshToken;
    if (cached != null) return cached;
    return _refreshToken = await _storage.read(key: _refreshKey);
  }

  Future<void> clear() async {
    _accessToken = null;
    _refreshToken = null;
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }
}
