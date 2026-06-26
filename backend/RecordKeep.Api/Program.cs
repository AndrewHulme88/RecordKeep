using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RecordKeep.Infrastructure.Persistence;
using RecordKeep.Api.Endpoints;

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

app.MapRecordEndpoints();

app.Run();