namespace RecordKeep.Api.Contracts.Documents;

public sealed class CreateDocumentUploadUrlResponse
{
    public Guid DocumentId { get; init; }
    public string UploadUrl { get; init; } = string.Empty;
    public string ObjectKey { get; init; } = string.Empty;
    public DateTime ExpiresAtUtc { get; init; }
}