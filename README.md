# Banking System (Full Stack)

Production-ready banking application with a Spring Boot REST backend and vanilla HTML/CSS/JS frontend.

## Project Overview

- Backend module: `account-service` (Java 17, Spring Boot, Spring Data JPA, Validation)
- Frontend module: `frontend` (single-page UI using vanilla JavaScript + Fetch API)
- Database:
  - Default: H2 file database
  - Optional: MySQL profile

## Features

- Account CRUD (create, list, get by id, update, delete)
- Deposit and withdraw operations with business rules
- Transaction history with pagination
- Optimistic locking for safe concurrent updates
- Standardized API response envelope (`status`, `message`, `data`, `timestamp`)
- Structured validation and exception handling
- Modern UI with modals, toasts, loading states, and transaction pagination controls

## Tech Stack

- Java 17
- Spring Boot 3
- Spring Web / Spring Data JPA / Bean Validation
- H2 / MySQL
- JUnit 5 + Mockito
- HTML / CSS / JavaScript (vanilla)

## Backend API Endpoints

Base URL: `http://localhost:8081/api/accounts`

- `POST /api/accounts` - create account
- `GET /api/accounts` - list accounts
- `GET /api/accounts/{id}` - get account by id
- `PUT /api/accounts/{id}` - update account
- `DELETE /api/accounts/{id}` - delete account
- `POST /api/accounts/{id}/deposit` - deposit amount
- `POST /api/accounts/{id}/withdraw` - withdraw amount
- `GET /api/accounts/{id}/transactions?page=0&size=10` - paginated transaction history

## Example Requests

Create account:

```json
{
  "accountHolderName": "Shubham Kumar",
  "accountType": "SAVINGS",
  "balance": 5000,
  "email": "shubham@email.com",
  "phoneNumber": "+91-9876543210"
}
```

Deposit / Withdraw request:

```json
{
  "amount": 250.00
}
```

## Example API Responses

Success response:

```json
{
  "status": 200,
  "message": "Operation successful",
  "data": {},
  "timestamp": "2026-04-18T13:40:11.123"
}
```

Validation error (`400`):

```json
{
  "status": 400,
  "message": "Validation failed",
  "data": {
    "accountHolderName": "Account holder name is required",
    "accountType": "Account type is required"
  },
  "timestamp": "2026-04-18T13:40:11.123"
}
```

Concurrency conflict (`409`):

```json
{
  "status": 409,
  "message": "Concurrent update detected. Please retry.",
  "data": null,
  "timestamp": "2026-04-18T13:40:11.123"
}
```

Paginated transaction response:

```json
{
  "status": 200,
  "message": "Transactions retrieved successfully",
  "data": {
    "content": [],
    "page": 0,
    "size": 10,
    "totalElements": 25,
    "totalPages": 3
  },
  "timestamp": "2026-04-18T13:40:11.123"
}
```

## Run Locally

### 1) Backend

```bash
cd account-service
mvn spring-boot:run
```

Backend runs on: `http://localhost:8081`

### 2) Frontend

Open `frontend/index.html` directly in the browser (or serve via any static server).

## Testing

Run unit tests:

```bash
cd account-service
mvn test
```

## Screenshots

- Add dashboard screenshot here
- Add create-account form screenshot here
- Add transaction-history modal screenshot here



## Error Handling

- 400 → Validation errors
- 404 → Resource not found
- 409 → Concurrency conflict
- 500 → Internal server error

All responses follow a standardized ApiResponse format.

## Validation

- Amount must be greater than 0
- Account holder name cannot be empty
- Account type must be valid
- Uses Jakarta Bean Validation (@NotNull, @DecimalMin, etc.)

## Business Rules

- SAVINGS account:
  - Minimum balance: ₹1000

- CURRENT account:
  - Overdraft allowed up to: -₹5000

  ## Architecture

- Layered architecture:
  - Controller (API layer)
  - Service (business logic)
  - Repository (data access)
- DTO pattern used for API communication
- Global exception handling for consistent responses
- Optimistic locking using @Version for concurrency control

## Database Configuration

Default: H2 (file-based)

To use MySQL:
- Configure application-mysql.properties
- Set active profile:
  spring.profiles.active=mysql