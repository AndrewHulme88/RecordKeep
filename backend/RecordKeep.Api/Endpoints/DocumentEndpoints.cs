using System.Security.Claims;
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

        var documents = await dbContext.RecordDocuments.Where(document =>
            document.RecordId == recordId && document.UserId == userId)
                .OrderByDescending(document => document.CreatedAtUtc)
                .Select(document => new DocumentResponse
                {
                    Id = document.Id,
                    RecordId = document.RecordId,
                    OriginalFileName = document.OriginalFileName,
                    ContentType = document.ContentType,
                    SizeBytes = document.SizeBytes,
                    CreatedAtUtc = document.CreatedAtUtc
                }).ToListAsync();
        
        return Results.Ok(documents);
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
}