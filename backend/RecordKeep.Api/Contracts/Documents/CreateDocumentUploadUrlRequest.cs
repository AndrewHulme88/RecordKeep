namespace RecordKeep.Api.Contracts.Documents;

public sealed class CreateDocumentUploadUrlRequest
{
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long SizeBytes { get; init; }
}