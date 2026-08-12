namespace RecordKeep.Application.Documents;

public interface IDocumentExtractionService
{
    Task<DocumentExtractionResult> ExtractAsync(
        DocumentExtractionRequest request,
        CancellationToken cancellationToken = default);
}
