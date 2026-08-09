"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getRecordById } from "@/lib/records";
import type { RecordItem } from "@/types/record";
import EditRecordForm from "./EditRecordForm";

export default function EditRecordPage() {
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
        setError("You must be signed in to edit this record.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadRecord();
  }, [id]);

  if (isLoading) {
    return (
      <main className="page-shell page-shell--narrow !pt-12">
        <p className="text-[var(--muted)]">Loading record…</p>
      </main>
    );
  }

  if (error || !record) {
    return (
      <main className="page-shell page-shell--narrow !pt-12">
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

  return <EditRecordForm record={record} />;
}
