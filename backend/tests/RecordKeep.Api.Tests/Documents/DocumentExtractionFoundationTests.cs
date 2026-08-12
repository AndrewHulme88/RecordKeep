using Microsoft.EntityFrameworkCore;
using RecordKeep.Application.Documents;
using RecordKeep.Domain.Documents;
using RecordKeep.Infrastructure.Persistence;

namespace RecordKeep.Api.Tests.Documents;

public sealed class DocumentExtractionFoundationTests
{
    [Fact]
    public async Task ExtractionService_ReturnsConfiguredStructuredResult()
    {
        var documentId = Guid.NewGuid();
        var service = new FakeDocumentExtractionService
        {
            Result = new DocumentExtractionResult(
                Provider: "FakeTextract",
                ModelName: "forms-v1",
                SchemaVersion: "1",
                ExtractedFieldsJson: "{\"provider\":\"Example Insurance\"}",
                EvidenceJson: "{\"provider\":{\"page\":1}}")
        };

        var request = new DocumentExtractionRequest(
            documentId,
            "users/user-1/documents/example.pdf",
            "application/pdf");

        var result = await service.ExtractAsync(request);

        Assert.Equal(request, service.LastRequest);
        Assert.Equal("FakeTextract", result.Provider);
        Assert.Contains("Example Insurance", result.ExtractedFieldsJson);
    }

    [Fact]
    public async Task ExtractionAttempt_IsPersistedAgainstItsDocument()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"DocumentExtraction-{Guid.NewGuid()}")
            .Options;

        var recordId = Guid.NewGuid();
        var documentId = Guid.NewGuid();
        var extractionId = Guid.NewGuid();

        await using (var arrangeContext = new ApplicationDbContext(options))
        {
            arrangeContext.Records.Add(new RecordKeep.Domain.Records.Record
            {
                Id = recordId,
                UserId = "user-1",
                Title = "Insurance policy",
                Category = "Insurance",
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow
            });

            arrangeContext.RecordDocuments.Add(new RecordDocument
            {
                Id = documentId,
                RecordId = recordId,
                UserId = "user-1",
                OriginalFileName = "policy.pdf",
                ObjectKey = "users/user-1/policy.pdf",
                ContentType = "application/pdf",
                SizeBytes = 1024,
                IsUploaded = true,
                CreatedAtUtc = DateTime.UtcNow
            });

            arrangeContext.DocumentExtractions.Add(new DocumentExtraction
            {
                Id = extractionId,
                DocumentId = documentId,
                UserId = "user-1",
                Status = DocumentExtractionStatus.NeedsReview,
                Provider = "FakeTextract",
                SchemaVersion = "1",
                ExtractedFieldsJson = "{\"expiryDate\":\"2027-08-12\"}",
                EvidenceJson = "{\"expiryDate\":{\"page\":2}}",
                CreatedAtUtc = DateTime.UtcNow,
                StartedAtUtc = DateTime.UtcNow,
                CompletedAtUtc = DateTime.UtcNow
            });

            await arrangeContext.SaveChangesAsync();
        }

        await using var assertContext = new ApplicationDbContext(options);
        var extraction = await assertContext.DocumentExtractions
            .Include(item => item.Document)
            .SingleAsync(item => item.Id == extractionId);

        Assert.Equal(DocumentExtractionStatus.NeedsReview, extraction.Status);
        Assert.Equal(documentId, extraction.Document.Id);
        Assert.Contains("2027-08-12", extraction.ExtractedFieldsJson);
    }
}
