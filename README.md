# RecordKeep

RecordKeep is a full-stack personal administration platform for storing and managing important records such as insurance policies, subscriptions, warranties, licences, memberships, and other documents with renewal or expiry dates.

The application is designed to help users keep track of important information in one place, with secure authentication, user-specific data, validation, and planned document upload and AI-assisted processing features.

## Features

Current functionality includes:

* Secure user authentication with AWS Cognito
* User-specific record ownership
* Create, view, update, and delete records
* Track providers, reference numbers, dates, descriptions, and amounts
* Prevent users from accessing or modifying another user’s records
* API request validation
* PostgreSQL database constraints
* Centralised API error handling
* Automated API integration tests
* Responsive Next.js frontend

Planned functionality includes:

* Document uploads using Amazon S3
* Expiry and renewal reminders
* Record categories and filtering
* Search and sorting
* AI-assisted document data extraction
* Dashboard summaries and upcoming expiry alerts

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* AWS Amplify

### Backend

* C#
* .NET 10
* ASP.NET Core Minimal APIs
* Entity Framework Core
* PostgreSQL

### Authentication and Cloud

* AWS Cognito
* AWS Amplify
* Amazon S3 planned

### Testing

* xUnit
* ASP.NET Core `WebApplicationFactory`
* Entity Framework Core InMemory provider

## Project Structure

```text
record-keep/
├── backend/
│   ├── RecordKeep.Api/
│   ├── RecordKeep.Application/
│   ├── RecordKeep.Domain/
│   ├── RecordKeep.Infrastructure/
│   ├── tests/
│   │   └── RecordKeep.Api.Tests/
│   └── RecordKeep.slnx
├── frontend/
├── docs/
├── docker-compose.yml
└── README.md
```

## Architecture

The backend follows a layered structure:

* `RecordKeep.Api` contains the HTTP endpoints, authentication configuration, validation, and API startup logic.
* `RecordKeep.Application` is intended for application-level use cases and business workflows.
* `RecordKeep.Domain` contains the core domain entities.
* `RecordKeep.Infrastructure` contains Entity Framework Core, PostgreSQL configuration, and external service implementations.
* `RecordKeep.Api.Tests` contains API integration tests.

The frontend communicates with the API using Cognito access tokens. Each protected request includes a bearer token, and the API uses the Cognito `sub` claim to identify the current user.

All record queries are filtered by the authenticated user ID.

## Prerequisites

Install the following before running the project:

* .NET 10 SDK
* Node.js
* npm
* Docker Desktop
* PostgreSQL through Docker
* AWS Cognito user pool and app client

## Local Setup

Clone the repository:

```bash
git clone https://github.com/AndrewHulme88/RecordKeep.git
cd record-keep
```

## Database Setup

The project uses PostgreSQL through Docker.

Start the database from the project root:

```bash
docker compose up -d
```

Confirm that the container is running:

```bash
docker compose ps
```

The default local database configuration is defined in `docker-compose.yml`.

Do not commit production credentials or secrets to the repository.

## Backend Configuration

Create or update the backend development settings with the required values.

Example configuration:

```json
{
  "ConnectionStrings": {
    "Database": "Host=localhost;Port=5432;Database=recordkeep;Username=recordkeep;Password=your-password"
  },
  "Cognito": {
    "Region": "ap-southeast-2",
    "UserPoolId": "your-user-pool-id",
    "ClientId": "your-app-client-id"
  }
}
```

Sensitive configuration should be stored using environment variables, user secrets, or another secure configuration provider.

Do not commit real credentials.

## Run Database Migrations

From the `backend` directory:

```bash
dotnet ef database update \
  --project RecordKeep.Infrastructure \
  --startup-project RecordKeep.Api
```

To create a new migration:

```bash
dotnet ef migrations add MigrationName \
  --project RecordKeep.Infrastructure \
  --startup-project RecordKeep.Api
```

## Run the Backend

From the `backend` directory:

```bash
dotnet run --project RecordKeep.Api
```

The local API URL may resemble:

```text
http://localhost:5076
```

The exact port is defined in the API launch settings.

## Frontend Configuration

Create a `.env.local` file inside the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:5076
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-app-client-id
NEXT_PUBLIC_COGNITO_DOMAIN=your-cognito-domain
```

The Cognito domain should not include the protocol unless required by the AWS Amplify configuration.

Example:

```env
NEXT_PUBLIC_COGNITO_DOMAIN=your-domain.auth.ap-southeast-2.amazoncognito.com
```

The local Cognito callback URL should be configured as:

```text
http://localhost:3000/auth/callback
```

The local sign-out URL should be configured as:

```text
http://localhost:3000
```

## Run the Frontend

From the `frontend` directory:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Run the Tests

From the `backend` directory:

```bash
dotnet test RecordKeep.slnx
```

The integration test suite currently verifies:

* unauthenticated users receive `401 Unauthorized`
* authenticated users can create records
* users only receive their own records
* users cannot retrieve another user’s record
* users cannot update another user’s record
* users cannot delete another user’s record
* users can update their own records
* users can delete their own records
* deleted records can no longer be retrieved
* blank titles are rejected
* field length limits are enforced
* negative amounts are rejected
* expiry dates before start dates are rejected

Tests run against an isolated in-memory database and use a fake authentication handler instead of connecting to AWS Cognito.

## Record Data Model

A record currently supports:

* title
* provider
* description
* reference number
* start date
* expiry date
* amount
* authenticated user ID
* created timestamp
* updated timestamp

The API and database enforce validation rules including:

* title is required
* title cannot exceed 200 characters
* provider cannot exceed 200 characters
* reference number cannot exceed 100 characters
* description cannot exceed 2,000 characters
* amount cannot be negative
* expiry date cannot be before start date

## Authentication

Authentication is handled by AWS Cognito.

The frontend uses AWS Amplify to complete the OAuth authorisation-code flow.

Authenticated API requests include a Cognito access token:

```http
Authorization: Bearer <access-token>
```

The API validates:

* token issuer
* token signature
* token lifetime
* `token_use` is `access`
* Cognito client ID
* authenticated user `sub` claim

Records are always queried using both the record ID and authenticated user ID. This prevents users from accessing records that belong to another account.

Cross-user record requests return `404 Not Found` so the API does not reveal whether another user’s record exists.

## Error Handling

The API uses centralised exception handling and Problem Details responses.

Unexpected server errors return a consistent response without exposing stack traces or internal exception details.

Example:

```json
{
  "title": "An unexpected error occurred.",
  "status": 500
}
```

Validation failures return `400 Bad Request` responses containing field-specific validation errors.

## Security

The project follows several security practices:

* protected API endpoints
* Cognito JWT validation
* per-user record ownership
* no client-provided user IDs
* server-side ownership filtering
* environment files excluded from source control
* credentials excluded from source control
* consistent error responses
* database-level constraints
* tests for cross-user access attempts

## Development Roadmap

Upcoming work includes:

* Amazon S3 document uploads
* secure document ownership
* pre-signed upload and download URLs
* file metadata storage
* record categories
* expiry reminders
* dashboard improvements
* search and filtering
* AI document parsing
* automated field extraction
* cloud deployment
* production monitoring and logging

## Status

RecordKeep is currently under active development.

The core record-management workflow, authentication, ownership controls, validation, database configuration, and integration testing are complete. Document storage and automation features are planned next.
