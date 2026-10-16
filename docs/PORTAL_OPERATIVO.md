# Seguimiento de pedidos

La web corporativa consulta pedidos individuales en /seguimiento/, sin login. /clientes/ conserva los enlaces anteriores y muestra la misma pantalla. Las cuentas de clientes y su gestión pertenecen a Nexora OS.

El destinatario ingresa el código de un bulto recibido de Nexora. La consulta devuelve el estado del pedido completo, cantidad de bultos y fechas de movimientos. No muestra nombres, teléfonos, direcciones, notas internas ni comprobantes. Cualquier persona con el código puede ver esos estados; compartirlo únicamente con quienes participan en la entrega.

El OS genera los códigos y muestra los enlaces en el detalle de Envíos. La web consulta Supabase mediante una función limitada y una clave publicable; no recibe credenciales administrativas. Los registros de demostración locales no aparecen en la web. Sin un pedido real registrado, el código no devuelve resultados.

El seguimiento se actualiza al consultar nuevamente. Refleja movimientos registrados por Nexora; no ofrece ubicación GPS ni horarios estimados.

La configuración de Google anterior permanece conservada, pero no se utiliza para consultar pedidos en la web. Publicar la landing no publica el servidor privado del OS.
