using RecordKeep.Application.Documents;

namespace RecordKeep.Api.Tests.Documents;

public sealed class FakeDocumentStorageService : IDocumentStorageService
{
    public List<string> DeletedObjectKeys { get; } = [];

    public string CreateUploadUrl(
        string objectKey,
        string contentType,
        TimeSpan expiresIn)
    {
        return $"https://example.test/upload/{Uri.EscapeDataString(objectKey)}";
    }

    public string CreateDownloadUrl(
        string objectKey,
        TimeSpan expiresIn)
    {
        return $"https://example.test/download/{Uri.EscapeDataString(objectKey)}";
    }

    public Task DeleteAsync(
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        DeletedObjectKeys.Add(objectKey);

        return Task.CompletedTask;
    }
}