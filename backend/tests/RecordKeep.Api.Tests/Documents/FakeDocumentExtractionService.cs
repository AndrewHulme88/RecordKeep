using RecordKeep.Application.Documents;

namespace RecordKeep.Api.Tests.Documents;

public sealed class FakeDocumentExtractionService : IDocumentExtractionService
{
    public DocumentExtractionRequest? LastRequest { get; private set; }

    public DocumentExtractionResult Result { get; set; } = new(
        Provider: "Fake",
        ModelName: null,
        SchemaVersion: "1",
        ExtractedFieldsJson: "{}",
        EvidenceJson: "{}");

    public Task<DocumentExtractionResult> ExtractAsync(
        DocumentExtractionRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        LastRequest = request;
        return Task.FromResult(Result);
    }
}
