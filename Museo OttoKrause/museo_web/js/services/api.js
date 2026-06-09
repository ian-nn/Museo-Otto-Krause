// api.js
// Este servicio centraliza la URL base del backend PHP y expone helpers para las solicitudes HTTP.
// Usamos una ruta relativa desde `museo_web` hacia la carpeta `museo_api`.
const API_BASE_URL = '../museo_api';

/**
 * Envía datos a un endpoint PHP usando fetch con JSON.
 * @param {string} endpoint - Nombre del archivo PHP o ruta relativa.
 * @param {object} body - Datos que se enviarán en el body de la petición.
 * @returns {Promise<object>} - Respuesta JSON del servidor.
 */
export async function postJson(endpoint, body) {
  const url = `${API_BASE_URL}/${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // Intentar leer mensaje JSON del servidor si existe
    let serverMessage = '';
    try {
      const errJson = await response.json();
      serverMessage = errJson.message ? ` - ${errJson.message}` : '';
    } catch (e) {
      // ignore
    }
    throw new Error(`Error de red: ${response.status} ${response.statusText}${serverMessage}`);
  }

  return response.json();
}
