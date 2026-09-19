// ============================================================================
// File: MongoDbSettings.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Strongly-typed configuration options for MongoDB connection and collection names.
// Module: SE4040 Enterprise Application Development
// ============================================================================

namespace SolariX.Api.Data
{
    /// <summary>
    /// Configuration options mapped from appsettings.json for MongoDB connectivity.
    /// </summary>
    public class MongoDbSettings
    {
        public const string SectionName = "MongoDbSettings";

        public string ConnectionString { get; set; } = "mongodb://localhost:27017";
        public string DatabaseName { get; set; } = "SolarixDb";

        public string UsersCollectionName { get; set; } = "Users";
        public string StationsCollectionName { get; set; } = "SolarStationInfo";
        public string SlotsCollectionName { get; set; } = "EnergyBookingSlots";
        public string ReservationsCollectionName { get; set; } = "EnergyReservation";
    }
}
