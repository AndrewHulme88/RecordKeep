using Microsoft.EntityFrameworkCore;
using RecordKeep.Infrastructure.Persistence;
using RecordKeep.Api.Endpoints;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Generate OpenAPI documentation and use Swagger during development
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString =
    builder.Configuration.GetConnectionString("Database")
    ?? throw new InvalidOperationException("Database connection string was not found.");

// Register the PostgreSQL Entity Framework Core database context
builder.Services.AddDbContext<ApplicationDbContext>(Options =>
    Options.UseNpgsql(connectionString));

// Allow the local Next.js frontend to call the API during development
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var cognitoRegion = 
    builder.Configuration["Cognito:Region"]
    ?? throw new InvalidOperationException("Cognito region is not configured.");

var cognitoUserPoolId = 
    builder.Configuration["Cognito:UserPoolId"]
    ?? throw new InvalidOperationException("Cognito user pool ID is not configured.");

var cognitoClientId =
    builder.Configuration["Cognito:ClientId"]
    ?? throw new InvalidOperationException("Cognito client ID is not configured.");

// Cognito publishes its signing keys and token metadata through this authority
var cognitoAuthority = $"https://cognito-idp.{cognitoRegion}.amazonaws.com/{cognitoUserPoolId}";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.Authority = cognitoAuthority;

    // Preserve Cognito's original claim names including "sub" and "client_id"
    options.MapInboundClaims = false;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = cognitoAuthority,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        // Cognito access tokens use "client_id" rather than the standard "aud" claim 
        // so the client is validated manually below
        ValidateAudience = false,
        NameClaimType = "username"
    };

    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = context =>
        {
            var tokenUse = context.Principal?.FindFirst("token_use")?.Value;
            var clientId = context.Principal?.FindFirst("client_id")?.Value;

            // Accept only access tokens issued for this RecordKeep app client
            if (tokenUse != "access" || clientId != cognitoClientId)
            {
                context.Fail("Invalid Cognito access token.");
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwagger();
    app.UseSwaggerUI();
}

// Middleware order matters: CORS must run before authentication
// and authentication must run before authorisation and protected endpoints
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

app.UseHttpsRedirection();
app.MapRecordEndpoints();

app.Run();

// Makes the generated Program type available to the test project
public partial class Program;