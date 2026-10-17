import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';

const initialForm = {
  name: '',
  username: '',
  password: '',
  confirmPassword: '',
  age: '',
  gender: '',
  phone: '',
  blood_group: ''
};

export default function Signup() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...account } = form;
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account)
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Could not create your account.');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/patient-dashboard');
    } catch {
      setError('Cannot connect to the server. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <AppNavbar />
      <main className="login-main">
        <section className="login-card signup-card" aria-labelledby="signup-title">
          <header className="login-header">
            <span className="login-icon" aria-hidden="true">+</span>
            <p className="eyebrow">PATIENT REGISTRATION</p>
            <h1 id="signup-title">Create your account</h1>
            <p>Sign up to book visits and manage your appointments.</p>
          </header>

          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error" role="alert">{error}</div>}

            <div className="form-group">
              <label htmlFor="signup-name">Full name</label>
              <input id="signup-name" autoComplete="name" maxLength={100} value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="signup-username">Username</label>
              <input id="signup-username" autoComplete="username" minLength={3} maxLength={50} value={form.username} onChange={(e) => update('username', e.target.value)} required />
              <small className="field-hint">3–50 characters; letters, numbers, dots, underscores, or hyphens.</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <input id="signup-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={form.password} onChange={(e) => update('password', e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="signup-confirm-password">Confirm password</label>
                <input id="signup-confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="signup-age">Age <span className="optional-label">(optional)</span></label>
                <input id="signup-age" type="number" min="1" max="120" value={form.age} onChange={(e) => update('age', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="signup-gender">Gender <span className="optional-label">(optional)</span></label>
                <select id="signup-gender" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                  <option value="">Prefer not to say</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="signup-phone">Phone <span className="optional-label">(optional)</span></label>
                <input id="signup-phone" type="tel" autoComplete="tel" maxLength={20} value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="signup-blood-group">Blood group <span className="optional-label">(optional)</span></label>
                <select id="signup-blood-group" value={form.blood_group} onChange={(e) => update('blood_group', e.target.value)}>
                  <option value="">Select blood group</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create patient account'}
            </button>
          </form>

          <p className="auth-switch">Already registered?<Link to="/">Sign in</Link></p>
        </section>
      </main>
    </div>
  );
}
