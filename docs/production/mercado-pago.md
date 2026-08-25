# Mercado Pago para MusicFlow Premium

MusicFlow mantendrá el plan Básico gratuito y ofrecerá Premium por `S/ 13.00
PEN` al mes. El cobro inicial se habilitará solo en web y usará el checkout
alojado de Mercado Pago mediante `/preapproval`; MusicFlow no capturará datos
de tarjeta. Mobile leerá el entitlement que confirme el backend.

Referencias: [suscripciones](https://www.mercadopago.com.pe/developers/es/docs/subscriptions/overview),
[credenciales](https://www.mercadopago.com.pe/developers/es/docs/your-integrations/credentials)
y [webhooks](https://www.mercadopago.com.pe/developers/es/docs/your-integrations/notifications/webhooks).

## Preparación de la cuenta

1. Completar y validar el perfil de vendedor de Mercado Pago Perú.
2. Crear MusicFlow en **Tus integraciones**.
3. Activar credenciales de prueba y producción.
4. Crear un plan asociado mensual de `S/ 13.00 PEN` para cada entorno.
5. Configurar una URL HTTPS pública de retorno.
6. Configurar el webhook HTTPS para `payment`, `subscription_preapproval` y
   `subscription_authorized_payment`.
7. Probar aprobación, rechazo, renovación, cancelación y eventos repetidos.

## Variables requeridas

```env
MERCADO_PAGO_TEST_ACCESS_TOKEN=
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_TEST_WEBHOOK_SECRET=
MERCADO_PAGO_WEBHOOK_SECRET=
MERCADO_PAGO_TEST_PREAPPROVAL_PLAN_ID=
MERCADO_PAGO_PREAPPROVAL_PLAN_ID=
```

Los access tokens y secretos de webhook son secretos de backend. Los IDs de
plan no deben usarse como credenciales. Para el checkout alojado inicial no se
requieren Public Key, Client ID ni Client Secret en el navegador.

## API futura

- `POST /api/billing/mercado-pago/subscription`: crea la suscripción y devuelve
  la URL alojada.
- `GET /api/billing/subscription`: devuelve el entitlement y estado actual.
- `POST /api/billing/mercado-pago/webhook`: verifica firma y procesa eventos.
- `POST /api/billing/subscription/cancel`: solicita cancelación.

El backend validará precio, moneda, plan y usuario; nunca confiará en valores
enviados por el frontend.

## Persistencia e idempotencia

`Subscription` guardará usuario, proveedor, identificador externo, estado,
periodo vigente, próxima renovación y cancelación. `BillingWebhookEvent`
guardará el identificador único del evento, tipo, fecha y resultado de proceso.
Una restricción única impedirá aplicar dos veces el mismo evento. `isPremium`
seguirá siendo el indicador rápido y solo se actualizará mediante eventos
firmados o reconciliación con el proveedor.

Los webhooks deben responder rápido, encolar trabajo pesado y tolerar entrega
fuera de orden. Un job diario reconciliará suscripciones pendientes o vencidas.

## Reglas de tiendas

La primera integración de Mercado Pago será web. Las aplicaciones móviles no
abrirán este checkout para vender una suscripción digital hasta confirmar una
excepción aplicable. Consultar las políticas vigentes de
[Google Play](https://support.google.com/googleplay/android-developer/answer/9858738)
y [Apple](https://developer.apple.com/app-store/review/guidelines/).
