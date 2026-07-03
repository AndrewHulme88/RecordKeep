namespace RecordKeep.Infrastructure.Documents;

public sealed class S3Options
{
    public const string SectionName = "S3";

    public required string BucketName { get; init; }
}