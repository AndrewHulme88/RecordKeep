"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createRecord } from "@/lib/records";
import { DEFAULT_RECORD_CATEGORY, RECORD_CATEGORIES, RecordCategory } from "@/lib/record-categories";

export default function NewRecordPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<RecordCategory>(DEFAULT_RECORD_CATEGORY);
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
        category,
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
    <main className="page-shell page-shell--narrow !pt-12">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="text-action back-link"
      >
        Back to records
      </button>

      <div className="mt-6">
        <h1 className="page-title mt-4 !font-bold">Add a new record</h1>

        <p className="lede mt-4">
          Save key details for a policy, warranty, licence, subscription or
          other important item. You can attach supporting documents after the
          record has been created.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-sheet">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="field-label">
              Title <span className="text-red-600">*</span>
            </label>

            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Car insurance, laptop warranty, driver licence..."
              className="field mt-2"
              required
            />

            <p className="field-help">
              A short name that makes this record easy to recognise.
            </p>
          </div>

          <div>
            <label htmlFor="category" className="field-label">
              Category
            </label>

            <select
              id="category"
              value={category}
              onChange={(event) => setCategory(event.target.value as RecordCategory)}
              className="field mt-2"
            >
              {RECORD_CATEGORIES.map((categoryOption) => (
                <option key={categoryOption} value={categoryOption}>
                  {categoryOption}
                </option>
              ))}
            </select>

            <p className="field-help">
              Choose the type of record you are saving.
            </p>
          </div>

          <div>
            <label htmlFor="provider" className="field-label">
              Provider
            </label>

            <input
              id="provider"
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              placeholder="AAMI, Apple, VicRoads..."
              className="field mt-2"
            />
          </div>

          <div>
            <label htmlFor="description" className="field-label">
              Description
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add any notes that would help you understand this record later."
              className="field mt-2 min-h-28 resize-y"
            />
          </div>

          <div>
            <label
              htmlFor="referenceNumber"
              className="field-label"
            >
              Reference number
            </label>

            <input
              id="referenceNumber"
              value={referenceNumber}
              onChange={(event) => setReferenceNumber(event.target.value)}
              placeholder="Policy number, account number, licence number..."
              className="field mt-2"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="startDate"
                className="field-label"
              >
                Start date
              </label>

              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="field mt-2"
              />
            </div>

            <div>
              <label
                htmlFor="expiryDate"
                className="field-label"
              >
                Expiry date
              </label>

              <input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                className="field mt-2"
              />
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="field-label">
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
              className="field mt-2"
            />
          </div>
        </div>
        {error && (
          <div className="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="button-primary"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="button-primary"
          >
            {isSubmitting ? "Saving..." : "Save record"}
          </button>
        </div>
      </form>
    </main>
  );
}
