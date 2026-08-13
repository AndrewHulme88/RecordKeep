using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecordKeep.Api.Contracts.Documents;
using RecordKeep.Api.Contracts.Records;
using RecordKeep.Api.Tests.Authentication;
using RecordKeep.Infrastructure.Persistence;
using RecordKeep.Domain.Documents;
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

        scope.ServiceProvider.GetRequiredService<FakeDocumentExtractionService>().Reset();
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

        var extraction = await dbContext.DocumentExtractions.SingleAsync(
            item => item.DocumentId == uploadResponse.DocumentId);

        Assert.Equal(DocumentExtractionStatus.NeedsReview, extraction.Status);
        Assert.Equal("Fake", extraction.Provider);
        Assert.Equal("{\"blocks\":[]}", extraction.RawResultJson);

        using var extractionRequest = new HttpRequestMessage(
            HttpMethod.Get,
            $"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}/extraction");
        extractionRequest.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");

        var extractionResponse = await _client.SendAsync(extractionRequest);
        var extractionBody = await extractionResponse.Content.ReadFromJsonAsync<DocumentExtractionResponse>();

        Assert.Equal(HttpStatusCode.OK, extractionResponse.StatusCode);
        Assert.NotNull(extractionBody);
        Assert.Equal("NeedsReview", extractionBody.Status);
        Assert.Equal("Fake", extractionBody.Provider);
        Assert.Equal(JsonValueKind.Object, extractionBody.ExtractedFields?.ValueKind);
    }

    [Fact]
    public async Task GetExtraction_WhenDocumentBelongsToAnotherUser_ReturnsNotFound()
    {
        var record = await CreateRecord("user-a", "Insurance");
        var uploadResponse = await CreateUploadUrl("user-a", record.Id, "policy.pdf", "application/pdf");

        using (var completeRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}/complete"))
        {
            completeRequest.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");
            (await _client.SendAsync(completeRequest)).EnsureSuccessStatusCode();
        }

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}/extraction");
        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-b");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ApplyExtraction_UpdatesSelectedFieldsAndMarksReviewComplete()
    {
        var record = await CreateRecord("user-a", "Existing title");
        var uploadResponse = await CreateUploadUrl("user-a", record.Id, "policy.pdf", "application/pdf");

        using (var completeRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}/complete"))
        {
            completeRequest.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");
            (await _client.SendAsync(completeRequest)).EnsureSuccessStatusCode();
        }

        using var applyRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}/extraction/apply");
        applyRequest.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");
        applyRequest.Content = JsonContent.Create(new ApplyDocumentExtractionRequest
        {
            ApplyProvider = true,
            Provider = "Detected insurer",
            ApplyReferenceNumber = true,
            ReferenceNumber = "POL-123",
            ApplyAmount = true,
            Amount = 725.50m
        });

        var response = await _client.SendAsync(applyRequest);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var updatedRecord = await dbContext.Records.FindAsync(record.Id);
        var extraction = await dbContext.DocumentExtractions.SingleAsync(
            item => item.DocumentId == uploadResponse.DocumentId);

        Assert.NotNull(updatedRecord);
        Assert.Equal("Existing title", updatedRecord.Title);
        Assert.Equal("Detected insurer", updatedRecord.Provider);
        Assert.Equal("POL-123", updatedRecord.ReferenceNumber);
        Assert.Equal(725.50m, updatedRecord.Amount);
        Assert.Equal(DocumentExtractionStatus.Completed, extraction.Status);
    }

    [Fact]
    public async Task ApplyExtraction_WithoutSelectedFields_ReturnsValidationError()
    {
        var record = await CreateRecord("user-a", "Insurance");
        var uploadResponse = await CreateUploadUrl("user-a", record.Id, "policy.pdf", "application/pdf");

        using (var completeRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}/complete"))
        {
            completeRequest.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");
            (await _client.SendAsync(completeRequest)).EnsureSuccessStatusCode();
        }

        using var applyRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}/extraction/apply");
        applyRequest.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");
        applyRequest.Content = JsonContent.Create(new ApplyDocumentExtractionRequest());

        var response = await _client.SendAsync(applyRequest);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ApplyExtraction_WithUnselectedMalformedDate_IgnoresTheDate()
    {
        var record = await CreateRecord("user-a", "Insurance");
        var uploadResponse = await CreateUploadUrl("user-a", record.Id, "policy.pdf", "application/pdf");

        using (var completeRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}/complete"))
        {
            completeRequest.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");
            (await _client.SendAsync(completeRequest)).EnsureSuccessStatusCode();
        }

        using var applyRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}/extraction/apply");
        applyRequest.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");
        applyRequest.Content = JsonContent.Create(new ApplyDocumentExtractionRequest
        {
            ApplyProvider = true,
            Provider = "Detected insurer",
            ApplyExpiryDate = false,
            ExpiryDate = "31 September sometime"
        });

        var response = await _client.SendAsync(applyRequest);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ApplyExtraction_WithSelectedMalformedDate_ReturnsValidationError()
    {
        var record = await CreateRecord("user-a", "Insurance");
        var uploadResponse = await CreateUploadUrl("user-a", record.Id, "policy.pdf", "application/pdf");

        using (var completeRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}/complete"))
        {
            completeRequest.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");
            (await _client.SendAsync(completeRequest)).EnsureSuccessStatusCode();
        }

        using var applyRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}/extraction/apply");
        applyRequest.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");
        applyRequest.Content = JsonContent.Create(new ApplyDocumentExtractionRequest
        {
            ApplyExpiryDate = true,
            ExpiryDate = "31 September sometime"
        });

        var response = await _client.SendAsync(applyRequest);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CompleteUpload_WhenExtractionFails_KeepsUploadAndRecordsFailure()
    {
        var record = await CreateRecord("user-a", "Insurance");
        var uploadResponse = await CreateUploadUrl("user-a", record.Id, "policy.pdf", "application/pdf");

        using (var scope = _factory.Services.CreateScope())
        {
            scope.ServiceProvider.GetRequiredService<FakeDocumentExtractionService>().ExceptionToThrow =
                new InvalidOperationException("Simulated extraction failure.");
        }

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/records/{record.Id}/documents/{uploadResponse.DocumentId}/complete");
        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var verificationScope = _factory.Services.CreateScope();
        var dbContext = verificationScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var document = await dbContext.RecordDocuments.FindAsync(uploadResponse.DocumentId);
        var extraction = await dbContext.DocumentExtractions.SingleAsync(
            item => item.DocumentId == uploadResponse.DocumentId);

        Assert.NotNull(document);
        Assert.True(document.IsUploaded);
        Assert.Equal(DocumentExtractionStatus.Failed, extraction.Status);
        Assert.Equal(nameof(InvalidOperationException), extraction.ErrorCode);
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
