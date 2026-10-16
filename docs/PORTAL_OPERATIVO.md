# Portal conectado al OS

El portal usa Google/Supabase para identificar al cliente y consulta las operaciones del sistema Nexora OS. No contiene envíos de demostración ni usa datos locales de ejemplo como alternativa cuando una consulta falla.

## Habilitar una empresa

1. En la instalación real de Nexora OS (`http://127.0.0.1:5173` mientras no tenga hosting propio), completar el alta inicial de Administración si todavía aparece la pantalla de configuración.
2. Crear el cliente real en el OS.
3. Pedir que esa persona ingrese con Google en `https://nexoralogisticpy.netlify.app/clientes/`.
4. Como Administración, abrir Inventario → Accesos de cliente → **Portal web · Acceso con Google**. Seleccionar el cliente y su correo; pulsar **Habilitar acceso Google**.
5. La persona vuelve al portal o recarga. Ve únicamente los envíos y comprobantes de ese cliente.

Las cuentas sin asignación siguen pendientes; las suspendidas no pueden consultar operaciones. No se asignan empresas por dominio de correo ni por datos editables de Google. El servidor del OS comprueba el rol ADMIN y la organización antes de otorgar o suspender el acceso.

Al verificar esta entrega, la base real no tenía organizaciones, clientes ni envíos: su alta y la asignación del primer correo son pasos necesarios para usarla con operaciones reales.

## Funciones

- **Mis envíos:** hasta 500 envíos recientes del cliente, búsqueda por referencia/código/ruta, bultos y sus estados efectivos, detalle e historial de custodia.
- **Documentos:** hasta 500 comprobantes ligados a bultos propios, descargados desde la base privada mediante una consulta autorizada. Sin comprobantes cargados, muestra un estado vacío.
- **Resumen:** conteos calculados desde esos registros, incluidas entregas parciales y devoluciones.
- **Solicitar envío:** guarda referencia, origen, destino, destinatario, teléfono y cantidad de bultos en la base de datos. La solicitud permanece pendiente hasta su aceptación por Nexora.
- En el OS, Administración ve las solicitudes de sus clientes y puede pulsar **Crear envío**. Genera envío y bultos reales con la misma lógica del sistema; los reintentos no duplican el envío. Esto no confirma una ruta ni una entrega automáticamente.

Los estados operativos cambian al registrar recepción, carga, despacho, entrega o devolución en el OS. El botón Actualizar consulta la base nuevamente. No se afirma seguimiento GPS ni confirmación de entrega sin registros reales.

## Seguridad y alojamiento

Cada cuenta accede a la empresa que Nexora le asigna. Las cuentas suspendidas no consultan operaciones. El alojamiento de la web es independiente de la instalación interna de Nexora OS. La configuración y las pruebas de base de datos se conservan en el proyecto privado.
