namespace RecordKeep.Api.Contracts.Documents;

public sealed class DocumentResponse
{
    public Guid Id { get; init; }
    public Guid RecordId { get; init; }
    public string OriginalFileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long SizeBytes { get; init; }
    public DateTime CreatedAtUtc { get; init; }
}