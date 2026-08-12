namespace RecordKeep.Domain.Documents;

public enum DocumentExtractionStatus
{
    Pending,
    Processing,
    NeedsReview,
    Completed,
    Failed
}
