import { useState } from 'react';
import { signIn, signUp } from '../supabase';

export function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const { error: err } = await signUp(email, password, displayName);
        if (err) throw err;
      } else {
        const { error: err } = await signIn(email, password);
        if (err) throw err;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon">📦</div>
        <h1>BC Migration Tracker</h1>
        <p>Traccia lo stato della migrazione delle dipendenze Business Central</p>
        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <input
              type="text"
              placeholder="Nome visualizzato"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="login-input"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="login-input"
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Attendere...' : isRegister ? 'Registrati' : 'Accedi'}
          </button>
        </form>
        <button
          className="login-toggle"
          onClick={() => { setIsRegister(!isRegister); setError(''); }}
        >
          {isRegister ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
        </button>
      </div>
    </div>
  );
}
