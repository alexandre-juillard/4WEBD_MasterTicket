import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { cancelTicket, fetchMyTickets } from '../services/api';
import type { TicketItem } from '../types/models';

export function MyTicketsPage() {
  const { token } = useAuth();
  const { notify } = useNotifications();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetchMyTickets(token);
      setTickets(response);
    } catch (error) {
      notify((error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, [token]);

  const handleCancel = async (ticketId: string) => {
    if (!token) {
      return;
    }

    try {
      await cancelTicket(token, ticketId);
      notify('Ticket cancelled', 'success');
      await loadTickets();
    } catch (error) {
      notify((error as Error).message, 'error');
    }
  };

  return (
    <section>
      <h1>My tickets</h1>
      {loading ? (
        <p>Loading tickets...</p>
      ) : (
        <div className="ticket-list">
          {tickets.map((ticket) => (
            <article key={ticket._id} className="ticket-card">
              <h3>{ticket.eventTitle}</h3>
              <p>Ticket number: {ticket.ticketNumber}</p>
              <p>Price: {ticket.unitPrice.toFixed(2)} EUR</p>
              <p>Status: {ticket.status}</p>
              <p>Purchased at: {new Date(ticket.createdAt).toLocaleString()}</p>
              {ticket.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => {
                    void handleCancel(ticket._id);
                  }}
                >
                  Cancel ticket
                </button>
              )}
            </article>
          ))}
          {tickets.length === 0 && <p>No tickets yet.</p>}
        </div>
      )}
    </section>
  );
}
