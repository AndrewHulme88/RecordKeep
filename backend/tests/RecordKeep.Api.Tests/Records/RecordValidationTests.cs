using System.Net;
using System.Net.Http.Json;
using RecordKeep.Api.Tests.Authentication;

namespace RecordKeep.Api.Tests.Records;

public sealed class RecordValidationTests : IClassFixture<RecordKeepApiFactory>
{
    private readonly HttpClient _client;

    public RecordValidationTests(RecordKeepApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateRecord_WithTitleOverMaximumLimit_ReturnsBadRequest()
    {
        var response = await SendCreateRequest(new
        {
            title = new string('a', 201)
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateRecord_WithProviderOverMaximumLength_ReturnsBadRequest()
    {
        var response = await SendCreateRequest(new
        {
            title = "Insurance",
            provider = new string('a', 201)
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateRecord_WithReferenceNumberOverMaximumLength_ReturnsBadRequest()
    {
        var response = await SendCreateRequest(new
        {
            title = "Insurance",
            referenceNumber = new string('a', 101)
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateRecord_WithNegativeAmount_ReturnsBadRequest()
    {
        var response = await SendCreateRequest(new
        {
            title = "Insurance",
            amount = -1
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateRecord_WithExpiryBeforeStartDate_ReturnsBadRequest()
    {
        var response = await SendCreateRequest(new
        {
            title = "Insurance",
            startDate = "2026-06-30",
            expiryDate = "2026-06-29"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task<HttpResponseMessage> SendCreateRequest(object body)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/records");

        request.Headers.Add(TestAuthHandler.UserIdHeader, "validation-user");

        request.Content = JsonContent.Create(body);

        return await _client.SendAsync(request);
    }
}