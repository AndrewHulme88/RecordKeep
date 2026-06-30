"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthControls from "@/components/AuthControls";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import type { RecordItem } from "@/types/record";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Records are loaded in the browser so the Cognito access token
  // can be attached to the API request
  useEffect(() => {
    async function loadRecords() {
      if (!apiUrl) {
        setError("API URL is not configured.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await authenticatedFetch(
          `${apiUrl}/api/records`,
        );

        if (response.status === 401) {
          setError("Sign in to view your records.");
          return;
        }

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const data: RecordItem[] = await response.json();
        setRecords(data);
      } catch {
        setError("Sign in to view your records.");
      } finally {
        setIsLoading(false);
      }
    }

    loadRecords();
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">RecordKeep</h1>
          <p className="mt-2 text-gray-600">
            Keep track of your important records and upcoming dates.
          </p>
        </div>

        <AuthControls />
      </header>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your records</h2>

          <Link
            href="/records/new"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Add Record
          </Link>
        </div>

        {isLoading ? (
          <p className="text-gray-600">Loading records...</p>
        ) : error ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-gray-600">{error}</p>
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <h3 className="font-semibold">No records yet</h3>
            <p className="mt-2 text-sm text-gray-600">
              Create your first record to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <Link
                key={record.id}
                href={`/records/${record.id}`}
                className="block rounded-lg border p-5 shadow-sm transition hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {record.title}
                    </h3>

                    {record.provider && (
                      <p className="mt-1 text-sm text-gray-600">
                        {record.provider}
                      </p>
                    )}
                  </div>

                  {record.amount !== null && (
                    <p className="font-medium">
                      ${record.amount.toFixed(2)}
                    </p>
                  )}
                </div>

                {record.description && (
                  <p className="mt-4 text-sm text-gray-700">
                    {record.description}
                  </p>
                )}

                {record.expiryDate && (
                  <p className="mt-4 text-sm">
                    Expires:{" "}
                    {new Date(record.expiryDate).toLocaleDateString(
                      "en-AU",
                    )}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}