"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { RecordItem } from "@/types/record";
import { updateRecord } from "@/lib/records";

type EditRecordFormProps = {
  record: RecordItem;
};

export default function EditRecordForm({ record }: EditRecordFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(record.title);
  const [provider, setProvider] = useState(record.provider ?? "");
  const [description, setDescription] = useState(record.description ?? "");
  const [referenceNumber, setReferenceNumber] = useState(
    record.referenceNumber ?? "",
  );
  const [startDate, setStartDate] = useState(record.startDate ?? "");
  const [expiryDate, setExpiryDate] = useState(record.expiryDate ?? "");
  const [amount, setAmount] = useState(record.amount?.toString() ?? "");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await updateRecord(record.id, {
        title: title.trim(),
        provider: provider.trim() || undefined,
        description: description.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        startDate: startDate || undefined,
        expiryDate: expiryDate || undefined,
        amount: amount ? Number(amount) : undefined,
      });

      router.push(`/records/${record.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong while updating the record.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <button
        type="button"
        onClick={() => router.push(`/records/${record.id}`)}
        className="text-sm text-gray-600 hover:underline"
      >
        ← Back to record
      </button>

      <div className="mt-6">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Edit record
        </p>

        <h1 className="mt-2 text-3xl font-bold">{record.title}</h1>

        <p className="mt-3 max-w-2xl text-gray-600">
          Update the key details for this record. Documents attached to this
          record are managed from the record details page.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 rounded-lg border p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium">
              Title <span className="text-red-600">*</span>
            </label>

            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Car insurance, laptop warranty, driver licence..."
              className="mt-2 w-full rounded-md border bg-white px-3 py-2 text-black outline-none transition focus:border-black"
              required
            />

            <p className="mt-1 text-xs text-gray-500">
              A short name that makes this record easy to recognise.
            </p>
          </div>

          <div>
            <label htmlFor="provider" className="block text-sm font-medium">
              Provider
            </label>

            <input
              id="provider"
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              placeholder="AAMI, Apple, VicRoads..."
              className="mt-2 w-full rounded-md border bg-white px-3 py-2 text-black outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium"
            >
              Description
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add any notes that would help you understand this record later."
              className="mt-2 min-h-28 w-full rounded-md border bg-white px-3 py-2 text-black outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="referenceNumber"
              className="block text-sm font-medium"
            >
              Reference number
            </label>

            <input
              id="referenceNumber"
              value={referenceNumber}
              onChange={(event) => setReferenceNumber(event.target.value)}
              placeholder="Policy number, account number, licence number..."
              className="mt-2 w-full rounded-md border bg-white px-3 py-2 text-black outline-none transition focus:border-black"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium"
              >
                Start date
              </label>

              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-2 w-full rounded-md border bg-white px-3 py-2 text-black outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="expiryDate"
                className="block text-sm font-medium"
              >
                Expiry date
              </label>

              <input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                className="mt-2 w-full rounded-md border bg-white px-3 py-2 text-black outline-none transition focus:border-black"
              />
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium">
              Amount
            </label>

            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className="mt-2 w-full rounded-md border bg-white px-3 py-2 text-black outline-none transition focus:border-black"
            />

            <p className="mt-1 text-xs text-gray-500">
              Optional amount associated with the record, such as an annual fee
              or purchase price.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push(`/records/${record.id}`)}
            className="rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-black hover:text-white"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </main>
  );
}