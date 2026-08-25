# Notificaciones Push

MusicFlow mantiene temporalmente su proveedor actual y no cambia jobs, tokens,
CI ni el esquema de dispositivos en esta fase. La abstracción funcional debe
seguir hablando de tokens y entrega push, sin acoplar documentación de producto
a una marca concreta.

## Evaluación de alternativas

- OneSignal reduce trabajo de segmentación, paneles y campañas, pero todavía
  depende del transporte del sistema operativo en Android y de APNs en iOS.
- Un proveedor administrado equivalente simplifica reintentos y métricas, pero
  añade costo, dependencia externa y requisitos de privacidad.
- Un servicio propio puede controlar reglas y datos, aunque no reemplaza los
  transportes nativos de Android/iOS y aumenta la carga operativa.
- Cloudflare R2 almacena objetos; no puede entregar notificaciones push.

Antes de sustituir el runtime se medirán entrega, latencia, costo, soporte de
deep links, consentimiento, borrado de tokens e integración con APNs. Cualquier
migración requerirá rotación gradual y convivencia de tokens para no perder
dispositivos activos.
