// ============================================================================
// File: IStationService.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Contract for solar microgrid hub management and active reservation validation on node deactivation.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using SolariX.Api.DTOs;

namespace SolariX.Api.Services
{
    public interface IStationService
    {
        Task<StationResponse> CreateStationAsync(CreateStationRequest request);
        Task<StationResponse> UpdateStationAsync(string id, UpdateStationRequest request);
        Task<StationResponse?> GetStationByIdAsync(string id);
        Task<List<StationResponse>> GetAllStationsAsync(bool? activeOnly = null);
        Task<bool> DeactivateStationAsync(string id);
        Task<bool> ReactivateStationAsync(string id);
        Task<int> GetActiveReservationsCountForStationAsync(string stationId);
    }
}
