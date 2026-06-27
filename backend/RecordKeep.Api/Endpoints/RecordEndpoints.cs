using Microsoft.EntityFrameworkCore;
using RecordKeep.Api.Contracts.Records;
using RecordKeep.Domain.Records;
using RecordKeep.Infrastructure.Persistence;
using System.Security.Claims;

namespace RecordKeep.Api.Endpoints;

public static class RecordEndpoints
{
    private static string? GetUserId(ClaimsPrincipal user)
    {
        return user.FindFirst("sub")?.Value;
    }

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
        ClaimsPrincipal user,
        ApplicationDbContext dbContext)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return Results.BadRequest(new
            {
                error = "Title is required."
            });
        }

        var userId = GetUserId(user);

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var record = new Record
        {
            Id = Guid.NewGuid(),
            UserId = userId,
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
        ClaimsPrincipal user,
        ApplicationDbContext dbContext)
    {
        var userId = GetUserId(user);

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var records = await dbContext.Records
            .AsNoTracking()
            .Where(record => record.UserId == userId)
            .OrderBy(record => record.ExpiryDate)
            .ThenBy(record => record.Title)
            .ToListAsync();

        return Results.Ok(records);
    }

    private static async Task<IResult> GetRecordById(
        Guid id,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext)
    {
        var userId = GetUserId(user);

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var record = await dbContext.Records
            .AsNoTracking()
            .FirstOrDefaultAsync(record => record.Id == id && record.UserId == userId);

        return record is null
            ? Results.NotFound(new { error = "Record not found." })
            : Results.Ok(record);
    }

    private static async Task<IResult> UpdateRecord(
        Guid id,
        UpdateRecordRequest request,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return Results.BadRequest(new
            {
                error = "Title is required."
            });
        }

        var userId = GetUserId(user);

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var record = await dbContext.Records
            .FirstOrDefaultAsync(record => record.Id == id && record.UserId == userId);

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
        ClaimsPrincipal user,
        ApplicationDbContext dbContext)
    {
        var userId = GetUserId(user);

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var record = await dbContext.Records
            .FirstOrDefaultAsync(record => record.Id == id && record.UserId == userId);

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