using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using RecordKeep.Api.Contracts.Documents;
using RecordKeep.Api.Contracts.Records;
using RecordKeep.Api.Tests.Authentication;
using RecordKeep.Infrastructure.Persistence;
using RecordEntity = RecordKeep.Domain.Records.Record;

namespace RecordKeep.Api.Tests.Documents;

public sealed class DocumentUploadUrlTests
    : IClassFixture<RecordKeepApiFactory>
{
    private readonly RecordKeepApiFactory _factory;
    private readonly HttpClient _client;

    public DocumentUploadUrlTests(
        RecordKeepApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        dbContext.Database.EnsureDeleted();
        dbContext.Database.EnsureCreated();
    }

    [Fact]
    public async Task CreateUploadUrl_WithoutAuthenticatedUser_ReturnsUnauthorized()
    {
        var record = await CreateRecord("user-a", "Insurance");

        var response = await _client.PostAsJsonAsync(
            $"/api/records/{record.Id}/documents/upload-url",
            new CreateDocumentUploadUrlRequest
            {
                FileName = "policy.pdf",
                ContentType = "application/pdf",
                SizeBytes = 1000
            });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateUploadUrl_WhenRecordBelongsToAnotherUser_ReturnsNotFound()
    {
        var record = await CreateRecord("user-a", "Insurance");

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/records/{record.Id}/documents/upload-url");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-b");

        request.Content = JsonContent.Create(
            new CreateDocumentUploadUrlRequest
            {
                FileName = "policy.pdf",
                ContentType = "application/pdf",
                SizeBytes = 1000
            });

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateUploadUrl_WithValidRequest_ReturnsUploadUrlAndCreatesDocumentMetadata()
    {
        var record = await CreateRecord("user-a", "Insurance");

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/records/{record.Id}/documents/upload-url");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");

        request.Content = JsonContent.Create(
            new CreateDocumentUploadUrlRequest
            {
                FileName = "policy.pdf",
                ContentType = "application/pdf",
                SizeBytes = 1000
            });

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var uploadResponse = await response.Content.ReadFromJsonAsync<CreateDocumentUploadUrlResponse>();

        Assert.NotNull(uploadResponse);
        Assert.NotEqual(Guid.Empty, uploadResponse.DocumentId);
        Assert.NotEmpty(uploadResponse.UploadUrl);
        Assert.Contains($"/records/{record.Id}/documents/", uploadResponse.ObjectKey);

        using var scope = _factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var document = await dbContext.RecordDocuments.FindAsync(uploadResponse.DocumentId);

        Assert.NotNull(document);
        Assert.Equal(record.Id, document.RecordId);
        Assert.Equal("user-a", document.UserId);
        Assert.Equal("policy.pdf", document.OriginalFileName);
        Assert.Equal("application/pdf", document.ContentType);
        Assert.Equal(1000, document.SizeBytes);
        Assert.Equal(uploadResponse.ObjectKey, document.ObjectKey);
    }

    [Fact]
    public async Task CreateUploadUrl_WithUnsupportedContentType_ReturnsBadRequest()
    {
        var record = await CreateRecord("user-a", "Insurance");

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/records/{record.Id}/documents/upload-url");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");

        request.Content = JsonContent.Create(
            new CreateDocumentUploadUrlRequest
            {
                FileName = "notes.txt",
                ContentType = "text/plain",
                SizeBytes = 1000
            });

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateUploadUrl_WithOversizedFile_ReturnsBadRequest()
    {
        var record = await CreateRecord("user-a", "Insurance");

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/records/{record.Id}/documents/upload-url");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");

        request.Content = JsonContent.Create(
            new CreateDocumentUploadUrlRequest
            {
                FileName = "large-policy.pdf",
                ContentType = "application/pdf",
                SizeBytes = 10 * 1024 * 1024 + 1
            });

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
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
}