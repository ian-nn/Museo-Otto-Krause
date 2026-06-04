export async function login(email, password) {
    const url = 'http://localhost/museo_api/controllers/auth.php';
    const payload = {
        nombre_usuario: '',
        email_usuario: email,
        password,
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error('Respuesta inválida del servidor.');
    }

    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`);
    }

    return data;
}
