const API_BASE = '../museo_api';
const reservationBody = document.getElementById('dashboard-reservas-body');
const availableDatesList = document.getElementById('dashboard-fechas-list');

function formatDateTime(dateTime) {
  const [date, time] = dateTime.split(' ');
  const [year, month, day] = date.split('-');
  return { date: `${day}/${month}/${year}`, time: time.slice(0, 5) };
}

function showTableMessage(message) {
  reservationBody.replaceChildren();
  const row = reservationBody.insertRow();
  const cell = row.insertCell();
  cell.colSpan = 5;
  cell.textContent = message;
}

function renderReservations(reservations) {
  const upcoming = reservations
    .filter(reservation => new Date(reservation.fecha_hora.replace(' ', 'T')) >= new Date())
    .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))
    .slice(0, 10);

  reservationBody.replaceChildren();
  if (!upcoming.length) {
    showTableMessage('No hay próximas visitas.');
    return;
  }

  upcoming.forEach(reservation => {
    const row = reservationBody.insertRow();
    const referente = row.insertCell();
    referente.textContent = `${reservation.nombre} ${reservation.apellido}`;
    row.insertCell().textContent = reservation.tipo;
    const dateTime = formatDateTime(reservation.fecha_hora);
    row.insertCell().textContent = dateTime.date;
    row.insertCell().textContent = dateTime.time;
    row.insertCell().textContent = reservation.estado;
  });
}

function renderStats(reservations) {
  document.getElementById('stat-approved').textContent =
    reservations.filter(item => item.estado === 'aprobada').length;
  document.getElementById('stat-schools').textContent =
    reservations.filter(item => item.tipo === 'Escolar').length;
  document.getElementById('stat-pending').textContent =
    reservations.filter(item => item.estado === 'pendiente').length;
  document.getElementById('stat-total').textContent = reservations.length;
}

async function loadReservations() {
  const token = localStorage.getItem('token');
  if (!token) {
    showTableMessage('Iniciá sesión como administrador para consultar las reservas.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/get-admin-reservas.php`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || result.success !== true || !Array.isArray(result.reservas)) {
      throw new Error(result.message || 'No se pudieron cargar las reservas.');
    }
    renderStats(result.reservas);
    renderReservations(result.reservas);
  } catch (error) {
    showTableMessage(error.message || 'No se pudieron cargar las reservas.');
  }
}

async function loadAvailableDates() {
  try {
    const response = await fetch(`${API_BASE}/get-visitas.php`);
    const result = await response.json();
    if (!response.ok || result.success !== true || !Array.isArray(result.visitas)) {
      throw new Error(result.message || 'No se pudieron cargar las fechas.');
    }

    availableDatesList.replaceChildren();
    result.visitas.slice(0, 5).forEach(visit => {
      const item = document.createElement('li');
      const details = document.createElement('div');
      const date = document.createElement('strong');
      const time = document.createElement('span');
      const type = document.createElement('span');
      const dateTime = formatDateTime(visit.fecha_hora);

      date.textContent = dateTime.date;
      time.textContent = `${dateTime.time} · ${visit.cupos_disponibles} cupos`;
      type.className = `tag ${visit.tipo_visita === 'Publica' ? 'tag-red' : 'tag-blue'}`;
      type.textContent = visit.tipo_visita === 'Publica' ? 'Personal' : 'Institucional / Escolar';
      details.append(date, time);
      item.append(details, type);
      availableDatesList.appendChild(item);
    });

    if (!result.visitas.length) {
      const item = document.createElement('li');
      item.textContent = 'No hay fechas con cupos disponibles.';
      availableDatesList.appendChild(item);
    }
  } catch (error) {
    availableDatesList.replaceChildren();
    const item = document.createElement('li');
    item.textContent = error.message || 'No se pudieron cargar las fechas.';
    availableDatesList.appendChild(item);
  }
}

loadReservations();
loadAvailableDates();
