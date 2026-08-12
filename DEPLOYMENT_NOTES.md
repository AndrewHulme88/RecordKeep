# RecordKeep Deployment Notes

## Overview

RecordKeep is deployed as a full-stack cloud application using:

* **Frontend:** Next.js on Vercel
* **Backend:** .NET 10 Minimal API on AWS ECS
* **Database:** PostgreSQL on Amazon RDS
* **Authentication:** AWS Cognito Hosted UI
* **File storage:** Amazon S3 with presigned upload URLs

The production app supports authenticated record management and direct document uploads to S3.

---

## Architecture

```text
Browser
  → Vercel frontend
  → AWS ECS .NET API
  → Amazon RDS PostgreSQL

Browser
  → S3 direct upload using presigned URL
```

The backend generates presigned S3 URLs, then the browser uploads files directly to S3.

---

## Vercel Frontend

The frontend is deployed from the `frontend` directory.

Vercel settings:

```text
Framework Preset: Next.js
Root Directory: frontend
Install Command: npm install
Build Command: npm run build
Output Directory: blank/default
Production Branch: master
```

Production frontend:

```text
https://record-keep-iota.vercel.app
```

Important frontend environment variables:

```env
NEXT_PUBLIC_API_URL=https://re-92b2dffd78544ad89e1081387a17910b.ecs.ap-southeast-2.on.aws
NEXT_PUBLIC_COGNITO_REGION=ap-southeast-2
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<user-pool-id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<app-client-id>
NEXT_PUBLIC_COGNITO_DOMAIN=<cognito-domain>.auth.ap-southeast-2.amazoncognito.com
```

`NEXT_PUBLIC_API_URL` should not have a trailing slash.

---

## Cognito Configuration

The Cognito app client needs both local and production URLs.

Allowed callback URLs:

```text
http://localhost:3000/auth/callback
https://record-keep-iota.vercel.app/auth/callback
```

Allowed sign-out URLs:

```text
http://localhost:3000
https://record-keep-iota.vercel.app
```

OAuth settings:

```text
Grant type: Authorization code grant
Scopes: openid, email, profile
Identity provider: Cognito user pool
```

The frontend generates Cognito redirect URLs from the current browser origin so the same code works locally and in production.

---

## ECS Backend

The backend is deployed to AWS ECS as a Docker container.

Runtime Dockerfile:

```dockerfile
FROM --platform=linux/amd64 mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app

COPY publish/ .

ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "RecordKeep.Api.dll"]
```

Publish and build flow:

```bash
dotnet publish RecordKeep.Api/RecordKeep.Api.csproj -c Release -o ./publish

docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  -f backend/Dockerfile.runtime \
  -t <account-id>.dkr.ecr.ap-southeast-2.amazonaws.com/recordkeep-api:amd64-v2 \
  ./backend \
  --push
```

The `linux/amd64` platform was required for ECS compatibility.

---

## Backend Environment Variables

ECS container variables:

```env
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080

ConnectionStrings__Database=Host=<rds-endpoint>;Port=5432;Database=recordkeep;Username=<username>;Password=<password>;SSL Mode=Require;Trust Server Certificate=true;GSS Encryption Mode=Disable

Cognito__Region=ap-southeast-2
Cognito__UserPoolId=<user-pool-id>
Cognito__ClientId=<app-client-id>

AWS__Region=ap-southeast-2
S3__BucketName=recordkeep-documents-andrew-sydney

AllowedOrigins__0=http://localhost:3000
AllowedOrigins__1=https://record-keep-iota.vercel.app
```

Do not use AWS access keys or `AWS__Profile` in ECS. The app uses the ECS task role for AWS credentials.

---

## RDS PostgreSQL

The backend connects to Amazon RDS PostgreSQL.

RDS security group rule:

```text
Type: PostgreSQL
Port: 5432
Source: ECS service/task security group
```

This allows the ECS backend to connect to the private RDS database.

The connection string includes:

```text
GSS Encryption Mode=Disable
```

This avoids a Linux runtime issue with the missing `libgssapi_krb5.so.2` library.

---

## ECS Task Role for S3 and Textract

The ECS task uses a dedicated IAM task role for S3 and Textract access:

```text
recordkeep-ecs-task-role
```

The task role trust relationship allows ECS tasks to assume it:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

The role has S3 permissions for the document bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowRecordKeepObjectAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::recordkeep-documents-andrew-sydney/*"
      ]
    },
    {
      "Sid": "AllowRecordKeepBucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::recordkeep-documents-andrew-sydney"
      ]
    },
    {
      "Sid": "AllowRecordKeepDocumentAnalysis",
      "Effect": "Allow",
      "Action": [
        "textract:AnalyzeDocument"
      ],
      "Resource": "*"
    }
  ]
}
```

The ECS task role is different from the task execution role. The execution role is used by ECS itself; the task role is used by the application code.

---

## S3 Bucket CORS

The S3 bucket needs CORS configured so the browser can upload files directly using presigned URLs.

S3 CORS configuration:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://record-keep-iota.vercel.app"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

---

## Upload Flow

Document upload flow:

```text
1. Frontend requests a presigned upload URL from the backend.
2. Backend creates a document record and returns the upload URL.
3. Frontend uploads the file directly to S3 using PUT.
4. Frontend confirms the upload with the backend.
```

The direct S3 upload uses plain `fetch`, not the authenticated backend fetch helper.

```ts
await fetch(uploadUrl, {
  method: "PUT",
  headers: {
    "Content-Type": file.type || "application/octet-stream",
  },
  body: file,
});
```

---

## Main Issues Fixed

### Vercel 404

The frontend built successfully but initially returned a Vercel platform `404`. Recreating/redeploying the Vercel project with the correct frontend root eventually resolved it.

### Cognito Redirect Mismatch

Cognito returned `redirect_mismatch` until the production callback URL was added to the correct app client.

### Amplify Origin Error

The sign-in button failed because redirect URLs were hardcoded to localhost. This was fixed by generating redirect URLs from the current browser origin.

### Backend CORS

The backend initially blocked requests from Vercel. This was fixed by adding the Vercel origin to `AllowedOrigins`.

### API Double Slash

A trailing slash in `NEXT_PUBLIC_API_URL` caused requests like `//api/records`, resulting in `404`. Removing the trailing slash fixed it.

### RDS Connection Timeout

ECS could not reach RDS until the RDS security group allowed PostgreSQL traffic from the ECS security group.

### S3 Credentials Error

The backend could not access AWS credentials until a dedicated ECS task role was created and attached.

### S3 Upload CORS

Direct browser uploads to S3 failed until the S3 bucket CORS policy allowed the Vercel frontend origin.

---

## Final Smoke Test

After deployment, verify:

```text
1. Frontend loads
2. Sign-in works
3. Sign-out works
4. Records can be created
5. Records can be listed
6. Records can be edited
7. Records can be deleted
8. Documents can be uploaded
9. Uploaded documents can be opened
10. Uploaded documents can be deleted
```
