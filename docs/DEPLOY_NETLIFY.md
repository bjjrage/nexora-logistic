# Actualizar la web de Netlify

Sitio: https://nexoralogisticpy.netlify.app, equipo corporativo `nexoralogisticpy`.

La publicación actual usa Netlify Drop. Un push a GitHub actualiza GitHub Pages, pero todavía no actualiza Netlify. No subir el sistema interno ni la carpeta completa del repositorio.

Desde la raíz de este repositorio público, preparar el build en PowerShell:

```powershell
npm.cmd run check
npm.cmd test
$env:BASE_PATH='/'
$env:SITE_ORIGIN='https://nexoralogisticpy.netlify.app'
$env:NETLIFY='true'
$env:CONTEXT='production'
$env:URL='https://nexoralogisticpy.netlify.app'
node scripts/build.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/package-netlify.ps1
```

El último comando imprime un ZIP nuevo de `artifacts/`, con únicamente el contenido de `dist/`. Usa rutas ZIP con `/`: `Compress-Archive` puede generar separadores de Windows que Netlify no interpreta como carpetas.

En [el proyecto de Netlify](https://app.netlify.com/projects/nexoralogisticpy/overview), usar **choose a file** y subir ese ZIP. Esperar a **Currently published Production**. Comprobar HTTP 200 en `/`, `/seguimiento/`, `/clientes/`, `/privacidad/`, `/tracking.js` y las imágenes. Probar el seguimiento sin sesión y el mensaje para códigos inexistentes.

Al finalizar, cerrar esa terminal o retirar las variables de entorno anteriores antes de generar una copia para GitHub Pages. No se necesitan secretos OAuth en el build: permanecen en Supabase.

El dominio de NIC.py tiene los nameservers de Netlify solicitados; falta comprobar propagación DNS y certificado. Hasta entonces usar la dirección Netlify.
