# Activar Google para el portal de Nexora

La integración usa Supabase Auth con PKCE. Google identifica al usuario; Nexora habilita su empresa en la base de datos. Una cuenta nueva queda pendiente hasta recibir esa habilitación.

## 1. Publicar en Netlify

Importar `bjjrage/nexora-logistic`, rama `main`, en la cuenta de Netlify de Nexora. `netlify.toml` prepara el build. Netlify instala las dependencias y sirve `dist/`.

Anotar la URL HTTPS de producción que entregue Netlify. El build usa automáticamente `URL` como origen del login. Las vistas previas remiten al portal de producción. GitHub Pages muestra el aviso de preparación y no inicia sesiones: sus repositorios comparten el mismo origen del navegador.

## 2. Crear el cliente OAuth en Google

Entrar con la cuenta corporativa en [Google Auth Platform](https://console.cloud.google.com/auth/clients) y crear o seleccionar un proyecto de Nexora.

1. Completar Branding: nombre Nexora Logistic, correo de soporte y contacto de Nexora.
2. Elegir audiencia externa si accederán clientes de otras empresas. Mientras la aplicación esté en Testing, agregar las cuentas con las que se probará el acceso.
3. Configurar únicamente `openid`, `https://www.googleapis.com/auth/userinfo.email` y `https://www.googleapis.com/auth/userinfo.profile`.
4. Crear un cliente OAuth de tipo **Web application**, llamado «Nexora portal web».
5. En **Authorized JavaScript origins**, poner el origen HTTPS de producción de Netlify, sin `/clientes/`.
6. En **Authorized redirect URIs**, poner exactamente:

```text
https://pnaqjenemmfydetkpokk.supabase.co/auth/v1/callback
```

Guardar el Client ID y el Client Secret para cargarlos en el siguiente paso. El Secret no se pega en el chat, el repositorio, archivos públicos ni variables del frontend.

## 3. Habilitar Google en Supabase

En [Google provider de Nexora](https://supabase.com/dashboard/project/pnaqjenemmfydetkpokk/auth/providers?provider=Google), habilitar Google, cargar Client ID y Client Secret y guardar. Mantener las comprobaciones de seguridad del proveedor.

En Authentication → URL Configuration:

- **Site URL:** el origen HTTPS de producción.
- **Redirect URLs:** la misma dirección, seguida de `/clientes/` y con la barra final. Por ejemplo, `https://TU-SITIO.netlify.app/clientes/`.
- Para probar en local, agregar temporalmente `http://localhost:4173/clientes/` y `http://localhost:4174/clientes/`. Retirarlas cuando termine la prueba. No autorizar todas las vistas previas con un comodín.

No se necesita Client Secret en Netlify. `public/auth-config.js` contiene únicamente el URL del proyecto y su clave pública publishable. Las tablas están protegidas por RLS y permisos de solo lectura para clientes.

## 4. Probar y habilitar una empresa

Abrir `/clientes/` en producción e ingresar con Google. La primera entrada debe mostrar «Falta un paso». En Supabase → Authentication → Users, verificar la cuenta y copiar su UUID.

En el SQL Editor, como administrador de Nexora, crear la empresa:

```sql
insert into public.portal_companies (name)
values ('NOMBRE REAL DE LA EMPRESA')
returning id;
```

Usar ese ID y el UUID verificado del usuario:

```sql
insert into public.portal_memberships (user_id, company_id, status)
values ('UUID_DEL_USUARIO', 'UUID_DE_LA_EMPRESA', 'active');
```

Para agregar otra persona de la misma empresa, crear otra membresía con el mismo `company_id`. Cada persona tiene una empresa asignada en esta versión. La cuenta no se habilita por dominio de email ni por datos editables del perfil de Google.

Para pausar una cuenta, cambiar su membresía a `status = 'suspended'`. Para pausar una empresa completa, cambiar `portal_companies.active` a `false`. La siguiente consulta del portal comprobará el nuevo permiso. Cerrar y volver a abrir sesión para comprobarlo visualmente.

El portal muestra la identidad y la empresa habilitada. Los envíos, documentos y reportes operativos todavía requieren una integración de datos; no se publican datos del sistema interno.

## 5. Conectar el dominio

Cuando `nexoralogistic.com.py` tenga DNS y HTTPS funcionando en Netlify, establecerlo como dominio principal y volver a desplegar. Comprobar el origen generado en `dist/auth-config.js`.

Actualizar Site URL y Redirect URLs en Supabase a `https://nexoralogistic.com.py` y `https://nexoralogistic.com.py/clientes/`. Agregar el nuevo origen en Google. Conservar el origen anterior solo durante la transición. Una sesión del dominio Netlify no se comparte con el nuevo dominio: habrá que ingresar otra vez.

## Verificación técnica

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run check
npm.cmd test
npm.cmd run build
```

Las 12 pruebas cubren identidad verificada, cuentas pendientes y suspendidas, errores de permisos, configuración y el URL OAuth generado por el SDK real con PKCE. `supabase/tests/portal_access.sql` verifica la separación entre empresas con roles reales de Postgres y revierte todos sus datos de prueba; ejecutar el archivo completo en una sola consulta.

La migración `portal_customer_access` ya se aplicó al proyecto `pnaqjenemmfydetkpokk` de la organización Nexora. No volver a ejecutar el SQL de creación sobre ese proyecto. La auditoría de seguridad no encontró avisos. El índice de empresa se conserva para la clave foránea; el aviso informativo de índice todavía no usado es esperable en una base vacía.

La prueba completa de ida a Google y regreso debe realizarse después de configurar el proveedor y las URLs. No se verificó un login real antes de disponer de esas credenciales.

Referencias: [Google en Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [aviso de índice no usado](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).
