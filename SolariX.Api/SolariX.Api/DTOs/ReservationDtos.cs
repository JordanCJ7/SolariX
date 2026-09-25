// ============================================================================
// File: ReservationDtos.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Data transfer objects for energy reservation lifecycle, cancellations, modifications, QR verification, and operational dashboards.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using System.ComponentModel.DataAnnotations;
using SolariX.Api.Models;

namespace SolariX.Api.DTOs
{
    public class CreateReservationRequest
    {
        [Required]
        public string ProsumerNIC { get; set; } = string.Empty;

        [Required]
        public string StationId { get; set; } = string.Empty;

        [Required]
        public string SlotId { get; set; } = string.Empty;

        [Range(0.1, 1000.0)]
        public double EnergyAmountKW { get; set; }

        public string TradeType { get; set; } = "DropOff"; // "DropOff" or "Charge"
    }

    public class UpdateReservationRequest
    {
        public string? NewSlotId { get; set; }

        [Range(0.1, 1000.0)]
        public double? NewEnergyAmountKW { get; set; }

        public string? TradeType { get; set; }
    }

    public class CancelReservationRequest
    {
        [Required]
        public string ProsumerNIC { get; set; } = string.Empty;

        public string Reason { get; set; } = "Cancelled by user";
    }

    /// <summary>
    /// Request payload for Grid Operator scanning prosumer QR code and completing trade.
    /// </summary>
    public class VerifyAndCompleteRequest
    {
        [Required]
        public string QrToken { get; set; } = string.Empty;

        [Required]
        public string OperatorId { get; set; } = string.Empty;

        [Range(0.1, 10000.0)]
        public double EnergyDeliveredKWh { get; set; }

        public string? Notes { get; set; }
    }

    public class FinalizeTransferRequest
    {
        [Required]
        public string QrToken { get; set; } = string.Empty;

        [Required]
        public string OperatorNIC { get; set; } = string.Empty;

        public string? Notes { get; set; }
    }

    public class ReservationResponse
    {
        public string Id { get; set; } = string.Empty;
        public string ReservationNumber { get; set; } = string.Empty;
        public string ProsumerNIC { get; set; } = string.Empty;
        public string StationId { get; set; } = string.Empty;
        public string StationName { get; set; } = string.Empty;
        public string SlotId { get; set; } = string.Empty;
        public DateTime ReservationDate { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public double EnergyAmountKW { get; set; }
        public string TradeType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string QrCodeToken { get; set; } = string.Empty;
        public string? CancellationReason { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? FinalizedByOperatorNIC { get; set; }
        public DateTime? FinalizedAt { get; set; }
        public string? OperatorNotes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class DashboardSummaryResponse
    {
        public int TotalStations { get; set; }
        public int ActiveStations { get; set; }
        public int TotalProsumers { get; set; }
        public int PendingProsumerApprovals { get; set; }
        public int PendingReservationsCount { get; set; }
        public int ApprovedFutureReservationsCount { get; set; }
        public int CompletedReservationsCount { get; set; }
        public int CancelledReservationsCount { get; set; }
        public double TotalEnergyTradedKW { get; set; }
    }

    public class ReservationFilterRequest
    {
        public string? ProsumerNIC { get; set; }
        public string? StationId { get; set; }
        public ReservationStatus? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? SearchQuery { get; set; }
    }
}
