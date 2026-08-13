using System.Text.Json;

namespace RecordKeep.Api.Contracts.Documents;

public sealed class DocumentExtractionResponse
{
    public Guid Id { get; init; }
    public Guid DocumentId { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Provider { get; init; }
    public string? ModelName { get; init; }
    public JsonElement? ExtractedFields { get; init; }
    public JsonElement? Evidence { get; init; }
    public string? ErrorCode { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public DateTime? CompletedAtUtc { get; init; }
}
