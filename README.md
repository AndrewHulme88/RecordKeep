# RecordKeep

RecordKeep is a full-stack personal administration platform for storing and managing important records such as insurance policies, subscriptions, warranties, licences, memberships, and other documents with renewal or expiry dates.

The application is designed to help users keep track of important information in one place, with secure authentication, user-specific data, document uploads, validation, and planned reminder and AI-assisted processing features.

## Features

Current functionality includes:

* Secure user authentication with AWS Cognito
* User-specific record ownership
* Create, view, update, and delete records
* Track providers, reference numbers, dates, descriptions, and amounts
* Prevent users from accessing or modifying another user’s records
* Upload documents to Amazon S3 using presigned URLs
* Attach PDF, PNG, and JPEG documents to records
* List, open, and delete attached documents
* Private S3 bucket access with temporary download URLs
* Pending upload flow to prevent incomplete uploads appearing in the UI
* API request validation
* PostgreSQL database constraints
* Centralised API error handling
* Automated API integration tests
* Responsive Next.js frontend

Planned functionality includes:

* Expiry and renewal reminders
* Record categories and filtering
* Search and sorting
* AI-assisted document data extraction
* Dashboard summaries and upcoming expiry alerts
* Cloud deployment
* Production monitoring and logging

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
* Amazon S3
* AWS SDK for .NET

### Testing

* xUnit
* ASP.NET Core `WebApplicationFactory`
* Entity Framework Core InMemory provider
* Fake authentication handler for integration tests
* Fake document storage service for S3-related tests

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
* `RecordKeep.Application` contains application-level abstractions, including the document storage service interface.
* `RecordKeep.Domain` contains the core domain entities.
* `RecordKeep.Infrastructure` contains Entity Framework Core, PostgreSQL configuration, and AWS S3 storage implementations.
* `RecordKeep.Api.Tests` contains API integration tests.

The frontend communicates with the API using Cognito access tokens. Each protected request includes a bearer token, and the API uses the Cognito `sub` claim to identify the current user.

All record and document queries are filtered by the authenticated user ID.

Documents are stored using a split-storage model:

```text
PostgreSQL
└── Stores record and document metadata

Amazon S3
└── Stores the actual uploaded file contents
```

This keeps structured, queryable data in PostgreSQL while allowing files to be stored securely and efficiently in S3.

## Prerequisites

Install the following before running the project:

* .NET 10 SDK
* Node.js
* npm
* Docker Desktop
* PostgreSQL through Docker
* AWS Cognito user pool and app client
* Amazon S3 bucket
* AWS CLI configured with a local development profile

## Local Setup

Clone the repository:

```bash
git clone https://github.com/AndrewHulme88/RecordKeep.git
cd RecordKeep
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
  },
  "AWS": {
    "Profile": "recordkeep-dev",
    "Region": "ap-southeast-2"
  },
  "S3": {
    "BucketName": "your-s3-bucket-name"
  }
}
```

Sensitive configuration should be stored using environment variables, user secrets, or another secure configuration provider.

Do not commit real credentials.

The S3 bucket name and AWS profile name are not secrets, but AWS access keys must never be committed to source control.

## AWS S3 Setup

RecordKeep uses Amazon S3 for document storage.

The S3 bucket should be private and configured with:

* Block Public Access enabled
* ACLs disabled
* Bucket owner enforced
* Default encryption enabled
* Region set to `ap-southeast-2`
* CORS configured for local frontend uploads

Example S3 CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Local development access is handled through an AWS CLI profile, for example:

```bash
aws configure --profile recordkeep-dev
```

The development IAM policy should grant only the required object-level permissions for the RecordKeep bucket:

* `s3:PutObject`
* `s3:GetObject`
* `s3:DeleteObject`

Example resource scope:

```json
"Resource": "arn:aws:s3:::your-s3-bucket-name/*"
```

Avoid using broad permissions such as `AmazonS3FullAccess`.

## Document Upload Flow

Documents are uploaded using presigned S3 URLs.

The upload process is:

```text
1. User selects a file in the frontend.
2. Frontend asks the RecordKeep API for an upload URL.
3. API authenticates the user.
4. API confirms the record belongs to that user.
5. API validates the file name, content type, and size.
6. API creates a pending document metadata row.
7. API returns a short-lived presigned S3 upload URL.
8. Frontend uploads the file directly to S3.
9. Frontend calls the API to complete the upload.
10. API marks the document as uploaded.
11. The completed document appears in the record’s document list.
```

This prevents incomplete or failed uploads from appearing in the UI.

The API only lists and allows downloads for documents where the upload has been completed.

Supported file types:

* PDF
* PNG
* JPEG

Maximum file size:

```text
10 MB
```

## Document Download Flow

Documents are downloaded using temporary presigned URLs.

The download process is:

```text
1. User clicks Open on a document.
2. Frontend asks the API for a download URL.
3. API authenticates the user.
4. API confirms the document belongs to the requested record and user.
5. API returns a short-lived private S3 download URL.
6. Frontend opens the document in a new browser tab.
```

The S3 bucket remains private. Users never receive permanent public document URLs.

## Document Deletion Flow

When a user deletes a document:

```text
1. Frontend sends a delete request to the API.
2. API authenticates the user.
3. API confirms the document belongs to the requested record and user.
4. API deletes the object from S3.
5. API deletes the document metadata row from PostgreSQL.
6. Frontend refreshes the document list.
```

The API deletes the S3 object before deleting the metadata row. This helps avoid losing the database reference if S3 deletion fails.

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
* users can request document upload URLs for their own records
* users cannot request upload URLs for another user’s record
* invalid document file types are rejected
* oversized document uploads are rejected
* document metadata is created in a pending state
* completed document uploads can be listed
* incomplete document uploads are not exposed in lists or downloads
* users cannot list documents for another user’s record
* users cannot download another user’s document
* users cannot download a document through the wrong record
* users can generate download URLs for their own completed documents
* users cannot delete another user’s document
* users cannot delete a document through the wrong record
* users can delete their own documents
* document deletion removes metadata and calls the storage service

Tests run against an isolated in-memory database and use fake implementations instead of connecting to AWS Cognito or Amazon S3.

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
* attached documents

The API and database enforce validation rules including:

* title is required
* title cannot exceed 200 characters
* provider cannot exceed 200 characters
* reference number cannot exceed 100 characters
* description cannot exceed 2,000 characters
* amount cannot be negative
* expiry date cannot be before start date

## Document Data Model

A document currently supports:

* record ID
* authenticated user ID
* original file name
* S3 object key
* content type
* file size in bytes
* upload completion status
* created timestamp

The S3 object key is generated by the backend and is not based directly on the original filename.

Example object key shape:

```text
users/{userId}/records/{recordId}/documents/{documentId}.pdf
```

The original filename is stored only for display purposes.

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

Records and documents are always queried using the authenticated user ID. This prevents users from accessing records or documents that belong to another account.

Cross-user record and document requests return `404 Not Found` so the API does not reveal whether another user’s data exists.

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
* per-user document ownership
* no client-provided user IDs
* server-side ownership filtering
* private S3 bucket
* presigned upload URLs
* presigned download URLs
* short-lived document access
* generated S3 object keys
* pending upload status for incomplete uploads
* environment files excluded from source control
* credentials excluded from source control
* consistent error responses
* database-level constraints
* tests for cross-user access attempts

## Development Roadmap

Upcoming work includes:

* record categories
* search and filtering
* expiry reminders
* dashboard improvements
* upcoming expiry alerts
* AI document parsing
* automated field extraction
* cloud deployment
* production monitoring and logging

## Status

RecordKeep is currently under active development.

The core record-management workflow, authentication, ownership controls, validation, database configuration, integration testing, and S3-backed document upload flow are complete.

Next planned work includes record organisation, search/filtering, expiry reminders, and AI-assisted document processing.
