// inventario.js
// Controlador para la gestión del inventario de objetos del museo

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
  initializeInventory();
});

/**
 * Inicializa la funcionalidad del inventario
 */
function initializeInventory() {
  const addItemBtn = document.getElementById('add-item-btn');
  const modal = document.getElementById('add-item-modal');
  const cancelBtn = document.getElementById('cancel-add-btn');
  const form = document.getElementById('add-item-form');
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');

  if (addItemBtn) {
    addItemBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      form.reset();
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      addItem();
      modal.style.display = 'none';
      form.reset();
    });
  }

  // Filtros
  if (searchInput) {
    searchInput.addEventListener('input', filterInventory);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterInventory);
  }

  // Cerrar modal al hacer clic fuera
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

/**
 * Agrega un nuevo objeto al inventario
 */
function addItem() {
  const form = document.getElementById('add-item-form');
  const name = form.querySelector('input[placeholder="Ej: Maqueta de motor"]').value;
  const category = form.querySelector('select').value;
  const location = form.querySelector('input[placeholder="Ej: Vitrina A-1"]').value;
  const description = form.querySelector('textarea').value;

  if (!name || !category || !location) {
    alert('Por favor completa los campos obligatorios');
    return;
  }

  // Mostrar mensaje de éxito (en producción, se enviaría al backend)
  showAlert(`Objeto "${name}" agregado al inventario exitosamente`, 'success');
  
  // En producción: enviar datos al backend
  // postJson('controllers/ObjetosController.php', { nombre: name, categoría: category, ubicación: location, descripción: description });
}

/**
 * Filtra el inventario según búsqueda y categoría
 */
function filterInventory() {
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const tableBody = document.getElementById('inventory-table-body');
  const rows = tableBody.querySelectorAll('tr');

  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value.toLowerCase();

  let visibleCount = 0;

  rows.forEach(row => {
    const name = row.cells[1].textContent.toLowerCase();
    const category = row.cells[2].textContent.toLowerCase();
    
    const matchesSearch = name.includes(searchTerm);
    const matchesCategory = selectedCategory === '' || category.includes(selectedCategory);

    if (matchesSearch && matchesCategory) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  // Actualizar contador
  const itemCount = document.getElementById('item-count');
  if (itemCount) {
    itemCount.textContent = `Total: ${visibleCount} objetos`;
  }
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
