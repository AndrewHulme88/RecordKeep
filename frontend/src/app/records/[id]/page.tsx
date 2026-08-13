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
      <main className="page-shell !pt-12">
        <p className="text-[var(--muted)]">Loading record…</p>
      </main>
    );
  }

  if (error || !record) {
    return (
      <main className="page-shell !pt-12">
        <div className="quiet-state">
          <h1 className="section-title">Unable to load record</h1>

          <p className="mt-2 text-sm text-red-600">
            {error || "Record not found."}
          </p>

          <Link
            href="/"
            className="button-secondary mt-5"
          >
            Return to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell !pt-12">
      <Link href="/" className="text-action back-link">
        Back to records
      </Link>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">
            Record details
          </p>

          <h1 className="page-title mt-4 !font-bold">{record.title}</h1>

          {record.provider ? (
            <p className="mt-3 text-[var(--muted)]">{record.provider}</p>
          ) : (
            <p className="mt-2 text-gray-500">No provider added</p>
          )}
        </div>

        <div className="flex gap-3">
          <Link
            href={`/records/${record.id}/edit`}
            className="button-secondary"
          >
            Edit
          </Link>

          <DeleteRecordButton recordId={record.id} />
        </div>
      </div>

      <section className="mt-14 border-t border-[var(--line)] pt-8">
        <div className="mb-6">
          <h2 className="section-title">Record information</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Key details stored for this record.
          </p>
        </div>

        <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
          <Detail label="Category" value={record.category} />

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
        <RecordDocuments
          recordId={record.id}
          onRecordUpdated={(updatedRecord) => setRecord(updatedRecord)}
        />
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
      <p className="text-xs font-bold tracking-[0.08em] text-[var(--muted)] uppercase">{label}</p>

      <p className="mt-2 break-words font-serif text-lg">
        {value || <span className="text-gray-400">Not provided</span>}
      </p>
    </div>
  );
}
