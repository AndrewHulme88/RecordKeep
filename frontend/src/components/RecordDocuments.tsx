"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { createDocumentDownloadUrl, deleteDocument, DocumentItem, getDocuments, uploadDocument, } from "@/lib/documents";

type RecordDocumentsProps = { recordId: string; };

export default function RecordDocuments({ recordId, }: RecordDocumentsProps) {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
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
    }, [recordId]);

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
            setErrorMessage("Choose a file before uploading.");
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

    return (
        <section className="rounded-lg border p-6">
            <div className="mb-4">
                <h2 className="text-xl font-semibold">Documents</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Attach PDFs or images related to this record.
                </p>
            </div>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="text-sm"
                />

                <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isUploading ? "Uploading..." : "Upload"}
                </button>
            </div>

            {selectedFile && (
                <p className="mb-4 text-gray-600">
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
                <ul className="divide-y">
                    {documents.map((document) => (
                        <li
                            key={document.id}
                            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div>
                                <p className="font-medium">{document.originalFileName}</p>
                                <p className="text-sm text-gray-600">
                                    {formatFileSize(document.sizeBytes)} -{" "}
                                    {formatDate(document.createdAtUtc)}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleDownload(document.id)}
                                    className="rounded-md border px-3 py-2 text-sm font-medium"
                                >
                                    Open
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDelete(document.id)}
                                    disabled={deletingDocumentId === document.id}
                                    className="rounded-md border px-3 py-2 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {deletingDocumentId === document.id ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
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