// api.js
// Este servicio centraliza la URL base del backend PHP y expone helpers para las solicitudes HTTP.
const API_BASE_URL = 'http://localhost/museo_api/controllers';

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
    throw new Error(`Error de red: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
