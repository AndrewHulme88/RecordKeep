using System.Security.Claims;
using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RecordKeep.Api.Contracts.Documents;
using RecordKeep.Api.Validation;
using RecordKeep.Application.Documents;
using RecordKeep.Domain.Documents;
using RecordKeep.Infrastructure.Persistence;
using Swashbuckle.AspNetCore.Swagger;

namespace RecordKeep.Api.Endpoints;

public static class DocumentEndpoints
{
    public static void MapDocumentEndpoints(
        this WebApplication app)
    {
        var group = app.MapGroup("/api/records").RequireAuthorization();

        group.MapPost("/{recordId:guid}/documents/upload-url", CreateUploadUrl);

        group.MapGet("/{recordId:guid}/documents", GetDocuments);

        group.MapGet("/{recordId:guid}/documents/{documentId:guid}/extraction", GetLatestExtraction);

        group.MapPost("/{recordId:guid}/documents/{documentId:guid}/extraction/apply", ApplyLatestExtraction);

        group.MapGet("/{recordId:guid}/documents/{documentId:guid}/download-url", CreateDownloadUrl);

        group.MapDelete("/{recordId:guid}/documents/{documentId:guid}", DeleteDocument);

        group.MapPost("/{recordId:guid}/documents/{documentId:guid}/complete", CompleteUpload);
    }

    private static async Task<IResult> CreateUploadUrl(
        Guid recordId,
        CreateDocumentUploadUrlRequest request,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        IDocumentStorageService documentStorageService)
    {
        var userId = GetUserId(user);

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var validationErrors =
            DocumentRequestValidator.ValidateUploadUrlRequest(request);

        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        var recordExists = await dbContext.Records.AnyAsync(
            record =>
                record.Id == recordId &&
                record.UserId == userId);

        if (!recordExists)
        {
            return Results.NotFound();
        }

        var documentId = Guid.NewGuid();

        var objectKey = CreateObjectKey(
            userId,
            recordId,
            documentId,
            request.FileName);

        var expiresIn = TimeSpan.FromMinutes(5);
        var expiresAtUtc = DateTime.UtcNow.Add(expiresIn);

        var uploadUrl =
            documentStorageService.CreateUploadUrl(
                objectKey,
                request.ContentType,
                expiresIn);

        var document = new RecordDocument
        {
            Id = documentId,
            RecordId = recordId,
            UserId = userId,
            OriginalFileName = request.FileName,
            ObjectKey = objectKey,
            ContentType = request.ContentType,
            SizeBytes = request.SizeBytes,
            IsUploaded = false,
            CreatedAtUtc = DateTime.UtcNow
        };

        dbContext.RecordDocuments.Add(document);

        await dbContext.SaveChangesAsync();

        return Results.Ok(
            new CreateDocumentUploadUrlResponse
            {
                DocumentId = documentId,
                UploadUrl = uploadUrl,
                ObjectKey = objectKey,
                ExpiresAtUtc = expiresAtUtc
            });
    }

    private static async Task<IResult> GetDocuments(
        Guid recordId,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext)
    {
        var userId = GetUserId(user);

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var recordExists = await dbContext.Records.AnyAsync(
            record => record.Id == recordId && record.UserId == userId);

        if (!recordExists)
        {
            return Results.NotFound();
        }

        var documents = await dbContext.RecordDocuments
            .Include(document => document.Extractions)
            .Where(document =>
            document.RecordId == recordId && document.UserId == userId && document.IsUploaded)
            .OrderByDescending(document => document.CreatedAtUtc)
            .ToListAsync();

        var response = documents.Select(document =>
        {
            var latestExtraction = document.Extractions.MaxBy(extraction => extraction.CreatedAtUtc);

            return new DocumentResponse
            {
                Id = document.Id,
                RecordId = document.RecordId,
                OriginalFileName = document.OriginalFileName,
                ContentType = document.ContentType,
                SizeBytes = document.SizeBytes,
                CreatedAtUtc = document.CreatedAtUtc,
                ExtractionStatus = latestExtraction?.Status.ToString()
            };
        });
        
        return Results.Ok(response);
    }

    private static async Task<IResult> GetLatestExtraction(
        Guid recordId,
        Guid documentId,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext)
    {
        var userId = GetUserId(user);

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var extraction = await dbContext.DocumentExtractions
            .Where(item =>
                item.DocumentId == documentId &&
                item.Document.RecordId == recordId &&
                item.UserId == userId)
            .OrderByDescending(item => item.CreatedAtUtc)
            .FirstOrDefaultAsync();

        if (extraction is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(new DocumentExtractionResponse
        {
            Id = extraction.Id,
            DocumentId = extraction.DocumentId,
            Status = extraction.Status.ToString(),
            Provider = extraction.Provider,
            ModelName = extraction.ModelName,
            ExtractedFields = ParseJson(extraction.ExtractedFieldsJson),
            Evidence = ParseJson(extraction.EvidenceJson),
            ErrorCode = extraction.ErrorCode,
            CreatedAtUtc = extraction.CreatedAtUtc,
            CompletedAtUtc = extraction.CompletedAtUtc
        });
    }

    private static JsonElement? ParseJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(json);
            return document.RootElement.Clone();
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static async Task<IResult> ApplyLatestExtraction(
        Guid recordId,
        Guid documentId,
        ApplyDocumentExtractionRequest request,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext)
    {
        var userId = GetUserId(user);

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        if (!HasSelectedField(request))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["fields"] = ["Select at least one detected field to apply."]
            });
        }

        var extraction = await dbContext.DocumentExtractions
            .Include(item => item.Document)
            .ThenInclude(document => document.Record)
            .Where(item =>
                item.DocumentId == documentId &&
                item.Document.RecordId == recordId &&
                item.UserId == userId)
            .OrderByDescending(item => item.CreatedAtUtc)
            .FirstOrDefaultAsync();

        if (extraction is null)
        {
            return Results.NotFound();
        }

        if (extraction.Status != DocumentExtractionStatus.NeedsReview)
        {
            return Results.Conflict(new { error = "This extraction is not awaiting review." });
        }

        var record = extraction.Document.Record;
        var title = request.ApplyTitle ? request.Title?.Trim() ?? string.Empty : record.Title;
        var provider = request.ApplyProvider ? NullIfWhiteSpace(request.Provider) : record.Provider;
        var referenceNumber = request.ApplyReferenceNumber
            ? NullIfWhiteSpace(request.ReferenceNumber)
            : record.ReferenceNumber;
        var dateErrors = new Dictionary<string, string[]>();
        var startDate = request.ApplyStartDate
            ? ParseDate(request.StartDate, "startDate", dateErrors)
            : record.StartDate;
        var expiryDate = request.ApplyExpiryDate
            ? ParseDate(request.ExpiryDate, "expiryDate", dateErrors)
            : record.ExpiryDate;
        var amount = request.ApplyAmount ? request.Amount : record.Amount;

        if (dateErrors.Count > 0)
        {
            return Results.ValidationProblem(dateErrors);
        }

        var validationErrors = RecordRequestValidator.ValidateFields(
            title,
            provider,
            referenceNumber,
            startDate,
            expiryDate,
            amount);

        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        record.Title = title;
        record.Provider = provider;
        record.ReferenceNumber = referenceNumber;
        record.StartDate = startDate;
        record.ExpiryDate = expiryDate;
        record.Amount = amount;
        record.UpdatedAtUtc = DateTime.UtcNow;
        extraction.Status = DocumentExtractionStatus.Completed;

        await dbContext.SaveChangesAsync();

        return Results.Ok(new
        {
            record.Id,
            record.Title,
            record.Category,
            record.Provider,
            record.Description,
            record.ReferenceNumber,
            record.StartDate,
            record.ExpiryDate,
            record.Amount,
            record.CreatedAtUtc,
            record.UpdatedAtUtc
        });
    }

    private static bool HasSelectedField(ApplyDocumentExtractionRequest request) =>
        request.ApplyTitle ||
        request.ApplyProvider ||
        request.ApplyReferenceNumber ||
        request.ApplyStartDate ||
        request.ApplyExpiryDate ||
        request.ApplyAmount;

    private static string? NullIfWhiteSpace(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static DateOnly? ParseDate(
        string? value,
        string fieldName,
        Dictionary<string, string[]> errors)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (DateOnly.TryParseExact(
            value,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out var date))
        {
            return date;
        }

        errors[fieldName] = ["Enter a valid date."];
        return null;
    }

    private static async Task<IResult> CreateDownloadUrl(
        Guid recordId,
        Guid documentId,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        IDocumentStorageService documentStorageService)
    {
        var userId = GetUserId(user);

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var document = await dbContext.RecordDocuments.Where(document =>
            document.Id == documentId && document.RecordId == recordId &&
            document.UserId == userId && document.IsUploaded).SingleOrDefaultAsync();

        if (document is null)
        {
            return Results.NotFound();
        }

        var expiresIn = TimeSpan.FromMinutes(5);
        var expiresAtUtc = DateTime.UtcNow.Add(expiresIn);
        var downloadUrl = documentStorageService.CreateDownloadUrl(document.ObjectKey, expiresIn);

        return Results.Ok(new CreateDocumentDownloadUrlResponse
        {
            DocumentId = documentId,
            DownloadUrl = downloadUrl,
            ExpiresAtUtc = expiresAtUtc
        });
    }

    private static async Task<IResult> DeleteDocument(
        Guid recordId,
        Guid documentId,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        IDocumentStorageService documentStorageService)
    {
        var userId = GetUserId(user);

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var document = await dbContext.RecordDocuments.Where(document =>
            document.Id == documentId &&
            document.RecordId == recordId &&
            document.UserId == userId).SingleOrDefaultAsync();

        if (document is null)
        {
            return Results.NotFound();
        }

        await documentStorageService.DeleteAsync(document.ObjectKey);

        dbContext.RecordDocuments.Remove(document);

        await dbContext.SaveChangesAsync();

        return Results.NoContent();
    }

    private static string? GetUserId(
        ClaimsPrincipal user)
    {
        return user.FindFirst("sub")?.Value ??
               user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }

    private static string CreateObjectKey(
        string userId,
        Guid recordId,
        Guid documentId,
        string fileName)
    {
        var extension = Path.GetExtension(fileName)
            .ToLowerInvariant();

        return
            $"users/{userId}/records/{recordId}/documents/{documentId}{extension}";
    }

    private static async Task<IResult> CompleteUpload(
        Guid recordId,
        Guid documentId,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        IDocumentExtractionService extractionService,
        ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId(user);

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var document = await dbContext.RecordDocuments.Where(document =>
            document.Id == documentId && document.RecordId == recordId && document.UserId == userId).SingleOrDefaultAsync();

        if (document is null)
        {
            return Results.NotFound();
        }

        if (document.IsUploaded)
        {
            return Results.NoContent();
        }

        var now = DateTime.UtcNow;
        var extraction = new DocumentExtraction
        {
            Id = Guid.NewGuid(),
            DocumentId = document.Id,
            UserId = userId,
            Status = DocumentExtractionStatus.Processing,
            CreatedAtUtc = now,
            StartedAtUtc = now
        };

        document.IsUploaded = true;
        dbContext.DocumentExtractions.Add(extraction);

        await dbContext.SaveChangesAsync(cancellationToken);

        try
        {
            var result = await extractionService.ExtractAsync(
                new DocumentExtractionRequest(document.Id, document.ObjectKey, document.ContentType),
                cancellationToken);

            extraction.Provider = result.Provider;
            extraction.ModelName = result.ModelName;
            extraction.SchemaVersion = result.SchemaVersion;
            extraction.ExtractedFieldsJson = result.ExtractedFieldsJson;
            extraction.EvidenceJson = result.EvidenceJson;
            extraction.RawResultJson = result.RawResultJson;
            extraction.Status = DocumentExtractionStatus.NeedsReview;
            extraction.CompletedAtUtc = DateTime.UtcNow;
        }
        catch (Exception exception)
        {
            extraction.Status = DocumentExtractionStatus.Failed;
            extraction.ErrorCode = exception.GetType().Name;
            extraction.CompletedAtUtc = DateTime.UtcNow;

            loggerFactory.CreateLogger(nameof(DocumentEndpoints)).LogError(
                exception,
                "Document extraction failed for document {DocumentId} and user {UserId}",
                document.Id,
                userId);
        }

        await dbContext.SaveChangesAsync(CancellationToken.None);

        return Results.NoContent();
    }
}
