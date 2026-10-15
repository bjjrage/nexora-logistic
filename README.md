# Nexora Logistic

Web pública: https://bjjrage.github.io/nexora-logistic/

Repositorio: https://github.com/bjjrage/nexora-logistic

GitHub Actions genera y publica automáticamente la web con cada actualización de `main`. Este repositorio contiene únicamente la landing pública.

Web multipágina responsive en español, basada en la identidad y las referencias facilitadas. Proyecto independiente del resto del espacio de trabajo.

## Abrir en local

Requiere Node.js 22 o posterior, sin instalación de dependencias:

```powershell
node scripts/serve.mjs --port 4173
```

Abrir http://localhost:4173/.

## Preparar los archivos de publicación

```powershell
node --check public/app.js
node scripts/build.mjs
```

El resultado está en `dist/`, con archivos HTML independientes para 15 rutas. El desarrollo comparte la navegación, la cabecera, el pie y las plantillas mediante JavaScript sin dependencias de ejecución externas.

El build utiliza `BASE_PATH=/nexora-logistic` y `SITE_ORIGIN=https://bjjrage.github.io` por defecto. El workflow toma el origen y la ruta directamente de la configuración de GitHub Pages, incluido el dominio personalizado cuando esté activado.

Dominio previsto: `nexoralogistic.com.py`. Para activarlo, primero hay que configurar su proveedor DNS: actualmente NIC.py lo delega a `dns1pendiente.nic.py` y `dns2pendiente.nic.py`. La dirección de GitHub Pages se mantiene activa mientras se prepara la delegación.

Para comprobar localmente el sitio generado con el mismo prefijo que GitHub Pages:

```powershell
node scripts/serve.mjs --dist --base /nexora-logistic --port 4174
```

Abrir http://localhost:4174/nexora-logistic/.

## Páginas

Inicio, Nosotros, Servicios, cuatro fichas de servicio, Cobertura, Novedades, tres artículos, Contacto, Clientes y Privacidad.

## Publicar en Netlify

Importar `bjjrage/nexora-logistic` desde GitHub en el espacio de Nexora, seleccionando `main` como rama de producción y dejando vacío el directorio base. El archivo `netlify.toml` configura Node.js 24, el comando `npm run check && npm run build`, la carpeta de publicación `dist` y las rutas desde la raíz del dominio.

Netlify proporciona automáticamente `URL` y `DEPLOY_PRIME_URL`. El build usa la primera para los enlaces canónicos y el sitemap de producción, y la segunda en las vistas previas. Al conectar `nexoralogistic.com.py` como dominio principal, volver a desplegar para actualizar esos enlaces. `SITE_ORIGIN` permite sobrescribir el origen cuando sea necesario.

El portal publicado sigue siendo una demostración; la autenticación y los datos de clientes requieren su integración independiente.

## Comportamientos incluidos

- Navegación e historial, menú móvil y estados de foco.
- Filtro por región, búsqueda sin distinción de tildes y selección de destinos en el mapa.
- Artículos filtrables, enlaces internos y copia del enlace para compartir.
- Preguntas frecuentes desplegables.
- Formulario con validación, resumen editable, descarga TXT y preparación de correo `mailto:`. No envía datos a un servidor ni afirma que el correo fue enviado.
- Portal de demostración con tres envíos ficticios, búsqueda, detalle de seguimiento, documentos descargables y resumen. No implementa autenticación ni seguimiento real.

## Antes del lanzamiento comercial

Confirmar el correo `info@nexoralogistic.com`, los servicios y las condiciones de cobertura con la empresa. No se incluyen los números de teléfono de muestra de los folletos. Si se requiere recepción automática de cotizaciones o acceso corporativo, integrar el proveedor correspondiente y actualizar la privacidad.

## Recursos

- Logo y material de marca: archivos facilitados por el usuario, conservados sin rediseñar.
- Imagen principal: fotografía ilustrativa generada para esta web, con la identidad Nexora.
- Foto de almacén: Unsplash (`photo-1586528116311-ad8dd3c8310d`). Es una imagen ilustrativa, no una fotografía verificada de instalaciones de Nexora. Las imágenes de logística integral y documentación proceden del material de marca facilitado.
- Tipografías locales: Manrope e Inter, Google Fonts, licencias OFL.
- Iconos locales: Lucide 0.468.0, licencia ISC, cabecera de licencia conservada en `public/vendor/lucide.js`.
- Contorno geográfico: `johan/world.geo.json`, archivo PRY.geo.json, derivado a SVG.

Las fotos, los iconos y las fuentes se sirven desde el propio sitio. `scripts/download-assets.mjs` permite reproducir las descargas iniciales y requiere conexión.
