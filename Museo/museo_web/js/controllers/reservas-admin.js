const API_URL = '../museo_api/get-admin-reservas.php';
const reservationsBody = document.getElementById('admin-reservas-body');
let reservations = [];

function displayStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(dateTime) {
  const [date] = dateTime.split(' ');
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function showTableMessage(message) {
  reservationsBody.replaceChildren();
  const row = reservationsBody.insertRow();
  const cell = row.insertCell();
  cell.colSpan = 6;
  cell.textContent = message;
}

function renderReservations() {
  const query = document.getElementById('search-reservas').value.trim().toLowerCase();
  const type = document.getElementById('filter-tipo').value;
  const status = document.getElementById('filter-estado').value.toLowerCase();
  const filtered = reservations.filter(reservation => {
    const searchable = `${reservation.nombre} ${reservation.apellido} ${reservation.email} ${reservation.institucion || ''}`.toLowerCase();
    return (!query || searchable.includes(query))
      && (!type || reservation.tipo === type)
      && (!status || reservation.estado === status);
  });

  reservationsBody.replaceChildren();
  if (!filtered.length) {
    showTableMessage('Sin resultados.');
    return;
  }

  filtered.forEach(reservation => {
    const row = reservationsBody.insertRow();
    const referenteCell = row.insertCell();
    referenteCell.className = 'referente-cell';
    const referente = document.createElement('strong');
    referente.textContent = `${reservation.nombre} ${reservation.apellido}`;
    const email = document.createElement('span');
    email.textContent = reservation.email;
    referenteCell.append(referente, email);
    row.insertCell().textContent = reservation.tipo;
    row.insertCell().textContent = reservation.cantidad_personas;
    row.insertCell().textContent = formatDate(reservation.fecha_hora);

    const statusCell = row.insertCell();
    const badge = document.createElement('span');
    badge.className = `status-badge ${displayStatus(reservation.estado)}`;
    badge.textContent = displayStatus(reservation.estado);
    statusCell.appendChild(badge);

    const actions = row.insertCell();
    actions.className = 'action-cell';
    const button = document.createElement('button');
    button.className = 'action-btn action-secondary';
    button.type = 'button';
    button.dataset.reservaId = reservation.id_reserva;
    button.setAttribute('aria-label', 'Ver reserva');
    button.title = 'Ver reserva';
    button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3"/></svg>';
    actions.appendChild(button);
  });
}

function openReservation(reservationId) {
  const reservation = reservations.find(item => item.id_reserva === reservationId);
  if (!reservation) return;

  document.getElementById('reserva-modal-title').textContent = `Reserva ${reservation.id_reserva}`;
  document.getElementById('modal-referente').textContent = `${reservation.nombre} ${reservation.apellido} · ${reservation.email}`;
  document.getElementById('modal-tipo').textContent = reservation.tipo;
  document.getElementById('modal-fecha').textContent = formatDate(reservation.fecha_hora);
  document.getElementById('modal-horario').textContent = reservation.fecha_hora.split(' ')[1].slice(0, 5);
  document.getElementById('modal-personas').textContent = reservation.cantidad_personas;
  document.getElementById('modal-estado').textContent = displayStatus(reservation.estado);
  document.getElementById('modal-observaciones').textContent = [
    reservation.institucion,
    reservation.cue ? `CUE: ${reservation.cue}` : '',
    reservation.dni ? `DNI: ${reservation.dni}` : '',
    reservation.telefono ? `Teléfono: ${reservation.telefono}` : ''
  ].filter(Boolean).join(' · ');

  const overlay = document.getElementById('reserva-modal-overlay');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeReservation() {
  const overlay = document.getElementById('reserva-modal-overlay');
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

async function loadReservations() {
  const token = localStorage.getItem('token');
  if (!token) {
    showTableMessage('Iniciá sesión como administrador para consultar las reservas.');
    return;
  }

  try {
    const response = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || result.success !== true || !Array.isArray(result.reservas)) {
      throw new Error(result.message || 'No se pudieron cargar las reservas.');
    }
    reservations = result.reservas;
    renderReservations();
  } catch (error) {
    showTableMessage(error.message || 'No se pudieron cargar las reservas.');
  }
}

document.getElementById('search-reservas').addEventListener('input', renderReservations);
document.getElementById('filter-tipo').addEventListener('change', renderReservations);
document.getElementById('filter-estado').addEventListener('change', renderReservations);
reservationsBody.addEventListener('click', event => {
  const button = event.target.closest('[data-reserva-id]');
  if (button) openReservation(button.dataset.reservaId);
});
document.getElementById('reserva-modal-close').addEventListener('click', closeReservation);
document.getElementById('reserva-modal-overlay').addEventListener('click', event => {
  if (event.target.id === 'reserva-modal-overlay') closeReservation();
});
loadReservations();
