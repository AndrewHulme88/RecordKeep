import type { RecordItem } from "@/types/record";

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

export async function getRecords(): Promise<RecordItem[]> {
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const response = await fetch(`${apiUrl}/api/records`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to retrieve records: ${response.status}`);
  }

  return response.json();
}

export async function createRecord(
    input: CreateRecordInput,
): Promise<RecordItem> {
    if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured.");
    }

    const response = await fetch(`${apiUrl}/api/records`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        throw new Error(`Failed to create record: ${response.status}`);
    }

    return response.json();
}