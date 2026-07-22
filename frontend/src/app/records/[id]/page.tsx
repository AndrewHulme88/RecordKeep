"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import DeleteRecordButton from "./DeleteRecordButton";
import { getRecordById } from "@/lib/records";
import type { RecordItem } from "@/types/record";
import RecordDocuments from "@/components/RecordDocuments";

export default function RecordDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [record, setRecord] = useState<RecordItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecord() {
      try {
        const result = await getRecordById(id);

        if (!result) {
          setError("Record not found.");
          return;
        }

        setRecord(result);
      } catch {
        setError("You must be signed in to view this record.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadRecord();
  }, [id]);

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
        <p className="text-gray-600">Loading record...</p>
      </main>
    );
  }

  if (error || !record) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h1 className="text-lg font-semibold">Unable to load record</h1>

          <p className="mt-2 text-sm text-red-600">
            {error || "Record not found."}
          </p>

          <Link
            href="/"
            className="mt-5 inline-block rounded-md border px-4 py-2 text-sm font-medium hover:bg-black hover:text-white"
          >
            Return to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <Link href="/" className="text-sm text-gray-600 hover:underline">
        ← Back to records
      </Link>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Record details
          </p>

          <h1 className="mt-2 text-3xl font-bold">{record.title}</h1>

          {record.provider ? (
            <p className="mt-2 text-gray-600">{record.provider}</p>
          ) : (
            <p className="mt-2 text-gray-500">No provider added</p>
          )}
        </div>

        <div className="flex gap-3">
          <Link
            href={`/records/${record.id}/edit`}
            className="rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-black hover:text-white"
          >
            Edit
          </Link>

          <DeleteRecordButton recordId={record.id} />
        </div>
      </div>

      <section className="mt-8 rounded-lg border p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Record information</h2>
          <p className="mt-1 text-sm text-gray-600">
            Key details stored for this record.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Detail label="Description" value={record.description} />

          <Detail
            label="Reference number"
            value={record.referenceNumber}
          />

          <Detail
            label="Start date"
            value={
              record.startDate
                ? new Date(record.startDate).toLocaleDateString("en-AU")
                : null
            }
          />

          <Detail
            label="Expiry date"
            value={
              record.expiryDate
                ? new Date(record.expiryDate).toLocaleDateString("en-AU")
                : null
            }
          />

          <Detail
            label="Amount"
            value={
              record.amount !== null
                ? `$${record.amount.toFixed(2)}`
                : null
            }
          />
        </div>
      </section>

      <div className="mt-8">
        <RecordDocuments recordId={record.id} />
      </div>
    </main>
  );
}

type DetailProps = {
  label: string;
  value: string | null;
};

function Detail({ label, value }: DetailProps) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>

      <p className="mt-1 break-words">
        {value || <span className="text-gray-400">Not provided</span>}
      </p>
    </div>
  );
}