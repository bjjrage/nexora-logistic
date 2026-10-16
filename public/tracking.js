const states = Object.freeze({EXPECTED:'Pedido registrado',RECEIVED:'Recibido en depósito',LOADED:'Preparado para salir',IN_TRANSIT:'En camino',DELIVERED:'Entregado',RETURN_PENDING:'Entrega pendiente de resolución',RETURNED_TO_DEPOT:'De regreso en depósito',RETURNED_TO_SENDER:'Devuelto al remitente'});
const actions = Object.freeze({RECEIVED:'Recibido en depósito',LOADED:'Carga preparada',DISPATCHED:'Salió a reparto',DIRECT_PICKUP:'Retiro realizado',DELIVERED:'Entrega registrada',DELIVERY_FAILED:'Intento de entrega sin completar',RETURN_RECEIVED:'Devolución recibida en depósito',RETURNED_TO_SENDER:'Devuelto al remitente'});
export const normalizeCode = value => String(value ?? '').trim().toUpperCase();
export const validCode = value => /^B-[A-F0-9]{20}$/.test(normalizeCode(value));
export function orderStatus(counts) {
  const entries=Object.entries(counts || {}), total=entries.reduce((sum,[,n])=>sum+Number(n),0);
  if (!total) return 'Sin estado disponible';
  if (Number(counts.DELIVERED)===total) return states.DELIVERED;
  if (entries.some(([state,n])=>state.startsWith('RETURN') && Number(n)>0)) return 'Con devolución';
  if (Number(counts.DELIVERED)>0) return 'Entrega parcial';
  return states[['IN_TRANSIT','LOADED','RECEIVED','EXPECTED'].find(state=>Number(counts[state])>0)] || 'En proceso';
}
export async function lookupOrder(code,{config=globalThis.NEXORA_AUTH_CONFIG,fetcher=fetch,signal}={}) {
  if (!validCode(code)) throw new Error('invalid-code');
  if (!config?.supabaseUrl || !config?.publishableKey) throw new Error('unconfigured');
  const response=await fetcher(`${config.supabaseUrl}/rest/v1/rpc/track_order`,{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_code:normalizeCode(code)}),signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
  if (!response.ok) throw new Error('unavailable');
  const data=await response.json();
  if(data===null) return null;
  if(data?.code!==normalizeCode(code) || !data.counts || !Array.isArray(data.events)) throw new Error('invalid-response');
  return data;
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function date(value){const d=new Date(value);return Number.isNaN(d.getTime())?'Fecha no disponible':new Intl.DateTimeFormat('es-PY',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Asuncion'}).format(d);}
export function renderGps(gps,now=Date.now()) {
  if(!gps||gps.status==='INACTIVE')return '';
  const p=gps.position,age=p?now-Date.parse(p.measuredAt):Infinity;
  if(!['FRESH','STALE','NO_POSITION'].includes(gps.status)||!p||!Number.isFinite(p.latitude)||Math.abs(p.latitude)>90||!Number.isFinite(p.longitude)||Math.abs(p.longitude)>180||!Number.isFinite(age)||age < -60000||age>600000)
    return '<section class="tracking-gps"><h3>Ubicación aún no disponible</h3><p>El pedido está en reparto. Esperamos una medición reciente del vehículo.</p></section>';
  const stale=gps.status!=='FRESH'||age>180000;
  const bbox=[Math.max(-180,p.longitude-.012),Math.max(-90,p.latitude-.008),Math.min(180,p.longitude+.012),Math.min(90,p.latitude+.008)].join(',');
  return `<section class="tracking-gps"><h3>${stale?'Última ubicación · sin actualización reciente':'Vehículo de este bulto en reparto'}</h3><p>Medición: ${escape(date(p.measuredAt))}${stale?' · Puede haber perdido señal.':''}</p><iframe title="Ubicación del vehículo de este bulto" loading="lazy" referrerpolicy="no-referrer" style="width:100%;height:280px;border:0;border-radius:14px" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&amp;layer=mapnik&amp;marker=${p.latitude},${p.longitude}"></iframe><p class="tracking-note">La ubicación corresponde al vehículo asignado a este bulto. No indica una hora estimada de llegada.</p></section>`;
}
export function mountTracking(root) {
  const form=root.querySelector('form'),input=root.querySelector('input'),button=root.querySelector('button[type=submit]'),result=root.querySelector('#tracking-result');
  button.disabled=false;
  let controller,timer;
  const show=(title,copy)=>{result.innerHTML=`<h3>${escape(title)}</h3><p>${escape(copy)}</p>`;};
  const lookup=async(code,automatic=false)=>{
    clearTimeout(timer);controller?.abort();controller=new AbortController();const request=controller;
    if(!root.isConnected)return;
    if(automatic&&document.visibilityState==='hidden'){timer=setTimeout(()=>lookup(code,true),15000);return;}
    button.disabled=false;button.textContent='Rastrear pedido';result.removeAttribute('aria-busy');
    if(!validCode(code)){show('Revisá el código','Copiá el código completo de tu etiqueta o mensaje de Nexora: empieza con B- y tiene 20 letras y números después del guion.');input.focus();return;}
    button.disabled=true;button.textContent='Consultando…';result.setAttribute('aria-busy','true');if(!automatic)show('Buscando tu pedido','Estamos consultando su último estado registrado.');
    try {
      const data=await lookupOrder(code,{signal:request.signal});
      if(!root.isConnected || request!==controller)return;
      if(!data){show('No encontramos ese pedido','Revisá el código o consultá con quien te lo compartió.');return;}
      const total=Object.values(data.counts).reduce((sum,n)=>sum+Number(n),0);
      const timeline=[{action:'REGISTERED',at:data.createdAt},...data.events.filter(e=>actions[e.action])];
      result.innerHTML=`<div class="tracking-status"><span class="auth-eyebrow">ESTADO DEL PEDIDO</span><h3>${escape(orderStatus(data.counts))}</h3><p>${total} ${total===1?'bulto':'bultos'} · ${Number(data.counts.DELIVERED)||0} entregados</p></div>${renderGps(data.gps)}<ol class="tracking-timeline">${timeline.map(e=>`<li><strong>${escape(actions[e.action]||'Pedido registrado')}</strong><time>${escape(date(e.at))}</time></li>`).join('')}</ol><p class="tracking-note">Los estados se actualizan cuando Nexora registra un movimiento. Todas las horas corresponden a Paraguay.</p>`;
    } catch(error){if(error.name!=='AbortError' && root.isConnected)show('No pudimos consultar el pedido','Intentá nuevamente en unos momentos. Si continúa, contactá con Nexora.');}
    finally{if(request===controller){button.disabled=false;button.textContent='Rastrear pedido';result.removeAttribute('aria-busy');if(root.isConnected)timer=setTimeout(()=>lookup(code,true),15000);}}
  };
  form.addEventListener('submit',event=>{event.preventDefault();input.value=normalizeCode(input.value);void lookup(input.value);});
  input.addEventListener('input',()=>{clearTimeout(timer);controller?.abort();controller=null;result.replaceChildren();button.disabled=false;button.textContent='Rastrear pedido';result.removeAttribute('aria-busy');});
  const shared=new URLSearchParams(location.hash.slice(1)).get('codigo');
  if(shared){input.value=shared;form.requestSubmit();}
}

