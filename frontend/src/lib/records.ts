import type { RecordItem } from "@/types/record";
import { authenticatedFetch } from "./authenticated-fetch";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export type CreateRecordInput = {
  title: string;
  provider?: string;
  description?: string;
  referenceNumber?: string;
  startDate?: string;
  expiryDate?: string;
  amount?: number;
};

export type UpdateRecordInput = CreateRecordInput;

function getApiUrl(): string {
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return apiUrl;
}

// Centralise record API calls here so authentication and error handling
// remain consistent across the frontend.
export async function getRecords(): Promise<RecordItem[]> {
  const response = await authenticatedFetch(`${getApiUrl()}/api/records`, {
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("You must be signed in.");
  }

  if (!response.ok) {
    throw new Error(`Failed to retrieve records: ${response.status}`);
  }

  return response.json();
}

export async function createRecord(
  input: CreateRecordInput,
): Promise<RecordItem> {
  const response = await authenticatedFetch(`${getApiUrl()}/api/records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (response.status === 401) {
    throw new Error("You must be signed in.");
  }

  if (!response.ok) {
    throw new Error(`Failed to create record: ${response.status}`);
  }

  return response.json();
}

export async function getRecordById(id: string): Promise<RecordItem | null> {
  const response = await authenticatedFetch(`${getApiUrl()}/api/records/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (response.status === 401) {
    throw new Error("You must be signed in.");
  }

  if (!response.ok) {
    throw new Error(`Failed to retrieve record: ${response.status}`);
  }

  return response.json();
}

export async function updateRecord(
  id: string,
  input: UpdateRecordInput,
): Promise<RecordItem> {
  const response = await authenticatedFetch(`${getApiUrl()}/api/records/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (response.status === 404) {
    throw new Error("Record not found.");
  }

  if (response.status === 401) {
    throw new Error("You must be signed in.");
  }

  if (!response.ok) {
    throw new Error(`Failed to update record: ${response.status}`);
  }

  return response.json();
}

export async function deleteRecord(id: string): Promise<void> {
  const response = await authenticatedFetch(`${getApiUrl()}/api/records/${id}`, {
    method: "DELETE",
  });

  if (response.status === 404) {
    throw new Error("Record not found.");
  }

  if (response.status === 401) {
    throw new Error("You must be signed in.");
  }

  if (!response.ok) {
    throw new Error(`Failed to delete record: ${response.status}`);
  }
}