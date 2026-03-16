import { Link } from 'react-router-dom';

export function PaymentCancelPage() {
  return (
    <section className="centered-panel">
      <h1>Payment canceled</h1>
      <p>Your payment was canceled. No ticket has been generated.</p>
      <Link to="/">Back to events</Link>
    </section>
  );
}
