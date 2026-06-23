// reservas-admin.js
// Controlador para la página de reservas del dashboard admin

document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('username') || 'Admin';
  const usernameDisplay = document.getElementById('username-display');
  if (usernameDisplay) {
    usernameDisplay.textContent = username;
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  updateActiveLink();
  initializeReservationControls();
});

function initializeReservationControls() {
  const searchInput = document.getElementById('reservation-search');
  const statusFilter = document.getElementById('reservation-status-filter');
  const refreshBtn = document.getElementById('refresh-reservations');

  if (searchInput) {
    searchInput.addEventListener('input', filterReservations);
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', filterReservations);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      filterReservations();
      showAlert('Lista de reservas actualizada', 'success');
    });
  }

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.matches('.btn-approve') || target.matches('.btn-reject')) {
      handleReservationAction(target);
    }
  });
}

function filterReservations() {
  const searchInput = document.getElementById('reservation-search');
  const statusFilter = document.getElementById('reservation-status-filter');
  const tableBody = document.querySelector('#reservations-table tbody');
  const rows = Array.from(tableBody.querySelectorAll('tr'));
  const searchTerm = searchInput.value.toLowerCase();
  const selectedStatus = statusFilter.value.toLowerCase();

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    const rowText = Array.from(cells).slice(0, 5).map(cell => cell.textContent.toLowerCase()).join(' ');
    const statusText = cells[5].textContent.toLowerCase();
    const matchesSearch = searchTerm === '' || rowText.includes(searchTerm);
    const matchesStatus = selectedStatus === '' || statusText.includes(selectedStatus);
    row.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
  });
}

function handleReservationAction(button) {
  const row = button.closest('tr');
  if (!row) return;
  const statusCell = row.cells[5];
  const action = button.classList.contains('btn-approve') ? 'Aprobada' : 'Rechazada';

  statusCell.innerHTML = `<span class="badge badge-${action === 'Aprobada' ? 'green' : 'red'}">${action}</span>`;
  button.disabled = true;
  button.textContent = 'Revisado';
  button.classList.remove('btn-approve', 'btn-reject');
  button.classList.add('btn-secondary');

  const otherButton = row.querySelector('.btn-approve, .btn-reject');
  if (otherButton && otherButton !== button) {
    otherButton.disabled = true;
    otherButton.textContent = 'Revisado';
    otherButton.classList.remove('btn-approve', 'btn-reject');
    otherButton.classList.add('btn-secondary');
  }

  showAlert(`Reserva ${action.toLowerCase()} correctamente`, 'success');
}

function updateActiveLink() {
  const currentPage = window.location.pathname.split('/').pop();
  const menuLinks = document.querySelectorAll('.sidebar-menu-link');
  menuLinks.forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === currentPage);
  });
}

function showAlert(message, type = 'info') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.style.position = 'fixed';
  alert.style.top = '20px';
  alert.style.right = '20px';
  alert.style.zIndex = '9999';
  alert.style.maxWidth = '400px';
  alert.innerHTML = `
    <div class="alert-icon">${type === 'success' ? '✓' : 'ℹ'}</div>
    <div class="alert-content">${message}</div>
  `;
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), 3000);
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('rol');
  window.location.href = 'login.html';
}
