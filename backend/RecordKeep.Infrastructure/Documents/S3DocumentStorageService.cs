using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using RecordKeep.Application.Documents;

namespace RecordKeep.Infrastructure.Documents;

public sealed class S3DocumentStorageService : IDocumentStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;

    public S3DocumentStorageService(IAmazonS3 s3Client, IOptions<S3Options> options)
    {
        _s3Client = s3Client;
        _bucketName = options.Value.BucketName;
    }

    public string CreateUploadUrl(
        string objectKey,
        string contentType,
        TimeSpan expiresIn)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = objectKey,
            Verb = HttpVerb.PUT,
            ContentType = contentType,
            Expires = DateTime.UtcNow.Add(expiresIn)
        };

        return _s3Client.GetPreSignedURL(request);
    }

    public string CreateDownloadUrl(
        string objectKey,
        TimeSpan expiresIn)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = objectKey,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.Add(expiresIn)
        };

        return _s3Client.GetPreSignedURL(request);
    }

    public async Task DeleteAsync(
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        var request = new DeleteObjectRequest
        {
            BucketName = _bucketName,
            Key = objectKey
        };

        await _s3Client.DeleteObjectAsync(request, cancellationToken);
    }
}