using RecordKeep.Application.Documents;

namespace RecordKeep.Api.Tests.Documents;

public sealed class FakeDocumentExtractionService : IDocumentExtractionService
{
    public DocumentExtractionRequest? LastRequest { get; private set; }
    public Exception? ExceptionToThrow { get; set; }

    public DocumentExtractionResult Result { get; set; } = new(
        Provider: "Fake",
        ModelName: null,
        SchemaVersion: "1",
        ExtractedFieldsJson: "{}",
        EvidenceJson: "{}",
        RawResultJson: "{\"blocks\":[]}");

    public void Reset()
    {
        LastRequest = null;
        ExceptionToThrow = null;
        Result = new DocumentExtractionResult("Fake", null, "1", "{}", "{}", "{\"blocks\":[]}");
    }

    public Task<DocumentExtractionResult> ExtractAsync(
        DocumentExtractionRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        LastRequest = request;

        if (ExceptionToThrow is not null)
        {
            throw ExceptionToThrow;
        }

        return Task.FromResult(Result);
    }
}
