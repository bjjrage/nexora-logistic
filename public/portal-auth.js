const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const moduleBase = new URL('.', import.meta.url);
let clientPromise;
let subscription;
let revision = 0;

// Authentication is verified with Supabase; authorization comes only from RLS-backed membership.
export async function readPortalAccess(client) {
  const sessionResult = await client.auth.getSession();
  if (sessionResult.error) throw sessionResult.error;
  if (!sessionResult.data.session) return {kind:'signed-out'};
  const userResult = await client.auth.getUser();
  if (userResult.error || !userResult.data.user) throw new Error('Unable to verify session');
  const user = userResult.data.user;
  if (user.id !== sessionResult.data.session.user.id) throw new Error('Session identity mismatch');
  const memberResult = await client.from('portal_memberships').select('user_id, company_id, status').eq('user_id', user.id).maybeSingle();
  if (memberResult.error) throw memberResult.error;
  const member = memberResult.data;
  if (!member) return {kind:'pending', user};
  if (member.user_id !== user.id) throw new Error('Membership identity mismatch');
  if (member.status !== 'active') return {kind:'suspended', user};
  const companyResult = await client.from('portal_companies').select('id, name, active').eq('id', member.company_id).maybeSingle();
  if (companyResult.error) throw companyResult.error;
  const company = companyResult.data;
  if (!company || !company.active) return {kind:'suspended', user};
  if (company.id !== member.company_id) throw new Error('Company identity mismatch');
  return {kind:'active', user, company};
}

export function validateConfig(config) {
  if (!config || !/^sb_publishable_[\w-]+$/.test(config.publishableKey ?? '')) throw new Error('Missing publishable key');
  const api = new URL(config.supabaseUrl);
  const login = new URL(config.loginOrigin);
  if (api.protocol !== 'https:' || api.pathname !== '/' || api.search || api.hash || api.username || api.password) throw new Error('Invalid API origin');
  if (login.protocol !== 'https:' || login.pathname !== '/' || login.search || login.hash || login.username || login.password) throw new Error('Invalid login origin');
  return {...config, supabaseUrl:api.origin, loginOrigin:login.origin};
}

export async function googleOAuthUrl(client, callback, apiOrigin) {
  const {data,error} = await client.auth.signInWithOAuth({
    provider:'google',
    options:{redirectTo:callback, skipBrowserRedirect:true, queryParams:{prompt:'select_account'}},
  });
  if (error) throw error;
  const target = new URL(data.url);
  if (target.origin !== apiOrigin || target.pathname !== '/auth/v1/authorize') throw new Error('Unexpected authentication destination');
  return target.href;
}

function heading(title, text, symbol = 'shield-check') {
  return `<div class="auth-symbol"><i data-lucide="${symbol}" aria-hidden="true"></i></div><span class="auth-eyebrow">PORTAL DE CLIENTES</span><h2>${title}</h2><p>${text}</p>`;
}
function icons(root) { if (window.lucide) window.lucide.createIcons({root, attrs:{'stroke-width':1.6}}); }
function paint(root, html) { root.innerHTML = html; icons(root); }
function helpLink() { return `<a class="text-link" href="${new URL('contacto/',moduleBase).href}">Contactá con Nexora <i data-lucide="arrow-up-right" aria-hidden="true"></i></a>`; }
function notice(root, text) { const node = root.querySelector('[data-auth-notice]'); if (node) {node.textContent = text; node.hidden = !text;} }
function cleanCallback() {
  const url = new URL(location.href);
  let changed = false;
  for (const key of ['code','error','error_code','error_description']) if (url.searchParams.has(key)) {url.searchParams.delete(key);changed=true;}
  if (/^#(?:access_token|error|refresh_token|token_type)=/.test(url.hash)) {url.hash='';changed=true;}
  if (changed) history.replaceState(history.state,'',url.pathname+url.search+url.hash);
}
function sdk() {
  if (window.supabase?.createClient) return Promise.resolve(window.supabase);
  return new Promise((resolve,reject) => {
    const script = document.createElement('script');
    script.src = new URL('vendor/supabase.js',moduleBase).href;
    script.onload = () => window.supabase?.createClient ? resolve(window.supabase) : reject(new Error('SDK unavailable'));
    script.onerror = () => {script.remove();reject(new Error('SDK failed to load'));};
    document.head.append(script);
  });
}
async function getClient(config) {
  if (!clientPromise) clientPromise = sdk().then(library => library.createClient(config.supabaseUrl,config.publishableKey,{
    auth:{flowType:'pkce', detectSessionInUrl:true, persistSession:true, autoRefreshToken:true, storageKey:'nexora-customer-session'},
  })).catch(error => {clientPromise=undefined;throw error;});
  const client = await clientPromise;
  if (!subscription) subscription = client.auth.onAuthStateChange(event => {
    if (event !== 'INITIAL_SESSION') setTimeout(() => {
      const root = document.querySelector('#customer-auth-root');
      if (root) void mountPortal(root);
    },0);
  }).data.subscription;
  return client;
}
async function googleEnabled(config) {
  const response = await fetch(`${config.supabaseUrl}/auth/v1/settings`,{headers:{apikey:config.publishableKey},signal:AbortSignal.timeout(12000)});
  if (!response.ok) throw new Error('Auth settings unavailable');
  return (await response.json()).external?.google === true;
}
const googleMark = `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.24 5.48-4.76 7.18l7.73 6C44.42 38.02 46.98 31.88 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.28-3.13.78-4.59l-7.97-6.19A23.77 23.77 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>`;

function signInView(root, client, config, enabled, callbackFailed) {
  paint(root, `${heading('Tu cuenta.<br>Todo más cerca.','Identificate con Google para acceder al portal de Nexora.')}<button type="button" class="google-login" data-google-login ${enabled?'':'disabled'}>${googleMark}<span>Continuar con Google</span></button><p class="auth-notice" data-auth-notice role="alert" ${callbackFailed?'':'hidden'}>${callbackFailed?'No pudimos completar el acceso. Volvé a intentarlo.':''}</p>${!enabled?'<div class="auth-availability" role="status">Estamos preparando el acceso con Google. Si necesitás asistencia, contactá con nuestro equipo.</div>':''}<p class="auth-consent">Usamos tu nombre y correo para identificarte. Nexora habilita el acceso a la empresa que te corresponde.</p><a class="auth-privacy" href="${new URL('privacidad/',moduleBase).href}">Cómo cuidamos tus datos</a><div class="auth-card-footer">${helpLink()}</div>`);
  root.querySelector('[data-google-login]').addEventListener('click',async event => {
    const button = event.currentTarget;
    button.disabled = true;
    button.querySelector('span').textContent = 'Conectando con Google…';
    notice(root,'');
    try {
      const target = await googleOAuthUrl(client,new URL('clientes/',moduleBase).href,config.supabaseUrl);
      window.location.assign(target);
    } catch {
      button.disabled=false;
      button.querySelector('span').textContent='Continuar con Google';
      notice(root,'No pudimos iniciar el acceso. Volvé a intentarlo en unos momentos.');
    }
  });
}
function accountView(root, client, state) {
  const email = escapeHtml(state.user.email);
  let content;
  if (state.kind === 'active') {
    content = `${heading('Bienvenido a Nexora.','Tu acceso está habilitado. Nuestro equipo está cerca para acompañar tu operación.','circle-check')}<div class="auth-account"><span>EMPRESA</span><strong>${escapeHtml(state.company.name)}</strong><span>CUENTA</span><p>${email}</p></div><div class="auth-availability">Por el momento, coordiná tus envíos y documentos directamente con nuestro equipo.</div>`;
  } else if (state.kind === 'suspended') {
    content = `${heading('Tu acceso está pausado.','Contactá con Nexora para revisar la habilitación de tu cuenta.','shield-alert')}<div class="auth-account"><span>CUENTA</span><p>${email}</p></div>`;
  } else {
    content = `${heading('Ya te identificaste.<br>Falta un paso.','Nuestro equipo debe vincular tu cuenta con tu empresa para habilitar el acceso.','user-round-check')}<div class="auth-account"><span>CUENTA DE GOOGLE</span><p>${email}</p></div><div class="auth-availability">Compartí este correo con tu contacto de Nexora para solicitar la habilitación.</div>`;
  }
  paint(root,`${content}<p class="auth-notice" data-auth-notice role="alert" hidden></p><div class="auth-card-footer">${helpLink()}<button type="button" class="auth-signout" data-signout><i data-lucide="log-out" aria-hidden="true"></i> Cerrar sesión</button></div>`);
  root.querySelector('[data-signout]').addEventListener('click',async event => {
    const button = event.currentTarget;
    button.disabled=true;
    try {
      const {error} = await client.auth.signOut({scope:'local'});
      if (error) throw error;
      await mountPortal(root);
    } catch {
      button.disabled=false;
      notice(root,'No pudimos cerrar la sesión. Revisá tu conexión y volvé a intentarlo.');
    }
  });
}

export async function mountPortal(root) {
  const currentRevision = ++revision;
  const current = () => root.isConnected && currentRevision === revision && document.querySelector('#customer-auth-root') === root;
  paint(root,`${heading('Conectando tu cuenta.','Estamos comprobando el acceso.')}<div class="auth-loading" role="status"><span></span> Un momento…</div>`);
  try {
    const config = validateConfig(window.NEXORA_AUTH_CONFIG);
    const development = ['http://localhost:4173','http://localhost:4174','http://127.0.0.1:4173','http://127.0.0.1:4174'].includes(location.origin);
    if (location.origin !== config.loginOrigin && !development) {
      paint(root,config.portalPublished
        ? `${heading('Tu acceso a Nexora.','El acceso de clientes está disponible desde el portal principal.')}<a class="button button-navy button-full" href="${escapeHtml(config.loginOrigin)}/clientes/">Ir al portal de clientes <i data-lucide="arrow-up-right" aria-hidden="true"></i></a><div class="auth-card-footer">${helpLink()}</div>`
        : `${heading('Más cerca.<br>Muy pronto.','Estamos preparando el acceso de clientes. Contactá con el equipo de Nexora para recibir asistencia.')}<div class="auth-card-footer">${helpLink()}</div>`);
      return;
    }
    const callbackFailed = new URL(location.href).searchParams.has('error');
    const client = await getClient(config);
    const state = await readPortalAccess(client);
    if (!current()) return;
    cleanCallback();
    if (state.kind === 'signed-out') {
      const enabled = await googleEnabled(config);
      if (current()) signInView(root,client,config,enabled,callbackFailed);
    } else accountView(root,client,state);
  } catch {
    if (!current()) return;
    cleanCallback();
    paint(root,`${heading('No pudimos comprobar<br>tu acceso.','Revisá tu conexión y volvé a intentarlo.','wifi-off')}<button type="button" class="button button-navy button-full" data-retry>Volver a intentar</button><div class="auth-card-footer">${helpLink()}</div>`);
    root.querySelector('[data-retry]').addEventListener('click',() => void mountPortal(root));
  }
}
