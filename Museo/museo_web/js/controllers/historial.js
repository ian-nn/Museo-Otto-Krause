// historial.js
// Controlador para la visualización del historial de visitas

document.addEventListener('DOMContentLoaded', () => {
  // Cargar datos del usuario
  const username = localStorage.getItem('username') || 'Admin';
  const usernameDisplay = document.getElementById('username-display');
  if (usernameDisplay) {
    usernameDisplay.textContent = username;
  }

  // Manejar logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Actualizar enlace activo
  updateActiveLink();

  // Inicializar funcionalidades
  initializeHistory();
});

/**
 * Inicializa la funcionalidad del historial
 */
function initializeHistory() {
  const dateFromInput = document.getElementById('date-from');
  const dateToInput = document.getElementById('date-to');
  const visitTypeFilter = document.getElementById('visit-type-filter');
  const exportBtn = document.getElementById('export-btn');
  const detailsButtons = document.querySelectorAll('button.btn:contains("Ver detalles")');

  // Filtros de fecha
  if (dateFromInput) {
    dateFromInput.addEventListener('change', filterHistory);
  }

  if (dateToInput) {
    dateToInput.addEventListener('change', filterHistory);
  }

  if (visitTypeFilter) {
    visitTypeFilter.addEventListener('change', filterHistory);
  }

  // Botón de exportar
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToCSV);
  }

  // Botones de ver detalles
  document.addEventListener('click', (e) => {
    if (e.target.textContent.includes('Ver detalles')) {
      showVisitDetails();
    }
  });

  // Botón de cerrar modal
  document.addEventListener('click', (e) => {
    if (e.target.id === 'close-modal-btn') {
      const modal = document.getElementById('visit-details-modal');
      if (modal) {
        modal.style.display = 'none';
      }
    }
  });

  // Cerrar modal al hacer clic fuera
  const modal = document.getElementById('visit-details-modal');
  if (modal) {
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
}

/**
 * Filtra el historial de visitas
 */
function filterHistory() {
  const dateFromInput = document.getElementById('date-from');
  const dateToInput = document.getElementById('date-to');
  const visitTypeFilter = document.getElementById('visit-type-filter');
  const tableBody = document.getElementById('history-table-body');
  const rows = tableBody.querySelectorAll('tr');

  const dateFrom = dateFromInput.value;
  const dateTo = dateToInput.value;
  const selectedType = visitTypeFilter.value.toLowerCase();

  let visibleCount = 0;

  rows.forEach(row => {
    const dateCell = row.cells[0].textContent;
    const typeCell = row.cells[1].textContent.toLowerCase();

    // Convertir fecha de tabla (DD/MM/YYYY) a comparable
    const [day, month, year] = dateCell.split('/');
    const rowDate = `${year}-${month}-${day}`;

    // Aplicar filtros
    let matchesDateRange = true;
    if (dateFrom) matchesDateRange = rowDate >= dateFrom;
    if (dateTo && matchesDateRange) matchesDateRange = rowDate <= dateTo;

    const matchesType = selectedType === '' || typeCell.includes(selectedType);

    if (matchesDateRange && matchesType) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  // Actualizar contador
  const visitCount = document.getElementById('visit-count');
  if (visitCount) {
    visitCount.textContent = `Mostrando ${visibleCount} registros`;
  }
}

/**
 * Muestra los detalles de una visita
 */
function showVisitDetails() {
  const modal = document.getElementById('visit-details-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Exporta el historial a CSV
 */
function exportToCSV() {
  const tableBody = document.getElementById('history-table-body');
  const rows = tableBody.querySelectorAll('tr');

  // Crear contenido CSV
  let csv = 'Fecha,Tipo de visita,Visitantes,Contacto,Institución,Duración,Estado\n';

  rows.forEach(row => {
    if (row.style.display !== 'none') {
      const cells = row.querySelectorAll('td');
      const rowData = [
        cells[0].textContent,
        cells[1].textContent.replace(/[^a-zA-Z]/g, ''), // Limpiar badges
        cells[2].textContent,
        cells[3].textContent,
        cells[4].textContent,
        cells[5].textContent,
        cells[6].textContent.replace(/[^a-zA-Z]/g, '') // Limpiar badges
      ];
      csv += rowData.map(cell => `"${cell.trim()}"`).join(',') + '\n';
    }
  });

  // Crear blob y descargar
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `historial-visitas-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showAlert('Archivo CSV descargado correctamente', 'success');
}

/**
 * Muestra una alerta temporal
 */
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

  setTimeout(() => {
    alert.remove();
  }, 3000);
}

/**
 * Actualiza el enlace activo en el sidebar
 */
function updateActiveLink() {
  const currentPage = window.location.pathname.split('/').pop();
  const menuLinks = document.querySelectorAll('.sidebar-menu-link');
  
  menuLinks.forEach(link => {
    const href = link.getAttribute('href');
    const linkPage = href.split('/').pop();
    
    if (linkPage === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Cierra la sesión del usuario
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('rol');
  window.location.href = 'login.html';
}
