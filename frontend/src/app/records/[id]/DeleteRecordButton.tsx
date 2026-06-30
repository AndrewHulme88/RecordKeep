"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteRecord } from "@/lib/records";

type DeleteRecordButtonProps = {
  recordId: string;
};

export default function DeleteRecordButton({
  recordId,
}: DeleteRecordButtonProps) {
  const router = useRouter();

  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setIsDeleting(true);

    try {
      await deleteRecord(recordId);
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong while deleting the record.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isConfirming) {
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="text-sm text-gray-600">
          Are you sure? This cannot be undone.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Confirm delete"}
          </button>

          <button
            type="button"
            onClick={() => setIsConfirming(false)}
            disabled={isDeleting}
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsConfirming(true)}
      className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
    >
      Delete
    </button>
  );
}