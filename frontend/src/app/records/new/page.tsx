"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createRecord } from "@/lib/records";

export default function NewRecordPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [description, setDescription] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [amount, setAmount] = useState("");

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
      await createRecord({
        title: title.trim(),
        provider: provider.trim() || undefined,
        description: description.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        startDate: startDate || undefined,
        expiryDate: expiryDate || undefined,
        amount: amount ? Number(amount) : undefined,
      });

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong while creating the record.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-bold">Add record</h1>
      <p className="mt-2 text-gray-600">
        Add an important record and its relevant dates.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="provider" className="block text-sm font-medium">
            Provider
          </label>
          <input
            id="provider"
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            className="mt-2 w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 min-h-28 w-full rounded-md border px-3 py-2"
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
            className="mt-2 w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium">
              Start date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-2 w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium">
              Expiry date
            </label>
            <input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(event) => setExpiryDate(event.target.value)}
              className="mt-2 w-full rounded-md border px-3 py-2"
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
            className="mt-2 w-full rounded-md border px-3 py-2"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save record"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}