import type { AuthUser, EventItem, TicketItem } from '../types/models';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;

    const message =
      typeof errorPayload?.message === 'string'
        ? errorPayload.message
        : Array.isArray(errorPayload?.message)
          ? errorPayload.message.join(', ')
          : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function registerUser(payload: {
  email: string;
  fullName: string;
  password: string;
  role?: string;
}) {
  return apiRequest<{ accessToken: string; user: AuthUser }>('/api/users/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export function loginUser(payload: { email: string; password: string }) {
  return apiRequest<{ accessToken: string; user: AuthUser }>('/api/users/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export function fetchEvents() {
  return apiRequest<EventItem[]>('/api/events');
}

export function createEvent(
  token: string,
  payload: {
    title: string;
    description: string;
    venue: string;
    city: string;
    date: string;
    totalSeats: number;
    ticketPrice: number;
  },
) {
  return apiRequest<EventItem>('/api/events', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function startCheckout(token: string, payload: { eventId: string; quantity: number }) {
  return apiRequest<{ sessionId: string; checkoutUrl: string }>('/api/tickets/checkout', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function confirmPurchase(token: string, payload: { sessionId: string }) {
  return apiRequest<{ message: string; tickets: TicketItem[] }>('/api/tickets/confirm', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function fetchMyTickets(token: string) {
  return apiRequest<TicketItem[]>('/api/tickets/mine', {
    token,
  });
}

export function cancelTicket(token: string, ticketId: string) {
  return apiRequest<{ message: string }>(`/api/tickets/${ticketId}`, {
    method: 'DELETE',
    token,
  });
}
