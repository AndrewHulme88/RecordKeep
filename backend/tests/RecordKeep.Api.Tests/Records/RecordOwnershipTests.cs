using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using RecordKeep.Api.Contracts.Records;
using RecordKeep.Api.Tests.Authentication;
using RecordKeep.Infrastructure.Persistence;
using RecordEntity = RecordKeep.Domain.Records.Record;

namespace RecordKeep.Api.Tests.Records;

public sealed class RecordOwnershipTests : IClassFixture<RecordKeepApiFactory>
{
    private readonly HttpClient _client;

    public RecordOwnershipTests(RecordKeepApiFactory factory)
    {
        _client = factory.CreateClient();

        // Ensures every test starts with an empty database, while requests from the same test still
        // share that database. This prevents test data leaking between tests
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        dbContext.Database.EnsureDeleted();
        dbContext.Database.EnsureCreated();
    }

    [Fact]
    public async Task CreateRecord_WithAuthenticatedUser_ReturnsCreated()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/records");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");

        request.Content = JsonContent.Create(
            new CreateRecordRequest
            {
                Title = "Car Insurance",
                Provider = "Example Insurance",
                Amount = 950.50m
            });
        
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var record = await response.Content.ReadFromJsonAsync<RecordEntity>();

        Assert.NotNull(record);
        Assert.Equal("Car Insurance", record.Title);
        Assert.Equal("user-a", record.UserId);
    }

    [Fact]
    public async Task GetRecords_ReturnsOnlyRecordsOwnedByCurrentUser()
    {
        var userARecord = await CreateRecord("user-a", "User A Record");

        await CreateRecord("user-b", "User B Record");

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/records");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-a");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var records = await response.Content.ReadFromJsonAsync<List<RecordEntity>>();

        Assert.NotNull(records);
        Assert.Single(records);
        Assert.Equal(userARecord.Id, records[0].Id);
        Assert.Equal("user-a", records[0].UserId);
    }

    [Fact]
    public async Task GetRecordById_WhenOwnedByAnotherUser_ReturnsNotFound()
    {
        var record = await CreateRecord("user-a", "Private Record");

        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/records/{record.Id}");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "user-b");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
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