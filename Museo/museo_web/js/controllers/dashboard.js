// dashboard.js
// Controlador del dashboard de administración principal (dashboard)

document.addEventListener('DOMContentLoaded', () => {
  // Cargar datos del usuario desde localStorage
  const username = localStorage.getItem('username') || 'Admin';
  const usernameDisplay = document.getElementById('username-display');
  if (usernameDisplay) {
    usernameDisplay.textContent = username;
  }

  // Manejar botón de logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Marcar el enlace activo en el sidebar
  updateActiveLink();
});

/**
 * Actualiza el enlace activo en el sidebar según la página actual
 */
function updateActiveLink() {
  const currentPage = window.location.pathname.split('/').pop();
  const menuLinks = document.querySelectorAll('.sidebar-menu-link');
  
  menuLinks.forEach(link => {
    const href = link.getAttribute('href');
    const linkPage = href.split('/').pop();
    
    if (linkPage === currentPage || (currentPage === '' && href === 'dashboard.html')) {
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
  // Limpiar localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('rol');
  
  // Redirigir a login
  window.location.href = 'login.html';
}
