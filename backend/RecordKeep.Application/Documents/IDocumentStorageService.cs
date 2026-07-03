namespace RecordKeep.Application.Documents;

public interface IDocumentStorageService
{
    string CreateUploadUrl(
        string objectKey,
        string contentType,
        TimeSpan expiresIn);
    
    string CreateDownloadUrl(
        string objectKey,
        TimeSpan expiresIn);

    Task DeleteAsync(
        string objectKey,
        CancellationToken cancellationToken = default);
}