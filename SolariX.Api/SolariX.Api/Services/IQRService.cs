// ============================================================================
// File: IQRService.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Contract for generating and verifying cryptographic QR tokens for energy transfer dispatch.
// Module: SE4040 Enterprise Application Development
// ============================================================================

namespace SolariX.Api.Services
{
    public interface IQRService
    {
        string GenerateQrPayload(string reservationId, string prosumerNic, string stationId, string slotId, DateTime timestamp);
        bool ValidateQrPayload(string payload, out string reservationId, out string prosumerNic, out string stationId, out string slotId, out DateTime timestamp);
    }
}
