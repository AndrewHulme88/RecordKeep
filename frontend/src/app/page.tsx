"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthControls from "@/components/AuthControls";
import type { RecordItem } from "@/types/record";
import { getRecords } from "@/lib/records";

export default function HomePage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Records are loaded in the browser so the Cognito access token
  // can be attached to the API request.
  useEffect(() => {
    async function loadRecords() {
      try {
        const data = await getRecords();
        setRecords(data);
      } catch {
        setError("Sign in to view and manage your records.");
      } finally {
        setIsLoading(false);
      }
    }

    loadRecords();
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <header className="mb-10 flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Personal record management
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Keep important records and documents in one place.
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            RecordKeep helps you track policies, warranties, licences,
            subscriptions and other important records, with secure document
            uploads and expiry details attached to each item.
          </p>
        </div>

        <AuthControls />
      </header>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Your records</h2>
            <p className="mt-1 text-sm text-gray-600">
              View, update and organise your saved records.
            </p>
          </div>

          <Link
            href="/records/new"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Add Record
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-lg border p-8">
            <p className="text-gray-600">Loading records...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <h3 className="font-semibold">Sign in required</h3>

            <p className="mt-2 text-sm text-gray-600">{error}</p>

            <p className="mt-4 text-sm text-gray-500">
              Your records and documents are private to your account.
            </p>
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <h3 className="text-lg font-semibold">No records yet</h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              Create your first record to start tracking an insurance policy,
              warranty, licence, subscription or other important document.
            </p>

            <Link
              href="/records/new"
              className="mt-5 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Create your first record
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <Link
                key={record.id}
                href={`/records/${record.id}`}
                className="block rounded-lg border p-5 shadow-sm transition hover:border-gray-300 hover:bg-black hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{record.title}</h3>

                    {record.provider && (
                      <p className="mt-1 text-sm text-gray-600">
                        {record.provider}
                      </p>
                    )}
                  </div>

                  {record.amount !== null && (
                    <p className="shrink-0 font-medium">
                      ${record.amount.toFixed(2)}
                    </p>
                  )}
                </div>

                {record.description && (
                  <p className="mt-4 line-clamp-2 text-sm text-gray-700">
                    {record.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
                  {record.referenceNumber && (
                    <span>Reference: {record.referenceNumber}</span>
                  )}

                  {record.expiryDate && (
                    <span>
                      Expires:{" "}
                      {new Date(record.expiryDate).toLocaleDateString("en-AU")}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}