import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { confirmPurchase } from '../services/api';

export function PaymentSuccessPage() {
  const { token } = useAuth();
  const { notify } = useNotifications();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId || !token) {
      setStatus('error');
      setMessage('Missing session or authentication token');
      return;
    }

    const runConfirmation = async () => {
      try {
        const result = await confirmPurchase(token, { sessionId });
        setStatus('done');
        setMessage(`${result.message}. ${result.tickets.length} ticket(s) issued.`);
        notify('Payment confirmed and tickets created', 'success');
      } catch (error) {
        setStatus('error');
        setMessage((error as Error).message);
        notify((error as Error).message, 'error');
      }
    };

    void runConfirmation();
  }, [searchParams, token]);

  return (
    <section className="centered-panel">
      <h1>Payment result</h1>
      <p>{message}</p>
      {status === 'done' && <Link to="/my-tickets">View my tickets</Link>}
      {status === 'error' && <Link to="/">Back to events</Link>}
    </section>
  );
}
