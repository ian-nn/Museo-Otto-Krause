// login.js
// Controlador del formulario de login. Evita recarga, valida campos y llama al backend.
import { postJson } from '../services/api.js';

const form = document.querySelector('#login-form');
const errorElement = document.querySelector('#login-error');
const successElement = document.querySelector('#login-success');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorElement.textContent = '';
  errorElement.classList.remove('visible');
  successElement.textContent = '';
  successElement.classList.remove('visible');

  const email = form.querySelector('#email').value.trim();
  const password = form.querySelector('#password').value;

  if (!email || !password) {
    errorElement.textContent = 'Por favor complete todos los campos.';
    errorElement.classList.add('visible');
    return;
  }

  try {
    const payload = {
      username: email,
      password: password,
    };

    const data = await postJson('auth/login.php', payload);

    if (data && data.success === true) {
      // Almacenar token y datos de usuario que devuelve el backend
      if (data.token) localStorage.setItem('token', data.token);
      if (data.user && data.user.username) localStorage.setItem('username', data.user.username);
      if (data.user && data.user.role) localStorage.setItem('rol', data.user.role);

      successElement.textContent = 'Inicio de sesión correcto. Redirigiendo...';
      successElement.classList.add('visible');
      // Pequeña espera para que el usuario vea el mensaje
      setTimeout(() => window.location.href = 'panel.html', 700);
      return;
    }

    errorElement.textContent = (data && data.message) ? data.message : 'Credenciales incorrectas.';
    errorElement.classList.add('visible');
  } catch (error) {
    // Mostrar mensaje del servidor si está presente (postJson incluye el mensaje después de ' - ')
    let displayMessage = 'No se pudo conectar con el servidor. Intente de nuevo.';
    if (error && error.message) {
      const m = error.message.match(/-\s*(.+)$/);
      if (m && m[1]) {
        displayMessage = m[1];
      } else if (error.message.length < 200) {
        displayMessage = error.message;
      }
    }

    errorElement.textContent = displayMessage;
    errorElement.classList.add('visible');
  }
});
