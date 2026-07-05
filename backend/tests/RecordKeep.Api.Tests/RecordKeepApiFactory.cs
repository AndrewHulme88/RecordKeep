using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecordKeep.Api.Tests.Authentication;
using RecordKeep.Infrastructure.Persistence;
using RecordKeep.Application.Documents;
using RecordKeep.Api.Tests.Documents;

namespace RecordKeep.Api.Tests;

public sealed class RecordKeepApiFactory : WebApplicationFactory<Program>
{
    // Create one single database for use with tests to avoid a new database being created for each action
    private readonly string _databaseName = $"RecordKeepTests-{Guid.NewGuid()}";
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
            });

            services.AddSingleton<FakeDocumentStorageService>();

            services.AddSingleton<IDocumentStorageService>(serviceProvider =>
                serviceProvider.GetRequiredService<FakeDocumentStorageService>());

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthHandler.AuthenticationScheme;

                options.DefaultChallengeScheme = TestAuthHandler.AuthenticationScheme;
            })
            .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                TestAuthHandler.AuthenticationScheme, _ => {});
        });
    }
}