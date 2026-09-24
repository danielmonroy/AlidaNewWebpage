# Inventario de cookies (producción)

Revisión del 24 de septiembre de 2026, en Chrome, incluido un inicio de sesión de prueba. No aparecieron cookies adicionales. Primero el sitio `alida.health`; desde `_alida_session`, la aplicación `app.alidahealth.com`.

| Dominio donde se carga | Nombre | Proveedor | Dominio de la cookie | Finalidad | Duración observada | Datos | Destinatario | Consentimiento |
|---|---|---|---|---|---|---|---|---|
| `alida.health` | `_ga` | Google | `.alida.health` | Distinguir navegadores | 400 días. Google las fija en 2 años; Chrome las acorta | Código aleatorio del navegador. Sin correo ni nombre | Google, Estados Unidos | Se puede rechazar |
| `alida.health` | `_ga_*` | Google Analytics 4 | `.alida.health` | Recordar la visita. El asterisco es el id de medición de Google | 400 días. Google las fija en 2 años; Chrome las acorta | Página, origen, navegador, idioma, pantalla y zona aproximada por IP. Sin correo ni nombre | Google, Estados Unidos | Se puede rechazar |
| `alida.health` | `ph_*_posthog` | PostHog | `.alida.health` | Distinguir navegadores | 365 días | Código aleatorio del navegador y de la sesión, página, origen, navegador, dispositivo, IP y campaña del enlace (UTM, `gclid`, `fbclid`, `msclkid`). Sin correo ni nombre | PostHog, Estados Unidos | Se puede rechazar |
| `alida.health` | `_fbp` | Meta, píxel `1014209211096748` | `.alida.health` | Medir campañas | 90 días | Código aleatorio del navegador y página visitada. Sin correo ni nombre | Meta, Estados Unidos | Se puede rechazar |
| `app.alidahealth.com` | `_alida_session` | Alida | `app.alidahealth.com` (solo ese dominio) | Mantener la sesión | Sesión del navegador. La página no puede leerla | Clave técnica de la sesión. Sin nombre ni expediente | Alida | Necesaria |
| `app.alidahealth.com` | `ph_*_posthog` | PostHog | `.alidahealth.com` | Distinguir navegadores. Con sesión iniciada, asociarlos a la cuenta | 365 días | Código aleatorio del navegador y de la sesión. Con sesión iniciada el código pasa a ser el correo, y también se envían nombre, id de usuario e id de clínica | PostHog, Estados Unidos | Se puede rechazar |
| `app.alidahealth.com` | `_fbp` | Meta, píxel `1014209211096748` | `.alidahealth.com` | Medir campañas | 90 días | Código aleatorio del navegador y página. En el registro: inicio y alta de cuenta, y huella del correo (no legible) | Meta, Estados Unidos | Se puede rechazar |

## PostHog entre el sitio y la aplicación

Sí los enlaza. No comparten cookie: cada dominio guarda la suya. Al hacer click en el inicio hacia la aplicación, la dirección lleva el código aleatorio del navegador y el de la sesión. La aplicación los adopta y luego los quita de la URL.

No se enlaza si la persona ya había iniciado sesión o si escribe la dirección de la aplicación. Pasadas 24 horas se conserva ese código y no la sesión.

## Google Analytics en areas autenticadas

No carga en areas autenticadas. Solo se carga en `alida.health`. No se carga en `app.alidahealth.com`, ni en el inicio de sesión ni con la sesión iniciada. En la prueba no apareció su cookie. No recibe correo, nombre ni expediente.

## Servidores fuera de México

- Amazon Web Services, Oregón (Estados Unidos): aplicación, base de datos, archivos y correo.
- PostHog, Estados Unidos: medición.
- Google, Estados Unidos: analítica, inicio de sesión con Google y mapas.
- Meta, Estados Unidos: medición de campañas.
- Stripe, Estados Unidos: pago.
- Twilio, Estados Unidos: WhatsApp.
- New Relic, Estados Unidos: rendimiento de la aplicación.
- Cloudflare: sitio y verificación de que no es un robot.
- OpenAI, Estados Unidos: resumen clínico, solo si la clínica lo activa.

## Análisis de datos

A futuro queremos analizar datos médicos agregados. Por ejemplo, enfermedades más frecuentes o tipos de lentes. Sin nombre, correo, teléfono ni domicilio.

Ese tipo de conteo se haría en nuestro sistema. Usar un modelo de IA no está definido. Si se usara, sería uno de un proveedor grande, como Anthropic u OpenAI.
