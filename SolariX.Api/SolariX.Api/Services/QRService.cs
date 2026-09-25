// ============================================================================
// File: QRService.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Implements secure HMAC-based QR payload generation and validation containing ReservationId, ProsumerNIC, StationId, SlotId, Timestamp, and SignatureHash.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace SolariX.Api.Services
{
    public class QRService : IQRService
    {
        private static readonly byte[] SecretKey = Encoding.UTF8.GetBytes("SolariX-Microgrid-Secret-Security-Key-2026");

        public string GenerateQrPayload(string reservationId, string prosumerNic, string stationId, string slotId, DateTime timestamp)
        {
            // Inline: Generates a tamper-proof QR payload encoding { ReservationId, ProsumerNIC, StationId, SlotId, Timestamp, SignatureHash } using HMAC-SHA256.
            var timestampStr = timestamp.ToUniversalTime().ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture);
            var rawData = $"{reservationId}|{prosumerNic}|{stationId}|{slotId}|{timestampStr}";
            using var hmac = new HMACSHA256(SecretKey);
            var signatureHash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawData)));
            return $"{rawData}#{signatureHash}";
        }

        public bool ValidateQrPayload(string payload, out string reservationId, out string prosumerNic, out string stationId, out string slotId, out DateTime timestamp)
        {
            // Inline: Validates signature hash of QR payload and extracts ReservationId, ProsumerNIC, StationId, SlotId, and Timestamp.
            reservationId = string.Empty;
            prosumerNic = string.Empty;
            stationId = string.Empty;
            slotId = string.Empty;
            timestamp = DateTime.MinValue;

            if (string.IsNullOrWhiteSpace(payload) || !payload.Contains('#'))
            {
                return false;
            }

            var parts = payload.Split('#');
            if (parts.Length != 2)
            {
                return false;
            }

            var rawData = parts[0];
            var expectedHash = parts[1];

            using var hmac = new HMACSHA256(SecretKey);
            var calculatedHash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawData)));

            if (calculatedHash != expectedHash)
            {
                return false;
            }

            var segments = rawData.Split('|');
            if (segments.Length != 5)
            {
                return false;
            }

            reservationId = segments[0];
            prosumerNic = segments[1];
            stationId = segments[2];
            slotId = segments[3];

            if (DateTime.TryParseExact(segments[4], "yyyyMMddHHmmss", CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal, out var parsedTime))
            {
                timestamp = parsedTime;
            }
            else
            {
                timestamp = DateTime.UtcNow;
            }

            return true;
        }
    }
}
