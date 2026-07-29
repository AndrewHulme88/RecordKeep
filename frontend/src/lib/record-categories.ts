export const RECORD_CATEGORIES = [
    "Warranty",
    "Insurance",
    "Vehicle",
    "Property",
    "Finance",
    "Legal",
    "Medical",
    "Other",
] as const;

export type RecordCategory = (typeof RECORD_CATEGORIES)[number];
export const DEFAULT_RECORD_CATEGORY: RecordCategory = "Other";