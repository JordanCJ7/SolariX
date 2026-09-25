// ============================================================================
// File: SlotDtos.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Data transfer objects for Energy Booking Slots.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using System.ComponentModel.DataAnnotations;
using SolariX.Api.Models;

namespace SolariX.Api.DTOs
{
    public class CreateSlotRequest
    {
        [Required]
        public string StationId { get; set; } = string.Empty;

        [Required]
        public DateTime SlotDate { get; set; }

        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        public DateTime EndTime { get; set; }

        [Range(1, 10000)]
        public double MaxCapacityKW { get; set; }
    }

    public class GenerateDailySlotsRequest
    {
        [Required]
        public string StationId { get; set; } = string.Empty;

        [Required]
        public DateTime TargetDate { get; set; }

        public int SlotDurationMinutes { get; set; } = 60;
        public double SlotCapacityKW { get; set; } = 25.0;
    }

    public class SlotResponse
    {
        public string Id { get; set; } = string.Empty;
        public string StationId { get; set; } = string.Empty;
        public DateTime SlotDate { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public double MaxCapacityKW { get; set; }
        public double AvailableCapacityKW { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
