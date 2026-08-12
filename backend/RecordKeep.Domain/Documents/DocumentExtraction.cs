namespace RecordKeep.Domain.Documents;

public sealed class DocumentExtraction
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DocumentExtractionStatus Status { get; set; } = DocumentExtractionStatus.Pending;
    public string? Provider { get; set; }
    public string? ModelName { get; set; }
    public string SchemaVersion { get; set; } = "1";
    public string? ExtractedFieldsJson { get; set; }
    public string? EvidenceJson { get; set; }
    public string? RawResultJson { get; set; }
    public string? ErrorCode { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public RecordDocument Document { get; set; } = null!;
}
