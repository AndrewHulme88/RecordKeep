using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RecordKeep.Infrastructure.Persistence;
using RecordKeep.Api.Contracts.Records;
using RecordKeep.Domain.Records;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString =
    builder.Configuration.GetConnectionString("Database")
    ?? throw new InvalidCastException("Database connection string was not found.");

builder.Services.AddDbContext<ApplicationDbContext>(Options =>
    Options.UseNpgsql(connectionString));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapPost("/api/records", async (
    CreateRecordRequest request,
    ApplicationDbContext dbContext) =>
{
    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return Results.BadRequest(new { error = "Title is required." });
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
})
.WithName("CreateRecord");

app.MapGet("/api/records", async (
    ApplicationDbContext dbContext) =>
{
    var records = await dbContext.Records
        .AsNoTracking()
        .OrderBy(record => record.ExpiryDate)
        .ThenBy(record => record.Title)
        .ToListAsync();
    
    return Results.Ok(records);
})
.WithName("GetRecords");

app.MapGet("/api/records/{id:guid}", async (
    Guid id,
    ApplicationDbContext dbContext) =>
{
    var record = await dbContext.Records
        .AsNoTracking()
        .FirstOrDefaultAsync(record => record.Id == id);
    
    return record is null
        ? Results.NotFound(new { error = "Record not found." })
        : Results.Ok(record);
})
.WithName("GetRecordById");

app.Run();