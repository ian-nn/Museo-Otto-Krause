// fechas.js
// Controlador para la gestión de fechas y horarios disponibles

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
  initializeSchedules();
});

/**
 * Inicializa la funcionalidad de gestión de fechas y horarios
 */
function initializeSchedules() {
  // Manejo de botones de edición de modalidades
  const editButtons = document.querySelectorAll('button[data-type]');
  editButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const type = e.target.getAttribute('data-type');
      showEditModal(type);
    });
  });

  // Manejo de botón de agregar fecha bloqueada
  const addBlockedDateBtn = document.getElementById('add-blocked-date-btn');
  if (addBlockedDateBtn) {
    addBlockedDateBtn.addEventListener('click', showBlockedDateModal);
  }
}

/**
 * Muestra modal para editar horarios de una modalidad
 */
function showEditModal(type) {
  const typeNames = {
    personal: 'Visita Personal',
    escolar: 'Visita Escolar',
    institucional: 'Visita Institucional'
  };

  const modal = createModal(`
    <h2>Editar horarios - ${typeNames[type]}</h2>
    <form id="edit-schedule-form">
      <div class="form-group">
        <label class="form-label">Cupo máximo (personas) *</label>
        <input type="number" class="form-input" value="30" min="1" required>
      </div>
      <div class="form-group">
        <label class="form-label">Duración estimada (minutos) *</label>
        <input type="number" class="form-input" value="50" min="30" required>
      </div>
      <div class="form-group">
        <label class="form-label">Días disponibles</label>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 8px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" checked> Lunes
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" checked> Martes
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox"> Miércoles
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" checked> Jueves
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" checked> Viernes
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox"> Sábado
          </label>
        </div>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
        <button type="button" class="btn btn-secondary" id="close-modal-btn">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar cambios</button>
      </div>
    </form>
  `);

  modal.querySelector('#edit-schedule-form').addEventListener('submit', (e) => {
    e.preventDefault();
    showAlert('Horarios actualizados correctamente', 'success');
    modal.remove();
  });

  modal.querySelector('#close-modal-btn').addEventListener('click', () => {
    modal.remove();
  });
}

/**
 * Muestra modal para agregar fecha bloqueada
 */
function showBlockedDateModal() {
  const modal = createModal(`
    <h2>Agregar fecha bloqueada</h2>
    <form id="blocked-date-form">
      <div class="form-group">
        <label class="form-label">Fecha *</label>
        <input type="date" class="form-input" required>
      </div>
      <div class="form-group">
        <label class="form-label">Motivo *</label>
        <select class="form-select" required>
          <option value="">Selecciona un motivo</option>
          <option value="mantenimiento">Mantenimiento</option>
          <option value="feriado">Feriado</option>
          <option value="evento">Evento especial</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Descripción</label>
        <textarea class="form-input" style="min-height: 80px;" placeholder="Describe el motivo..."></textarea>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
        <button type="button" class="btn btn-secondary" id="close-modal-btn">Cancelar</button>
        <button type="submit" class="btn btn-primary">Agregar fecha</button>
      </div>
    </form>
  `);

  modal.querySelector('#blocked-date-form').addEventListener('submit', (e) => {
    e.preventDefault();
    showAlert('Fecha bloqueada agregada correctamente', 'success');
    modal.remove();
  });

  modal.querySelector('#close-modal-btn').addEventListener('click', () => {
    modal.remove();
  });
}

/**
 * Crea un modal dinámico
 */
function createModal(content) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const innerDiv = document.createElement('div');
  innerDiv.style.cssText = `
    background: var(--color-surface-secondary);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 32px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  `;
  innerDiv.innerHTML = content;

  modal.appendChild(innerDiv);
  document.body.appendChild(modal);

  // Cerrar al hacer clic fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  return modal;
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
