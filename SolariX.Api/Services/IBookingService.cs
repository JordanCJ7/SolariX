// ============================================================================
// File: IBookingService.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Central FAT service contract enforcing 7-day future booking window, 12-hour cancellation/update thresholds, and QR validation.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using SolariX.Api.DTOs;

namespace SolariX.Api.Services
{
    public interface IBookingService
    {
        Task<ReservationResponse> CreateReservationAsync(CreateReservationRequest request);
        Task<ReservationResponse> UpdateReservationAsync(string reservationId, string prosumerNic, UpdateReservationRequest request);
        Task<ReservationResponse> CancelReservationAsync(string reservationId, CancelReservationRequest request);
        Task<ReservationResponse> VerifyAndCompleteAsync(VerifyAndCompleteRequest request);
        Task<ReservationResponse> FinalizeTransferAsync(FinalizeTransferRequest request);
        Task<ReservationResponse?> GetReservationByIdAsync(string id);
        Task<ReservationResponse?> GetReservationByNumberAsync(string reservationNumber);
        Task<List<ReservationResponse>> GetReservationsAsync(ReservationFilterRequest filter);
        Task<List<ReservationResponse>> GetReservationsByProsumerAsync(string prosumerNic);
        Task<DashboardSummaryResponse> GetDashboardSummaryAsync();
        Task<List<SlotResponse>> GetAvailableSlotsAsync(string stationId, DateTime? date = null);
        Task<SlotResponse> CreateSlotAsync(CreateSlotRequest request);
        Task<List<SlotResponse>> GenerateDailySlotsAsync(GenerateDailySlotsRequest request);
    }
}
