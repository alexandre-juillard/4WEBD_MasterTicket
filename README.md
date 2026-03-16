# MasterTicket SaaS

Microservices MVP for concert events and ticket sales.

## Stack

- Backend: NestJS + TypeScript
- Frontend: React + Vite + TypeScript
- Databases: MongoDB (one database per service)
- Broker: RabbitMQ (durable queue)
- Load balancer / entrypoint: Nginx on port 8080
- Payment: Stripe Checkout (test mode)
- Email: Mailtrap SMTP

## Project layout

- /backend/user-service
- /backend/event-service
- /backend/ticket-service
- /backend/notification-service
- /backend/payment-service
- /frontend
- /nginx
- /docker-compose.yml

## Core behavior

- Event read is public.
- Ticket purchase is authenticated and linked to the authenticated user.
- JWT is validated locally in each service using the shared JWT secret.
- Frontend keeps the JWT in local storage so users do not need to re-login for every action.
- RabbitMQ queues email notification messages. If notification service is down, messages remain queued and are consumed when it is up again.

## Services

### User Service

- Register
- Login (JWT)
- Get profile
- Delete profile
- Roles: Admin, EventCreator, Operator, User

Swagger: /api/users/docs

### Event Service

- Public list/details
- Create/update/delete with role checks
- Seat stock (remaining seats) management
- Internal reserve/release endpoints for ticket flow

Swagger: /api/events/docs

### Ticket Service

- Authenticated checkout start
- Purchase confirmation from Stripe session
- Unit unique ticket generation
- User ticket listing
- Ticket cancellation (seat released, no refund)

Swagger: /api/tickets/docs

### Payment Service

- Stripe checkout session creation (test mode)
- Internal payment session verification
- Payment records by user
- Scheduled JSON backup for payment DB snapshots

Swagger: /api/payments/docs

### Notification Service

- RabbitMQ consumer on notifications.email queue
- Mailtrap SMTP email dispatch
- Health endpoint

Swagger: /api/notifications/docs

## Run with Docker

1. Copy root env template:

   - Windows PowerShell:
     - Copy-Item .env.example .env

2. Update .env values:

   - JWT_SECRET
   - INTERNAL_API_KEY
   - STRIPE_SECRET_KEY
   - SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM

3. Start all services:

   - docker compose up --build

4. Access app:

   - Frontend and API gateway: http://localhost:8080
   - RabbitMQ management: http://localhost:15672 (guest / guest)

## Stripe test mode quick guide

1. Create a Stripe account and enable test mode.
2. Get your Secret key (starts with sk_test_) and set STRIPE_SECRET_KEY in .env.
3. Start the stack with docker compose up --build.
4. Register/login from the UI.
5. Open Events, choose quantity, click Buy ticket(s).
6. Stripe Checkout opens; use Stripe test card:
   - Card: 4242 4242 4242 4242
   - Expiry: any future date
   - CVC: any 3 digits
7. After payment success, Stripe redirects to /payment/success, then ticket confirmation is performed and unique tickets are generated.

## Local development (without Docker)

- Each service has its own package.json and .env.example.
- Install dependencies in each service and in frontend.
- Start services independently with npm run start:dev.
- Start frontend with npm run dev.

## Notes

- This is an MVP-oriented architecture, not production hardening.
- Secrets are not hardcoded in source code.
- Passwords are hashed with bcrypt.
- Unit tests are included in each service.
