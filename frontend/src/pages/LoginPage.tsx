import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { loginUser } from '../services/api';

export function LoginPage() {
  const { login } = useAuth();
  const { notify } = useNotifications();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await loginUser(formData);
      login(response.accessToken, response.user);
      notify('Login successful', 'success');
      navigate('/');
    } catch (error) {
      notify((error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="centered-panel">
      <h1>Login</h1>
      <form className="form-card" onSubmit={(event) => void handleSubmit(event)}>
        <input
          placeholder="Email"
          type="email"
          value={formData.email}
          onChange={(entry) => setFormData((current) => ({ ...current, email: entry.target.value }))}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={formData.password}
          onChange={(entry) => setFormData((current) => ({ ...current, password: entry.target.value }))}
          required
        />
        <button disabled={loading} type="submit">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p>
        No account yet? <Link to="/register">Create one</Link>
      </p>
    </section>
  );
}
