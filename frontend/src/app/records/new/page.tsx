"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/lib/documents";
import { createRecord, deleteRecord } from "@/lib/records";
import {
  DEFAULT_RECORD_CATEGORY,
  RECORD_CATEGORIES,
  RecordCategory,
} from "@/lib/record-categories";

type EntryMethod = "document" | "manual";

export default function NewRecordPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [entryMethod, setEntryMethod] = useState<EntryMethod>("document");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  function chooseEntryMethod(method: EntryMethod) {
    setEntryMethod(method);
    setError("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
    setError("");
  }

  async function handleDocumentUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Choose a PDF, PNG or JPEG under 10 MB.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    let draftRecordId: string | null = null;

    try {
      const record = await createRecord({
        title: titleFromFileName(selectedFile.name),
        category: DEFAULT_RECORD_CATEGORY,
      });
      draftRecordId = record.id;

      const documentId = await uploadDocument(record.id, selectedFile);
      router.push(`/records/${record.id}?reviewDocument=${documentId}`);
      router.refresh();
    } catch (uploadError) {
      console.error("Failed to create a record from the document:", uploadError);

      if (draftRecordId) {
        try {
          await deleteRecord(draftRecordId);
        } catch (cleanupError) {
          console.error("Failed to remove incomplete draft record:", cleanupError);
        }
      }

      setError("Could not upload the document. Check the file and try again.");
      setIsSubmitting(false);
    }
  }

  async function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
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
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell page-shell--narrow !pt-12">
      <button type="button" onClick={() => router.push("/")} className="text-action back-link">
        Back to records
      </button>

      <div className="mt-6">
        <h1 className="page-title mt-4 !font-bold">Add a new record</h1>
        <p className="lede mt-4">
          Start with a document and review the details we find, or enter everything yourself.
        </p>
      </div>

      <div className="mt-10 flex gap-6 border-b border-[var(--line)]" aria-label="Choose how to add a record">
        <MethodButton
          active={entryMethod === "document"}
          onClick={() => chooseEntryMethod("document")}
        >
          Upload a document
        </MethodButton>
        <MethodButton
          active={entryMethod === "manual"}
          onClick={() => chooseEntryMethod("manual")}
        >
          Enter details manually
        </MethodButton>
      </div>

      {entryMethod === "document" ? (
        <form onSubmit={handleDocumentUpload} className="pt-10">
          <h2 className="section-title">Let the document do the first pass</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Upload one document. You’ll review and correct every detected detail before anything is saved to the record.
          </p>

          <div className="mt-8">
            <label htmlFor="record-document" className="field-label">Document</label>
            <input
              ref={fileInputRef}
              id="record-document"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={handleFileChange}
              className="mt-3 block w-full text-sm text-[var(--muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--surface)] file:px-4 file:py-2 file:text-xs file:font-bold file:text-[var(--accent)]"
            />
            <p className="field-help">PDF, PNG or JPEG. Maximum size 10 MB.</p>
          </div>

          {selectedFile && (
            <p className="mt-5 font-serif text-lg">{selectedFile.name}</p>
          )}

          <FormMessage error={error} />

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => router.push("/")} className="button-primary">
              Cancel
            </button>
            <button type="submit" disabled={!selectedFile || isSubmitting} className="button-primary">
              {isSubmitting ? "Reading document…" : "Upload and continue"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleManualSubmit} className="form-sheet">
          <div className="space-y-6">
            <Field label="Title" required help="A short name that makes this record easy to recognise.">
              <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Car insurance, laptop warranty, driver licence..." className="field mt-2" required />
            </Field>

            <Field label="Category" help="Choose the type of record you are saving.">
              <select id="category" value={category} onChange={(event) => setCategory(event.target.value as RecordCategory)} className="field mt-2">
                {RECORD_CATEGORIES.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>

            <Field label="Provider">
              <input id="provider" value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="AAMI, Apple, VicRoads..." className="field mt-2" />
            </Field>

            <Field label="Description">
              <textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add any notes that would help you understand this record later." className="field mt-2 min-h-28 resize-y" />
            </Field>

            <Field label="Reference number">
              <input id="reference-number" value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} placeholder="Policy number, account number, licence number..." className="field mt-2" />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Start date">
                <input id="start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="field mt-2" />
              </Field>
              <Field label="Expiry date">
                <input id="expiry-date" type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} className="field mt-2" />
              </Field>
            </div>

            <Field label="Amount">
              <input id="amount" type="number" step="0.01" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="field mt-2" />
            </Field>
          </div>

          <FormMessage error={error} />

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => router.push("/")} className="button-primary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="button-primary">
              {isSubmitting ? "Saving..." : "Save record"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

function MethodButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`pb-3 text-sm font-bold transition-colors ${active ? "border-b-2 border-[var(--accent)] text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
    >
      {children}
    </button>
  );
}

function Field({ label, required, help, children }: { label: string; required?: boolean; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {help && <p className="field-help">{help}</p>}
    </div>
  );
}

function FormMessage({ error }: { error: string }) {
  return error ? <div className="alert"><p>{error}</p></div> : null;
}

function titleFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const readable = withoutExtension.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return readable || "New record";
}
