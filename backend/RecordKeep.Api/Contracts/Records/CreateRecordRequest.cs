namespace RecordKeep.Api.Contracts.Records;

public sealed class CreateRecordRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Provider { get; set; }
    public string? Description { get; set; }
    public string? ReferenceNumber { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public decimal? Amount { get; set; }
}