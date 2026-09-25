// ============================================================================
// File: EnergyReservation.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Energy reservation entity mapped to the MongoDB 'EnergyReservation' collection.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SolariX.Api.Models
{
    /// <summary>
    /// Represents a prosumer's power trading reservation for energy drop-off or charging.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class EnergyReservation
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("reservationNumber")]
        public string ReservationNumber { get; set; } = string.Empty;

        /// <summary>
        /// Prosumer's National Identity Card (NIC) number.
        /// </summary>
        [BsonElement("prosumerNIC")]
        public string ProsumerNIC { get; set; } = string.Empty;

        [BsonElement("stationId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string StationId { get; set; } = string.Empty;

        [BsonElement("slotId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string SlotId { get; set; } = string.Empty;

        [BsonElement("reservationDate")]
        public DateTime ReservationDate { get; set; }

        [BsonElement("startTime")]
        public DateTime StartTime { get; set; }

        [BsonElement("endTime")]
        public DateTime EndTime { get; set; }

        [BsonElement("energyAmountKW")]
        public double EnergyAmountKW { get; set; }

        /// <summary>
        /// Energy transaction type: DropOff (selling solar energy) or Charge (consuming/charging battery).
        /// </summary>
        [BsonElement("tradeType")]
        public string TradeType { get; set; } = "DropOff";

        [BsonElement("status")]
        [BsonRepresentation(BsonType.String)]
        public ReservationStatus Status { get; set; } = ReservationStatus.Approved;

        /// <summary>
        /// Cryptographic or signed token payload encoded in the prosumer's QR code.
        /// </summary>
        [BsonElement("qrCodeToken")]
        public string QrCodeToken { get; set; } = string.Empty;

        [BsonElement("cancellationReason")]
        public string? CancellationReason { get; set; }

        [BsonElement("cancelledAt")]
        public DateTime? CancelledAt { get; set; }

        [BsonElement("finalizedByOperatorNIC")]
        public string? FinalizedByOperatorNIC { get; set; }

        [BsonElement("finalizedAt")]
        public DateTime? FinalizedAt { get; set; }

        [BsonElement("operatorNotes")]
        public string? OperatorNotes { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
