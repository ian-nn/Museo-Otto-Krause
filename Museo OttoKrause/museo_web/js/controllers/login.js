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
      email_usuario: email,
      password: password,
    };

    const data = await postJson('auth.php', payload);

    if (data.success === true) {
      localStorage.setItem('id_usuario', String(data.id_usuario || ''));
      localStorage.setItem('nombre', data.nombre || '');
      localStorage.setItem('rol', data.rol || '');
      successElement.textContent = 'Inicio de sesión correcto. Redirigiendo...';
      successElement.classList.add('visible');
      window.location.href = 'panel.html';
      return;
    }

    errorElement.textContent = data.message || 'Credenciales incorrectas.';
    errorElement.classList.add('visible');
  } catch (error) {
    errorElement.textContent = 'No se pudo conectar con el servidor. Intente de nuevo.';
    errorElement.classList.add('visible');
    console.error('Login error:', error);
  }
});
