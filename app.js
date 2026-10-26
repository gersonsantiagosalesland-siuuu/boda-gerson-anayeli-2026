/*
 * Gerson & Anayeli - prototipo independiente de mesa de regalos.
 * Demo sin Firebase: reservas SOLO en este navegador (localStorage).
 * Firebase: Firestore + Authentication, sin Cloud Functions (compatible Spark).
 */
'use strict';

const WEDDING_UNLOCK_UTC = Date.UTC(2026, 10, 22, 5, 0, 0); // 22/11/2026 00:00 Peru (UTC-5)
const SDK_VERSION = '11.10.0';
const STORAGE_RESERVATIONS = 'ga_gifts_demo_reservations_v1';
const STORAGE_CATALOG = 'ga_gifts_demo_catalog_v1';

const DEFAULT_GIFTS = [
  {id:'vasos',name:'Juego de vasos',tier:'eco',favorite:true,emoji:'🥛',order:1,delivery:'reception',description:'12 vasos resistentes como mínimo, para una mesa de 8 personas y visitas.'},
  {id:'utensilios',name:'Utensilios de cocina',tier:'eco',favorite:true,emoji:'🍳',order:2,delivery:'reception',description:'Juego de espátulas, cucharones, pinzas y utensilios básicos.'},
  {id:'cubiertos',name:'Juego de cubiertos',tier:'eco',favorite:false,emoji:'🍴',order:3,delivery:'reception',description:'Servicio para 8 a 12 personas; preferiblemente para 12.'},
  {id:'cuchillos',name:'Cuchillos y tabla de picar',tier:'eco',favorite:false,emoji:'🔪',order:4,delivery:'reception',description:'Cuchillos de cocina y tabla resistente para preparación de alimentos.'},
  {id:'hermeticos',name:'Recipientes herméticos',tier:'eco',favorite:false,emoji:'🫙',order:5,delivery:'reception',description:'Juego de recipientes para conservar alimentos.'},
  {id:'escurridor',name:'Escurridor de platos',tier:'eco',favorite:false,emoji:'🍽️',order:6,delivery:'reception',description:'Escurridor práctico y resistente para cocina.'},
  {id:'toallas',name:'Juego de toallas',tier:'eco',favorite:false,emoji:'🛁',order:7,delivery:'reception',description:'Juego de toallas de baño y manos de buena absorción.'},
  {id:'protector',name:'Protector de colchón',tier:'eco',favorite:false,emoji:'🛏️',order:8,delivery:'reception',description:'Protector lavable. Medida exacta del colchón por confirmar.'},
  {id:'alfombra-bano',name:'Alfombra antideslizante',tier:'eco',favorite:false,emoji:'🧼',order:9,delivery:'reception',description:'Alfombra antideslizante y absorbente para el baño.'},
  {id:'organizador-bano',name:'Organizador para baño',tier:'eco',favorite:false,emoji:'🧺',order:10,delivery:'reception',description:'Organizador compacto para artículos de higiene.'},
  {id:'tazas',name:'Juego de tazas',tier:'eco',favorite:false,emoji:'☕',order:11,delivery:'reception',description:'Preferiblemente 8 a 12 tazas para café, té y otras bebidas.'},
  {id:'botiquin',name:'Botiquín de primeros auxilios',tier:'eco',favorite:false,emoji:'🩹',order:12,delivery:'reception',description:'Botiquín doméstico con suministros básicos.'},
  {id:'vajilla',name:'Juego de vajilla',tier:'mid',favorite:true,emoji:'🍽️',order:13,delivery:'reception',description:'Servicio de platos para 8 a 12 personas; preferiblemente para 12 comensales.'},
  {id:'cama',name:'Juego de cama completo',tier:'mid',favorite:true,emoji:'🛏️',order:14,delivery:'reception',description:'Un solo conjunto de ropa de cama: sábanas, fundas y edredón. Medidas por confirmar.'},
  {id:'ollas',name:'Juego de ollas',tier:'mid',favorite:false,emoji:'🥘',order:15,delivery:'reception',description:'Juego de ollas resistentes de distintos tamaños.'},
  {id:'sartenes',name:'Juego de sartenes',tier:'mid',favorite:false,emoji:'🍳',order:16,delivery:'reception',description:'Sartenes de distintos tamaños para uso diario.'},
  {id:'almohadas',name:'Juego de almohadas',tier:'mid',favorite:false,emoji:'☁️',order:17,delivery:'reception',description:'Par de almohadas cómodas para el dormitorio.'},
  {id:'veladores',name:'Par de veladores',tier:'mid',favorite:false,emoji:'🪵',order:18,delivery:'coordinate',description:'Dos mesas de noche en colores neutros. Medidas por confirmar.'},
  {id:'microondas',name:'Horno microondas',tier:'mid',favorite:false,emoji:'♨️',order:19,delivery:'coordinate',description:'Microondas de capacidad apropiada para el hogar.'},
  {id:'barman',name:'Set de barman',tier:'mid',favorite:true,emoji:'🍸',order:20,delivery:'reception',description:'Juego de coctelería con coctelera, medidor, colador y accesorios.'},
  {id:'cortinas-dormitorio',name:'Cortinas para dormitorio',tier:'mid',favorite:false,emoji:'🪟',order:21,delivery:'coordinate',description:'Cortinas en tonos neutros. Medidas por confirmar.'},
  {id:'cortinas-sala',name:'Cortinas para sala',tier:'mid',favorite:false,emoji:'🪟',order:22,delivery:'coordinate',description:'Cortinas beige o tonos cálidos. Medidas por confirmar.'},
  {id:'copas',name:'Juego de copas',tier:'mid',favorite:false,emoji:'🥂',order:23,delivery:'reception',description:'Preferiblemente 12 copas para reuniones y celebraciones.'},
  {id:'alacena',name:'Alacena de cocina',tier:'special',favorite:true,emoji:'🪑',order:24,delivery:'coordinate',description:'Color beige, roble natural o marrón claro, acorde con las paredes beige claro. Medidas por confirmar.'},
  {id:'sonido',name:'Equipo de sonido potente',tier:'special',favorite:true,emoji:'🔊',order:25,delivery:'coordinate',description:'Con Bluetooth, buena potencia y calidad de audio. Características por definir.'}
];


// Fotografias reales de Pexels, usadas como referencias visuales, sin marcas obligatorias.
// No modifica datos de Firestore: la imagen se asigna localmente por el ID de regalo.
const GIFT_PHOTO_IDS = Object.freeze({
  'vasos': 6387830,
  'utensilios': 17542995,
  'cubiertos': 7140435,
  'cuchillos': 16443132,
  'hermeticos': 8580786,
  'escurridor': 10397049,
  'toallas': 4210371,
  'protector': 9893931,
  'alfombra-bano': 7546609,
  'organizador-bano': 33429884,
  'tazas': 8063827,
  'botiquin': 5664736,
  'vajilla': 6611480,
  'cama': 7303691,
  'ollas': 30981356,
  'sartenes': 2868977,
  'almohadas': 3755585,
  'veladores': 18145480,
  'microondas': 4686822,
  'barman': 38772777,
  'cortinas-dormitorio': 14613397,
  'cortinas-sala': 7045703,
  'copas': 16545926,
  'alacena': 5556176,
  'sonido': 28739306,
});

const $ = (selector) => document.querySelector(selector);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const safeRead = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } };
const safeWrite = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* almacenamiento deshabilitado */ } };
const tierName = (tier) => ({eco:'Económico',mid:'Intermedio',special:'Especial'})[tier] || 'Regalo';
const isAfterWedding = () => Date.now() >= WEDDING_UNLOCK_UTC;
const isFirebaseConfigured = () => { const c=window.FIREBASE_CONFIG; return Boolean(c && c.apiKey && c.authDomain && c.projectId && c.appId && !String(c.apiKey).includes('...') && !String(c.projectId).startsWith('tu-')); };

const state = {
  mode:'demo', gifts:[], demoReservations:[], myReservations:[], adminReservations:[],
  filter:'all', tab:'physical', user:null, isAdmin:false, reveal:false, demoReveal:false,
  firebase:null, fb:null, unsubGifts:null, unsubOwn:null, unsubSettings:null, unsubAdmin:null,
  busy:false, selectedGift:null, editingGift:null, error:null
};

function setBanner(message, type='demo') {
  const el=$('#status-banner'); el.textContent=message; el.className='status-banner '+type;
}
let toastTimer;
function toast(message) {
  const el=$('#toast'); el.textContent=message; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),4200);
}
function getGift(id) { return state.gifts.find(g=>g.id===id); }
function getReservations() { return state.mode==='demo' ? state.demoReservations : state.adminReservations; }
function loadDemo() {
  const edits=safeRead(STORAGE_CATALOG, {});
  state.gifts=DEFAULT_GIFTS.map(g=>({...g,...(edits[g.id]||{})}));
  state.demoReservations=safeRead(STORAGE_RESERVATIONS, []).filter(r=>DEFAULT_GIFTS.some(g=>g.id===r.giftId));
  state.myReservations=state.demoReservations;
  state.gifts=state.gifts.map(g=>({...g,status:state.demoReservations.some(r=>r.giftId===g.id)?'reserved':'available'}));
}
function persistDemo() {
  safeWrite(STORAGE_RESERVATIONS,state.demoReservations);
  state.myReservations=state.demoReservations;
  state.gifts=state.gifts.map(g=>({...g,status:state.demoReservations.some(r=>r.giftId===g.id)?'reserved':'available'}));
  renderAll();
}
function renderAll() { renderCatalog(); renderMyReservations(); renderAdmin(); }
function renderCatalog() {
  const gifts=state.gifts;
  $('#available-count').textContent=gifts.filter(g=>g.status==='available').length;
  $('#reserved-count').textContent=gifts.filter(g=>g.status==='reserved').length;
  $('#tier-filter').value=state.filter;
  const filtered=gifts.filter(g=>state.filter==='all'||(state.filter==='favorite'&&g.favorite)||(state.filter==='available'&&g.status==='available')||g.tier===state.filter)
    .sort((a,b)=>a.order-b.order);
  $('#gift-grid').innerHTML=filtered.length?filtered.map(g=>{
    const available=g.status==='available';
    const photoId=GIFT_PHOTO_IDS[g.id];
    const photoUrl=photoId?`https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop`:'';
    return `<article class="gift-card ${available?'':'reserved'}">
      <div class="gift-art"><span class="emoji" aria-hidden="true">${esc(g.emoji||'🎁')}</span>${photoUrl?`<img class="gift-photo" src="${photoUrl}" alt="Fotografía referencial de ${esc(g.name)}" loading="lazy" decoding="async"><span class="photo-note">Imagen referencial</span>`:''}${g.favorite?'<span class="favorite-mark">♡ Elegido por nosotros</span>':''}</div>
      <div class="gift-card-body"><span class="gift-tier">${esc(tierName(g.tier))}</span><h3>${esc(g.name)}</h3>
      <p>${esc(g.description)}</p><div class="gift-card-foot">
      <span class="gift-status ${available?'available':'reserved'}">${available?'● Disponible':'🔒 Reservado'}</span>
      <button type="button" class="button ${available?'button-primary':'button-outline'} button-small" data-action="reserve" data-id="${esc(g.id)}" ${available&&state.mode!=='error'?'':'disabled'}>${available?'Reservar regalo':'No disponible'}</button>
      </div></div></article>`;
  }).join(''):'<div class="empty-state">No hay regalos en esta categoría. Si acabas de activar Firebase, un administrador debe cargar el catálogo inicial.</div>';
}
function renderMyReservations() {
  const own=state.myReservations.filter(r=>getGift(r.giftId));
  const el=$('#my-reservations');
  if(!own.length){el.hidden=true;el.innerHTML='';return;}
  el.hidden=false;
  el.innerHTML=`<h3>Mis regalos reservados</h3><p>Estas reservas están asociadas a este navegador y a tu sesión. Puedes cancelarlas si cambias de opinión.</p>
    ${own.map(r=>`<div class="my-reservation-row"><strong>${esc(getGift(r.giftId)?.name||r.giftId)}</strong><button class="button button-outline button-small" type="button" data-action="cancel-own" data-id="${esc(r.giftId)}">Cancelar mi reserva</button></div>`).join('')}`;
}
function renderAdmin() {
  const el=$('#admin-panel');
  if(state.mode==='error') {
    el.innerHTML=`<div class="admin-notice">No se pudo iniciar Firebase. Revisa la configuración y los permisos. <strong>${esc(state.error||'Error desconocido')}</strong></div>`;
    return;
  }
  if(state.mode==='firebase'&&!state.isAdmin) {
    const uid=state.user?.uid;
    el.innerHTML=`<div class="admin-login"><h3>Acceso privado</h3>
      <p>Este panel estará protegido con una cuenta Google autorizada. Los invitados no pueden consultar los nombres de otras personas.</p>
      <button type="button" class="button button-primary" data-action="admin-login">Acceder con Google</button>
      ${state.user&&!state.user.isAnonymous?`<p>Esta cuenta todavía no es administradora. Crea en Firestore el documento <strong>admins/${esc(uid)}</strong> desde la consola de Firebase y vuelve a iniciar sesión.</p><div class="admin-uid">${esc(uid)}</div><button type="button" class="button button-outline button-small" data-action="admin-logout">Cerrar sesión de Google</button>`:''}</div>`;
    return;
  }
  const gifts=state.gifts;
  const reserved=gifts.filter(g=>g.status==='reserved');
  const unlocked=state.mode==='demo'?state.demoReveal:(state.reveal&&isAfterWedding());
  const records=getReservations();
  const nameFor=(id)=>unlocked?(records.find(r=>r.giftId===id)?.name||'Sin datos'):'🔒 Sorpresa';
  const countRow=`<div class="stat-grid"><div class="stat"><strong>${gifts.length}</strong><span>Regalos</span></div><div class="stat"><strong>${reserved.length}</strong><span>Reservados</span></div><div class="stat"><strong>${gifts.length-reserved.length}</strong><span>Disponibles</span></div></div>`;
  const demoNotice=state.mode==='demo'?'<div class="admin-notice"><strong>Panel de prueba:</strong> aquí no hay contraseña y los datos se guardan solo en este navegador. En Firebase, el acceso estará protegido y las identidades no podrán consultarse antes del desbloqueo.</div>':'';
  const controls=state.mode==='demo'
    ? `<button class="button button-outline button-small" type="button" data-action="demo-reveal">${state.demoReveal?'Ocultar nombres (demo)':'Simular revelación de nombres'}</button><button class="button button-outline button-small" type="button" data-action="demo-reset">Restablecer prueba</button>`
    : `${!gifts.length?'<button class="button button-primary button-small" type="button" data-action="seed">Cargar los 25 regalos iniciales</button>':''}
       ${!state.reveal?`<button class="button button-outline button-small" type="button" data-action="reveal" ${isAfterWedding()?'':'disabled'}>Revelar nombres después de la boda</button>`:''}
       <button class="button button-outline button-small" type="button" data-action="admin-logout">Salir del panel</button>`;
  const revealNotice=unlocked
    ? '<div class="admin-notice"><strong>Identidades reveladas.</strong> Los nombres y teléfonos solo son visibles aquí, no en el catálogo público.</div>'
    : `<div class="admin-notice"><strong>🔒 Modo sorpresa activo.</strong> Verán qué regalos están reservados, pero no los nombres. ${state.mode==='firebase'?'El desbloqueo manual estará disponible desde el 22 de noviembre de 2026 (hora de Perú).':'En esta demostración pueden simular la revelación para comprobar el diseño.'}</div>`;
  el.innerHTML=`<div class="admin-header"><h3>Resumen de regalos</h3><span class="pill">${state.mode==='demo'?'Prueba local':'Firebase · acceso protegido'}</span></div>
    <p class="admin-subtitle">${state.mode==='demo'?'Sin sincronización entre dispositivos':'Actualización automática entre dispositivos'}</p>
    ${countRow}${demoNotice}${revealNotice}<div class="admin-actions">${controls}${unlocked?'<button class="button button-outline button-small" type="button" data-action="export">Exportar reservas CSV</button>':''}</div>
    <div class="admin-scroll"><table class="admin-table"><thead><tr><th>Regalo</th><th>Estado</th><th>Quién reservó</th><th>Acciones</th></tr></thead><tbody>
    ${gifts.slice().sort((a,b)=>a.order-b.order).map(g=>`<tr><td>${esc(g.name)}</td><td><span class="pill ${g.status==='available'?'ok':''}">${g.status==='available'?'Disponible':'Reservado'}</span></td><td>${g.status==='reserved'?esc(nameFor(g.id)):'—'}</td><td><button type="button" class="button button-outline button-small" data-action="edit" data-id="${esc(g.id)}">Editar</button>${g.status==='reserved'?`<button type="button" class="button button-danger button-small" data-action="cancel-admin" data-id="${esc(g.id)}">Liberar</button>`:''}</td></tr>`).join('')}
    </tbody></table></div>
    ${unlocked&&records.length?`<p class="admin-subtitle">Contactos de reservas reveladas: ${records.map(r=>`${esc(r.name)} (${esc(r.whatsapp)})`).join(' · ')}</p>`:''}`;
}
function setTab(tab) {
  state.tab=tab;
  $('#physical-panel').hidden=tab!=='physical'; $('#contribution-panel').hidden=tab!=='contribution';
  document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});
}
function openReserve(id) {
  const g=getGift(id); if(!g||g.status!=='available')return toast('Este regalo ya no está disponible.');
  state.selectedGift=id;
  $('#reserve-gift-name').textContent=g.name+' · '+g.description;
  $('#delivery-note').textContent=g.delivery==='coordinate'?'Por su tamaño o características, la entrega se coordinará de manera privada. No publicaremos la dirección de los novios.':'Puedes entregar este regalo en la recepción o coordinarlo con los novios.';
  $('#reserve-form').reset(); $('#reserve-error').hidden=true;
  $('#reserve-dialog').showModal();
}
function openEdit(id) {
  const g=getGift(id);if(!g)return;
  state.editingGift=id;$('#edit-form').reset();
  $('#edit-name').value=g.name;$('#edit-desc').value=g.description;$('#edit-tier').value=g.tier;$('#edit-error').hidden=true;
  $('#edit-dialog').showModal();
}
function displayError(elId, error) {const el=$(elId);el.hidden=false;el.textContent=error;}
function friendlyError(error) {
  const code=error?.code||'';
  if(code==='permission-denied')return 'Permiso denegado. Revisa las reglas de Firestore y que el usuario esté autenticado.';
  if(code==='unavailable')return 'No hay conexión con Firebase. Revisa internet e inténtalo de nuevo.';
  if(code==='auth/unauthorized-domain')return 'Debes agregar este dominio a Firebase Authentication > Dominios autorizados.';
  if(code==='auth/operation-not-allowed')return 'Activa el inicio de sesión anónimo y Google en Firebase Authentication.';
  return error?.message||String(error);
}
async function reserveGift(name, whatsapp) {
  const giftId=state.selectedGift;
  if(state.mode==='demo') {
    if(state.demoReservations.some(r=>r.giftId===giftId))throw new Error('El regalo ya está reservado.');
    state.demoReservations.push({giftId,name,whatsapp,uid:'demo',createdAt:new Date().toISOString()});
    persistDemo();return;
  }
  if(state.mode!=='firebase'||!state.user)throw new Error('Espera a que se inicie tu sesión en Firebase.');
  const f=state.fb, db=state.firebase.db, uid=state.user.uid;
  await f.runTransaction(db,async transaction=>{
    const giftRef=f.doc(db,'gifts',giftId),resRef=f.doc(db,'reservations',giftId);
    const gift=await transaction.get(giftRef);
    if(!gift.exists()||gift.data().status!=='available')throw new Error('Este regalo acaba de ser reservado por otra persona. Elige otro.');
    transaction.update(giftRef,{status:'reserved',updatedAt:f.serverTimestamp()});
    transaction.set(resRef,{giftId,uid,name,whatsapp,createdAt:f.serverTimestamp()});
  });
}
async function cancelOwn(giftId) {
  if(!confirm('¿Deseas cancelar esta reserva y dejar el regalo disponible para otro invitado?'))return;
  if(state.mode==='demo') {
    state.demoReservations=state.demoReservations.filter(r=>r.giftId!==giftId);persistDemo();toast('Reserva cancelada.');return;
  }
  const f=state.fb,db=state.firebase.db,uid=state.user?.uid;
  await f.runTransaction(db,async tx=>{
    const gr=f.doc(db,'gifts',giftId),rr=f.doc(db,'reservations',giftId);
    const g=await tx.get(gr),r=await tx.get(rr);
    if(!g.exists()||!r.exists()||r.data().uid!==uid)throw new Error('No se encontró una reserva tuya para este regalo.');
    tx.update(gr,{status:'available',updatedAt:f.serverTimestamp()});tx.delete(rr);
  });toast('Tu reserva fue cancelada.');
}
async function cancelAdmin(giftId) {
  if(!confirm('¿Liberar este regalo? La reserva se eliminará y quedará disponible para los invitados.'))return;
  if(state.mode==='demo') {state.demoReservations=state.demoReservations.filter(r=>r.giftId!==giftId);persistDemo();toast('Regalo liberado.');return;}
  if(!state.isAdmin)throw new Error('No tienes acceso de administrador.');
  const f=state.fb,db=state.firebase.db,batch=f.writeBatch(db);
  batch.update(f.doc(db,'gifts',giftId),{status:'available',updatedAt:f.serverTimestamp()});
  batch.delete(f.doc(db,'reservations',giftId));
  await batch.commit();toast('Regalo liberado.');
}
async function saveEdit() {
  const id=state.editingGift;
  const patch={name:$('#edit-name').value.trim(),description:$('#edit-desc').value.trim(),tier:$('#edit-tier').value};
  if(!patch.name||!patch.description)throw new Error('Completa nombre y descripción.');
  if(state.mode==='demo') {
    const edits=safeRead(STORAGE_CATALOG,{});edits[id]={...(edits[id]||{}),...patch};safeWrite(STORAGE_CATALOG,edits);
    state.gifts=state.gifts.map(g=>g.id===id?{...g,...patch}:g);renderAll();return;
  }
  if(!state.isAdmin)throw new Error('Solo los novios pueden editar el catálogo.');
  await state.fb.updateDoc(state.fb.doc(state.firebase.db,'gifts',id),{...patch,updatedAt:state.fb.serverTimestamp()});
}
async function seedCatalog() {
  if(state.mode!=='firebase'||!state.isAdmin||state.gifts.length)throw new Error('El catálogo ya existe o no tienes acceso.');
  const f=state.fb,db=state.firebase.db;
  for(let i=0;i<DEFAULT_GIFTS.length;i+=8){
    const batch=f.writeBatch(db);
    for(const g of DEFAULT_GIFTS.slice(i,i+8))batch.set(f.doc(db,'gifts',g.id),{...g,status:'available',updatedAt:f.serverTimestamp()});
    await batch.commit();
  }
  const settingsRef=f.doc(db,'settings','control');
  if(!(await f.getDoc(settingsRef)).exists())await f.setDoc(settingsRef,{revealNames:false,updatedAt:f.serverTimestamp()});
  toast('Los 25 regalos ya están cargados en Firebase.');
}
async function revealNames() {
  if(!state.isAdmin||!isAfterWedding())throw new Error('Solo podrás revelar los nombres después de la boda.');
  if(!confirm('¿Revelar definitivamente los nombres de quienes reservaron regalos?'))return;
  await state.fb.updateDoc(state.fb.doc(state.firebase.db,'settings','control'),{revealNames:true,updatedAt:state.fb.serverTimestamp()});
  toast('Identidades reveladas.');
}
function exportCsv() {
  const unlocked=state.mode==='demo'?state.demoReveal:(state.isAdmin&&state.reveal&&isAfterWedding());
  if(!unlocked)return toast('Los nombres siguen protegidos por el modo sorpresa.');
  const records=getReservations();
  const q=(v)=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const lines=[['Regalo','Nombre','WhatsApp','Fecha de reserva'].map(q).join(',')];
  for(const r of records)lines.push([getGift(r.giftId)?.name||r.giftId,r.name,r.whatsapp,r.createdAt?.toDate?.()?.toISOString?.()||r.createdAt||''].map(q).join(','));
  const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='reservas_gerson_anayeli.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function attachOwnListener() {
  if(state.unsubOwn){state.unsubOwn();state.unsubOwn=null;}
  state.myReservations=[];
  if(!state.user)return;
  const f=state.fb,db=state.firebase.db;
  state.unsubOwn=f.onSnapshot(f.query(f.collection(db,'reservations'),f.where('uid','==',state.user.uid)),snapshot=>{
    state.myReservations=snapshot.docs.map(d=>({id:d.id,...d.data()}));renderMyReservations();
  },error=>{console.error('Mis reservas:',error);toast('No se pudieron cargar tus reservas: '+friendlyError(error));});
}
function attachAdminReservations() {
  if(state.unsubAdmin){state.unsubAdmin();state.unsubAdmin=null;}
  state.adminReservations=[];
  if(!state.isAdmin||!state.reveal||!isAfterWedding())return;
  const f=state.fb;
  state.unsubAdmin=f.onSnapshot(f.collection(state.firebase.db,'reservations'),snapshot=>{
    state.adminReservations=snapshot.docs.map(d=>({id:d.id,...d.data()}));renderAdmin();
  },error=>{console.error('Reservas admin:',error);toast(friendlyError(error));});
}
function attachSettingsListener() {
  if(state.unsubSettings){state.unsubSettings();state.unsubSettings=null;}
  state.reveal=false;
  if(!state.isAdmin)return;
  const f=state.fb;
  state.unsubSettings=f.onSnapshot(f.doc(state.firebase.db,'settings','control'),snapshot=>{
    state.reveal=Boolean(snapshot.exists()&&snapshot.data().revealNames);attachAdminReservations();renderAdmin();
  },error=>{console.error('Configuracion:',error);toast(friendlyError(error));});
}
async function initFirebase() {
  try {
    const root=`https://www.gstatic.com/firebasejs/${SDK_VERSION}`;
    const [app,auth,firestore]=await Promise.all([import(`${root}/firebase-app.js`),import(`${root}/firebase-auth.js`),import(`${root}/firebase-firestore.js`)]);
    const f={...app,...auth,...firestore};state.fb=f;
    const firebaseApp=f.initializeApp(window.FIREBASE_CONFIG),firebaseAuth=f.getAuth(firebaseApp),db=f.getFirestore(firebaseApp);
    state.firebase={app:firebaseApp,auth:firebaseAuth,db};state.mode='firebase';
    setBanner('FIREBASE CONECTADO · Reservas sincronizadas en tiempo real','live');
    state.unsubGifts=f.onSnapshot(f.collection(db,'gifts'),snapshot=>{
      state.gifts=snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.order-b.order);
      renderAll();
    },error=>{console.error('Catalogo Firebase:',error);setBanner('Error al leer regalos: '+friendlyError(error),'error');});
    f.onAuthStateChanged(firebaseAuth,async user=>{
      if(!user){state.user=null;state.isAdmin=false;state.reveal=false;attachOwnListener();renderAll();
        try{await f.signInAnonymously(firebaseAuth);}catch(error){setBanner('Activa el acceso anónimo en Firebase: '+friendlyError(error),'error');}return;}
      state.user=user;
      try{const admin=await f.getDoc(f.doc(db,'admins',user.uid));state.isAdmin=admin.exists()&&admin.data().enabled===true;}
      catch(error){state.isAdmin=false;console.error('Verificacion admin:',error);}
      attachOwnListener();attachSettingsListener();renderAll();
    });
    renderAll();
  } catch(error) {
    console.error('Firebase init:',error);state.mode='error';state.error=friendlyError(error);
    setBanner('No se pudo conectar Firebase · '+state.error,'error');renderAll();
  }
}

async function handleAction(button) {
  const action=button.dataset.action,id=button.dataset.id;
  if(state.busy)return;
  try {
    if(action==='reserve')return openReserve(id);
    if(action==='edit')return openEdit(id);
    if(action==='demo-reveal'){state.demoReveal=!state.demoReveal;renderAdmin();return;}
    if(action==='demo-reset'){
      if(!confirm('¿Borrar todas las reservas y ediciones de esta prueba local?'))return;
      state.demoReservations=[];safeWrite(STORAGE_CATALOG,{});loadDemo();state.demoReveal=false;renderAll();toast('Prueba reiniciada.');return;
    }
    if(action==='export')return exportCsv();
    if(action==='admin-login'){
      if(!state.firebase)throw new Error('Firebase no está conectado.');
      await state.fb.signInWithPopup(state.firebase.auth,new state.fb.GoogleAuthProvider());return;
    }
    if(action==='admin-logout'){
      if(!state.firebase)return;
      await state.fb.signOut(state.firebase.auth);toast('Sesión de administrador cerrada.');return;
    }
    state.busy=true;button.disabled=true;
    if(action==='cancel-own')await cancelOwn(id);
    if(action==='cancel-admin')await cancelAdmin(id);
    if(action==='seed')await seedCatalog();
    if(action==='reveal')await revealNames();
  } catch(error){console.error(error);toast(friendlyError(error));}
  finally{state.busy=false;button.disabled=false;}
}

function registerEvents() {
  // Si la fuente externa no responde, el regalo conserva su icono original.
  document.addEventListener('error', event=>{
    if(event.target instanceof HTMLImageElement && event.target.classList.contains('gift-photo')) {
      const container=event.target.parentElement;
      event.target.remove();
      container?.querySelector('.photo-note')?.remove();
    }
  }, true);
  document.addEventListener('click',event=>{
    const tab=event.target.closest('[data-tab]');if(tab){setTab(tab.dataset.tab);return;}
    const close=event.target.closest('[data-close]');if(close){document.getElementById(close.dataset.close)?.close();return;}
    const button=event.target.closest('[data-action]');if(button){handleAction(button);return;}
  });
  $('#tier-filter').addEventListener('change',event=>{state.filter=event.target.value;renderCatalog();});
  $('#reserve-form').addEventListener('submit',async event=>{
    event.preventDefault();if(state.busy)return;
    const name=$('#guest-name').value.trim(),whatsapp=$('#guest-phone').value.trim();
    if(name.length<3||!/^\+?[0-9 ()-]{7,20}$/.test(whatsapp))return displayError('#reserve-error','Revisa tu nombre y número de contacto.');
    state.busy=true;$('#reserve-submit').disabled=true;$('#reserve-error').hidden=true;
    try{await reserveGift(name,whatsapp);$('#reserve-dialog').close();toast('¡Gracias! Tu regalo ha quedado reservado. Puedes verlo en «Mis regalos reservados».');}
    catch(error){displayError('#reserve-error',friendlyError(error));}
    finally{state.busy=false;$('#reserve-submit').disabled=false;}
  });
  $('#edit-form').addEventListener('submit',async event=>{
    event.preventDefault();if(state.busy)return;state.busy=true;$('#edit-submit').disabled=true;$('#edit-error').hidden=true;
    try{await saveEdit();$('#edit-dialog').close();toast('Regalo actualizado.');}
    catch(error){displayError('#edit-error',friendlyError(error));}
    finally{state.busy=false;$('#edit-submit').disabled=false;}
  });
  for(const modal of document.querySelectorAll('dialog'))modal.addEventListener('click',event=>{if(event.target===modal)modal.close();});
}
function main() {
  registerEvents();
  if(isFirebaseConfigured()){
    state.mode='loading';state.gifts=DEFAULT_GIFTS.map(g=>({...g,status:'available'}));
    setBanner('Conectando con Firebase…','demo');renderAll();initFirebase();
  }else{
    state.mode='demo';loadDemo();setBanner('MODO DEMOSTRACIÓN LOCAL · No sincroniza otros celulares · Usa datos ficticios','demo');renderAll();
  }
}
main();


/* Actualizacion de regalos Gerson y Anayeli - pegar al FINAL de app.js */
(() => {
  const retirados = new Set(['cubiertos', 'cortinas-dormitorio', 'cortinas-sala']);
  const nuevos = [
    {id:'hervidor-electrico',name:'Hervidor el\u00e9ctrico',tier:'eco',favorite:false,emoji:'\uD83E\uDED6',order:26,delivery:'reception',description:'Hervidor el\u00e9ctrico con apagado autom\u00e1tico. Capacidad por definir.'},
    {id:'cafetera-electrica',name:'Cafetera el\u00e9ctrica',tier:'mid',favorite:false,emoji:'\u2615',order:27,delivery:'reception',description:'Cafetera el\u00e9ctrica para uso dom\u00e9stico. Tipo y capacidad por definir.'},
    {id:'aspiradora-vertical-2en1',name:'Aspiradora vertical inal\u00e1mbrica 2 en 1',tier:'special',favorite:false,emoji:'\uD83E\uDDF9',order:28,delivery:'coordinate',description:'Aspiradora recargable, utilizable como aspiradora vertical y de mano. Autonom\u00eda por definir.'}
  ];
  const especificaciones = {
    protector:['Protector lavable. Medida exacta del colch\u00f3n por confirmar.','Protector lavable para colch\u00f3n de 2 plazas.'],
    cama:['Un solo conjunto de ropa de cama: s\u00e1banas, fundas y edred\u00f3n. Medidas por confirmar.','Un solo conjunto de ropa de cama para 2 plazas: s\u00e1banas, fundas y edred\u00f3n. Colores preferidos: marr\u00f3n, beige, gris o tonos neutros.'],
    veladores:['Dos mesas de noche en colores neutros. Medidas por confirmar.','Dos mesas de noche de color blanco, beige o marr\u00f3n. Medidas por confirmar.'],
    microondas:['Microondas de capacidad apropiada para el hogar.','Microondas de 20 litros de capacidad.'],
    sonido:['Con Bluetooth, buena potencia y calidad de audio. Caracter\u00edsticas por definir.','Torre de sonido con Bluetooth, buena potencia y calidad de audio.']
  };

  for (const regalo of nuevos) {
    if (!DEFAULT_GIFTS.some(g => g.id === regalo.id)) DEFAULT_GIFTS.push(regalo);
  }
  DEFAULT_GIFTS.splice(0, DEFAULT_GIFTS.length, ...DEFAULT_GIFTS.filter(g => !retirados.has(g.id)));
  const actualizarDescripcion = g => {
    const cambio = especificaciones[g.id];
    return cambio && g.description === cambio[0] ? {...g, description:cambio[1]} : g;
  };
  for (const regalo of DEFAULT_GIFTS) {
    const cambio = especificaciones[regalo.id];
    if (cambio && regalo.description === cambio[0]) regalo.description = cambio[1];
  }

  const renderOriginal = renderAll;
  renderAll = function () {
    state.gifts = state.gifts.filter(g => !retirados.has(g.id)).map(actualizarDescripcion);
    renderOriginal();
    if (state.mode !== 'firebase' || !state.isAdmin) return;
    const faltantes = nuevos.filter(g => !state.gifts.some(x => x.id === g.id));
    const zona = document.querySelector('#admin-panel .admin-actions') || document.querySelector('#admin-panel') || document.querySelector('#administracion') || document.body;
    if (faltantes.length && zona && !document.querySelector('#ga-nuevos') && !document.querySelector('[data-action="add-new-gifts"]')) {
      const boton = document.createElement('button');
      boton.id = 'ga-nuevos';
      boton.type = 'button';
      boton.className = 'button button-primary button-small';
      boton.textContent = 'Agregar ' + faltantes.length + ' regalos nuevos';
      zona.prepend(boton);
    }
  };

  document.addEventListener('click', async evento => {
    const boton = evento.target.closest('#ga-nuevos');
    if (!boton) return;
    evento.preventDefault();
    evento.stopImmediatePropagation();
    if (state.mode !== 'firebase' || !state.isAdmin) return;
    boton.disabled = true;
    try {
      let creados = 0;
      for (const regalo of nuevos) {
        const agregado = await state.fb.runTransaction(state.firebase.db, async tx => {
          const ref = state.fb.doc(state.firebase.db, 'gifts', regalo.id);
          if ((await tx.get(ref)).exists()) return false;
          tx.set(ref, {...regalo, status:'available', updatedAt:state.fb.serverTimestamp()});
          return true;
        });
        if (agregado) creados++;
      }
      toast(creados + ' regalos nuevos agregados a Firebase.');
    } catch (error) {
      toast(friendlyError(error));
    } finally {
      boton.disabled = false;
    }
  }, true);

  if (state.mode === 'demo') loadDemo();
  renderAll();
})();
