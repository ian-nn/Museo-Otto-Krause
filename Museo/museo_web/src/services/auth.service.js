const DEFAULT_API_BASE_URL = 'http://localhost/Museo/Museo-Otto-Krause/Museo%20OttoKrause/museo_api';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
const LOGIN_ENDPOINT = `${API_BASE_URL}/auth/login.php`;

export const AuthService = {
    login: async (username, password) => {
        const response = await fetch(LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error('Respuesta inválida del servidor');
        }

        if (!response.ok) {
            throw new Error(data.message || `Error ${response.status}`);
        }

        if (!data.token) {
            throw new Error(data.message || 'No se recibió token de autenticación');
        }

        return data;
    },
};
