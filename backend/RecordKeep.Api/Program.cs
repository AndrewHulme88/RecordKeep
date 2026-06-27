using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RecordKeep.Infrastructure.Persistence;
using RecordKeep.Api.Endpoints;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString =
    builder.Configuration.GetConnectionString("Database")
    ?? throw new InvalidCastException("Database connection string was not found.");

builder.Services.AddDbContext<ApplicationDbContext>(Options =>
    Options.UseNpgsql(connectionString));

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

var cognitoAuthority = $"https://cognito-idp.{cognitoRegion}.amazonaws.com/{cognitoUserPoolId}";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.Authority = cognitoAuthority;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = cognitoAuthority,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidateAudience = false,
        NameClaimType = "username"
    };

    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = context =>
        {
            var tokenUse = context.Principal?.FindFirst("token_use")?.Value;
            var clientId = context.Principal?.FindFirst("client_id")?.Value;

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

app.UseCors("Frontend");

// The order here matters! Authentication - Authorization - Endpoints
app.UseAuthentication();
app.UseAuthorization();

app.UseHttpsRedirection();
app.MapRecordEndpoints();

app.Run();