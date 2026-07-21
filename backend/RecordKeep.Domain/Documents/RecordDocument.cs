using RecordEntity = RecordKeep.Domain.Records.Record;

namespace RecordKeep.Domain.Documents;

public sealed class RecordDocument
{
    public Guid Id { get; set; }
    public Guid RecordId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ObjectKey { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public RecordEntity Record { get; set; } = null!;
    public bool IsUploaded { get; set; }
}