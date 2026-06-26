// api.js
// Este servicio centraliza la URL base del backend PHP y expone helpers para las solicitudes HTTP.
const API_BASE_URL = '../museo_api';

/**
 * Envía datos a un endpoint PHP usando fetch con JSON.
 * @param {string} endpoint - Ruta relativa al archivo PHP o al endpoint del router.
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

  let jsonData = null;
  try {
    jsonData = responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    throw new Error(`JSON inválido recibido del servidor: ${error.message}. ${responseText.slice(0, 300)}`);
  }

  if (!response.ok) {
    const serverMessage = jsonData?.message || jsonData?.errors?.[0]?.message || 'Error al procesar la solicitud.';
    throw new Error(serverMessage);
  }

  return jsonData || {};
}
