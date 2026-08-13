"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
    applyDocumentExtraction,
    createDocumentDownloadUrl,
    deleteDocument,
    DocumentExtraction,
    DocumentItem,
    getDocumentExtraction,
    getDocuments,
    uploadDocument,
} from "@/lib/documents";
import type { RecordItem } from "@/types/record";

type RecordDocumentsProps = {
    recordId: string;
    initialReviewDocumentId?: string | null;
    onRecordUpdated?: (record: RecordItem) => void;
};

export default function RecordDocuments({
    recordId,
    initialReviewDocumentId,
    onRecordUpdated,
}: RecordDocumentsProps) {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
    const [openExtractionId, setOpenExtractionId] = useState<string | null>(null);
    const [extractions, setExtractions] = useState<Record<string, DocumentExtraction>>({});
    const [loadingExtractionId, setLoadingExtractionId] = useState<string | null>(null);
    const [applyingExtractionId, setApplyingExtractionId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadDocuments() {
            try {
                const result = await getDocuments(recordId);

                if (isMounted) {
                    setDocuments(result);
                    setErrorMessage(null);

                    const reviewDocument = result.find(
                        (document) =>
                            document.id === initialReviewDocumentId &&
                            document.extractionStatus === "NeedsReview",
                    );

                    if (reviewDocument) {
                        setOpenExtractionId(reviewDocument.id);
                        setLoadingExtractionId(reviewDocument.id);

                        try {
                            const extraction = await getDocumentExtraction(recordId, reviewDocument.id);

                            if (isMounted) {
                                setExtractions({ [reviewDocument.id]: extraction });
                            }
                        } finally {
                            if (isMounted) {
                                setLoadingExtractionId(null);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load documents:", error);

                if (isMounted) {
                    setErrorMessage("Could not load documents.");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadDocuments();

        return () => {
            isMounted = false;
        };
    }, [initialReviewDocumentId, recordId]);

    async function refreshDocuments() {
        const result = await getDocuments(recordId);

        setDocuments(result);
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;

        setSelectedFile(file);
        setErrorMessage(null);
    }

    async function handleUpload() {
        if (!selectedFile) {
            setErrorMessage("Could not upload document. Check that the file is a PDF, PNG or JPEG under 10 MB.");
            return;
        }

        try {
            setIsUploading(true);
            setErrorMessage(null);

            await uploadDocument(recordId, selectedFile);
            await refreshDocuments();

            setSelectedFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error) {
            console.error("Failed to upload document:", error);
            setErrorMessage("Could not upload document.");
        } finally {
            setIsUploading(false);
        }
    }

    async function handleDownload(documentId: string) {
        try {
            setErrorMessage(null);

            const downloadUrl = await createDocumentDownloadUrl(recordId, documentId);

            window.open(downloadUrl, "_blank", "noopener,noreferrer");
        } catch (error) {
            console.error("Failed to create download URL:", error);
            setErrorMessage("Could not open document.");
        }
    }

    async function handleDelete(documentId: string) {
        const confirmed = window.confirm("Delete this document? This cannot be undone.");

        if (!confirmed) { return; }

        try {
            setDeletingDocumentId(documentId);
            setErrorMessage(null);

            await deleteDocument(recordId, documentId);
            await refreshDocuments();
        } catch (error) {
            console.error("Failed to delete document:", error);
            setErrorMessage("Could not delete document.");
        } finally {
            setDeletingDocumentId(null);
        }
    }

    async function handleReview(documentId: string) {
        if (openExtractionId === documentId) {
            setOpenExtractionId(null);
            return;
        }

        setOpenExtractionId(documentId);

        if (extractions[documentId]) {
            return;
        }

        try {
            setLoadingExtractionId(documentId);
            setErrorMessage(null);
            const extraction = await getDocumentExtraction(recordId, documentId);
            setExtractions((current) => ({ ...current, [documentId]: extraction }));
        } catch (error) {
            console.error("Failed to load extracted details:", error);
            setOpenExtractionId(null);
            setErrorMessage("Could not load the detected document details.");
        } finally {
            setLoadingExtractionId(null);
        }
    }

    return (
        <section className="border-t border-[var(--line)] pt-8">
            <div className="mb-4">
                <h2 className="section-title">Documents</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                    Attach supporting documents for this record, such as policies, receipts, warranties or licence files.
                </p>

                <p className="mt-2 text-xs text-[var(--muted)]">
                    Supported files: PDF, PNG, or JPEG. Maximum size: 10 MB.
                </p>
            </div>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="text-sm text-[var(--muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--surface)] file:px-4 file:py-2 file:text-xs file:font-bold file:text-[var(--accent)]"
                />

                <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="button-primary"
                >
                    {isUploading ? "Uploading..." : "Upload"}
                </button>
            </div>

            {selectedFile && (
                <p className="mb-4 text-sm text-[var(--muted)]">
                    Selected: {selectedFile.name}
                </p>
            )}

            {errorMessage && (
                <p className="mb-4 text-sm text-red-600">{errorMessage}</p>
            )}

            {isLoading ? (
                <p className="text-sm text-gray-600">Loading documents...</p>
            ) : documents.length === 0 ? (
                <p className="text-sm text-gray-600">
                    No documents have been attached yet.
                </p>
            ) : (
                <ul className="divide-y divide-[var(--line)]">
                    {documents.map((document) => (
                        <li key={document.id} className="py-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-serif text-lg">{document.originalFileName}</p>
                                    <p className="mt-1 text-xs text-[var(--muted)]">
                                        {formatFileSize(document.sizeBytes)} -{" "}
                                        {formatDate(document.createdAtUtc)}
                                        {document.extractionStatus && (
                                            <> · {formatExtractionStatus(document.extractionStatus)}</>
                                        )}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {document.extractionStatus === "NeedsReview" && (
                                        <button
                                            type="button"
                                            onClick={() => handleReview(document.id)}
                                            className="button-secondary"
                                        >
                                            {openExtractionId === document.id ? "Hide details" : "Review details"}
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => handleDownload(document.id)}
                                        className="button-secondary"
                                    >
                                        Open
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(document.id)}
                                        disabled={deletingDocumentId === document.id}
                                        className="button-danger"
                                    >
                                        {deletingDocumentId === document.id ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            </div>

                            {openExtractionId === document.id && (
                                <ExtractionReview
                                    extraction={extractions[document.id]}
                                    isLoading={loadingExtractionId === document.id}
                                    isApplying={applyingExtractionId === document.id}
                                    onApply={async (input) => {
                                        try {
                                            setApplyingExtractionId(document.id);
                                            setErrorMessage(null);
                                            const updatedRecord = await applyDocumentExtraction(recordId, document.id, input);
                                            const updatedDocuments = await getDocuments(recordId);
                                            setDocuments(updatedDocuments);
                                            setOpenExtractionId(null);
                                            onRecordUpdated?.(updatedRecord);
                                        } catch (error) {
                                            console.error("Failed to apply detected details:", error);
                                            setErrorMessage("Could not apply the selected details. Check the values and try again.");
                                        } finally {
                                            setApplyingExtractionId(null);
                                        }
                                    }}
                                />
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

const extractionLabels: Record<string, string> = {
    title: "Document type",
    provider: "Provider",
    referenceNumber: "Reference number",
    startDate: "Start date",
    expiryDate: "Expiry date",
    amount: "Amount",
};

function ExtractionReview({
    extraction,
    isLoading,
    isApplying,
    onApply,
}: {
    extraction?: DocumentExtraction;
    isLoading: boolean;
    isApplying: boolean;
    onApply: (input: import("@/lib/documents").ApplyDocumentExtractionInput) => Promise<void>;
}) {
    if (isLoading || !extraction) {
        return <p className="mt-5 text-sm text-[var(--muted)]">Reading detected details…</p>;
    }

    return <ExtractionReviewForm extraction={extraction} isApplying={isApplying} onApply={onApply} />;
}

const reviewFieldKeys = ["title", "provider", "referenceNumber", "startDate", "expiryDate", "amount"] as const;
type ReviewFieldKey = (typeof reviewFieldKeys)[number];

function ExtractionReviewForm({
    extraction,
    isApplying,
    onApply,
}: {
    extraction: DocumentExtraction;
    isApplying: boolean;
    onApply: (input: import("@/lib/documents").ApplyDocumentExtractionInput) => Promise<void>;
}) {
    const detectedFields = extraction.extractedFields ?? {};
    const availableFields = reviewFieldKeys.filter((key) => detectedFields[key]);
    const [selected, setSelected] = useState<Record<ReviewFieldKey, boolean>>({
        title: false,
        provider: false,
        referenceNumber: false,
        startDate: false,
        expiryDate: false,
        amount: false,
    });
    const [values, setValues] = useState<Record<ReviewFieldKey, string>>({
        title: detectedFields.title ?? "",
        provider: detectedFields.provider ?? "",
        referenceNumber: detectedFields.referenceNumber ?? "",
        startDate: normaliseDetectedDate(detectedFields.startDate),
        expiryDate: normaliseDetectedDate(detectedFields.expiryDate),
        amount: detectedFields.amount?.replace(/[^0-9.-]/g, "") ?? "",
    });

    const hasSelection = availableFields.some((key) => selected[key]);

    async function submitReview(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await onApply({
            applyTitle: selected.title,
            title: values.title,
            applyProvider: selected.provider,
            provider: values.provider,
            applyReferenceNumber: selected.referenceNumber,
            referenceNumber: values.referenceNumber,
            applyStartDate: selected.startDate,
            startDate: selected.startDate ? values.startDate || undefined : undefined,
            applyExpiryDate: selected.expiryDate,
            expiryDate: selected.expiryDate ? values.expiryDate || undefined : undefined,
            applyAmount: selected.amount,
            amount: selected.amount && values.amount ? Number(values.amount) : undefined,
        });
    }

    return (
        <form onSubmit={submitReview} className="mt-6 max-w-3xl bg-[rgb(255_255_255_/_0.24)] px-5 py-5 sm:px-6">
            <p className="eyebrow">Detected details</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Select the details you want to use, and correct them before applying. Unselected record fields stay unchanged.
            </p>

            {availableFields.length === 0 ? (
                <p className="mt-5 text-sm text-[var(--muted)]">No details were detected.</p>
            ) : (
                <div className="mt-5 grid gap-x-10 gap-y-5 sm:grid-cols-2">
                    {availableFields.map((key) => {
                        const confidence = extraction.evidence?.[key]?.confidence;

                        return (
                            <label key={key} className="block">
                                <span className="flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-[var(--muted)] uppercase">
                                    <input
                                        type="checkbox"
                                        checked={selected[key]}
                                        onChange={(event) => setSelected((current) => ({ ...current, [key]: event.target.checked }))}
                                        className="size-4 accent-[var(--accent)]"
                                    />
                                    {extractionLabels[key]}
                                </span>
                                <input
                                    type={key === "amount" ? "number" : key.endsWith("Date") ? "date" : "text"}
                                    step={key === "amount" ? "0.01" : undefined}
                                    min={key === "amount" ? "0" : undefined}
                                    value={values[key]}
                                    onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
                                    className="field mt-2"
                                    disabled={!selected[key]}
                                />
                                {typeof confidence === "number" && (
                                    <p className="mt-1 text-xs text-[var(--muted)]">
                                        {Math.round(confidence)}% confidence
                                    </p>
                                )}
                            </label>
                        );
                    })}
                </div>
            )}

            {availableFields.length > 0 && (
                <button type="submit" disabled={!hasSelection || isApplying} className="button-primary mt-6">
                    {isApplying ? "Applying…" : "Apply selected details"}
                </button>
            )}
        </form>
    );
}

function normaliseDetectedDate(value: string | null | undefined): string {
    if (!value) {
        return "";
    }

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        return value;
    }

    const australianMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (australianMatch) {
        const [, day, month, year] = australianMatch;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "";
    }

    return [
        parsed.getFullYear(),
        String(parsed.getMonth() + 1).padStart(2, "0"),
        String(parsed.getDate()).padStart(2, "0"),
    ].join("-");
}

function formatExtractionStatus(status: DocumentItem["extractionStatus"]): string {
    switch (status) {
        case "Pending":
        case "Processing":
            return "Reading document";
        case "NeedsReview":
            return "Details ready to review";
        case "Completed":
            return "Details reviewed";
        case "Failed":
            return "Could not read details";
        default:
            return "";
    }
}

function formatFileSize(sizeBytes: number): string {
    if (sizeBytes < 1024) {
        return `${sizeBytes} B`;
    }

    if (sizeBytes < 1024 * 1024) {
        return `${(sizeBytes / 1024).toFixed(1)} KB`;
    }

    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat("en-AU", {
        dateStyle: "medium",
    }).format(new Date(value));
}
