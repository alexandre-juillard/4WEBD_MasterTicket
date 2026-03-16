export type UserRole = 'Admin' | 'EventCreator' | 'Operator' | 'User';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface EventItem {
  _id: string;
  title: string;
  description: string;
  venue: string;
  city: string;
  date: string;
  totalSeats: number;
  remainingSeats: number;
  ticketPrice: number;
}

export interface TicketItem {
  _id: string;
  ticketNumber: string;
  eventId: string;
  eventTitle: string;
  unitPrice: number;
  status: 'ACTIVE' | 'CANCELLED';
  createdAt: string;
}
