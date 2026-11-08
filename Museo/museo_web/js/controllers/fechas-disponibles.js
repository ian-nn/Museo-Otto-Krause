const tableBody = document.getElementById('fechas-table-body');
const countTitle = document.getElementById('fechas-count-title');

function showMessage(message) {
  tableBody.replaceChildren();
  const row = tableBody.insertRow();
  const cell = row.insertCell();
  cell.colSpan = 6;
  cell.textContent = message;
}

function formatDateTime(dateTime) {
  const [date, time] = dateTime.split(' ');
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year} · ${time.slice(0, 5)}`;
}

function renderVisits(visits) {
  countTitle.textContent = `Fechas disponibles (${visits.length})`;
  tableBody.replaceChildren();

  if (!visits.length) {
    showMessage('No hay fechas con cupos disponibles.');
    return;
  }

  visits.forEach(visit => {
    const row = tableBody.insertRow();
    row.dataset.idVisita = visit.id_visita;
    row.insertCell().textContent = visit.id_visita;
    row.insertCell().textContent = formatDateTime(visit.fecha_hora);
    row.insertCell().textContent =
      visit.tipo_visita === 'Publica' ? 'Personal' : 'Institucional / Escolar';
    row.insertCell().textContent = visit.cupo_actual;
    row.insertCell().textContent = visit.cupo_maximo;
    row.insertCell().textContent = visit.cupos_disponibles;
  });
}

async function loadVisits() {
  try {
    const response = await fetch('../museo_api/get-visitas.php');
    const result = await response.json();
    if (!response.ok || result.success !== true || !Array.isArray(result.visitas)) {
      throw new Error(result.message || 'No se pudieron cargar las fechas disponibles.');
    }
    renderVisits(result.visitas);
  } catch (error) {
    countTitle.textContent = 'Fechas disponibles';
    showMessage(error.message || 'No se pudieron cargar las fechas disponibles.');
  }
}

loadVisits();
