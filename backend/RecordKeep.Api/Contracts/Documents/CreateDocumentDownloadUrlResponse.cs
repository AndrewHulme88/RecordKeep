using Amazon.S3.Model;

namespace RecordKeep.Api.Contracts.Documents;

public sealed class CreateDocumentDownloadUrlResponse
{
    public Guid DocumentId { get; init; }
    public string DownloadUrl { get; init; } = string.Empty;
    public DateTime ExpiresAtUtc { get; init; }
}