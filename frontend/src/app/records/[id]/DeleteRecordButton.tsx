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
            className="button-danger"
          >
            {isDeleting ? "Deleting..." : "Confirm delete"}
          </button>

          <button
            type="button"
            onClick={() => setIsConfirming(false)}
            disabled={isDeleting}
            className="button-secondary"
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
      className="button-danger"
    >
      Delete
    </button>
  );
}
