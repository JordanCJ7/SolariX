// ============================================================================
// File: StationDtos.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Data transfer objects for Solar Station / Microgrid Hub operations.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace SolariX.Api.DTOs
{
    public class CreateStationRequest
    {
        [Required]
        public string StationCode { get; set; } = string.Empty;

        [Required]
        public string StationName { get; set; } = string.Empty;

        [Required]
        public string LocationName { get; set; } = string.Empty;

        [Required]
        public double Latitude { get; set; }

        [Required]
        public double Longitude { get; set; }

        [Range(1, 100000)]
        public double CapacityKWh { get; set; }

        [Range(1, 500)]
        public int TotalBatterySlots { get; set; }

        public string OperationalHours { get; set; } = "06:00 - 20:00";
        public string ContactNumber { get; set; } = string.Empty;
    }

    public class UpdateStationRequest
    {
        public string StationName { get; set; } = string.Empty;
        public string LocationName { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double CapacityKWh { get; set; }
        public int TotalBatterySlots { get; set; }
        public int AvailableBatterySlots { get; set; }
        public string OperationalHours { get; set; } = "06:00 - 20:00";
        public string ContactNumber { get; set; } = string.Empty;
        public bool? IsActive { get; set; }
    }

    public class StationResponse
    {
        public string Id { get; set; } = string.Empty;
        public string StationCode { get; set; } = string.Empty;
        public string StationName { get; set; } = string.Empty;
        public string LocationName { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double CapacityKWh { get; set; }
        public int TotalBatterySlots { get; set; }
        public int AvailableBatterySlots { get; set; }
        public bool IsActive { get; set; }
        public string OperationalHours { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
