// ============================================================================
// File: DbSeeder.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Automated database seeder to initialize default administrative roles, sample stations, and schedulable slots for testing.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using MongoDB.Driver;
using SolariX.Api.Models;

namespace SolariX.Api.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(IMongoDbContext context)
        {
            // Inline: Seeds initial platform users (Backoffice, Grid Operator, and Prosumer), solar station hubs, and booking slots if database collections are empty.
            try
            {
                // 1. Seed Users if empty
                var usersCount = await context.Users.CountDocumentsAsync(_ => true);
                if (usersCount == 0)
                {
                    var sampleUsers = new List<User>
                    {
                        new User
                        {
                            NIC = "BO1000000001",
                            FullName = "Chief Backoffice Admin",
                            Email = "admin@solarix.com",
                            PhoneNumber = "+94771112233",
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123456"),
                            Role = UserRole.Backoffice,
                            Status = AccountStatus.Active,
                            Address = "SolariX HQ, Colombo 03, Sri Lanka",
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        },
                        new User
                        {
                            NIC = "GO2000000002",
                            FullName = "Site Grid Operator",
                            Email = "operator@solarix.com",
                            PhoneNumber = "+94772223344",
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Operator@123456"),
                            Role = UserRole.GridOperator,
                            Status = AccountStatus.Active,
                            Address = "Microgrid Station 1, Malabe, Sri Lanka",
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        },
                        new User
                        {
                            NIC = "200012345678",
                            FullName = "Kamal Perera (Prosumer)",
                            Email = "prosumer@solarix.com",
                            PhoneNumber = "+94773334455",
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Prosumer@123456"),
                            Role = UserRole.Prosumer,
                            Status = AccountStatus.Active,
                            Address = "45/2 Green Valley, Kaduwela, Sri Lanka",
                            SolarCapacityKW = 12.5,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        }
                    };

                    await context.Users.InsertManyAsync(sampleUsers);
                }

                // 2. Seed Solar Stations if empty
                var stationsCount = await context.SolarStationInfo.CountDocumentsAsync(_ => true);
                if (stationsCount == 0)
                {
                    var sampleStation = new SolarStationInfo
                    {
                        StationCode = "HUB-CMB-01",
                        StationName = "Malabe Smart Solar Microgrid Hub",
                        LocationName = "SLIIT Technology Park, Malabe",
                        Latitude = 6.9147,
                        Longitude = 79.9729,
                        CapacityKWh = 250.0,
                        TotalBatterySlots = 20,
                        AvailableBatterySlots = 20,
                        IsActive = true,
                        OperationalHours = "06:00 - 20:00",
                        ContactNumber = "+94112407777",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await context.SolarStationInfo.InsertOneAsync(sampleStation);

                    // 3. Seed Slots for the next 3 days
                    var now = DateTime.UtcNow;
                    var slots = new List<EnergyBookingSlot>();

                    for (int dayOffset = 1; dayOffset <= 3; dayOffset++)
                    {
                        var targetDay = DateTime.SpecifyKind(now.Date.AddDays(dayOffset), DateTimeKind.Utc);
                        for (int hour = 8; hour < 18; hour += 2)
                        {
                            var slotStart = targetDay.AddHours(hour);
                            var slotEnd = slotStart.AddHours(2);

                            slots.Add(new EnergyBookingSlot
                            {
                                StationId = sampleStation.Id!,
                                SlotDate = targetDay,
                                StartTime = slotStart,
                                EndTime = slotEnd,
                                MaxCapacityKW = 30.0,
                                AvailableCapacityKW = 30.0,
                                Status = SlotStatus.Available,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            });
                        }
                    }

                    if (slots.Count > 0)
                    {
                        await context.EnergyBookingSlots.InsertManyAsync(slots);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DbSeeder] Notice: {ex.Message}");
            }
        }
    }
}
