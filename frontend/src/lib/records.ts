import type { RecordItem } from "@/types/record";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

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