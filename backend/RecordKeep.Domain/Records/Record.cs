using RecordKeep.Domain.Documents;

namespace RecordKeep.Domain.Records;

public class Record
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Provider { get; set; }
    public string? Description { get; set; }
    public string? ReferenceNumber { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public decimal? Amount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public ICollection<RecordDocument> Documents { get; set; } = new List<RecordDocument>();
}