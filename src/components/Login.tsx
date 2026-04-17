import { useState, useMemo } from 'react';
import { signIn, signUp, resetPassword } from '../supabase';

type Mode = 'login' | 'register' | 'forgot';

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (pwd.length === 0) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: 'Molto debole', color: '#ef4444' };
  if (score === 2) return { score, label: 'Debole', color: '#f97316' };
  if (score === 3) return { score, label: 'Discreta', color: '#eab308' };
  if (score === 4) return { score, label: 'Buona', color: '#22c55e' };
  return { score, label: 'Ottima', color: '#16a34a' };
}

export function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setPassword('');
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const { data, error: err } = await signUp(email, password, displayName);
        if (err) {
          const msg = err.message.toLowerCase();
          if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
            throw new Error('Esiste già un account con questa email. Accedi o recupera la password.');
          }
          throw err;
        }
        // When email confirmation is enabled, Supabase returns success but with no identities
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('Esiste già un account con questa email. Accedi o recupera la password.');
        }
        // If user is null without error, also treat as duplicate
        if (!data.user) {
          throw new Error('Esiste già un account con questa email. Accedi o recupera la password.');
        }
      } else if (mode === 'login') {
        const { error: err } = await signIn(email, password);
        if (err) throw err;
      } else {
        const { error: err } = await resetPassword(email);
        if (err) throw err;
        setSuccess('Email di recupero inviata. Controlla la tua casella di posta.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === 'register' ? 'Crea account' : mode === 'forgot' ? 'Recupera password' : 'Accedi';

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon">📦</div>
        <h1>BC Migration Tracker</h1>
        <p>Traccia lo stato della migrazione delle dipendenze Business Central</p>
        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
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
          {mode !== 'forgot' && (
            <>
              <div className="login-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="login-input login-input--password"
                />
                <button
                  type="button"
                  className="btn-show-password"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {mode === 'register' && password.length > 0 && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="password-strength-segment"
                        style={{ background: i <= strength.score ? strength.color : 'var(--color-border)' }}
                      />
                    ))}
                  </div>
                  <span className="password-strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </>
          )}
          {error && <p className="login-error">{error}</p>}
          {success && <p className="login-success">{success}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Attendere...' : title}
          </button>
        </form>
        <div className="login-links">
          {mode === 'login' && (
            <>
              <button className="login-toggle" onClick={() => switchMode('register')}>
                Non hai un account? Registrati
              </button>
              <button className="login-toggle" onClick={() => switchMode('forgot')}>
                Password dimenticata?
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button className="login-toggle" onClick={() => switchMode('login')}>
              {mode === 'register' ? 'Hai già un account? Accedi' : 'Torna al login'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
