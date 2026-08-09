"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { RecordItem } from "@/types/record";
import { updateRecord } from "@/lib/records";
import { DEFAULT_RECORD_CATEGORY, RECORD_CATEGORIES, RecordCategory } from "@/lib/record-categories";

type EditRecordFormProps = {
  record: RecordItem;
};

export default function EditRecordForm({ record }: EditRecordFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(record.title);
  const initialCategory = RECORD_CATEGORIES.includes(record.category as RecordCategory)
    ? (record.category as RecordCategory) : DEFAULT_RECORD_CATEGORY;

  const [category, setCategory] = useState<RecordCategory>(initialCategory);
  const [provider, setProvider] = useState(record.provider ?? "");
  const [description, setDescription] = useState(record.description ?? "");
  const [referenceNumber, setReferenceNumber] = useState(record.referenceNumber ?? "");
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
        category,
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
    <main className="page-shell page-shell--narrow !pt-12">
      <button
        type="button"
        onClick={() => router.push(`/records/${record.id}`)}
        className="text-action back-link"
      >
        Back to record
      </button>

      <div className="mt-6">
        <p className="eyebrow">
          Edit record
        </p>

        <h1 className="page-title mt-4 !font-bold">{record.title}</h1>

        <p className="lede mt-4">
          Update the key details for this record. Documents attached to this
          record are managed from the record details page.
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
            <label
              htmlFor="description"
              className="field-label"
            >
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
            onClick={() => router.push(`/records/${record.id}`)}
            className="button-primary"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="button-primary"
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </main>
  );
}
