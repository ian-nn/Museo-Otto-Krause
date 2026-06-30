// api.js
// Este servicio centraliza la URL base del backend PHP y expone helpers para las solicitudes HTTP.
// Usamos una ruta relativa desde `museo_web` hacia la carpeta `museo_api`.
const API_BASE_URL = '../museo_api';

/**
 * Envía datos a un endpoint PHP usando fetch con JSON (GET).
 * @param {string} endpoint - Nombre del archivo PHP o ruta relativa.
 * @returns {Promise<object>} - Respuesta JSON del servidor.
 */
export async function getJson(endpoint) {
  const url = `${API_BASE_URL}/${endpoint}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const responseText = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error(`Respuesta inválida del servidor: se esperaba JSON pero se recibió ${contentType || 'texto'}. ${responseText.slice(0, 300)}`);
  }

  let jsonData;
  try {
    jsonData = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`JSON inválido recibido del servidor: ${e.message}. ${responseText.slice(0, 300)}`);
  }

  if (!response.ok) {
    const serverMessage = jsonData && jsonData.message ? ` - ${jsonData.message}` : '';
    throw new Error(`Error de red: ${response.status} ${response.statusText}${serverMessage}`);
  }

  return jsonData;
}

/**
 * Envía datos a un endpoint PHP usando fetch con JSON (POST).
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

  const responseText = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error(`Respuesta inválida del servidor: se esperaba JSON pero se recibió ${contentType || 'texto'}. ${responseText.slice(0, 300)}`);
  }

  let jsonData;
  try {
    jsonData = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`JSON inválido recibido del servidor: ${e.message}. ${responseText.slice(0, 300)}`);
  }

  if (!response.ok) {
    const serverMessage = jsonData && jsonData.message ? ` - ${jsonData.message}` : '';
    throw new Error(`Error de red: ${response.status} ${response.statusText}${serverMessage}`);
  }

  return jsonData;
}
