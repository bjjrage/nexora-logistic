const base = new URL('.', import.meta.url);
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const date = value => new Date(value).toLocaleString('es-PY',{timeZone:'America/Asuncion',dateStyle:'short',timeStyle:'short'});
export const normalize = value => String(value).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
const states = {EXPECTED:'Pendiente de retiro',RECEIVED:'En depósito',LOADED:'Cargado',IN_TRANSIT:'En camino',DELIVERED:'Entregado',RETURN_PENDING:'Devolución pendiente',RETURNED_TO_DEPOT:'Devuelto al depósito',RETURNED_TO_SENDER:'Devuelto al remitente'};
export function shipmentStatus(shipment) {
  const values=(shipment.parcels??[]).map(p=>p.state);
  if(!values.length)return {label:'Sin bultos registrados',cls:'status-amber'};
  if(values.every(s=>s==='DELIVERED'))return {label:'Entregado',cls:'status-green'};
  if(values.some(s=>s.startsWith('RETURN')))return {label:'Con devolución',cls:'status-amber'};
  if(values.some(s=>s==='DELIVERED'))return {label:'Entrega parcial',cls:'status-amber'};
  if(values.some(s=>s==='IN_TRANSIT'))return {label:'En camino',cls:'status-blue'};
  if(values.some(s=>s==='LOADED'))return {label:'Cargado',cls:'status-blue'};
  if(values.some(s=>s==='RECEIVED'))return {label:'En depósito',cls:'status-blue'};
  return {label:'Pendiente de retiro',cls:'status-amber'};
}
export function summary(shipments) {
  return {total:shipments.length,delivered:shipments.filter(s=>s.parcels.length&&s.parcels.every(p=>p.state==='DELIVERED')).length,inTransit:shipments.filter(s=>s.parcels.some(p=>p.state==='IN_TRANSIT')).length};
}
export async function readDashboard(client,companyId) {
  const {data,error}=await client.rpc('portal_dashboard');
  if(error)throw error;
  if(!data||data.company?.id!==companyId||!Array.isArray(data.shipments)||!Array.isArray(data.documents)||!Array.isArray(data.requests))throw Error('Invalid customer response');
  return data;
}
let generation=0;
function icons(){window.lucide?.createIcons({attrs:{'stroke-width':1.6}});}
export function hideLivePanel() {
  generation++;
  const panel=document.querySelector('#customer-panel');
  if(panel){panel.hidden=true;panel.innerHTML='';}
  const auth=document.querySelector('.portal-auth-section');if(auth)auth.hidden=false;
  const dialog=document.querySelector('#modal');if(dialog?.dataset.customer){dialog.close();dialog.innerHTML='';delete dialog.dataset.customer;}
}
function download(name,content,mime='text/plain;charset=utf-8') {
  const url=URL.createObjectURL(new Blob([content],{type:mime}));
  const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const actions={RECEIVE:'Recepción en depósito',LOAD:'Carga en vehículo',DISPATCH:'Salida a reparto',DELIVER:'Entrega registrada',RETURN:'Devolución registrada',PICKUP:'Retiro registrado'};
export async function mountLivePanel(root,client,state,signOut) {
  const current=++generation;
  const valid=()=>current===generation&&root.isConnected;
  root.hidden=false;document.querySelector('.portal-auth-section').hidden=true;
  root.innerHTML=`<div class="container"><p role="status">Consultando tus operaciones…</p></div>`;
  let data,tab='envios';
  const errorText='No pudimos consultar tus operaciones. Revisá la conexión y volvé a intentar.';
  async function load(){
    try{data=await readDashboard(client,state.company.id);if(valid())shell();}
    catch{if(valid()){root.innerHTML=`<div class="container"><h2>No pudimos cargar el panel.</h2><p role="alert">${errorText}</p><button class="button button-navy" data-retry>Volver a intentar</button> <button class="auth-signout" data-exit>Cerrar sesión</button></div>`;root.querySelector('[data-retry]').onclick=load;root.querySelector('[data-exit]').onclick=signOut;}}
  }
  function shell(){
    root.innerHTML=`<div class="container"><div class="portal-live-account"><div><span class="auth-eyebrow">PORTAL DE CLIENTES</span><h1>Tu operación, a la vista.</h1><p>${escapeHtml(data.company.name)} · ${escapeHtml(state.user.email)}</p></div><div><button class="button button-navy button-small" data-refresh>${icon('refresh-cw')} Actualizar</button><button class="auth-signout" data-exit>${icon('log-out')} Cerrar sesión</button></div></div>${!data.company.linked?'<p class="auth-availability" role="status">Tu cuenta está habilitada. Nexora debe vincular tu empresa con el registro operativo del OS para mostrar sus envíos. Las solicitudes que envíes quedan guardadas.</p>':''}<div class="portal-shell"><nav class="portal-sidebar" aria-label="Secciones del panel"><a href="${base.href}" class="brand"><img src="${new URL('assets/nexora-original.jpg',base).href}" alt="Nexora Logistic"></a><div class="portal-company">${icon('building-2')}<div>${escapeHtml(data.company.name)}<span>Cuenta de cliente</span></div></div>${[['envios','package','Mis envíos'],['documentos','files','Documentos'],['reportes','chart-no-axes-combined','Resumen']].map(([id,symbol,label])=>`<button class="portal-tab ${tab===id?'selected':''}" data-live-tab="${id}" aria-pressed="${tab===id}">${icon(symbol)}${label}</button>`).join('')}<a class="portal-help" href="${new URL('contacto/',base).href}">${icon('headset')} Hablá con tu equipo</a></nav><div class="portal-main" id="live-portal-content"></div></div><p class="small-note">Actualizado: ${date(data.loadedAt)}. Se muestran hasta ${data.shipmentLimit} envíos y ${data.documentLimit} documentos recientes.</p></div>`;
    root.querySelector('[data-refresh]').onclick=async e=>{e.currentTarget.disabled=true;await load();};
    root.querySelector('[data-exit]').onclick=signOut;
    root.querySelectorAll('[data-live-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.liveTab;shell();});view();
  }
  const badge=s=>{const status=shipmentStatus(s);return `<span class="status-badge ${status.cls}">${escapeHtml(status.label)}</span>`;};
  function stats(){const n=summary(data.shipments);return `<div class="portal-stats">${[['package','Mis envíos',n.total],['truck','En camino',n.inTransit],['package-check','Entregados',n.delivered]].map(([i,label,total])=>`<div>${icon(i)}<span>${label}</span><strong>${total}</strong></div>`).join('')}</div>`;}
  function view(){
    const content=root.querySelector('#live-portal-content');
    if(tab==='envios'){
      content.innerHTML=`<div class="portal-heading"><div><span>TU OPERACIÓN</span><h2>Tus envíos, conectados.</h2></div><button class="button button-red button-small" data-new-request>Solicitar envío ${icon('plus')}</button></div>${stats()}<div class="shipment-search"><h3>Seguimiento de envíos</h3><label class="search-field">${icon('search')}<input type="search" data-search aria-label="Buscar envío" placeholder="Referencia, código, origen o destino"></label></div><div class="table-scroll"><table class="shipment-table"><thead><tr><th>ENVÍO</th><th>RUTA</th><th>ESTADO</th><th>DETALLE</th></tr></thead><tbody data-rows></tbody></table></div><section class="portal-requests"><h3>Solicitudes enviadas</h3>${data.requests.length?`<div class="table-scroll"><table class="shipment-table"><thead><tr><th>REFERENCIA</th><th>DESTINO</th><th>ESTADO</th></tr></thead><tbody>${data.requests.map(r=>`<tr><td>${escapeHtml(r.reference)}<small>${date(r.created_at)}</small></td><td>${escapeHtml(r.destination_text)}</td><td>${{REQUESTED:'Pendiente de coordinación',ACCEPTED:'Aceptada',REJECTED:'Rechazada'}[r.status]??'En revisión'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="small-note">Todavía no enviaste solicitudes.</p>'}</section>`;
      const rows=query=>{
        const list=data.shipments.filter(s=>normalize([s.reference,s.origin,s.destination,...s.parcels.map(p=>p.code)].join(' ')).includes(normalize(query)));
        content.querySelector('[data-rows]').innerHTML=list.length?list.map(s=>`<tr><td><strong>${escapeHtml(s.reference)}</strong><small>${s.parcels.length} bultos · ${date(s.createdAt)}</small></td><td>${escapeHtml(s.origin)}<small>→ ${escapeHtml(s.destination)}</small></td><td>${badge(s)}</td><td><button class="icon-button" data-detail="${escapeHtml(s.id)}" aria-label="Ver envío ${escapeHtml(s.reference)}">${icon('arrow-up-right')}</button></td></tr>`).join(''):`<tr><td colspan="4" class="table-empty">${data.shipments.length?'No encontramos envíos para esa búsqueda.':'Todavía no hay envíos registrados para tu empresa.'}</td></tr>`;
        content.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>detail(data.shipments.find(s=>s.id===b.dataset.detail)));icons();
      };
      rows('');content.querySelector('[data-search]').oninput=e=>rows(e.target.value);content.querySelector('[data-new-request]').onclick=requestForm;
    }else if(tab==='documentos'){
      content.innerHTML=`<div class="portal-heading"><div><span>COMPROBANTES DE TU OPERACIÓN</span><h2>Tus documentos.</h2></div></div>${data.documents.length?`<div class="document-list">${data.documents.map(d=>`<div>${icon('file-text')}<span><strong>${escapeHtml(d.name)}</strong><small>${escapeHtml(d.reference)} · ${escapeHtml(d.parcel)} · ${date(d.createdAt)}</small></span><button class="icon-button" data-download="${escapeHtml(d.id)}" aria-label="Descargar ${escapeHtml(d.name)}">${icon('download')}</button></div>`).join('')}</div>`:'<p>No hay comprobantes registrados para tus envíos.</p>'}<p class="auth-notice" data-document-error role="alert" hidden></p>`;
      content.querySelectorAll('[data-download]').forEach(b=>b.onclick=async()=>{
        b.disabled=true;const alert=content.querySelector('[data-document-error]');alert.hidden=true;
        try{const {data:doc,error}=await client.rpc('portal_document',{p_document_id:b.dataset.download});if(error||!doc?.base64)throw Error('Unavailable');if(!valid())return;const bytes=Uint8Array.from(atob(doc.base64.replace(/\s/g,'')),c=>c.charCodeAt(0));download(doc.name.replace(/[\\/\x00-\x1f]/g,'_'),bytes,/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(doc.mime)?doc.mime:'application/octet-stream');}
        catch{if(valid()){alert.textContent='No pudimos descargar el comprobante. Volvé a intentar.';alert.hidden=false;}}finally{b.disabled=false;}
      });
    }else{
      const counts=new Map();for(const s of data.shipments){const label=shipmentStatus(s).label;counts.set(label,(counts.get(label)??0)+1);}
      content.innerHTML=`<div class="portal-heading"><div><span>UNA MIRADA A TU OPERACIÓN</span><h2>Tu resumen.</h2></div></div>${stats()}<div class="report-list"><h3>Estado de tus envíos</h3>${counts.size?[...counts].map(([label,count])=>`<div><span>${escapeHtml(label)}</span><div class="report-bar"><span class="blue" style="width:${count/data.shipments.length*100}%"></span></div><strong>${count}</strong></div>`).join(''):'<p>Todavía no hay operaciones para resumir.</p>'}</div><p class="small-note">${data.requests.filter(r=>r.status==='REQUESTED').length} solicitudes pendientes de coordinación.</p>`;
    }icons();
  }
  function modal(html){const dialog=document.querySelector('#modal');dialog.dataset.customer='true';dialog.innerHTML=`<button class="modal-close icon-button" aria-label="Cerrar detalle">${icon('x')}</button>${html}`;dialog.querySelector('.modal-close').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog)dialog.close();};if(!dialog.open)dialog.showModal();icons();return dialog;}
  async function detail(shipment){
    const dialog=modal(`<h2 id="modal-title">${escapeHtml(shipment.reference)}</h2><p>${escapeHtml(shipment.origin)} → ${escapeHtml(shipment.destination)}</p>${badge(shipment)}<p>Destinatario: ${escapeHtml(shipment.recipient)}</p><div class="document-list">${shipment.parcels.map(p=>`<div><span><strong>${escapeHtml(p.code)}</strong><small>${escapeHtml(states[p.state]??p.state)}</small></span></div>`).join('')}</div><h3>Historial registrado</h3><div data-history role="status">Consultando movimientos…</div>`);
    dialog.dataset.shipment=shipment.id;
    try{const {data:events,error}=await client.rpc('portal_shipment_events',{p_shipment_id:shipment.id});if(error)throw error;if(!valid()||!dialog.open||dialog.dataset.shipment!==shipment.id)return;dialog.querySelector('[data-history]').innerHTML=events.length?events.map(e=>`<p><strong>${escapeHtml(actions[e.action]??e.action)}</strong><br>${escapeHtml(e.code)} · ${date(e.created_at)}</p>`).join(''):'Sin movimientos registrados todavía.';}
    catch{if(valid()&&dialog.open&&dialog.dataset.shipment===shipment.id)dialog.querySelector('[data-history]').textContent='No pudimos consultar el historial. Cerrá el detalle y volvé a intentar.';}
  }
  function requestForm(){
    const requestId=crypto.randomUUID();
    const dialog=modal(`<h2 id="modal-title">Solicitar un envío</h2><p>La solicitud queda registrada para que Nexora coordine tu operación.</p><form class="portal-request-form">${[['reference','Referencia del envío',200],['origin_text','Dirección de retiro',500],['destination_text','Dirección de entrega',500],['recipient_name','Nombre del destinatario',200],['recipient_phone','Teléfono del destinatario',80]].map(([name,label,max])=>`<label>${label}<input name="${name}" maxlength="${max}" ${name==='recipient_phone'?'type="tel"':'required'}></label>`).join('')}<label>Cantidad de bultos<input name="parcel_count" type="number" min="1" max="200" value="1" required></label><p role="alert" data-request-error hidden></p><button class="button button-red" type="submit">Enviar solicitud</button></form>`);
    dialog.querySelector('form').onsubmit=async e=>{
      e.preventDefault();const form=e.currentTarget,button=form.querySelector('button[type="submit"]'),alert=form.querySelector('[data-request-error]');button.disabled=true;alert.hidden=true;
      const values=Object.fromEntries(new FormData(form));for(const key of Object.keys(values))values[key]=String(values[key]).trim();
      try{const payload={id:requestId,company_id:state.company.id,...values,parcel_count:Number(values.parcel_count)};const {error}=await client.from('portal_shipping_requests').insert(payload);if(error){if(error.code!=='23505')throw error;const previous=await client.from('portal_shipping_requests').select('id,company_id,reference,origin_text,destination_text,recipient_name,recipient_phone,parcel_count').eq('id',requestId).maybeSingle();if(previous.error||Object.keys(payload).some(key=>previous.data?.[key]!==payload[key]))throw error;}if(!valid())return;dialog.close();await load();}
      catch{if(valid()){alert.textContent='No pudimos guardar la solicitud. Revisá los datos y volvé a intentar.';alert.hidden=false;button.disabled=false;}}
    };
  }
  await load();
}
