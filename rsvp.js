/*
  Confirmacion personalizada de Gerson & Anayeli.
  Los nombres y cupos se leen desde Firestore con un token privado por enlace.
  Este archivo publico NO contiene la lista de invitados.
*/
(() => {
  'use strict';

  // Fecha de respaldo para invitaciones antiguas que no tengan deadlineAt.
  // Corresponde al 14/11/2026 a las 23:59:59 en Peru.
  const DEADLINE_UTC = Date.parse('2026-11-15T05:00:00Z');

  // Las invitaciones nuevas pueden tener una fecha limite propia en Firestore.
  // deadlineAt debe guardarse como tipo Timestamp.
  function getDeadlineMs(invite) {
    const value = invite && invite.deadlineAt;
    return value && typeof value.toMillis === 'function'
      ? value.toMillis()
      : DEADLINE_UTC;
  }

  function formatDeadline(deadlineMs) {
    return new Intl.DateTimeFormat('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Lima'
    }).format(new Date(deadlineMs));
  }
  const $ = id => document.getElementById(id);
  const token = new URLSearchParams(window.location.search).get('i') || '';
  const state = {db:null, ref:null, invite:null, saving:false};

  function setSummary(title, subtitle, label='INVITACION PERSONALIZADA') {
    const box = $('rsvpGuestSummary');
    if (!box) return;
    const a = document.createElement('span');
    const b = document.createElement('strong');
    const c = document.createElement('span');
    a.textContent = label;
    b.textContent = title;
    c.textContent = subtitle;
    box.replaceChildren(a, b, c);
  }

  function setHint(text) {
    $('rsvpSectionHint').textContent = text;
  }

  function setError(message) {
    const error = $('rsvpError');
    error.textContent = message;
    error.hidden = false;
  }

  function showToast(message) {
    const el = $('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 4500);
  }

  function updateCountOptions(quota, selected) {
    const el = $('guestCount');
    el.replaceChildren();
    for (let n = 1; n <= quota; n++) {
      const option = document.createElement('option');
      option.value = String(n);
      option.textContent = n + (n === 1 ? ' persona' : ' personas');
      el.appendChild(option);
    }
    el.value = String(selected >= 1 && selected <= quota ? selected : 1);
  }

  function renderQr(invite) {
    const section = $('qrPaseSection');
    const image = $('qrPaseImage');
    const family = $('qrPaseFamily');
    const count = $('qrPaseCount');
    const error = $('qrPaseError');
    if (!section || !image || !family || !count) return;

    const qrUrl = new URL('qr-familias/' + encodeURIComponent(token) + '.svg', window.location.href).href;

    section.hidden = false;
    family.textContent = invite.family;
    count.textContent = invite.quota + (invite.quota === 1 ? ' pase asignado' : ' pases asignados');
    image.alt = 'Código QR de ingreso para ' + invite.family;
    image.onload = () => {
      if (error) error.hidden = true;
    };
    image.onerror = () => {
      if (error) error.hidden = false;
      image.removeAttribute('src');
    };
    image.src = qrUrl;
  }

  function renderInvite() {
    const invite = state.invite;
    if (!invite) return;

    const quota = invite.quota;
    const answer = invite.status || 'pending';
    const count = Number(invite.confirmedCount || 0);
    const deadlineMs = getDeadlineMs(invite);
    const deadlineText = formatDeadline(deadlineMs);
    const closed = Date.now() >= deadlineMs;

    $('guestGreeting').textContent = 'Con mucho cariño, hemos reservado ' +
      (quota === 1 ? 'un pase' : quota + ' pases') + ' para ' + invite.family + '.';

    let status = 'Aun no han confirmado su asistencia.';
    if (answer === 'yes') status = 'Asistencia confirmada: ' + count + (count === 1 ? ' persona.' : ' personas.');
if (answer === 'no') status = 'Nos indicaron que no podrán asistir.';

setSummary(invite.family, quota + (quota === 1 ? ' pase asignado. ' : ' pases asignados. ') + status);
$('rsvpFamilyName').textContent = invite.family;
    $('rsvpQuota').textContent = 'Pases disponibles para confirmar: hasta ' + quota;
    $('rsvpBtn').disabled = closed;
    $('rsvpBtn').textContent = closed ? 'Confirmaciones cerradas' :
  (answer === 'pending' ? '♡ Confirmar asistencia' : '♡ Modificar mi respuesta');

    setHint(closed
      ? 'La fecha limite de confirmacion fue el ' + deadlineText + '.'
      : 'Puedes confirmar hasta ' + quota + ' personas y modificar tu respuesta hasta el ' + deadlineText + '.');

    $('attendance').value = answer === 'no' ? 'no' : 'si';
    updateCountOptions(quota, count);
    $('countRow').hidden = $('attendance').value === 'no';
    renderQr(invite);
  }

  function closeModal() {
    $('rsvpModal').classList.remove('show');
    $('rsvpError').hidden = true;
    $('rsvpFeedback').hidden = true;
  }

  async function ensureSignedIn(auth) {
    const current = await new Promise((resolve, reject) => {
      let unsubscribe = () => {};
      unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve(user);
      }, reject);
    });
    if (current) return current;
    return (await auth.signInAnonymously()).user;
  }

  async function init() {
    $('rsvpBtn').disabled = true;

    if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) {
      if ($('qrPaseSection')) $('qrPaseSection').hidden = true;
      setSummary('Invitacion sin identificar',
        'Abre el enlace personalizado que recibiste de Gerson y Anayeli.');
      setHint('Cada familia o invitado tiene un enlace propio con sus pases.');
      return;
    }

    if (!window.firebase || !window.FIREBASE_CONFIG) {
      setSummary('No pudimos cargar la confirmacion',
        'Falta la configuracion de Firebase. Comunicate con los novios.');
      return;
    }

    try {
      if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
      const auth = firebase.auth();
      state.db = firebase.firestore();
      await ensureSignedIn(auth);
      state.ref = state.db.collection('invitaciones').doc(token);

      // La suscripcion permite ver la respuesta actualizada desde cualquier dispositivo.
      state.ref.onSnapshot(snapshot => {
        if (!snapshot.exists) {
          state.invite = null;
          if ($('qrPaseSection')) $('qrPaseSection').hidden = true;
          $('rsvpBtn').disabled = true;
          setSummary('No encontramos esta invitacion',
            'Revisa que el enlace este completo o consulta con los novios.');
          return;
        }
        const data = snapshot.data();
        if (!Number.isInteger(data.quota) || data.quota < 1 || data.quota > 20 || typeof data.family !== 'string') {
          throw new Error('Datos de invitacion invalidos.');
        }
        state.invite = data;
        renderInvite();
      }, error => {
        console.error('Invitacion:', error);
        $('rsvpBtn').disabled = true;
        setSummary('No se pudo consultar la invitacion',
          'Revisa la conexion y las reglas de Firestore.');
      });
    } catch (error) {
      console.error('RSVP:', error);
      setSummary('No se pudo conectar',
        'Intentalo nuevamente o solicita ayuda a los novios.');
      setHint(error?.message || 'Error al conectar con Firebase.');
    }
  }

  $('rsvpBtn').addEventListener('click', () => {
    if (!state.invite || Date.now() >= getDeadlineMs(state.invite)) return;
    renderInvite();
    $('rsvpError').hidden = true;
    $('rsvpFeedback').hidden = true;
    $('rsvpModal').classList.add('show');
  });

  $('closeModal').addEventListener('click', closeModal);
  $('rsvpModal').addEventListener('click', event => {
    if (event.target === $('rsvpModal')) closeModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModal();
  });

  $('attendance').addEventListener('change', () => {
    $('countRow').hidden = $('attendance').value === 'no';
  });

  $('rsvpForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (state.saving || !state.invite || !state.ref) return;
    if (Date.now() >= getDeadlineMs(state.invite)) return setError('El plazo de confirmacion ha finalizado.');

    const attendance = $('attendance').value;
    const confirmedCount = attendance === 'no' ? 0 : Number($('guestCount').value);
    if (!['si', 'no'].includes(attendance) || !Number.isInteger(confirmedCount) ||
        confirmedCount < (attendance === 'si' ? 1 : 0) || confirmedCount > state.invite.quota) {
      return setError('La cantidad elegida supera los pases asignados.');
    }

    state.saving = true;
    $('rsvpSubmit').disabled = true;
    $('rsvpError').hidden = true;

    try {
      const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
      await state.db.runTransaction(async tx => {
        const snap = await tx.get(state.ref);
        if (!snap.exists) throw new Error('No se encontro la invitacion.');
        const currentInvite = snap.data();
        const currentDeadline = getDeadlineMs(currentInvite);
        if (Date.now() >= currentDeadline) throw new Error('El plazo de confirmacion ha finalizado.');
        const quota = currentInvite.quota;
        if (confirmedCount > quota) throw new Error('La cantidad supera los pases disponibles.');
        tx.update(state.ref, {
  status: attendance === 'si' ? 'yes' : 'no',
  confirmedCount,
  updatedAt: serverTimestamp
});
      });
      closeModal();
      showToast(attendance === 'si'
        ? '¡Gracias! Tu asistencia ha sido confirmada.'
        : 'Tu respuesta ha sido guardada. ¡Gracias por avisarnos!');
    } catch (error) {
      console.error('Guardar RSVP:', error);
      setError('No se pudo guardar la respuesta. ' + (error?.message || 'Intenta nuevamente.'));
    } finally {
      state.saving = false;
      $('rsvpSubmit').disabled = false;
    }
  });

  init();
})();
