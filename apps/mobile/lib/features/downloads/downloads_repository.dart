import 'dart:io';

import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';

/// Handles the on-device side of offline downloads: where audio files live and
/// fetching their bytes. Uses a bare [Dio] (no auth interceptor) because the
/// catalog's audio URLs are public R2 links that need no Authorization header.
class DownloadsRepository {
  DownloadsRepository();

  final Dio _dio = Dio();
  Directory? _dir;

  Future<Directory> _downloadsDir() async {
    final cached = _dir;
    if (cached != null) return cached;
    final base = await getApplicationDocumentsDirectory();
    final dir = Directory('${base.path}/downloads');
    if (!await dir.exists()) await dir.create(recursive: true);
    _dir = dir;
    return dir;
  }

  /// Absolute path of the downloads directory (cached after first call) so the
  /// player can build local file URIs synchronously.
  Future<String> directoryPath() async => (await _downloadsDir()).path;

  /// Absolute path for a stored file name.
  Future<String> pathFor(String fileName) async {
    final dir = await _downloadsDir();
    return '${dir.path}/$fileName';
  }

  /// Download [url] into the downloads dir as `<id>.<ext>` and return the file
  /// name. Reports 0..1 progress when the server sends a content length.
  Future<String> download(
    String id,
    String url, {
    void Function(double progress)? onProgress,
  }) async {
    final ext = _extensionFor(url);
    final fileName = '$id$ext';
    final fullPath = await pathFor(fileName);
    await _dio.download(
      url,
      fullPath,
      onReceiveProgress: (received, total) {
        if (total > 0 && onProgress != null) onProgress(received / total);
      },
    );
    return fileName;
  }

  Future<void> deleteFile(String fileName) async {
    final fullPath = await pathFor(fileName);
    final file = File(fullPath);
    if (await file.exists()) await file.delete();
  }

  String _extensionFor(String url) {
    final clean = url.split('?').first;
    final dot = clean.lastIndexOf('.');
    if (dot == -1) return '.mp3';
    final ext = clean.substring(dot).toLowerCase();
    const known = {'.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.opus'};
    return known.contains(ext) ? ext : '.mp3';
  }
}
