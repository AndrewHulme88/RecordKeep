using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using RecordKeep.Api.Contracts.Documents;
using RecordKeep.Api.Contracts.Records;
using RecordKeep.Api.Tests.Authentication;
using RecordKeep.Infrastructure.Persistence;
using RecordEntity = RecordKeep.Domain.Records.Record;

namespace RecordKeep.Api.Tests.Documents;

public sealed class DocumentCompleteUploadTests : IClassFixture<RecordKeepApiFactory>
{
    private readonly RecordKeepApiFactory _factory;
    private readonly HttpClient _client;

    public DocumentCompleteUploadTests(RecordKeepApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        dbContext.Database.EnsureDeleted();
        dbContext.Database.EnsureCreated();
    }

    [Fact]
    public async Task CompleteUpload_WithoutAuthenticatedUser_ReturnsUnauthorised()
    {
        var record = await CreateRecord("user-a", "Insurance");
        var uploadResponse = await CreateUploadUrl("user-a", record.Id, "policy.pdf", "application/pdf");
        var response = await _client.PostAsync($"/api/records/{record.Id}/Documents/{uploadResponse.DocumentId}/complete",
            content: null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CompleteUpload_WhenDocumentBelongsToAnotherUser_ReturnsNotFound()
    {
        var record = await CreateRecord("user-a", "Insurance");
        var uploadResponse = await CreateUploadUrl("user-a", record.Id, "policy.pdf", "application/pdf");

        using var request = new HttpRequestMessage(HttpMethod.Post,$"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}/complete");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-b");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CompleteUpload_WithValidRequest_MarksDocumentAsUploaded()
    {
        var record = await CreateRecord("user-a", "Insurance");
        var uploadResponse = await CreateUploadUrl("user-a", record.Id, "policy.pdf", "application/pdf");

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}/complete");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var scope = _factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var document = await dbContext.RecordDocuments.FindAsync(uploadResponse.DocumentId);

        Assert.NotNull(document);
        Assert.True(document.IsUploaded);
    }

    private async Task<RecordEntity> CreateRecord(string userId, string title)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/records");

        request.Headers.Add(TestAuthHandler.UserIdHeader, userId);
        request.Content = JsonContent.Create(new CreateRecordRequest{Title = title});

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