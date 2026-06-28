import 'dart:io';

import 'package:flutter/services.dart';

class CastService {
  const CastService();

  static const MethodChannel _channel = MethodChannel('musicflow/cast');

  Future<CastLaunchResult> openCastPicker() async {
    if (!Platform.isAndroid) {
      return const CastLaunchResult(
        opened: false,
        message: 'La conexion a TV por Miracast esta disponible desde Android.',
      );
    }

    try {
      final opened = await _channel.invokeMethod<bool>('openCastSettings');
      return CastLaunchResult(
        opened: opened ?? false,
        message: opened == true
            ? 'Selecciona tu TV desde el panel de transmision.'
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
        message: 'La transmision no esta disponible en este dispositivo.',
      );
    }
  }
}

class CastLaunchResult {
  const CastLaunchResult({required this.opened, required this.message});

  final bool opened;
  final String message;
}
