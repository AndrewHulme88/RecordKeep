import { authenticatedFetch } from "./authenticated-fetch";
import type { RecordItem } from "@/types/record";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export type DocumentItem = {
  id: string;
  recordId: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  createdAtUtc: string;
  extractionStatus: ExtractionStatus | null;
};

export type ExtractionStatus =
  | "Pending"
  | "Processing"
  | "NeedsReview"
  | "Completed"
  | "Failed";

export type DocumentExtraction = {
  id: string;
  documentId: string;
  status: ExtractionStatus;
  provider: string | null;
  modelName: string | null;
  extractedFields: Record<string, string | null> | null;
  evidence: Record<string, { text: string; confidence: number; page: number } | null> | null;
  errorCode: string | null;
  createdAtUtc: string;
  completedAtUtc: string | null;
};

export type ApplyDocumentExtractionInput = {
  applyTitle: boolean;
  title?: string;
  applyProvider: boolean;
  provider?: string;
  applyReferenceNumber: boolean;
  referenceNumber?: string;
  applyStartDate: boolean;
  startDate?: string;
  applyExpiryDate: boolean;
  expiryDate?: string;
  applyAmount: boolean;
  amount?: number;
};

type CreateUploadUrlResponse = {
  documentId: string;
  uploadUrl: string;
  objectKey: string;
  expiresAtUtc: string;
};

type CreateDownloadUrlResponse = {
  documentId: string;
  downloadUrl: string;
  expiresAtUtc: string;
};

function getApiUrl(): string {
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return apiUrl;
}

export async function getDocuments(recordId: string): Promise<DocumentItem[]> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/api/records/${recordId}/documents`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 401) {
    throw new Error("You must be signed in.");
  }

  if (response.status === 404) {
    throw new Error("Record not found.");
  }

  if (!response.ok) {
    throw new Error(`Failed to retrieve documents: ${response.status}`);
  }

  return response.json();
}

export async function uploadDocument(
  recordId: string,
  file: File,
): Promise<void> {
  const uploadUrlResponse = await authenticatedFetch(
    `${getApiUrl()}/api/records/${recordId}/documents/upload-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      }),
    },
  );

  if (uploadUrlResponse.status === 401) {
    throw new Error("You must be signed in.");
  }

  if (uploadUrlResponse.status === 404) {
    throw new Error("Record not found.");
  }

  if (uploadUrlResponse.status === 400) {
    throw new Error(
      "Document must be a PDF, PNG or JPEG file under 10 MB.",
    );
  }

  if (!uploadUrlResponse.ok) {
    throw new Error(
      `Failed to create upload URL: ${uploadUrlResponse.status}`,
    );
  }

  const uploadDetails =
    (await uploadUrlResponse.json()) as CreateUploadUrlResponse;

  const s3Response = await fetch(uploadDetails.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!s3Response.ok) {
    throw new Error(`Failed to upload document: ${s3Response.status}`);
  }

  await completeDocumentUpload(recordId, uploadDetails.documentId);
}

export async function createDocumentDownloadUrl(
  recordId: string,
  documentId: string,
): Promise<string> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/api/records/${recordId}/documents/${documentId}/download-url`,
  );

  if (response.status === 401) {
    throw new Error("You must be signed in.");
  }

  if (response.status === 404) {
    throw new Error("Document not found.");
  }

  if (!response.ok) {
    throw new Error(`Failed to create download URL: ${response.status}`);
  }

  const result = (await response.json()) as CreateDownloadUrlResponse;

  return result.downloadUrl;
}

export async function getDocumentExtraction(
  recordId: string,
  documentId: string,
): Promise<DocumentExtraction> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/api/records/${recordId}/documents/${documentId}/extraction`,
    { cache: "no-store" },
  );

  if (response.status === 401) {
    throw new Error("You must be signed in.");
  }

  if (response.status === 404) {
    throw new Error("Extraction not found.");
  }

  if (!response.ok) {
    throw new Error(`Failed to retrieve extraction: ${response.status}`);
  }

  return response.json();
}

export async function applyDocumentExtraction(
  recordId: string,
  documentId: string,
  input: ApplyDocumentExtractionInput,
): Promise<RecordItem> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/api/records/${recordId}/documents/${documentId}/extraction/apply`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  if (response.status === 401) {
    throw new Error("You must be signed in.");
  }

  if (response.status === 404) {
    throw new Error("Extraction not found.");
  }

  if (!response.ok) {
    throw new Error(`Failed to apply extraction: ${response.status}`);
  }

  return response.json();
}

export async function deleteDocument(
  recordId: string,
  documentId: string,
): Promise<void> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/api/records/${recordId}/documents/${documentId}`,
    {
      method: "DELETE",
    },
  );

  if (response.status === 401) {
    throw new Error("You must be signed in.");
  }

  if (response.status === 404) {
    throw new Error("Document not found.");
  }

  if (!response.ok) {
    throw new Error(`Failed to delete document: ${response.status}`);
  }
}

async function completeDocumentUpload(
  recordId: string,
  documentId: string,
): Promise<void> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/api/records/${recordId}/documents/${documentId}/complete`,
    {
      method: "POST",
    },
  );

  if (response.status === 401) {
    throw new Error("You must be signed in.");
  }

  if (response.status === 404) {
    throw new Error("Document not found.");
  }

  if (!response.ok) {
    throw new Error(`Failed to complete document upload: ${response.status}`);
  }
}
