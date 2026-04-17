import { useState, useMemo } from 'react';
import { updatePassword } from '../supabase';
import { useAuth } from '../context/AuthContext';

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

export function ResetPasswordModal() {
  const { clearRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri.');
      return;
    }
    setError('');
    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      clearRecovery();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Imposta nuova password</h3>
        <p>Scegli una nuova password per il tuo account.</p>
        <form onSubmit={handleSubmit} className="login-form" style={{ marginBottom: 0 }}>
          <div className="login-password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              className="login-input login-input--password"
              placeholder="Nuova password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoFocus
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
          {password.length > 0 && (
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
          {error && <p className="login-error">{error}</p>}
          <div className="modal-actions">
            <button type="submit" className="btn-confirm" disabled={loading || password.length < 6}>
              {loading ? 'Salvataggio...' : 'Salva password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
