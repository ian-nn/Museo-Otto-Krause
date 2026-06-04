import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginService } from '../services/auth.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function useAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const validate = () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setError('Ingrese un email válido.');
      return false;
    }

    if (!trimmedPassword) {
      setError('La contraseña no puede estar vacía.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginService(email.trim(), password);

      if (response.sucess === true) {
        localStorage.setItem('auth_token', response.token || '');
        localStorage.setItem(
          'auth_user',
          JSON.stringify({
            id_usuario: response.id_usuario || null,
            nombre: response.nombre || '',
            email: response.email || '',
            rol: response.rol || '',
          })
        );

        navigate('/admin');
        return;
      }

      setError(response.message || 'Credenciales inválidas.');
    } catch (fetchError) {
      setError(fetchError.message || 'Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    password,
    isLoading,
    error,
    setEmail,
    setPassword,
    handleSubmit,
  };
}

export default useAuth;
