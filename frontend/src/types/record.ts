import { RecordCategory } from "@/lib/record-categories";

// Naming it RecordItem to avoid conflict with JavaScripts built in Record
export type RecordItem = {
    id: string;
    title: string;
    category: RecordCategory;
    provider: string | null;
    description: string | null;
    referenceNumber: string | null;
    startDate: string | null;
    expiryDate: string | null;
    amount: number | null;
    createdAtUtc: string;
    updatedAtUtc: string;
};