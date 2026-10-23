# MusicFlow Mobile

<p align="center"><img src="assets/icon/music-flow.png" alt="MusicFlow" width="120"></p>
<p align="center"><strong>Tu música, tus reglas</strong></p>

Aplicación Flutter para Android e iOS con reproductor en segundo plano, letras
sincronizadas, EQ por segmentos, cola y sincronización con la API MusicFlow.

## Tecnologías

[![Flutter](https://img.shields.io/badge/Flutter-3.41%2B-02569B?logo=flutter&logoColor=white)](https://flutter.dev) [![Dart](https://img.shields.io/badge/Dart-3.11%2B-0175C2?logo=dart&logoColor=white)](https://dart.dev) [![Riverpod](https://img.shields.io/badge/Riverpod-2.6-1389FD)](https://riverpod.dev) [![Dio](https://img.shields.io/badge/Dio-HTTP-0175C2)](https://pub.dev/packages/dio) [![just_audio](https://img.shields.io/badge/just__audio-0.9-02569B)](https://pub.dev/packages/just_audio)

- Estado/navegación: Riverpod, GoRouter y generación de código.
- Red/modelos: Dio, Freezed, JSON Serializable y almacenamiento seguro.
- Audio: just_audio, audio_service, RxDart y permisos nativos.

## Comandos

Desde `apps/mobile/`:

```bash
flutter pub get
flutter run --dart-define-from-file=config/development.json
flutter analyze
flutter test
flutter test integration_test
flutter build apk --release --dart-define-from-file=config/production.json
```

Consulta [COMMANDS.md](../../COMMANDS.md) para release y diagnóstico.

## Video de la aplicación

<iframe width="560" height="315" src="https://www.youtube.com/embed/3bojp3Hu6b0?autoplay=1&mute=1&playsinline=1" title="MusicFlow Mobile" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>

[![Ver MusicFlow Mobile](https://img.youtube.com/vi/3bojp3Hu6b0/maxresdefault.jpg)](https://youtu.be/3bojp3Hu6b0)
