import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const getLoginMessage = (error) =>
  error?.response?.data?.message || error?.response?.data?.error || 'No fue posible iniciar sesion.';

export default function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (registering) {
        await onRegister({ email, nombre: name, password });
        setRegistering(false);
        setPassword('');
      } else {
        await onLogin({ email, password });
      }
    } catch (requestError) {
      setError(getLoginMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-card">
          <img className="login-logo" src="/brand/logo-color.png" alt="TaskFlow Pro" />

          <div className="login-copy">
            <h1>{registering ? 'Registro de usuario' : 'Iniciar sesion'}</h1>
            <p>{registering ? 'Este formulario consume POST /auth/registro.' : 'Acceso con POST /auth/login.'}</p>
          </div>

          <form className="login-form" onSubmit={submit}>
            {registering ? (
              <label className="field">
                <span>Nombre</span>
                <input value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
            ) : null}

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <button className="button button--primary button--login" type="submit" disabled={loading}>
              <span>{loading ? 'Procesando...' : registering ? 'Registrar' : 'Ingresar'}</span>
              <ArrowRight size={22} />
            </button>
          </form>

          <p className="access-note">
            <button type="button" onClick={() => setRegistering((value) => !value)}>
              {registering ? 'Ya tengo cuenta' : 'Crear cuenta'}
            </button>
          </p>
        </div>
      </section>

      <section className="login-visual" aria-hidden="true" />
    </main>
  );
}
