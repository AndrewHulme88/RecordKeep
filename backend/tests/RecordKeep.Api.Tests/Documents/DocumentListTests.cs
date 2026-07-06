using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using RecordKeep.Api.Contracts.Documents;
using RecordKeep.Api.Contracts.Records;
using RecordKeep.Api.Tests.Authentication;
using RecordKeep.Infrastructure.Persistence;
using RecordEntity = RecordKeep.Domain.Records.Record;

namespace RecordKeep.Api.Tests.Documents;

public sealed class DocumentListTests : IClassFixture<RecordKeepApiFactory>
{
    private readonly HttpClient _client;

    public DocumentListTests(RecordKeepApiFactory factory)
    {
        _client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        dbContext.Database.EnsureDeleted();
        dbContext.Database.EnsureCreated();
    }

    [Fact]
    public async Task GetDocuments_WithoutAuthenticatedUser_ReturnUnauthorised()
    {
        var record = await CreateRecord("user-a", "Insurance");
        var response = await _client.GetAsync($"/api/records/{record.Id}/documents");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetDocuments_WhenRecordBelongsToAnotherUser_ReturnsNotFound()
    {
        var record = await CreateRecord("user-a", "Insurance");
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/records/{record.Id}/documents");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-b");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetDocuments_WhenRecordBelongsToCurrentUser_ReturnsDocuments()
    {
        var record = await CreateRecord("user-a", "Insurance");

        await CreateUploadUrl("user-a", record.Id, "policy.pdf", "application/pdf");
        await CreateUploadUrl("user-a", record.Id, "receipt.png", "image/png");

        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/records/{record.Id}/documents");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var documents = await response.Content.ReadFromJsonAsync<List<DocumentResponse>>();

        Assert.NotNull(documents);
        Assert.Equal(2, documents.Count);

        Assert.All(documents, document =>
        {
            Assert.Equal(record.Id, document.RecordId);
            Assert.False(string.IsNullOrWhiteSpace(document.OriginalFileName));
            Assert.False(string.IsNullOrWhiteSpace(document.ContentType));
            Assert.True(document.SizeBytes > 0);
        });
    }

    [Fact]
    public async Task GetDocuments_DoesNotReturnDocumentsFromAnotherRecord()
    {
        var userARecord = await CreateRecord("user-a", "Insurance");
        var otherUserARecord = await CreateRecord("user-a", "Warranty");

        await CreateUploadUrl("user-a", userARecord.Id, "insurance.pdf", "application/pdf");
        await CreateUploadUrl("user-a", otherUserARecord.Id, "warranty.pdf", "application/pdf");

        using var request = new HttpRequestMessage(HttpMethod.Get, 
            $"/api/records/{userARecord.Id}/documents");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var documents = await response.Content.ReadFromJsonAsync<List<DocumentResponse>>();

        Assert.NotNull(documents);
        Assert.Single(documents);
        Assert.Equal(userARecord.Id, documents[0].RecordId);
        Assert.Equal("insurance.pdf", documents[0].OriginalFileName);
    }

    private async Task<RecordEntity> CreateRecord(string userId, string title)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/records");

        request.Headers.Add(TestAuthHandler.UserIdHeader, userId);

        request.Content = JsonContent.Create(
            new CreateRecordRequest
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
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/records/{recordId}/documents/upload-url");

        request.Headers.Add(TestAuthHandler.UserIdHeader, userId);

        request.Content = JsonContent.Create(
            new CreateDocumentUploadUrlRequest
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