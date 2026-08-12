namespace RecordKeep.Application.Documents;

public sealed record DocumentExtractionRequest(
    Guid DocumentId,
    string ObjectKey,
    string ContentType);
