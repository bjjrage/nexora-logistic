# Nexora Logistic

Web pública: https://nexoralogisticpy.netlify.app

Seguimiento público de pedidos: https://nexoralogisticpy.netlify.app/seguimiento/

Copia en GitHub Pages: https://bjjrage.github.io/nexora-logistic/

Repositorio: https://github.com/bjjrage/nexora-logistic

GitHub Actions actualiza automáticamente la copia de GitHub Pages con cada push a `main`. Netlify se publicó mediante Drop en la cuenta corporativa; los pushes todavía no actualizan Netlify automáticamente. Este repositorio contiene únicamente la web pública.

Web multipágina responsive en español, basada en la identidad y las referencias facilitadas. Proyecto independiente del resto del espacio de trabajo.

## Abrir en local

Requiere Node.js 22 o posterior. En PowerShell usar `npm.cmd` si la política de ejecución bloquea `npm.ps1`:

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run dev
```

Abrir http://localhost:4173/.

## Preparar los archivos de publicación

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run build
```

El resultado está en `dist/`, con archivos HTML independientes para 16 rutas. La biblioteca de Supabase se copia desde la dependencia fijada en el lockfile y se sirve localmente. El seguimiento consulta Supabase mediante un código de pedido, sin iniciar sesión.

El build utiliza `BASE_PATH=/nexora-logistic` y `SITE_ORIGIN=https://bjjrage.github.io` por defecto. El workflow toma el origen y la ruta directamente de la configuración de GitHub Pages, incluido el dominio personalizado cuando esté activado.

Dominio previsto: nexoralogistic.com.py. Los nameservers de Netlify fueron enviados a NIC.py; falta comprobar la propagación y el certificado HTTPS. Mientras tanto se usa la dirección Netlify.

Para comprobar localmente el sitio generado con el mismo prefijo que GitHub Pages:

```powershell
node scripts/serve.mjs --dist --base /nexora-logistic --port 4174
```

Abrir http://localhost:4174/nexora-logistic/.

## Páginas

Inicio, Nosotros, Servicios, cuatro fichas de servicio, Cobertura, Novedades, tres artículos, Contacto, Seguimiento, ruta de clientes anterior y Privacidad.

## Publicar en Netlify

Sitio público actual: https://nexoralogisticpy.netlify.app. Para actualizarlo manualmente, seguir [la guía de despliegue](docs/DEPLOY_NETLIFY.md). La web ofrece seguimiento de pedidos sin login; las cuentas de clientes pertenecen al OS.

### Conexión futura con GitHub

Importar `bjjrage/nexora-logistic` desde GitHub en el espacio de Nexora, seleccionando `main` como rama de producción y dejando vacío el directorio base. El archivo `netlify.toml` configura Node.js 24, el comando `npm run check && npm test && npm run build`, la carpeta de publicación `dist` y las rutas desde la raíz del dominio.

Netlify proporciona automáticamente `URL` y `DEPLOY_PRIME_URL`. El build usa la primera para los enlaces canónicos y el sitemap de producción, y la segunda en las vistas previas. Al conectar `nexoralogistic.com.py` como dominio principal, volver a desplegar para actualizar esos enlaces. `SITE_ORIGIN` permite sobrescribir el origen cuando sea necesario.

La web consulta pedidos individuales con códigos emitidos por el OS. Ver [seguimiento de pedidos](docs/PORTAL_OPERATIVO.md).

## Comportamientos incluidos

- Navegación e historial, menú móvil y estados de foco.
- Filtro por región, búsqueda sin distinción de tildes y selección de destinos en el mapa.
- Artículos filtrables, enlaces internos y copia del enlace para compartir.
- Preguntas frecuentes desplegables.
- Formulario con validación, resumen editable, descarga TXT y preparación de correo `mailto:`. No envía datos a un servidor ni afirma que el correo fue enviado.
- Seguimiento por código: estados, bultos y fechas reales, sin datos de demostración ni login. Ver [la guía operativa](docs/PORTAL_OPERATIVO.md).

## Antes del lanzamiento comercial

Confirmar el correo `info@nexoralogistic.com`, los servicios y las condiciones de cobertura con la empresa. No se incluyen los números de teléfono de muestra de los folletos. Si se requiere recepción automática de cotizaciones, integrar el proveedor correspondiente y actualizar la privacidad.

## Recursos

- Logo y material de marca: archivos facilitados por el usuario, conservados sin rediseñar.
- Imagen principal: fotografía ilustrativa generada para esta web, con la identidad Nexora.
- Foto de almacén: Unsplash (`photo-1586528116311-ad8dd3c8310d`). Es una imagen ilustrativa, no una fotografía verificada de instalaciones de Nexora. Las imágenes de logística integral y documentación proceden del material de marca facilitado.
- Tipografías locales: Manrope e Inter, Google Fonts, licencias OFL.
- Iconos locales: Lucide 0.468.0, licencia ISC, cabecera de licencia conservada en `public/vendor/lucide.js`.
- Supabase JS 2.118.0, versión exacta y licencia MIT copiada en el build.
- Contorno geográfico: `johan/world.geo.json`, archivo PRY.geo.json, derivado a SVG.

Las fotos, los iconos y las fuentes se sirven desde el propio sitio. `scripts/download-assets.mjs` permite reproducir las descargas iniciales y requiere conexión.
