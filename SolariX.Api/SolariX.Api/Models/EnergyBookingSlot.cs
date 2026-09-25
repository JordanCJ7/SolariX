// ============================================================================
// File: EnergyBookingSlot.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Battery storage slot entity mapped to the MongoDB 'EnergyBookingSlots' collection.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SolariX.Api.Models
{
    /// <summary>
    /// Represents a discrete schedulable time slot for energy charging or drop-off at a specific microgrid station.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class EnergyBookingSlot
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("stationId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string StationId { get; set; } = string.Empty;

        [BsonElement("slotDate")]
        public DateTime SlotDate { get; set; }

        [BsonElement("startTime")]
        public DateTime StartTime { get; set; }

        [BsonElement("endTime")]
        public DateTime EndTime { get; set; }

        [BsonElement("maxCapacityKW")]
        public double MaxCapacityKW { get; set; }

        [BsonElement("availableCapacityKW")]
        public double AvailableCapacityKW { get; set; }

        [BsonElement("status")]
        [BsonRepresentation(BsonType.String)]
        public SlotStatus Status { get; set; } = SlotStatus.Available;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
