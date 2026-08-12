namespace RecordKeep.Application.Documents;

public sealed record DocumentExtractionResult(
    string Provider,
    string? ModelName,
    string SchemaVersion,
    string ExtractedFieldsJson,
    string EvidenceJson,
    string? RawResultJson = null);
