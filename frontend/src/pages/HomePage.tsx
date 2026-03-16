import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { createEvent, fetchEvents, startCheckout } from '../services/api';
import type { EventItem } from '../types/models';

const editableRoles = new Set(['Admin', 'EventCreator']);

export function HomePage() {
  const { token, user } = useAuth();
  const { notify } = useNotifications();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantityByEvent, setQuantityByEvent] = useState<Record<string, number>>({});
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    city: '',
    date: '',
    totalSeats: 100,
    ticketPrice: 25,
  });

  const canCreateEvent = useMemo(() => !!user && editableRoles.has(user.role), [user]);

  const loadEvents = async () => {
    setLoading(true);

    try {
      const result = await fetchEvents();
      setEvents(result);
    } catch (error) {
      notify((error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const handleCheckout = async (eventId: string) => {
    if (!token) {
      notify('Please login before buying tickets', 'info');
      navigate('/login');
      return;
    }

    try {
      const quantity = quantityByEvent[eventId] ?? 1;
      const checkout = await startCheckout(token, { eventId, quantity });
      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      notify((error as Error).message, 'error');
    }
  };

  const handleCreateEvent = async (event: FormEvent) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    setCreatingEvent(true);

    try {
      await createEvent(token, {
        ...formData,
        date: new Date(formData.date).toISOString(),
      });
      notify('Event created successfully', 'success');
      setFormData({
        title: '',
        description: '',
        venue: '',
        city: '',
        date: '',
        totalSeats: 100,
        ticketPrice: 25,
      });
      await loadEvents();
    } catch (error) {
      notify((error as Error).message, 'error');
    } finally {
      setCreatingEvent(false);
    }
  };

  return (
    <div className="home-grid">
      <section>
        <h1>Available events</h1>
        {loading ? (
          <p>Loading events...</p>
        ) : (
          <div className="event-list">
            {events.map((event) => (
              <article key={event._id} className="event-card">
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <div className="event-meta">
                  <span>{new Date(event.date).toLocaleString()}</span>
                  <span>
                    {event.venue}, {event.city}
                  </span>
                </div>
                <div className="event-foot">
                  <span>{event.ticketPrice.toFixed(2)} EUR</span>
                  <span>{event.remainingSeats} seats left</span>
                </div>
                <div className="purchase-row">
                  <input
                    type="number"
                    min={1}
                    max={event.remainingSeats}
                    value={quantityByEvent[event._id] ?? 1}
                    onChange={(entry) =>
                      setQuantityByEvent((current) => ({
                        ...current,
                        [event._id]: Number(entry.target.value),
                      }))
                    }
                  />
                  <button
                    disabled={event.remainingSeats === 0}
                    onClick={() => {
                      void handleCheckout(event._id);
                    }}
                    type="button"
                  >
                    Buy ticket(s)
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {canCreateEvent && (
        <section>
          <h2>Create event</h2>
          <form className="form-card" onSubmit={(event) => void handleCreateEvent(event)}>
            <input
              placeholder="Title"
              value={formData.title}
              onChange={(entry) => setFormData((current) => ({ ...current, title: entry.target.value }))}
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(entry) =>
                setFormData((current) => ({ ...current, description: entry.target.value }))
              }
              required
            />
            <input
              placeholder="Venue"
              value={formData.venue}
              onChange={(entry) => setFormData((current) => ({ ...current, venue: entry.target.value }))}
              required
            />
            <input
              placeholder="City"
              value={formData.city}
              onChange={(entry) => setFormData((current) => ({ ...current, city: entry.target.value }))}
              required
            />
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(entry) => setFormData((current) => ({ ...current, date: entry.target.value }))}
              required
            />
            <div className="split-inputs">
              <input
                type="number"
                min={1}
                placeholder="Seats"
                value={formData.totalSeats}
                onChange={(entry) =>
                  setFormData((current) => ({ ...current, totalSeats: Number(entry.target.value) }))
                }
                required
              />
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Price"
                value={formData.ticketPrice}
                onChange={(entry) =>
                  setFormData((current) => ({ ...current, ticketPrice: Number(entry.target.value) }))
                }
                required
              />
            </div>
            <button disabled={creatingEvent} type="submit">
              {creatingEvent ? 'Creating...' : 'Create event'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
