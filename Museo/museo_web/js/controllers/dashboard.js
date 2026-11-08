const API_BASE = '../museo_api';
const reservationBody = document.getElementById('dashboard-reservas-body');
const availableDatesList = document.getElementById('dashboard-fechas-list');

function formatDateTime(dateTime) {
  const [date, time = ''] = dateTime.split(' ');
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
  reservationBody.replaceChildren();
  if (!reservations.length) {
    showTableMessage('No hay próximas visitas.');
    return;
  }

  reservations.forEach(reservation => {
    const row = reservationBody.insertRow();
    row.insertCell().textContent = reservation.referente;
    row.insertCell().textContent = reservation.tipo;
    const dateTime = formatDateTime(reservation.fecha_hora);
    row.insertCell().textContent = dateTime.date;
    row.insertCell().textContent = dateTime.time;
    row.insertCell().textContent = reservation.estado;
  });
}

function renderStats(stats) {
  document.getElementById('stat-approved').textContent = stats.approved_visits;
  document.getElementById('stat-schools').textContent = stats.institutional_reservations;
  document.getElementById('stat-pending').textContent = stats.pending_reservations;
  document.getElementById('stat-total').textContent = stats.total_visits;
}

async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/get-dashboard-stats.php`);
    const result = await response.json();
    if (!response.ok || result.success !== true || !result.stats) {
      throw new Error(result.message || 'No se pudieron cargar las estadísticas.');
    }
    renderStats(result.stats);
  } catch (error) {
    console.error('Error al cargar las estadísticas del dashboard:', error);
    ['stat-approved', 'stat-schools', 'stat-pending', 'stat-total'].forEach(id => {
      document.getElementById(id).textContent = 'Error';
    });
  }
}

async function loadUpcomingVisits() {
  try {
    const response = await fetch(`${API_BASE}/get-proximas-visitas.php`);
    const result = await response.json();
    if (!response.ok || !Array.isArray(result)) {
      throw new Error(result.message || 'No se pudieron cargar las próximas visitas.');
    }
    renderReservations(result);
  } catch (error) {
    console.error('Error al cargar las próximas visitas:', error);
    showTableMessage(error.message || 'No se pudieron cargar las próximas visitas.');
  }
}

async function loadAvailableDates() {
  try {
    const response = await fetch(`${API_BASE}/get-visitas.php?include_full=1`);
    const result = await response.json();
    if (!response.ok || result.success !== true || !Array.isArray(result.visitas)) {
      throw new Error(result.message || 'No se pudieron cargar las fechas.');
    }

    availableDatesList.replaceChildren();
    result.visitas.forEach(visit => {
      const item = document.createElement('li');
      const details = document.createElement('div');
      const date = document.createElement('strong');
      const time = document.createElement('span');
      const type = document.createElement('span');
      const tags = document.createElement('div');
      const dateTime = formatDateTime(visit.fecha_hora);
      const isFull = Number(visit.cupo_actual) >= Number(visit.cupo_maximo);

      date.textContent = dateTime.date;
      time.textContent = `${dateTime.time} · ${visit.cupos_disponibles} cupos disponibles`;
      type.className = `tag ${visit.tipo_visita === 'Publica' ? 'tag-red' : 'tag-blue'}`;
      type.textContent = visit.tipo_visita === 'Publica' ? 'Personal' : 'Institucional / Escolar';
      tags.className = 'date-list-tags';
      tags.appendChild(type);
      if (isFull) {
        const fullBadge = document.createElement('span');
        fullBadge.className = 'tag tag-full';
        fullBadge.textContent = 'Completo';
        tags.appendChild(fullBadge);
      }
      details.append(date, time);
      item.append(details, tags);
      availableDatesList.appendChild(item);
    });

    if (!result.visitas.length) {
      const item = document.createElement('li');
      item.textContent = 'No hay fechas programadas.';
      availableDatesList.appendChild(item);
    }
  } catch (error) {
    console.error('Error al cargar las fechas programadas:', error);
    availableDatesList.replaceChildren();
    const item = document.createElement('li');
    item.textContent = error.message || 'No se pudieron cargar las fechas.';
    availableDatesList.appendChild(item);
  }
}

loadStats();
loadUpcomingVisits();
loadAvailableDates();
