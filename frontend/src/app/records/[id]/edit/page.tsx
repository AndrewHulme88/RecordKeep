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
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
        <p className="text-gray-600">Loading record...</p>
      </main>
    );
  }

  if (error || !record) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h1 className="text-lg font-semibold">Unable to load record</h1>

          <p className="mt-2 text-sm text-red-600">
            {error || "Record not found."}
          </p>

          <Link
            href="/"
            className="mt-5 inline-block rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-black hover:text-white"
          >
            Return to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return <EditRecordForm record={record} />;
}