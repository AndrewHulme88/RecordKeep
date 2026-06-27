using Microsoft.EntityFrameworkCore;
using RecordKeep.Api.Contracts.Records;
using RecordKeep.Domain.Records;
using RecordKeep.Infrastructure.Persistence;

namespace RecordKeep.Api.Endpoints;

public static class RecordEndpoints
{
    public static IEndpointRouteBuilder MapRecordEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/records")
            .WithTags("Records")
            .RequireAuthorization();

        group.MapPost("/", CreateRecord);
        group.MapGet("/", GetRecords);
        group.MapGet("/{id:guid}", GetRecordById);
        group.MapPut("/{id:guid}", UpdateRecord);
        group.MapDelete("/{id:guid}", DeleteRecord);

        return app;
    }

    private static async Task<IResult> CreateRecord(
        CreateRecordRequest request,
        ApplicationDbContext dbContext)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return Results.BadRequest(new
            {
                error = "Title is required."
            });
        }

        var record = new Record
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Provider = request.Provider?.Trim(),
            Description = request.Description?.Trim(),
            ReferenceNumber = request.ReferenceNumber?.Trim(),
            StartDate = request.StartDate,
            ExpiryDate = request.ExpiryDate,
            Amount = request.Amount,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        dbContext.Records.Add(record);
        await dbContext.SaveChangesAsync();

        return Results.Created($"/api/records/{record.Id}", record);
    }

    private static async Task<IResult> GetRecords(
        ApplicationDbContext dbContext)
    {
        var records = await dbContext.Records
            .AsNoTracking()
            .OrderBy(record => record.ExpiryDate)
            .ThenBy(record => record.Title)
            .ToListAsync();

        return Results.Ok(records);
    }

    private static async Task<IResult> GetRecordById(
        Guid id,
        ApplicationDbContext dbContext)
    {
        var record = await dbContext.Records
            .AsNoTracking()
            .FirstOrDefaultAsync(record => record.Id == id);

        return record is null
            ? Results.NotFound(new { error = "Record not found." })
            : Results.Ok(record);
    }

    private static async Task<IResult> UpdateRecord(
        Guid id,
        UpdateRecordRequest request,
        ApplicationDbContext dbContext)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return Results.BadRequest(new
            {
                error = "Title is required."
            });
        }

        var record = await dbContext.Records
            .FirstOrDefaultAsync(record => record.Id == id);

        if (record is null)
        {
            return Results.NotFound(new
            {
                error = "Record not found."
            });
        }

        record.Title = request.Title.Trim();
        record.Provider = request.Provider?.Trim();
        record.Description = request.Description?.Trim();
        record.ReferenceNumber = request.ReferenceNumber?.Trim();
        record.StartDate = request.StartDate;
        record.ExpiryDate = request.ExpiryDate;
        record.Amount = request.Amount;
        record.UpdatedAtUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return Results.Ok(record);
    }

    private static async Task<IResult> DeleteRecord(
        Guid id,
        ApplicationDbContext dbContext)
    {
        var record = await dbContext.Records
            .FirstOrDefaultAsync(record => record.Id == id);

        if (record is null)
        {
            return Results.NotFound(new
            {
                error = "Record not found."
            });
        }

        dbContext.Records.Remove(record);
        await dbContext.SaveChangesAsync();

        return Results.NoContent();
    }
}