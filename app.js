/*
 * Gerson & Anayeli - Mesa de regalos
 * Firebase: Firestore + Authentication
 * Version completa con 25 regalos y panel de administracion.
 */
'use strict';

const WEDDING_UNLOCK_UTC = Date.UTC(2026, 10, 22, 5, 0, 0);
const SDK_VERSION = '11.10.0';
const STORAGE_RESERVATIONS = 'ga_gifts_demo_reservations_v1';
const STORAGE_CATALOG = 'ga_gifts_demo_catalog_v1';

// Los regalos retirados se ocultan, pero NO se borran de Firebase.
const RETIRED_GIFT_IDS = new Set([
  'cubiertos',
  'cortinas-dormitorio',
  'cortinas-sala'
]);

const DEFAULT_GIFTS = [
  {id:'vasos',name:'Juego de vasos',tier:'eco',favorite:true,emoji:'🥛',order:1,delivery:'reception',description:'12 vasos resistentes como mínimo, para una mesa de 8 personas y visitas.'},
  {id:'utensilios',name:'Utensilios de cocina',tier:'eco',favorite:true,emoji:'🍳',order:2,delivery:'reception',description:'Juego de espátulas, cucharones, pinzas y utensilios básicos.'},
  {id:'cuchillos',name:'Cuchillos y tabla de picar',tier:'eco',favorite:false,emoji:'🔪',order:4,delivery:'reception',description:'Cuchillos de cocina y tabla resistente para preparación de alimentos.'},
  {id:'hermeticos',name:'Recipientes herméticos',tier:'eco',favorite:false,emoji:'🫙',order:5,delivery:'reception',description:'Juego de recipientes para conservar alimentos.'},
  {id:'escurridor',name:'Escurridor de platos',tier:'eco',favorite:false,emoji:'🍽️',order:6,delivery:'reception',description:'Escurridor práctico y resistente para cocina.'},
  {id:'toallas',name:'Juego de toallas',tier:'eco',favorite:false,emoji:'🛁',order:7,delivery:'reception',description:'Juego de toallas de baño y manos de buena absorción.'},
  {id:'protector',name:'Protector de colchón',tier:'eco',favorite:false,emoji:'🛏️',order:8,delivery:'reception',description:'Protector lavable para colchón de 2 plazas.'},
  {id:'alfombra-bano',name:'Alfombra antideslizante',tier:'eco',favorite:false,emoji:'🧼',order:9,delivery:'reception',description:'Alfombra antideslizante y absorbente para el baño.'},
  {id:'organizador-bano',name:'Organizador para baño',tier:'eco',favorite:false,emoji:'🧺',order:10,delivery:'reception',description:'Organizador compacto para artículos de higiene.'},
  {id:'tazas',name:'Juego de tazas',tier:'eco',favorite:false,emoji:'☕',order:11,delivery:'reception',description:'Preferiblemente 8 a 12 tazas para café, té y otras bebidas.'},
  {id:'botiquin',name:'Botiquín de primeros auxilios',tier:'eco',favorite:false,emoji:'🩹',order:12,delivery:'reception',description:'Botiquín doméstico con suministros básicos.'},

  {id:'vajilla',name:'Juego de vajilla',tier:'mid',favorite:true,emoji:'🍽️',order:13,delivery:'reception',description:'Servicio de platos para 8 a 12 personas; preferiblemente para 12 comensales.'},
  {id:'cama',name:'Juego de cama completo',tier:'mid',favorite:true,emoji:'🛏️',order:14,delivery:'reception',description:'Un solo conjunto de ropa de cama para 2 plazas: sábanas, fundas y edredón. Colores preferidos: marrón, beige, gris o tonos neutros.'},
  {id:'ollas',name:'Juego de ollas',tier:'mid',favorite:false,emoji:'🥘',order:15,delivery:'reception',description:'Juego de ollas resistentes de distintos tamaños.'},
  {id:'sartenes',name:'Juego de sartenes',tier:'mid',favorite:false,emoji:'🍳',order:16,delivery:'reception',description:'Sartenes de distintos tamaños para uso diario.'},
  {id:'almohadas',name:'Juego de almohadas',tier:'mid',favorite:false,emoji:'☁️',order:17,delivery:'reception',description:'Par de almohadas cómodas para el dormitorio.'},
  {id:'veladores',name:'Par de veladores',tier:'mid',favorite:false,emoji:'🪵',order:18,delivery:'coordinate',description:'Dos mesas de noche de color blanco, beige o marrón. Medidas por confirmar.'},
  {id:'microondas',name:'Horno microondas',tier:'mid',favorite:false,emoji:'♨️',order:19,delivery:'coordinate',description:'Microondas de 20 litros de capacidad.'},
  {id:'barman',name:'Set de barman',tier:'mid',favorite:true,emoji:'🍸',order:20,delivery:'reception',description:'Juego de coctelería con coctelera, medidor, colador y accesorios.'},
  {id:'copas',name:'Juego de copas',tier:'mid',favorite:false,emoji:'🥂',order:23,delivery:'reception',description:'Preferiblemente 12 copas para reuniones y celebraciones.'},

  {id:'alacena',name:'Alacena de cocina',tier:'special',favorite:true,emoji:'🪑',order:24,delivery:'coordinate',description:'Color beige, roble natural o marrón claro, acorde con las paredes beige claro. Medidas por confirmar.'},
  {id:'sonido',name:'Equipo de sonido potente',tier:'special',favorite:true,emoji:'🔊',order:25,delivery:'coordinate',description:'Torre de sonido con Bluetooth, buena potencia y calidad de audio.'},

  // TRES REGALOS NUEVOS
  {id:'hervidor-electrico',name:'Hervidor eléctrico',tier:'eco',favorite:false,emoji:'🫖',order:26,delivery:'reception',description:'Hervidor eléctrico con apagado automático. Capacidad por definir.'},
  {id:'cafetera-electrica',name:'Cafetera eléctrica',tier:'mid',favorite:false,emoji:'☕',order:27,delivery:'reception',description:'Cafetera eléctrica para uso doméstico. Tipo y capacidad por definir.'},
  {id:'aspiradora-vertical-2en1',name:'Aspiradora vertical inalámbrica 2 en 1',tier:'special',favorite:false,emoji:'🧹',order:28,delivery:'coordinate',description:'Aspiradora recargable, utilizable como aspiradora vertical y de mano. Autonomía por definir.'}
];

const NEW_GIFT_IDS = new Set([
  'hervidor-electrico',
  'cafetera-electrica',
  'aspiradora-vertical-2en1'
]);

const NEW_GIFTS = DEFAULT_GIFTS.filter(g => NEW_GIFT_IDS.has(g.id));

// Actualizar descripciones antiguas solo si no fueron editadas.
const LEGACY_GIFT_DESCRIPTIONS = Object.freeze({
  protector:'Protector lavable. Medida exacta del colchón por confirmar.',
  cama:'Un solo conjunto de ropa de cama: sábanas, fundas y edredón. Medidas por confirmar.',
  veladores:'Dos mesas de noche en colores neutros. Medidas por confirmar.',
  microondas:'Microondas de capacidad apropiada para el hogar.',
  sonido:'Con Bluetooth, buena potencia y calidad de audio. Características por definir.'
});

function applyNewSpecifications(gift) {
  const previous = LEGACY_GIFT_DESCRIPTIONS[gift.id];
  if (previous === undefined || gift.description !== previous) {
    return gift;
  }

  const updated = DEFAULT_GIFTS.find(g => g.id === gift.id);
  return updated ? {...gift, description:updated.description} : gift;
}

// Fotografias referenciales de los regalos existentes.
const GIFT_PHOTO_IDS = Object.freeze({
  vasos:6387830,
  utensilios:17542995,
  cuchillos:16443132,
  hermeticos:8580786,
  escurridor:10397049,
  toallas:4210371,
  protector:9893931,
  'alfombra-bano':7546609,
  'organizador-bano':33429884,
  tazas:8063827,
  botiquin:5664736,
  vajilla:6611480,
  cama:7303691,
  ollas:30981356,
  sartenes:2868977,
  almohadas:3755585,
  veladores:18145480,
  microondas:4686822,
  barman:38772777,
  copas:16545926,
  alacena:5556176,
  sonido:28739306,
  'hervidor-electrico':3847574,
  'cafetera-electrica':4993062,
  'aspiradora-vertical-2en1':12167653
});

const $ = selector => document.querySelector(selector);

const esc = value => String(value ?? '').replace(
  /[&<>"']/g,
  ch => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  })[ch]
);

const safeRead = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // El navegador puede tener el almacenamiento deshabilitado.
  }
};

const tierName = tier => ({
  eco:'Económico',
  mid:'Intermedio',
  special:'Especial'
})[tier] || 'Regalo';

const isAfterWedding = () => Date.now() >= WEDDING_UNLOCK_UTC;

const isFirebaseConfigured = () => {
  const c = window.FIREBASE_CONFIG;
  return Boolean(
    c &&
    c.apiKey &&
    c.authDomain &&
    c.projectId &&
    c.appId &&
    !String(c.apiKey).includes('...') &&
    !String(c.projectId).startsWith('tu-')
  );
};

const state = {
  mode:'demo',
  gifts:[],
  demoReservations:[],
  myReservations:[],
  adminReservations:[],
  filter:'all',
  tab:'physical',
  user:null,
  isAdmin:false,
  reveal:false,
  demoReveal:false,
  firebase:null,
  fb:null,
  unsubGifts:null,
  unsubOwn:null,
  unsubSettings:null,
  unsubAdmin:null,
  busy:false,
  selectedGift:null,
  editingGift:null,
  error:null
};

function setBanner(message, type='demo') {
  const el = $('#status-banner');
  el.textContent = message;
  el.className = 'status-banner ' + type;
}

let toastTimer;

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4200);
}

function getGift(id) {
  return state.gifts.find(g => g.id === id);
}

function getReservations() {
  return state.mode === 'demo'
    ? state.demoReservations
    : state.adminReservations;
}

function loadDemo() {
  const edits = safeRead(STORAGE_CATALOG, {});

  state.gifts = DEFAULT_GIFTS.map(g =>
    applyNewSpecifications({...g, ...(edits[g.id] || {})})
  );

  state.demoReservations = safeRead(STORAGE_RESERVATIONS, [])
    .filter(r => DEFAULT_GIFTS.some(g => g.id === r.giftId));

  state.myReservations = state.demoReservations;

  state.gifts = state.gifts.map(g => ({
    ...g,
    status:state.demoReservations.some(r => r.giftId === g.id)
      ? 'reserved'
      : 'available'
  }));
}

function persistDemo() {
  safeWrite(STORAGE_RESERVATIONS, state.demoReservations);
  state.myReservations = state.demoReservations;

  state.gifts = state.gifts.map(g => ({
    ...g,
    status:state.demoReservations.some(r => r.giftId === g.id)
      ? 'reserved'
      : 'available'
  }));

  renderAll();
}

function renderAll() {
  renderCatalog();
  renderMyReservations();
  renderAdmin();
}

function renderCatalog() {
  const gifts = state.gifts.filter(g => !RETIRED_GIFT_IDS.has(g.id));

  $('#available-count').textContent =
    gifts.filter(g => g.status === 'available').length;

  $('#reserved-count').textContent =
    gifts.filter(g => g.status === 'reserved').length;

  $('#tier-filter').value = state.filter;

  const filtered = gifts.filter(g =>
    state.filter === 'all' ||
    (state.filter === 'favorite' && g.favorite) ||
    (state.filter === 'available' && g.status === 'available') ||
    g.tier === state.filter
  ).sort((a, b) => a.order - b.order);

  $('#gift-grid').innerHTML = filtered.length
    ? filtered.map(g => {
        const available = g.status === 'available';
        const photoId = GIFT_PHOTO_IDS[g.id];

        const photoUrl = photoId
          ? `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop`
          : '';

        return `
          <article class="gift-card ${available ? '' : 'reserved'}">
            <div class="gift-art">
              <span class="emoji" aria-hidden="true">${esc(g.emoji || '🎁')}</span>

              ${photoUrl ? `
                <img
                  class="gift-photo"
                  src="${photoUrl}"
                  alt="Fotografía referencial de ${esc(g.name)}"
                  loading="lazy"
                  decoding="async"
                >
                <span class="photo-note">Imagen referencial</span>
              ` : ''}

              ${g.favorite
                ? '<span class="favorite-mark">♡ Elegido por nosotros</span>'
                : ''}
            </div>

            <div class="gift-card-body">
              <span class="gift-tier">${esc(tierName(g.tier))}</span>
              <h3>${esc(g.name)}</h3>
              <p>${esc(g.description)}</p>

              <div class="gift-card-foot">
                <span class="gift-status ${available ? 'available' : 'reserved'}">
                  ${available ? '● Disponible' : '🔒 Reservado'}
                </span>

                <button
                  type="button"
                  class="button ${available ? 'button-primary' : 'button-outline'} button-small"
                  data-action="reserve"
                  data-id="${esc(g.id)}"
                  ${available && state.mode !== 'error' ? '' : 'disabled'}
                >
                  ${available ? 'Reservar regalo' : 'No disponible'}
                </button>
              </div>
            </div>
          </article>
        `;
      }).join('')
    : '<div class="empty-state">No hay regalos en esta categoría.</div>';
}

function renderMyReservations() {
  const own = state.myReservations.filter(r => getGift(r.giftId));
  const el = $('#my-reservations');

  if (!own.length) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }

  el.hidden = false;

  el.innerHTML = `
    <h3>Mis regalos reservados</h3>
    <p>Estas reservas están asociadas a este navegador y a tu sesión. Puedes cancelarlas si cambias de opinión.</p>

    ${own.map(r => `
      <div class="my-reservation-row">
        <strong>${esc(getGift(r.giftId)?.name || r.giftId)}</strong>
        <button
          class="button button-outline button-small"
          type="button"
          data-action="cancel-own"
          data-id="${esc(r.giftId)}"
        >
          Cancelar mi reserva
        </button>
      </div>
    `).join('')}
  `;
}

function renderAdmin() {
  const el = $('#admin-panel');

  if (state.mode === 'error') {
    el.innerHTML = `
      <div class="admin-notice">
        No se pudo iniciar Firebase.
        <strong>${esc(state.error || 'Error desconocido')}</strong>
      </div>
    `;
    return;
  }

  if (state.mode === 'firebase' && !state.isAdmin) {
    const uid = state.user?.uid;

    el.innerHTML = `
      <div class="admin-login">
        <h3>Acceso privado</h3>
        <p>Este panel está protegido con una cuenta Google autorizada.</p>

        <button
          type="button"
          class="button button-primary"
          data-action="admin-login"
        >
          Acceder con Google
        </button>

        ${state.user && !state.user.isAnonymous ? `
          <p>
            Esta cuenta todavía no es administradora.
            Verifica el documento <strong>admins/${esc(uid)}</strong>
            en Firebase.
          </p>
          <div class="admin-uid">${esc(uid)}</div>
          <button
            type="button"
            class="button button-outline button-small"
            data-action="admin-logout"
          >
            Cerrar sesión de Google
          </button>
        ` : ''}
      </div>
    `;
    return;
  }

  const gifts = state.gifts.filter(g => !RETIRED_GIFT_IDS.has(g.id));
  const reserved = gifts.filter(g => g.status === 'reserved');

  // El boton se construye directamente dentro del panel.
  // No desaparece cuando Firebase vuelve a dibujar la pagina.
  const missingNewGifts = state.mode === 'firebase'
    ? NEW_GIFTS.filter(g => !gifts.some(existing => existing.id === g.id))
    : [];

  const unlocked = state.mode === 'demo'
    ? state.demoReveal
    : state.reveal && isAfterWedding();

  const records = getReservations();

  const nameFor = id => unlocked
    ? (records.find(r => r.giftId === id)?.name || 'Sin datos')
    : '🔒 Sorpresa';

  const countRow = `
    <div class="stat-grid">
      <div class="stat">
        <strong>${gifts.length}</strong>
        <span>Regalos</span>
      </div>
      <div class="stat">
        <strong>${reserved.length}</strong>
        <span>Reservados</span>
      </div>
      <div class="stat">
        <strong>${gifts.length - reserved.length}</strong>
        <span>Disponibles</span>
      </div>
    </div>
  `;

  const demoNotice = state.mode === 'demo'
    ? '<div class="admin-notice"><strong>Panel de prueba:</strong> los datos se guardan solo en este navegador.</div>'
    : '';

  const controls = state.mode === 'demo'
    ? `
      <button
        class="button button-outline button-small"
        type="button"
        data-action="demo-reveal"
      >
        ${state.demoReveal ? 'Ocultar nombres (demo)' : 'Simular revelación de nombres'}
      </button>

      <button
        class="button button-outline button-small"
        type="button"
        data-action="demo-reset"
      >
        Restablecer prueba
      </button>
    `
    : `
      ${!gifts.length ? `
        <button
          class="button button-primary button-small"
          type="button"
          data-action="seed"
        >
          Cargar los 25 regalos iniciales
        </button>
      ` : ''}

      ${gifts.length && missingNewGifts.length ? `
        <button
          class="button button-primary button-small"
          type="button"
          data-action="add-new-gifts"
        >
          Agregar ${missingNewGifts.length} regalos nuevos
        </button>
      ` : ''}

      ${!state.reveal ? `
        <button
          class="button button-outline button-small"
          type="button"
          data-action="reveal"
          ${isAfterWedding() ? '' : 'disabled'}
        >
          Revelar nombres después de la boda
        </button>
      ` : ''}

      <button
        class="button button-outline button-small"
        type="button"
        data-action="admin-logout"
      >
        Salir del panel
      </button>
    `;

  const revealNotice = unlocked
    ? `
      <div class="admin-notice">
        <strong>Identidades reveladas.</strong>
        Los nombres y teléfonos solo son visibles aquí.
      </div>
    `
    : `
      <div class="admin-notice">
        <strong>🔒 Modo sorpresa activo.</strong>
        Verán qué regalos están reservados, pero no los nombres.
        ${state.mode === 'firebase'
          ? 'El desbloqueo manual estará disponible desde el 22 de noviembre de 2026 (hora de Perú).'
          : 'En esta demostración pueden simular la revelación.'}
      </div>
    `;

  el.innerHTML = `
    <div class="admin-header">
      <h3>Resumen de regalos</h3>
      <span class="pill">
        ${state.mode === 'demo' ? 'Prueba local' : 'Firebase · acceso protegido'}
      </span>
    </div>

    <p class="admin-subtitle">
      ${state.mode === 'demo'
        ? 'Sin sincronización entre dispositivos'
        : 'Actualización automática entre dispositivos'}
    </p>

    ${countRow}
    ${demoNotice}
    ${revealNotice}

    <div class="admin-actions">
      ${controls}

      ${unlocked ? `
        <button
          class="button button-outline button-small"
          type="button"
          data-action="export"
        >
          Exportar reservas CSV
        </button>
      ` : ''}
    </div>

    <div class="admin-scroll">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Regalo</th>
            <th>Estado</th>
            <th>Quién reservó</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          ${gifts.slice().sort((a, b) => a.order - b.order).map(g => `
            <tr>
              <td>${esc(g.name)}</td>

              <td>
                <span class="pill ${g.status === 'available' ? 'ok' : ''}">
                  ${g.status === 'available' ? 'Disponible' : 'Reservado'}
                </span>
              </td>

              <td>
                ${g.status === 'reserved' ? esc(nameFor(g.id)) : '—'}
              </td>

              <td>
                <button
                  type="button"
                  class="button button-outline button-small"
                  data-action="edit"
                  data-id="${esc(g.id)}"
                >
                  Editar
                </button>

                ${g.status === 'reserved' ? `
                  <button
                    type="button"
                    class="button button-danger button-small"
                    data-action="cancel-admin"
                    data-id="${esc(g.id)}"
                  >
                    Liberar
                  </button>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${unlocked && records.length ? `
      <p class="admin-subtitle">
        Contactos de reservas reveladas:
        ${records.map(r =>
          `${esc(r.name)} (${esc(r.whatsapp)})`
        ).join(' · ')}
      </p>
    ` : ''}
  `;
}

function setTab(tab) {
  state.tab = tab;

  $('#physical-panel').hidden = tab !== 'physical';
  $('#contribution-panel').hidden = tab !== 'contribution';

  document.querySelectorAll('[data-tab]').forEach(button => {
    const active = button.dataset.tab === tab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
}

function openReserve(id) {
  const gift = getGift(id);

  if (!gift || gift.status !== 'available') {
    return toast('Este regalo ya no está disponible.');
  }

  state.selectedGift = id;
  $('#reserve-gift-name').textContent =
    gift.name + ' · ' + gift.description;

  $('#delivery-note').textContent =
    gift.delivery === 'coordinate'
      ? 'Por su tamaño o características, la entrega se coordinará de manera privada. No publicaremos la dirección de los novios.'
      : 'Puedes entregar este regalo en la recepción o coordinarlo con los novios.';

  $('#reserve-form').reset();
  $('#reserve-error').hidden = true;
  $('#reserve-dialog').showModal();
}

function openEdit(id) {
  const gift = getGift(id);
  if (!gift) return;

  state.editingGift = id;
  $('#edit-form').reset();

  $('#edit-name').value = gift.name;
  $('#edit-desc').value = gift.description;
  $('#edit-tier').value = gift.tier;
  $('#edit-error').hidden = true;

  $('#edit-dialog').showModal();
}

function displayError(selector, error) {
  const el = $(selector);
  el.hidden = false;
  el.textContent = error;
}

function friendlyError(error) {
  const code = error?.code || '';

  if (code === 'permission-denied') {
    return 'Permiso denegado. Revisa las reglas de Firestore y que el usuario esté autenticado.';
  }

  if (code === 'unavailable') {
    return 'No hay conexión con Firebase. Revisa internet e inténtalo de nuevo.';
  }

  if (code === 'auth/unauthorized-domain') {
    return 'Debes agregar este dominio a Firebase Authentication > Dominios autorizados.';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Activa el inicio de sesión anónimo y Google en Firebase Authentication.';
  }

  return error?.message || String(error);
}

async function reserveGift(name, whatsapp) {
  const giftId = state.selectedGift;

  if (state.mode === 'demo') {
    if (state.demoReservations.some(r => r.giftId === giftId)) {
      throw new Error('El regalo ya está reservado.');
    }

    state.demoReservations.push({
      giftId,
      name,
      whatsapp,
      uid:'demo',
      createdAt:new Date().toISOString()
    });

    persistDemo();
    return;
  }

  if (state.mode !== 'firebase' || !state.user) {
    throw new Error('Espera a que se inicie tu sesión en Firebase.');
  }

  const f = state.fb;
  const db = state.firebase.db;
  const uid = state.user.uid;

  await f.runTransaction(db, async transaction => {
    const giftRef = f.doc(db, 'gifts', giftId);
    const resRef = f.doc(db, 'reservations', giftId);

    const gift = await transaction.get(giftRef);

    if (!gift.exists() || gift.data().status !== 'available') {
      throw new Error('Este regalo acaba de ser reservado por otra persona. Elige otro.');
    }

    transaction.update(giftRef, {
      status:'reserved',
      updatedAt:f.serverTimestamp()
    });

    transaction.set(resRef, {
      giftId,
      uid,
      name,
      whatsapp,
      createdAt:f.serverTimestamp()
    });
  });
}

async function cancelOwn(giftId) {
  if (!confirm('¿Deseas cancelar esta reserva y dejar el regalo disponible para otro invitado?')) {
    return;
  }

  if (state.mode === 'demo') {
    state.demoReservations = state.demoReservations.filter(
      r => r.giftId !== giftId
    );

    persistDemo();
    toast('Reserva cancelada.');
    return;
  }

  const f = state.fb;
  const db = state.firebase.db;
  const uid = state.user?.uid;

  await f.runTransaction(db, async tx => {
    const gr = f.doc(db, 'gifts', giftId);
    const rr = f.doc(db, 'reservations', giftId);

    const gift = await tx.get(gr);
    const reservation = await tx.get(rr);

    if (
      !gift.exists() ||
      !reservation.exists() ||
      reservation.data().uid !== uid
    ) {
      throw new Error('No se encontró una reserva tuya para este regalo.');
    }

    tx.update(gr, {
      status:'available',
      updatedAt:f.serverTimestamp()
    });

    tx.delete(rr);
  });

  toast('Tu reserva fue cancelada.');
}

async function cancelAdmin(giftId) {
  if (!confirm('¿Liberar este regalo? La reserva se eliminará y quedará disponible para los invitados.')) {
    return;
  }

  if (state.mode === 'demo') {
    state.demoReservations = state.demoReservations.filter(
      r => r.giftId !== giftId
    );

    persistDemo();
    toast('Regalo liberado.');
    return;
  }

  if (!state.isAdmin) {
    throw new Error('No tienes acceso de administrador.');
  }

  const f = state.fb;
  const db = state.firebase.db;
  const batch = f.writeBatch(db);

  batch.update(f.doc(db, 'gifts', giftId), {
    status:'available',
    updatedAt:f.serverTimestamp()
  });

  batch.delete(f.doc(db, 'reservations', giftId));

  await batch.commit();
  toast('Regalo liberado.');
}

async function saveEdit() {
  const id = state.editingGift;

  const patch = {
    name:$('#edit-name').value.trim(),
    description:$('#edit-desc').value.trim(),
    tier:$('#edit-tier').value
  };

  if (!patch.name || !patch.description) {
    throw new Error('Completa nombre y descripción.');
  }

  if (state.mode === 'demo') {
    const edits = safeRead(STORAGE_CATALOG, {});

    edits[id] = {
      ...(edits[id] || {}),
      ...patch
    };

    safeWrite(STORAGE_CATALOG, edits);

    state.gifts = state.gifts.map(g =>
      g.id === id ? {...g, ...patch} : g
    );

    renderAll();
    return;
  }

  if (!state.isAdmin) {
    throw new Error('Solo los novios pueden editar el catálogo.');
  }

  await state.fb.updateDoc(
    state.fb.doc(state.firebase.db, 'gifts', id),
    {...patch, updatedAt:state.fb.serverTimestamp()}
  );
}

async function seedCatalog() {
  if (
    state.mode !== 'firebase' ||
    !state.isAdmin ||
    state.gifts.length
  ) {
    throw new Error('El catálogo ya existe o no tienes acceso.');
  }

  const f = state.fb;
  const db = state.firebase.db;

  for (let i = 0; i < DEFAULT_GIFTS.length; i += 8) {
    const batch = f.writeBatch(db);

    for (const gift of DEFAULT_GIFTS.slice(i, i + 8)) {
      batch.set(
        f.doc(db, 'gifts', gift.id),
        {
          ...gift,
          status:'available',
          updatedAt:f.serverTimestamp()
        }
      );
    }

    await batch.commit();
  }

  const settingsRef = f.doc(db, 'settings', 'control');

  if (!(await f.getDoc(settingsRef)).exists()) {
    await f.setDoc(settingsRef, {
      revealNames:false,
      updatedAt:f.serverTimestamp()
    });
  }

  toast('Los 25 regalos ya están cargados en Firebase.');
}

// Agrega solamente los regalos nuevos que aun no existen.
// NO modifica reservas ni sobrescribe regalos existentes.
async function addNewGifts() {
  if (state.mode !== 'firebase' || !state.isAdmin) {
    throw new Error('Solo los administradores pueden agregar regalos.');
  }

  const f = state.fb;
  const db = state.firebase.db;
  let added = 0;

  for (const gift of NEW_GIFTS) {
    const wasAdded = await f.runTransaction(db, async tx => {
      const ref = f.doc(db, 'gifts', gift.id);
      const existing = await tx.get(ref);

      if (existing.exists()) {
        return false;
      }

      tx.set(ref, {
        ...gift,
        status:'available',
        updatedAt:f.serverTimestamp()
      });

      return true;
    });

    if (wasAdded) {
      added++;
    }
  }

  toast(
    added
      ? `${added} regalo(s) nuevo(s) agregado(s) a Firebase.`
      : 'Los tres regalos ya existen en Firebase.'
  );
}

async function revealNames() {
  if (!state.isAdmin || !isAfterWedding()) {
    throw new Error('Solo podrás revelar los nombres después de la boda.');
  }

  if (!confirm('¿Revelar definitivamente los nombres de quienes reservaron regalos?')) {
    return;
  }

  await state.fb.updateDoc(
    state.fb.doc(state.firebase.db, 'settings', 'control'),
    {
      revealNames:true,
      updatedAt:state.fb.serverTimestamp()
    }
  );

  toast('Identidades reveladas.');
}

function exportCsv() {
  const unlocked = state.mode === 'demo'
    ? state.demoReveal
    : state.isAdmin && state.reveal && isAfterWedding();

  if (!unlocked) {
    return toast('Los nombres siguen protegidos por el modo sorpresa.');
  }

  const records = getReservations();
  const quote = value =>
    '"' + String(value ?? '').replace(/"/g, '""') + '"';

  const lines = [
    ['Regalo', 'Nombre', 'WhatsApp', 'Fecha de reserva']
      .map(quote)
      .join(',')
  ];

  for (const r of records) {
    lines.push([
      getGift(r.giftId)?.name || r.giftId,
      r.name,
      r.whatsapp,
      r.createdAt?.toDate?.()?.toISOString?.() || r.createdAt || ''
    ].map(quote).join(','));
  }

  const blob = new Blob(
    ['\ufeff' + lines.join('\r\n')],
    {type:'text/csv;charset=utf-8'}
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = 'reservas_gerson_anayeli.csv';
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function attachOwnListener() {
  if (state.unsubOwn) {
    state.unsubOwn();
    state.unsubOwn = null;
  }

  state.myReservations = [];

  if (!state.user) return;

  const f = state.fb;
  const db = state.firebase.db;

  state.unsubOwn = f.onSnapshot(
    f.query(
      f.collection(db, 'reservations'),
      f.where('uid', '==', state.user.uid)
    ),
    snapshot => {
      state.myReservations = snapshot.docs.map(d => ({
        id:d.id,
        ...d.data()
      }));

      renderMyReservations();
    },
    error => {
      console.error('Mis reservas:', error);
      toast('No se pudieron cargar tus reservas: ' + friendlyError(error));
    }
  );
}

function attachAdminReservations() {
  if (state.unsubAdmin) {
    state.unsubAdmin();
    state.unsubAdmin = null;
  }

  state.adminReservations = [];

  if (!state.isAdmin || !state.reveal || !isAfterWedding()) {
    return;
  }

  const f = state.fb;

  state.unsubAdmin = f.onSnapshot(
    f.collection(state.firebase.db, 'reservations'),
    snapshot => {
      state.adminReservations = snapshot.docs.map(d => ({
        id:d.id,
        ...d.data()
      }));

      renderAdmin();
    },
    error => {
      console.error('Reservas admin:', error);
      toast(friendlyError(error));
    }
  );
}

function attachSettingsListener() {
  if (state.unsubSettings) {
    state.unsubSettings();
    state.unsubSettings = null;
  }

  state.reveal = false;

  if (!state.isAdmin) return;

  const f = state.fb;

  state.unsubSettings = f.onSnapshot(
    f.doc(state.firebase.db, 'settings', 'control'),
    snapshot => {
      state.reveal = Boolean(
        snapshot.exists() && snapshot.data().revealNames
      );

      attachAdminReservations();
      renderAdmin();
    },
    error => {
      console.error('Configuración:', error);
      toast(friendlyError(error));
    }
  );
}

async function initFirebase() {
  try {
    const root = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;

    const [app, auth, firestore] = await Promise.all([
      import(`${root}/firebase-app.js`),
      import(`${root}/firebase-auth.js`),
      import(`${root}/firebase-firestore.js`)
    ]);

    const f = {...app, ...auth, ...firestore};
    state.fb = f;

    const firebaseApp = f.initializeApp(window.FIREBASE_CONFIG);
    const firebaseAuth = f.getAuth(firebaseApp);
    const db = f.getFirestore(firebaseApp);

    state.firebase = {
      app:firebaseApp,
      auth:firebaseAuth,
      db
    };

    state.mode = 'firebase';

    setBanner(
      'FIREBASE CONECTADO · Reservas sincronizadas en tiempo real',
      'live'
    );

    state.unsubGifts = f.onSnapshot(
      f.collection(db, 'gifts'),
      snapshot => {
        state.gifts = snapshot.docs
          .map(d => applyNewSpecifications({
            id:d.id,
            ...d.data()
          }))
          .filter(g => !RETIRED_GIFT_IDS.has(g.id))
          .sort((a, b) => a.order - b.order);

        renderAll();
      },
      error => {
        console.error('Catálogo Firebase:', error);
        setBanner(
          'Error al leer regalos: ' + friendlyError(error),
          'error'
        );
      }
    );

    f.onAuthStateChanged(firebaseAuth, async user => {
      if (!user) {
        state.user = null;
        state.isAdmin = false;
        state.reveal = false;

        attachOwnListener();
        renderAll();

        try {
          await f.signInAnonymously(firebaseAuth);
        } catch (error) {
          setBanner(
            'Activa el acceso anónimo en Firebase: ' + friendlyError(error),
            'error'
          );
        }

        return;
      }

      state.user = user;

      try {
        const admin = await f.getDoc(
          f.doc(db, 'admins', user.uid)
        );

        state.isAdmin =
          admin.exists() && admin.data().enabled === true;
      } catch (error) {
        state.isAdmin = false;
        console.error('Verificación admin:', error);
      }

      attachOwnListener();
      attachSettingsListener();
      renderAll();
    });

    renderAll();

  } catch (error) {
    console.error('Firebase init:', error);

    state.mode = 'error';
    state.error = friendlyError(error);

    setBanner(
      'No se pudo conectar Firebase · ' + state.error,
      'error'
    );

    renderAll();
  }
}

async function handleAction(button) {
  const action = button.dataset.action;
  const id = button.dataset.id;

  if (state.busy) return;

  try {
    if (action === 'reserve') {
      return openReserve(id);
    }

    if (action === 'edit') {
      return openEdit(id);
    }

    if (action === 'demo-reveal') {
      state.demoReveal = !state.demoReveal;
      renderAdmin();
      return;
    }

    if (action === 'demo-reset') {
      if (!confirm('¿Borrar todas las reservas y ediciones de esta prueba local?')) {
        return;
      }

      state.demoReservations = [];
      safeWrite(STORAGE_CATALOG, {});
      loadDemo();
      state.demoReveal = false;

      renderAll();
      toast('Prueba reiniciada.');
      return;
    }

    if (action === 'export') {
      return exportCsv();
    }

    if (action === 'admin-login') {
      if (!state.firebase) {
        throw new Error('Firebase no está conectado.');
      }

      await state.fb.signInWithPopup(
        state.firebase.auth,
        new state.fb.GoogleAuthProvider()
      );

      return;
    }

    if (action === 'admin-logout') {
      if (!state.firebase) return;

      await state.fb.signOut(state.firebase.auth);
      toast('Sesión de administrador cerrada.');
      return;
    }

    state.busy = true;
    button.disabled = true;

    if (action === 'cancel-own') {
      await cancelOwn(id);
    }

    if (action === 'cancel-admin') {
      await cancelAdmin(id);
    }

    if (action === 'seed') {
      await seedCatalog();
    }

    if (action === 'add-new-gifts') {
      await addNewGifts();
    }

    if (action === 'reveal') {
      await revealNames();
    }

  } catch (error) {
    console.error(error);
    toast(friendlyError(error));

  } finally {
    state.busy = false;
    button.disabled = false;
  }
}

function registerEvents() {
  document.addEventListener('error', event => {
    if (
      event.target instanceof HTMLImageElement &&
      event.target.classList.contains('gift-photo')
    ) {
      const container = event.target.parentElement;
      event.target.remove();
      container?.querySelector('.photo-note')?.remove();
    }
  }, true);

  document.addEventListener('click', event => {
    const tab = event.target.closest('[data-tab]');

    if (tab) {
      setTab(tab.dataset.tab);
      return;
    }

    const close = event.target.closest('[data-close]');

    if (close) {
      document.getElementById(close.dataset.close)?.close();
      return;
    }

    const button = event.target.closest('[data-action]');

    if (button) {
      handleAction(button);
    }
  });

  $('#tier-filter').addEventListener('change', event => {
    state.filter = event.target.value;
    renderCatalog();
  });

  $('#reserve-form').addEventListener('submit', async event => {
    event.preventDefault();

    if (state.busy) return;

    const name = $('#guest-name').value.trim();
    const whatsapp = $('#guest-phone').value.trim();

    if (
      name.length < 3 ||
      !/^\+?[0-9 ()-]{7,20}$/.test(whatsapp)
    ) {
      return displayError(
        '#reserve-error',
        'Revisa tu nombre y número de contacto.'
      );
    }

    state.busy = true;
    $('#reserve-submit').disabled = true;
    $('#reserve-error').hidden = true;

    try {
      await reserveGift(name, whatsapp);

      $('#reserve-dialog').close();

      toast(
        '¡Gracias! Tu regalo ha quedado reservado. Puedes verlo en «Mis regalos reservados».'
      );

    } catch (error) {
      displayError('#reserve-error', friendlyError(error));

    } finally {
      state.busy = false;
      $('#reserve-submit').disabled = false;
    }
  });

  $('#edit-form').addEventListener('submit', async event => {
    event.preventDefault();

    if (state.busy) return;

    state.busy = true;
    $('#edit-submit').disabled = true;
    $('#edit-error').hidden = true;

    try {
      await saveEdit();

      $('#edit-dialog').close();
      toast('Regalo actualizado.');

    } catch (error) {
      displayError('#edit-error', friendlyError(error));

    } finally {
      state.busy = false;
      $('#edit-submit').disabled = false;
    }
  });

  for (const modal of document.querySelectorAll('dialog')) {
    modal.addEventListener('click', event => {
      if (event.target === modal) {
        modal.close();
      }
    });
  }
}

function main() {
  registerEvents();

  if (isFirebaseConfigured()) {
    state.mode = 'loading';

    state.gifts = DEFAULT_GIFTS.map(g => ({
      ...g,
      status:'available'
    }));

    setBanner('Conectando con Firebase…', 'demo');
    renderAll();
    initFirebase();

  } else {
    state.mode = 'demo';

    loadDemo();

    setBanner(
      'MODO DEMOSTRACIÓN LOCAL · No sincroniza otros celulares',
      'demo'
    );

    renderAll();
  }
}

main();
