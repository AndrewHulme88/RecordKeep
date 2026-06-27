"use client";

import { useEffect, useState } from "react";
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

    loadRecord();
  }, [id]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-gray-600">Loading record...</p>
      </main>
    );
  }

  if (error || !record) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-red-600">
          {error || "Record not found."}
        </p>
      </main>
    );
  }

  return <EditRecordForm record={record} />;
}