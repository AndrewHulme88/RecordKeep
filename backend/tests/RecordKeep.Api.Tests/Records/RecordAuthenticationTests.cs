using System.Net;

namespace RecordKeep.Api.Tests.Records;

public sealed class RecordAuthenticationTests : IClassFixture<RecordKeepApiFactory>
{
    private readonly HttpClient _client;

    public RecordAuthenticationTests(RecordKeepApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetRecords_WithoutAuthenticatedUser_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/records");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}