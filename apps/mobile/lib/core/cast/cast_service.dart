import 'dart:io';

import 'package:flutter/services.dart';

class CastService {
  const CastService();

  static const MethodChannel _channel = MethodChannel('musicflow/cast');

  Future<CastLaunchResult> openCastPicker() async {
    if (!Platform.isAndroid) {
      return const CastLaunchResult(
        opened: false,
        message:
            'Transmitir audio a TV requiere Google Cast o un receiver compatible.',
      );
    }

    try {
      final opened = await _channel.invokeMethod<bool>('openCastSettings');
      return CastLaunchResult(
        opened: opened ?? false,
        message: opened == true
            ? 'Se abrieron los ajustes de transmision. Audio Cast real requiere Google Cast SDK.'
            : 'No se pudo abrir el panel de transmision.',
      );
    } on PlatformException catch (error) {
      return CastLaunchResult(
        opened: false,
        message: error.message ?? 'No se pudo abrir el panel de transmision.',
      );
    } on MissingPluginException {
      return const CastLaunchResult(
        opened: false,
        message:
            'Audio Cast real aun no esta integrado. Requiere Google Cast SDK y un receiver.',
      );
    }
  }
}

class CastLaunchResult {
  const CastLaunchResult({required this.opened, required this.message});

  final bool opened;
  final String message;
}
