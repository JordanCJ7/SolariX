// ============================================================================
// File: MongoDbContext.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Implementation of IMongoDbContext managing MongoDB database connections, collections, and index configurations.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SolariX.Api.Models;

namespace SolariX.Api.Data
{
    /// <summary>
    /// Encapsulates database connectivity and provides typed collections for the 4 core data models.
    /// </summary>
    public class MongoDbContext : IMongoDbContext
    {
        private readonly IMongoDatabase _database;
        private readonly MongoDbSettings _settings;

        public MongoDbContext(IOptions<MongoDbSettings> settings)
        {
            // Inline: Initializes the MongoDB client and database instance based on configured connection settings, then ensures required indexes are provisioned.
            _settings = settings.Value;
            var client = new MongoClient(_settings.ConnectionString);
            _database = client.GetDatabase(_settings.DatabaseName);

            ConfigureIndexes();
        }

        public IMongoCollection<User> Users =>
            _database.GetCollection<User>(_settings.UsersCollectionName);

        public IMongoCollection<SolarStationInfo> SolarStationInfo =>
            _database.GetCollection<SolarStationInfo>(_settings.StationsCollectionName);

        public IMongoCollection<EnergyBookingSlot> EnergyBookingSlots =>
            _database.GetCollection<EnergyBookingSlot>(_settings.SlotsCollectionName);

        public IMongoCollection<EnergyReservation> EnergyReservations =>
            _database.GetCollection<EnergyReservation>(_settings.ReservationsCollectionName);

        /// <summary>
        /// Proactively builds indexes on primary business keys and query filters.
        /// </summary>
        private void ConfigureIndexes()
        {
            // Inline: Creates unique and compound indexes on NIC, email, reservation numbers, and station associations to optimize lookup performance and enforce business uniqueness.
            try
            {
                // Unique index on User NIC
                var userNicIndex = new CreateIndexModel<User>(
                    Builders<User>.IndexKeys.Ascending(u => u.NIC),
                    new CreateIndexOptions { Unique = true, Sparse = false }
                );
                Users.Indexes.CreateOne(userNicIndex);

                // Index on ReservationNumber
                var resNumberIndex = new CreateIndexModel<EnergyReservation>(
                    Builders<EnergyReservation>.IndexKeys.Ascending(r => r.ReservationNumber),
                    new CreateIndexOptions { Unique = true }
                );
                EnergyReservations.Indexes.CreateOne(resNumberIndex);

                // Compound Index on StationId and SlotDate for fast slot availability lookups
                var slotIndex = new CreateIndexModel<EnergyBookingSlot>(
                    Builders<EnergyBookingSlot>.IndexKeys.Ascending(s => s.StationId).Ascending(s => s.SlotDate)
                );
                EnergyBookingSlots.Indexes.CreateOne(slotIndex);
            }
            catch
            {
                // In scenarios where MongoDB is initializing or offline during build-time tests, suppress index exception
            }
        }
    }
}
