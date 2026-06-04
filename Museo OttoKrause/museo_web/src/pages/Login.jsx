import './Login.css';
import useAuth from '../hooks/useAuth';

const Login = () => {
    const {
        email,
        password,
        isLoading,
        error,
        setEmail,
        setPassword,
        handleSubmit,
    } = useAuth();

    return (
        <div className="login-page">
            <div className="background-glow" />

            <header className="header">
                <div className="header-top">
                    <div className="logo-container">
                        <img
                            src="/orig-marca-otto-krause.svg"
                            alt="Otto Krause"
                            className="logo-badge"
                        />
                        <span className="institution-name">Museo Otto Krause</span>
                    </div>
                </div>
            </header>

            <div className="login-container">
                <div className="login-card">
                    <div className="card-header">
                        <h2>Iniciar sesión</h2>
                        <p>Accede a la plataforma del museo</p>
                    </div>

                    <form className="formulario" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="correo">Correo electrónico</label>
                            <div className="input-wrapper">
                                <input
                                    id="correo"
                                    type="email"
                                    placeholder="Correo electrónico"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    aria-label="Correo electrónico"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Contraseña</label>
                            <div className="input-wrapper">
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    aria-label="Contraseña"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? 'Cargando...' : 'Iniciar sesión'}
                        </button>

                        {error && <span className="error-message active">{error}</span>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
