const RESERVATIONS_API = '../museo_api/get-all-reservations.php';
const STATUS_API = '../museo_api/update-reservation-status.php';
const reservationsBody = document.getElementById('admin-reservas-body');
const confirmationOverlay = document.getElementById('status-confirm-overlay');
const confirmButton = document.getElementById('status-confirm-apply');
const cancelButton = document.getElementById('status-confirm-cancel');
const closeButton = document.getElementById('status-confirm-close');
let reservations = [];
let pendingStatusChange = null;
let confirmationTrigger = null;

function displayStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDateTime(dateTime) {
  const [date, time = ''] = dateTime.split(' ');
  const [year, month, day] = date.split('-');
  return { date: `${day}/${month}/${year}`, time: time.slice(0, 5) };
}

function showTableMessage(message) {
  reservationsBody.replaceChildren();
  const row = reservationsBody.insertRow();
  const cell = row.insertCell();
  cell.colSpan = 6;
  cell.className = 'table-message';
  cell.textContent = message;
}

function createActionButton(reservation, status, label, icon, className) {
  const button = document.createElement('button');
  button.className = `action-btn ${className}`;
  button.type = 'button';
  button.dataset.reservaId = reservation.id;
  button.dataset.reservaTipo = reservation.tipo_reserva;
  button.dataset.nuevoEstado = status;
  button.setAttribute('aria-label', `${label} reserva de ${reservation.nombre} ${reservation.apellido}`);
  button.title = `${label} reserva`;
  button.disabled = reservation.estado === status;
  button.innerHTML = icon;
  return button;
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
    showTableMessage(reservations.length ? 'Sin resultados.' : 'No hay reservas registradas.');
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

    const dateTime = formatDateTime(reservation.fecha_hora);
    row.insertCell().textContent = dateTime.date;
    row.insertCell().textContent = dateTime.time;

    const statusCell = row.insertCell();
    const badge = document.createElement('span');
    badge.className = `status-badge ${displayStatus(reservation.estado)}`;
    badge.textContent = displayStatus(reservation.estado);
    statusCell.appendChild(badge);

    const actions = row.insertCell();
    actions.className = 'action-cell';
    const actionButtons = document.createElement('div');
    actionButtons.className = 'action-buttons';
    actionButtons.append(
      createActionButton(
        reservation,
        'aprobada',
        'Aprobar',
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
        'action-success'
      ),
      createActionButton(
        reservation,
        'rechazada',
        'Rechazar',
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
        'action-reject'
      )
    );
    actions.appendChild(actionButtons);
  });
}

function openStatusConfirmation(reservation, newStatus, trigger) {
  pendingStatusChange = { id: reservation.id, tipo: reservation.tipo_reserva, nuevo_estado: newStatus };
  confirmationTrigger = trigger;
  document.getElementById('status-confirm-title').textContent =
    `Cambiar estado a ${displayStatus(newStatus)}`;
  document.getElementById('status-confirm-message').textContent =
    '¿Estás seguro de cambiar el estado de esta reserva?';
  confirmButton.textContent = `Confirmar ${displayStatus(newStatus).toLowerCase()}`;
  confirmButton.classList.toggle('btn-reject', newStatus === 'rechazada');
  confirmButton.classList.toggle('btn-approve', newStatus === 'aprobada');
  confirmationOverlay.classList.remove('hidden');
  confirmationOverlay.setAttribute('aria-hidden', 'false');
  cancelButton.focus();
}

function closeStatusConfirmation(restoreFocus = true) {
  confirmationOverlay.classList.add('hidden');
  confirmationOverlay.setAttribute('aria-hidden', 'true');
  pendingStatusChange = null;
  if (restoreFocus) {
    if (confirmationTrigger && confirmationTrigger.isConnected) {
      confirmationTrigger.focus();
    } else {
      document.getElementById('search-reservas').focus();
    }
  }
  confirmationTrigger = null;
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', isError ? 'alert' : 'status');
  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.textContent = isError ? '!' : '✓';
  const text = document.createElement('span');
  text.textContent = message;
  toast.append(icon, text);
  document.getElementById('toast-container').replaceChildren(toast);
  window.setTimeout(() => toast.remove(), 3500);
}

async function loadReservations() {
  try {
    const response = await fetch(RESERVATIONS_API);
    const result = await response.json();
    if (!response.ok || !Array.isArray(result)) {
      throw new Error(result.message || 'No se pudieron cargar las reservas.');
    }
    reservations = result;
    renderReservations();
  } catch (error) {
    console.error('Error al cargar las reservas:', error);
    showTableMessage(error.message || 'No se pudieron cargar las reservas.');
  }
}

async function updateReservationStatus() {
  if (!pendingStatusChange) return;

  confirmButton.disabled = true;
  cancelButton.disabled = true;
  closeButton.disabled = true;
  try {
    const response = await fetch(STATUS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingStatusChange),
    });
    const result = await response.json();
    if (!response.ok || result.success !== true) {
      throw new Error(result.message || 'No se pudo actualizar el estado de la reserva.');
    }

    const reservation = reservations.find(item =>
      Number(item.id) === Number(pendingStatusChange.id)
      && item.tipo_reserva === pendingStatusChange.tipo
    );
    if (reservation) {
      reservation.estado = result.estado;
    }
    closeStatusConfirmation(false);
    renderReservations();
    document.getElementById('search-reservas').focus();
    showToast('El estado de la reserva se actualizó correctamente.');
  } catch (error) {
    console.error('Error al actualizar el estado de la reserva:', error);
    showToast(error.message || 'No se pudo actualizar el estado de la reserva.', true);
  } finally {
    confirmButton.disabled = false;
    cancelButton.disabled = false;
    closeButton.disabled = false;
  }
}

document.getElementById('search-reservas').addEventListener('input', renderReservations);
document.getElementById('filter-tipo').addEventListener('change', renderReservations);
document.getElementById('filter-estado').addEventListener('change', renderReservations);

reservationsBody.addEventListener('click', event => {
  const button = event.target.closest('[data-reserva-id]');
  if (!button || button.disabled) return;

  const reservation = reservations.find(item =>
    Number(item.id) === Number(button.dataset.reservaId)
    && item.tipo_reserva === button.dataset.reservaTipo
  );
  if (reservation) {
    openStatusConfirmation(reservation, button.dataset.nuevoEstado, button);
  }
});

confirmButton.addEventListener('click', updateReservationStatus);
cancelButton.addEventListener('click', () => closeStatusConfirmation());
closeButton.addEventListener('click', () => closeStatusConfirmation());
confirmationOverlay.addEventListener('click', event => {
  if (event.target === confirmationOverlay) closeStatusConfirmation();
});
confirmationOverlay.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !confirmButton.disabled) {
    closeStatusConfirmation();
  }
  if (event.key === 'Tab') {
    if (confirmButton.disabled) return;
    event.preventDefault();
    const focusableButtons = [closeButton, cancelButton, confirmButton]
      .filter(button => !button.disabled);
    const currentIndex = focusableButtons.indexOf(document.activeElement);
    const direction = event.shiftKey ? -1 : 1;
    const nextIndex = (currentIndex + direction + focusableButtons.length) % focusableButtons.length;
    focusableButtons[nextIndex].focus();
  }
});

loadReservations();
