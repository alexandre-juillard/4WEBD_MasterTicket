# MasterTicket SaaS

Plateforme microservices pour la gestion d'evenements et la vente de billets.

## Choix technologiques

- Backend: NestJS + TypeScript
- Frontend: React + Vite + TypeScript
- Bases de donnees: MongoDB (1 base par service)
- Messagerie: RabbitMQ
- Reverse proxy / point d'entree: Nginx (port 8080)
- Paiement: Stripe Checkout (mode test)
- Email: SMTP Mailtrap

## Objectifs du projet

- Gerer des evenements (creation, mise a jour, suppression, consultation)
- Permettre l'achat de billets avec confirmation de paiement
- Gerer les roles applicatifs: Admin, EventCreator, Operator, User
- Isoler chaque domaine metier en microservice

## Composition du backend

Le dossier `backend/` contient 5 microservices NestJS:

- `user-service`: inscription, connexion JWT, profil utilisateur, roles
- `event-service`: gestion des evenements et des places disponibles
- `ticket-service`: checkout, confirmation d'achat, tickets utilisateur, annulation
- `payment-service`: creation/verifications de sessions Stripe + backup periodique
- `notification-service`: consommation RabbitMQ + envoi email SMTP

Composants transverses:

- MongoDB: 1 instance par service metier de persistance
- RabbitMQ: transport asynchrone pour les notifications
- Nginx: entree unique et routage vers les APIs
- Replicas Docker: `event-service` et `ticket-service` sont instancies en x2

## Composition du frontend

Le dossier `frontend/` contient une SPA React:

- Routing principal dans `src/App.tsx`
- Pages: accueil, login, register, mes billets, paiement succes, paiement annule
- Contextes: authentification (`AuthContext`) + notifications UI (`NotificationContext`)
- Service API centralise dans `src/services/api.ts`
- Protection de route pour les pages authentifiees (`ProtectedRoute`)

## Prerequis

### Execution avec Docker

- Docker Desktop (ou Docker Engine + Compose)
- Port libres: 8080, 8081, 8082, 8083, 8084, 15672
- Fichier d'environnement racine:

PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux (bash):

```bash
cp .env.example .env
```

Variables a renseigner dans `.env`:

- `JWT_SECRET`
- `INTERNAL_API_KEY`
- `STRIPE_SECRET_KEY`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `MONGO_EXPRESS_USERNAME`, `MONGO_EXPRESS_PASSWORD`

### Execution en local sans Docker

- Node.js 20+ et npm
- MongoDB en local (bases: `user_service_db`, `event_service_db`, `ticket_service_db`, `payment_service_db`)
- RabbitMQ en local (broker AMQP)
- Compte Stripe en mode test
- Compte SMTP (Mailtrap ou equivalent)
- Copier les fichiers d'environnement de chaque service:

PowerShell:

```powershell
Copy-Item backend/user-service/.env.example backend/user-service/.env
Copy-Item backend/event-service/.env.example backend/event-service/.env
Copy-Item backend/ticket-service/.env.example backend/ticket-service/.env
Copy-Item backend/notification-service/.env.example backend/notification-service/.env
Copy-Item backend/payment-service/.env.example backend/payment-service/.env
```

Linux (bash):

```bash
cp backend/user-service/.env.example backend/user-service/.env
cp backend/event-service/.env.example backend/event-service/.env
cp backend/ticket-service/.env.example backend/ticket-service/.env
cp backend/notification-service/.env.example backend/notification-service/.env
cp backend/payment-service/.env.example backend/payment-service/.env
```

Points importants pour le mode local:

- Adapter les `MONGODB_URI` vers votre Mongo local (ex: `mongodb://localhost:27017/<db_name>`)
- Adapter les `RABBITMQ_URL` vers votre RabbitMQ local (ex: `amqp://guest:guest@localhost:5672`)
- Adapter `EVENT_SERVICE_URL` et `PAYMENT_SERVICE_URL` dans `ticket-service/.env`
- Renseigner `STRIPE_SECRET_KEY` et les variables SMTP
- Le frontend Vite proxy `/api` vers `http://localhost:8080` (un reverse proxy local doit donc etre disponible sur ce port)

## Commande de lancement avec Docker

Depuis la racine du projet:

```bash
docker compose up --build
```

## Commandes de lancement en local sans Docker

### 1) Installer les dependances

PowerShell:

```powershell
Set-Location backend/user-service; npm install
Set-Location ../event-service; npm install
Set-Location ../ticket-service; npm install
Set-Location ../notification-service; npm install
Set-Location ../payment-service; npm install
Set-Location ../../frontend; npm install
```

Linux (bash):

```bash
cd backend/user-service && npm install
cd ../event-service && npm install
cd ../ticket-service && npm install
cd ../notification-service && npm install
cd ../payment-service && npm install
cd ../../frontend && npm install
```

### 2) Lancer les services backend (1 terminal par service)

PowerShell:

```powershell
Set-Location backend/user-service; npm run start:dev
```

Linux (bash):

```bash
cd backend/user-service && npm run start:dev
```

PowerShell:

```powershell
Set-Location backend/event-service; npm run start:dev
```

Linux (bash):

```bash
cd backend/event-service && npm run start:dev
```

PowerShell:

```powershell
Set-Location backend/ticket-service; npm run start:dev
```

Linux (bash):

```bash
cd backend/ticket-service && npm run start:dev
```

PowerShell:

```powershell
Set-Location backend/notification-service; npm run start:dev
```

Linux (bash):

```bash
cd backend/notification-service && npm run start:dev
```

PowerShell:

```powershell
Set-Location backend/payment-service; npm run start:dev
```

Linux (bash):

```bash
cd backend/payment-service && npm run start:dev
```

### 3) Lancer le frontend

PowerShell:

```powershell
Set-Location frontend; npm run dev
```

Linux (bash):

```bash
cd frontend && npm run dev
```

## URLs utiles et configuration des credentials

### URLs en mode Docker

- Application + gateway Nginx: `http://localhost:8080`
- Swagger User API: `http://localhost:8080/api/users/docs`
- Swagger Event API: `http://localhost:8080/api/events/docs`
- Swagger Ticket API: `http://localhost:8080/api/tickets/docs`
- Swagger Payment API: `http://localhost:8080/api/payments/docs`
- Swagger Notification API: `http://localhost:8080/api/notifications/docs`
- RabbitMQ Management: `http://localhost:15672`
- Mongo Express User: `http://localhost:8081`
- Mongo Express Event: `http://localhost:8082`
- Mongo Express Ticket: `http://localhost:8083`
- Mongo Express Payment: `http://localhost:8084`

Credentials Docker:

- RabbitMQ Management: `guest / guest` (dans `docker-compose.yml`)
- Mongo Express: `MONGO_EXPRESS_USERNAME / MONGO_EXPRESS_PASSWORD` (dans `.env` racine)
- SMTP, Stripe, JWT, cle API interne: dans `.env` racine

### URLs en mode local sans Docker

- Frontend Vite: `http://localhost:5173`
- User service: `http://localhost:3001` (docs: `/api/users/docs`)
- Event service: `http://localhost:3002` (docs: `/api/events/docs`)
- Ticket service: `http://localhost:3003` (docs: `/api/tickets/docs`)
- Notification service: `http://localhost:3004` (docs: `/api/notifications/docs`)
- Payment service: `http://localhost:3005` (docs: `/api/payments/docs`)
- RabbitMQ Management (si actif localement): `http://localhost:15672`

Credentials local:

- Se paramettrent dans chaque fichier `.env` de service (`backend/*-service/.env`)
- MongoDB: via `MONGODB_URI`
- RabbitMQ: via `RABBITMQ_URL`
- Communication inter-services: `INTERNAL_API_KEY`, `EVENT_SERVICE_URL`, `PAYMENT_SERVICE_URL`
- Auth/JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- Paiement Stripe: `STRIPE_SECRET_KEY`, `FRONTEND_SUCCESS_URL`, `FRONTEND_CANCEL_URL`
- Email SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
