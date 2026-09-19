// ============================================================================
// File: Program.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Application entry point configuring dependency injection, MongoDB services, CORS, Swagger UI, and IIS hosting.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using System.Text.Json.Serialization;
using Microsoft.OpenApi.Models;
using SolariX.Api.Data;
using SolariX.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure strongly-typed MongoDB settings
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection(MongoDbSettings.SectionName));

// Register MongoDB context and domain services
builder.Services.AddSingleton<IMongoDbContext, MongoDbContext>();
builder.Services.AddSingleton<IQRService, QRService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IStationService, StationService>();
builder.Services.AddScoped<IBookingService, BookingService>();

// Configure controllers with JSON StringEnumConverter
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// Configure CORS for web portal and mobile client access
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure Swagger / OpenAPI documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SolariX Smart Solar Microgrid Web API (The FAT Service)",
        Version = "v1",
        Description = "Centralized FAT service API for Backoffice, Grid Operators, and Prosumers managing solar trading, 7-day future booking windows, and 12-hour cancellation thresholds.",
        Contact = new OpenApiContact
        {
            Name = "SolariX Engineering Team",
            Email = "support@solarix.com"
        }
    });
});

var app = builder.Build();

// Enable Swagger UI across all environments for verification and testing
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "SolariX FAT Service API v1");
    c.RoutePrefix = string.Empty; // Serves Swagger UI at root URL (e.g. http://localhost:5000/)
});

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Execute automated initial seed for users, stations, and slots
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
    await DbSeeder.SeedAsync(context);
}

app.Run();
