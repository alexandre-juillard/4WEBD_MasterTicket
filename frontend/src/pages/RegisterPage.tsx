import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { registerUser } from '../services/api';

export function RegisterPage() {
  const { login } = useAuth();
  const { notify } = useNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'User',
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await registerUser(formData);
      login(response.accessToken, response.user);
      notify('Account created successfully', 'success');
      navigate('/');
    } catch (error) {
      notify((error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="centered-panel">
      <h1>Register</h1>
      <form className="form-card" onSubmit={(event) => void handleSubmit(event)}>
        <input
          placeholder="Full name"
          value={formData.fullName}
          onChange={(entry) => setFormData((current) => ({ ...current, fullName: entry.target.value }))}
          required
        />
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
        <select
          value={formData.role}
          onChange={(entry) => setFormData((current) => ({ ...current, role: entry.target.value }))}
        >
          <option value="User">User</option>
          <option value="Operator">Operator</option>
          <option value="EventCreator">EventCreator</option>
          <option value="Admin">Admin</option>
        </select>
        <button disabled={loading} type="submit">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p>
        Already registered? <Link to="/login">Login</Link>
      </p>
    </section>
  );
}
