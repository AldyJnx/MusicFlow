# Google Cast en MusicFlow

MusicFlow usa un Styled Media Receiver con Application ID `47AE1B10`. El
sender está integrado en Android e iOS mediante Flutter y en web mediante el
Web Sender SDK oficial, cargado dinámicamente. El ID es público, pero debe
centralizarse por entorno. La integración de código no sustituye la prueba con
un receiver físico ni la publicación o registro de dispositivos en Cast
Console.

Referencias oficiales: [Web Sender](https://developers.google.com/cast/docs/web_sender/integrate),
[tipos de receiver](https://developers.google.com/cast/docs/web_receiver),
[registro de dispositivos](https://developers.google.com/cast/docs/registration)
y [medios soportados](https://developers.google.com/cast/docs/media).

## Configuración

- Mobile: `CAST_RECEIVER_APP_ID` en
  `apps/mobile/config/development.json`, usando
  `--dart-define-from-file=config/development.json`.
- iOS: el servicio Bonjour específico del receiver también figura en
  `apps/mobile/ios/Runner/Info.plist`. Si cambia el Application ID, debe
  actualizarse `_47AE1B10._googlecast._tcp` en ese archivo.
- Web: `VITE_CAST_RECEIVER_APP_ID` en `apps/web/.env.development` y
  `apps/web/.env.production`.
- Web staging/producción: definir `VITE_CAST_RECEIVER_APP_ID` durante el build.
- CI mobile: variable pública `CAST_RECEIVER_APP_ID` en el entorno de GitHub.

Web no importa la configuración de mobile. Ambos reciben el mismo valor desde
sus propios entornos para evitar acoplamiento entre aplicaciones.

## Funcionamiento web

- El icono aparece únicamente en Chrome/Chromium, en un contexto seguro y
  cuando la red anuncia al menos un dispositivo compatible.
- Al conectar, MusicFlow pausa el audio local y envía la URL HTTPS, MIME,
  título, artista, portada, duración y posición actual.
- Play, pausa, volumen, silencio y seek se dirigen al reproductor remoto.
- Siguiente y anterior conservan la cola de MusicFlow y cargan la pista remota.
- Al desconectar se conserva la canción y posición, pero el audio local queda
  pausado para evitar reproducción inesperada.
- Electron y Chrome en iOS no forman parte del soporte web inicial.

## Receiver y dispositivos de prueba

Mientras el receiver figure como no publicado, solo funcionará en dispositivos
registrados en Cast Console. Computadora, teléfono y receiver deben compartir
la misma red Wi-Fi. Tras registrar el serial, esperar hasta que figure listo y
reiniciar físicamente el dispositivo.

La verificación estática confirma inicialización, descubrimiento, selector,
conexión y carga de audio remoto en Android/iOS. La certificación funcional
queda pendiente hasta ejecutar el flujo en un Chromecast o Google TV
registrado, porque esa disponibilidad no se puede simular con fidelidad desde
el analizador de Flutter.

Antes de producción:

1. Probar reproducción, pausa, seek, siguiente, anterior y reconexión en un
   Chromecast o Google TV registrado.
2. Registrar el dominio HTTPS definitivo como sender web.
3. Publicar el receiver desde Cast Console.
4. Validar desconexión, cambio de red, TV apagada y sesión reanudada.

## Entrega de medios

- Audio y portadas deben ser públicos por HTTPS para el receiver.
- R2 debe aceptar `GET`, `HEAD` y byte ranges, con CORS correcto.
- Cada objeto debe responder con su MIME real, incluido `audio/wav`.
- Conviene disponer de AAC o FLAC alternativo cuando un WAV exceda los límites
  del receiver.

La EQ y la segmentación aplicadas en el navegador o teléfono no viajan al TV.
Eso requeriría un Custom Receiver con procesamiento propio o audio procesado
por backend y queda fuera de esta fase.
