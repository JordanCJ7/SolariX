// ============================================================================
// File: SolarStationInfo.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Solar station hub entity mapped to the MongoDB 'SolarStationInfo' collection.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SolariX.Api.Models
{
    /// <summary>
    /// Represents a physical solar microgrid hub/station that hosts battery storage slots and handles energy trades.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class SolarStationInfo
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("stationCode")]
        public string StationCode { get; set; } = string.Empty;

        [BsonElement("stationName")]
        public string StationName { get; set; } = string.Empty;

        [BsonElement("locationName")]
        public string LocationName { get; set; } = string.Empty;

        [BsonElement("latitude")]
        public double Latitude { get; set; }

        [BsonElement("longitude")]
        public double Longitude { get; set; }

        /// <summary>
        /// Total station capacity specs in kW/h.
        /// </summary>
        [BsonElement("capacityKWh")]
        public double CapacityKWh { get; set; }

        /// <summary>
        /// Total physical battery storage slots present at this hub.
        /// </summary>
        [BsonElement("totalBatterySlots")]
        public int TotalBatterySlots { get; set; }

        /// <summary>
        /// Currently available battery storage slots ready for booking.
        /// </summary>
        [BsonElement("availableBatterySlots")]
        public int AvailableBatterySlots { get; set; }

        /// <summary>
        /// Operational status of the solar grid hub.
        /// </summary>
        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;

        [BsonElement("operationalHours")]
        public string OperationalHours { get; set; } = "06:00 - 20:00";

        [BsonElement("contactNumber")]
        public string ContactNumber { get; set; } = string.Empty;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
