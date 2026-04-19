# Banking System (Full Stack)

Production-style banking application with OTP-based authentication, JWT authorization, and secured account operations.

## Overview

- Backend module: `account-service` (Java 17, Spring Boot 3)
- Frontend module: `frontend` (Vanilla HTML/CSS/JavaScript)
- Database:
  - Default: H2 file database
  - Optional: MySQL profile

## Security Features

- Spring Security with stateless JWT authentication
- OTP verification for **registration** and **login**
- BCrypt password hashing
- Role-based access control (`USER`, `ADMIN`)
- Ownership enforcement for account operations

## Auth Flow (Implemented)

### Register + OTP

1. `POST /auth/register` with `name`, `email`, `password`
2. System creates user in `PENDING` state
3. OTP (REGISTER type) generated and printed in backend logs
4. `POST /auth/verify-register-otp` with `email`, `code`
5. User becomes `ACTIVE`

### Login + OTP + JWT

1. `POST /auth/login` with `email`, `password`
2. OTP (LOGIN type) generated and printed in backend logs
3. `POST /auth/verify-login-otp` with `email`, `code`
4. Backend returns JWT token
5. Frontend stores token and sends `Authorization: Bearer <jwt>` automatically

## Role Behavior

- `USER`
  - Accesses own accounts via `/api/accounts/me`
  - Can perform transactions only on owned accounts
- `ADMIN`
  - Accesses all accounts via `/api/accounts`
  - Can access admin users endpoint: `/auth/admin/users`

## Backend API Endpoints

### Public Auth Endpoints

- `POST /auth/register`
- `POST /auth/verify-register-otp`
- `POST /auth/login`
- `POST /auth/verify-login-otp`

### Protected Account Endpoints

- `POST /api/accounts`
- `GET /api/accounts` (ADMIN)
- `GET /api/accounts/me` (USER self-view)
- `GET /api/accounts/{id}`
- `PUT /api/accounts/{id}`
- `DELETE /api/accounts/{id}`
- `POST /api/accounts/{id}/deposit`
- `POST /api/accounts/{id}/withdraw`
- `POST /api/accounts/transfer`
- `GET /api/accounts/{id}/transactions?page=0&size=10`

## Frontend Auth UI

The frontend now supports complete secure flow:

- Register form
- Register OTP verification form
- Login form
- Login OTP verification form
- JWT session banner with role and logout
- Auto-attached bearer token for all secured banking API calls

If token expires or becomes invalid, frontend clears local session and returns to auth screen.

## Run Locally

### 1) Backend

```bash
cd account-service
mvn spring-boot:run
```

Backend URL: `http://localhost:8081`

Default bootstrapped admin:

- Email: `admin@banking.com`
- Password: `Admin@12345`

### 2) Frontend

Open `frontend/index.html` directly in browser (or serve with any static server).

Recommended frontend origin for CORS default config: `http://localhost:5500`

## Testing

```bash
cd account-service
mvn test
```

## Tech Stack

- Java 17
- Spring Boot 3
- Spring Web / Spring Data JPA / Validation / Security
- JWT (`jjwt`)
- H2 / MySQL
- JUnit 5 + Mockito
- HTML / CSS / JavaScript (Vanilla)

## API Response Format

All APIs use:

```json
{
  "status": 200,
  "message": "Operation successful",
  "data": {},
  "timestamp": "2026-04-18T13:40:11.123"
}

```



🎨 UI Upgrade

The frontend has been significantly improved to deliver a modern, responsive, and user-friendly banking experience.

✨ Improvements
🌗 Added Dark & Light mode toggle
🧊 Implemented Glassmorphism UI (especially in dark mode)
🌫️ Added blur background effect for modals (glass effect)
⚡ Introduced smooth animations and transitions
Scale-in modals
Fade effects for UI components
📦 Added Skeleton loading screens for better UX during data fetch
📱 Improved overall layout for better responsiveness and visual clarity
🎯 Result

The UI now feels like a modern fintech dashboard with smoother interactions, better visual hierarchy, and an enhanced user experience.



## Notes

- OTP delivery is currently console/log based for development.
- Configure stronger JWT secret and admin credentials for production.
- Keep `Authorization` header enabled in frontend clients for secured APIs.