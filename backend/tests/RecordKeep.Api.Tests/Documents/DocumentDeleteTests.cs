using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using RecordKeep.Api.Contracts.Documents;
using RecordKeep.Api.Contracts.Records;
using RecordKeep.Api.Tests.Authentication;
using RecordKeep.Infrastructure.Persistence;
using RecordEntity = RecordKeep.Domain.Records.Record;

namespace RecordKeep.Api.Tests.Documents;

public sealed class DocumentDeleteTests : IClassFixture<RecordKeepApiFactory>
{
    private readonly RecordKeepApiFactory _factory;
    private readonly HttpClient _client;

    public DocumentDeleteTests(RecordKeepApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        dbContext.Database.EnsureDeleted();
        dbContext.Database.EnsureCreated();
    }

    [Fact]
    public async Task DeleteDocument_WithoutAuthenticatedUser_ReturnsUnauthorised()
    {
        var record = await CreateRecord("user-a", "Insurance");

        var uploadResponse = await CreateUploadUrl(
            "user-a",
            record.Id,
            "policy.pdf",
            "application/pdf");

        var response = await _client.DeleteAsync($"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DeleteDocument_WhenDocumentBelongsToAnotherUser_ReturnsNotFound()
    {
        var record = await CreateRecord("user-a", "Insurance");

        var uploadResponse = await CreateUploadUrl(
            "user-a",
            record.Id,
            "policy.pdf",
            "application/pdf");

        using var request = new HttpRequestMessage(HttpMethod.Delete, $"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-b");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteDocument_WhenDocumentDoesNotBelongToRecord_ReturnsNotFound()
    {
        var firstRecord = await CreateRecord("user-a", "Insurance");
        var secondRecord = await CreateRecord("user-b", "Warranty");

        var uploadResponse = await CreateUploadUrl(
            "user-a",
            firstRecord.Id,
            "policy.pdf",
            "application/pdf");

        using var request = new HttpRequestMessage(HttpMethod.Delete, $"/api/records/{secondRecord.Id}/documents/{uploadResponse.DocumentId}");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteDocument_WithValidRequest_RemovesMetadataAndDeletesObject()
    {
        var record = await CreateRecord("user-a", "Insurance");

        var uploadResponse = await CreateUploadUrl(
            "user-a",
            record.Id,
            "policy.pdf",
            "application/pdf");

        using var request = new HttpRequestMessage(HttpMethod.Delete, $"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var document = await dbContext.RecordDocuments.FindAsync(uploadResponse.DocumentId);

        Assert.Null(document);

        var fakeStorage = scope.ServiceProvider.GetRequiredService<FakeDocumentStorageService>();

        Assert.Contains(uploadResponse.ObjectKey, fakeStorage.DeletedObjectKeys);
    }

    private async Task<RecordEntity> CreateRecord(string userId, string title)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/records");

        request.Headers.Add(TestAuthHandler.UserIdHeader, userId);

        request.Content = JsonContent.Create(new CreateRecordRequest
        {
            Title = title
        });

        var response = await _client.SendAsync(request);

        response.EnsureSuccessStatusCode();

        var record = await response.Content.ReadFromJsonAsync<RecordEntity>();

        return record ?? throw new InvalidOperationException("Record response was empty.");
    }

    private async Task<CreateDocumentUploadUrlResponse> CreateUploadUrl(
        string userId,
        Guid recordId,
        string fileName,
        string contentType)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/records/{recordId}/documents/upload-url");

        request.Headers.Add(TestAuthHandler.UserIdHeader, userId);

        request.Content = JsonContent.Create(new CreateDocumentUploadUrlRequest
        {
            FileName = fileName,
            ContentType = contentType,
            SizeBytes = 1000
        });

        var response = await _client.SendAsync(request);

        response.EnsureSuccessStatusCode();

        var uploadResponse = await response.Content.ReadFromJsonAsync<CreateDocumentUploadUrlResponse>();

        return uploadResponse ?? throw new InvalidOperationException("Upload URL response was empty.");
    }
}