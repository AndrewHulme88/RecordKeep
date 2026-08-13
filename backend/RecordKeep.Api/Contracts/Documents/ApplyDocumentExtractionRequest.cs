namespace RecordKeep.Api.Contracts.Documents;

public sealed class ApplyDocumentExtractionRequest
{
    public bool ApplyTitle { get; init; }
    public string? Title { get; init; }
    public bool ApplyProvider { get; init; }
    public string? Provider { get; init; }
    public bool ApplyReferenceNumber { get; init; }
    public string? ReferenceNumber { get; init; }
    public bool ApplyStartDate { get; init; }
    public string? StartDate { get; init; }
    public bool ApplyExpiryDate { get; init; }
    public string? ExpiryDate { get; init; }
    public bool ApplyAmount { get; init; }
    public decimal? Amount { get; init; }
}
