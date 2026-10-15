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

El build utiliza `BASE_PATH=/nexora-logistic` y `SITE_ORIGIN=https://bjjrage.github.io` por defecto. El workflow adapta ambos valores al propietario y nombre del repositorio.

Para comprobar localmente el sitio generado con el mismo prefijo que GitHub Pages:

```powershell
node scripts/serve.mjs --dist --base /nexora-logistic --port 4174
```

Abrir http://localhost:4174/nexora-logistic/.

## Páginas

Inicio, Nosotros, Servicios, cuatro fichas de servicio, Cobertura, Novedades, tres artículos, Contacto, Clientes y Privacidad.

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
