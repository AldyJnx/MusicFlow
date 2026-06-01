import 'package:dio/dio.dart';
import 'package:musicflow_mobile/core/config/app_config.dart';
import 'package:musicflow_mobile/core/storage/token_storage.dart';

class DioClient {
  DioClient({required TokenStorage tokenStorage})
      : _tokenStorage = tokenStorage,
        _dio = Dio(BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 30),
          contentType: 'application/json',
        )) {
    _dio.interceptors.add(_AuthInterceptor(this));
  }

  final TokenStorage _tokenStorage;
  final Dio _dio;
  Future<String?>? _ongoingRefresh;

  Dio get dio => _dio;

  Future<String?> _refreshAccessToken() async {
    // Single-flight: if a refresh is already in progress, await it.
    final existing = _ongoingRefresh;
    if (existing != null) return existing;

    final completer = _doRefresh();
    _ongoingRefresh = completer;
    try {
      return await completer;
    } finally {
      _ongoingRefresh = null;
    }
  }

  Future<String?> _doRefresh() async {
    final refreshToken = await _tokenStorage.readRefreshToken();
    if (refreshToken == null) return null;

    try {
      // Use a bare Dio to avoid the auth interceptor recursing.
      final bareDio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl));
      final res = await bareDio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final newAccess = res.data?['accessToken'] as String?;
      final newRefresh = res.data?['refreshToken'] as String?;
      if (newAccess == null || newRefresh == null) {
        await _tokenStorage.clear();
        return null;
      }
      await _tokenStorage.saveTokens(
        accessToken: newAccess,
        refreshToken: newRefresh,
      );
      return newAccess;
    } catch (_) {
      await _tokenStorage.clear();
      return null;
    }
  }
}

class _AuthInterceptor extends Interceptor {
  _AuthInterceptor(this._client);

  final DioClient _client;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (options.extra['skipAuth'] != true) {
      final token = await _client._tokenStorage.readAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final response = err.response;
    final original = err.requestOptions;

    final canRetry = response?.statusCode == 401 &&
        original.extra['_retried'] != true &&
        original.extra['skipAuth'] != true;

    if (!canRetry) {
      handler.next(err);
      return;
    }

    final newToken = await _client._refreshAccessToken();
    if (newToken == null) {
      handler.next(err);
      return;
    }

    original.headers['Authorization'] = 'Bearer $newToken';
    original.extra['_retried'] = true;
    try {
      final retry = await _client._dio.fetch<dynamic>(original);
      handler.resolve(retry);
    } catch (e) {
      handler.next(e is DioException ? e : err);
    }
  }
}
