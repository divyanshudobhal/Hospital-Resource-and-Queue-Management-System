import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } catch (err) {
      setError('Cannot connect to server. Make sure the backend is running on port 5000.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <AppNavbar />
      <main className="login-main">
        <div className="login-card" id="login">
          <div className="login-header">
            <span className="login-icon" aria-hidden="true">+</span>
            <p className="eyebrow">WELCOME TO CAREPOINT</p>
            <h1>Your care, organized.</h1>
            <p>Sign in to manage appointments and patient care.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="demo-info">
            <p><strong>Demo Accounts</strong> (password: <code>password123</code>)</p>
            <div className="demo-accounts">
              <span className="demo-role">👨‍⚕️ Doctor:</span> dr.smith &nbsp;|&nbsp; dr.jones<br />
              <span className="demo-role">🧑 Patient:</span> patient1 &nbsp;|&nbsp; patient2 &nbsp;|&nbsp; patient3
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
