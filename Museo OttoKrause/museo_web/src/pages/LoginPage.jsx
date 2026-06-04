import { useState } from "react";
import "./LoginPage.css";

const logo = "/unnamed.png";

const ADMIN_CREDENTIALS = [
  { user: "admin", pass: "museo2024" },
  { user: "director", pass: "latzina24" },
];

 

function LoginPage({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const attempt = async () => {
    if (!user.trim() || !pass.trim()) {
      setErr("Completá usuario y contraseña.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const match = ADMIN_CREDENTIALS.find(
      (c) => c.user === user.trim() && c.pass === pass
    );

    if (match) {
      setErr("");
      setLoading(false);
      if (typeof onLogin === "function") {
        onLogin();
      } else {
        setSuccess(true);
      }
      return;
    }

    setErr("Usuario o contraseña incorrectos.");
    setPass("");
    setLoading(false);
    setTimeout(() => setErr(""), 2800);
  };

  const onKey = (e) => e.key === "Enter" && attempt();

  return (
    <div className="login-page">
      <div className="login-page-noise" />
      <div className="login-card">
        <div className="login-logo">
          <img src={logo} alt="Logo" />
        </div>

        <div className="login-title">Panel administrativo</div>
        <div className="login-sub">Museo Tecnológico Eduardo Latzina</div>
        <div className="login-divider" />

        {err && (
          <div className="login-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {err}
          </div>
        )}

        {success && (
          <div className="login-success">
            Acceso exitoso. Ahora estás dentro del modo de desarrollo de la página de login.
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Usuario</label>
          <input
            className="form-input"
            type="text"
            placeholder="Nombre de usuario"
            value={user}
            onChange={(e) => {
              setUser(e.target.value);
              setErr("");
              setSuccess(false);
            }}
            onKeyDown={onKey}
            autoComplete="username"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <input
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
              setErr("");
              setSuccess(false);
            }}
            onKeyDown={onKey}
            autoComplete="current-password"
          />
        </div>

        <button
          className="btn btn-primary btn-full login-submit"
          onClick={attempt}
          disabled={loading}
        >
          {loading ? "Verificando." : "Ingresar al panel"}
        </button>

        <div className="login-footer-hint">ACCESO RESTRINGIDO · PERSONAL AUTORIZADO</div>
      </div>
    </div>
  );
}

export default LoginPage;