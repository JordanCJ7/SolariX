// ============================================================================
// File: BookingService.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Core FAT service implementation enforcing business rules: 7-day future booking window, 12-hour cancellation/update notice thresholds, QR dispatching, and slot capacities.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using MongoDB.Driver;
using SolariX.Api.Data;
using SolariX.Api.DTOs;
using SolariX.Api.Models;

namespace SolariX.Api.Services
{
    public class BookingService : IBookingService
    {
        private readonly IMongoDbContext _context;
        private readonly IQRService _qrService;

        public BookingService(IMongoDbContext context, IQRService qrService)
        {
            // Inline: Injects the central MongoDB context and QR signature generator for reservation lifecycle management.
            _context = context;
            _qrService = qrService;
        }

        public async Task<ReservationResponse> CreateReservationAsync(CreateReservationRequest request)
        {
            // Inline: Validates prosumer status, checks station state, enforces the 7-day future window rule against combined UTC slot time, verifies slot capacity, generates secure QR token, and creates the reservation.
            var cleanNic = request.ProsumerNIC.Trim().ToUpperInvariant();

            // 1. Verify Prosumer Profile
            var prosumer = await _context.Users.Find(u => u.NIC == cleanNic).FirstOrDefaultAsync();
            if (prosumer == null)
            {
                throw new KeyNotFoundException($"Prosumer with NIC '{cleanNic}' was not found.");
            }

            if (prosumer.Status != AccountStatus.Active)
            {
                throw new InvalidOperationException($"Cannot create booking. Prosumer account is currently '{prosumer.Status}'. Only Active prosumers can book energy slots.");
            }

            // 2. Verify Solar Station Hub
            var station = await _context.SolarStationInfo.Find(s => s.Id == request.StationId).FirstOrDefaultAsync();
            if (station == null)
            {
                throw new KeyNotFoundException($"Solar Station with ID '{request.StationId}' was not found.");
            }

            if (!station.IsActive)
            {
                throw new InvalidOperationException($"Solar Station '{station.StationName}' is currently inactive or undergoing maintenance.");
            }

            // 3. Verify Energy Booking Slot
            var slot = await _context.EnergyBookingSlots.Find(s => s.Id == request.SlotId && s.StationId == request.StationId).FirstOrDefaultAsync();
            if (slot == null)
            {
                throw new KeyNotFoundException($"Energy Booking Slot with ID '{request.SlotId}' was not found for station '{station.StationName}'.");
            }

            if (slot.Status != SlotStatus.Available)
            {
                throw new InvalidOperationException("The requested energy booking slot is no longer available.");
            }

            if (slot.AvailableCapacityKW < request.EnergyAmountKW)
            {
                throw new InvalidOperationException($"Insufficient slot capacity. Requested: {request.EnergyAmountKW} kW, Available: {slot.AvailableCapacityKW} kW.");
            }

            // 4. TIMEZONE-SAFE COMBINATION: Combine SlotDate + StartTime into UTC DateTime
            DateTime slotDateTimeUtc = DateTime.SpecifyKind(slot.SlotDate.Date.Add(slot.StartTime.TimeOfDay), DateTimeKind.Utc);
            var nowUtc = DateTime.UtcNow;
            var maxFutureWindow = nowUtc.AddDays(7);

            if (slotDateTimeUtc < nowUtc)
            {
                throw new ArgumentOutOfRangeException(nameof(request.SlotId), "Cannot book a time slot in the past.");
            }

            if (slotDateTimeUtc > maxFutureWindow)
            {
                throw new ArgumentOutOfRangeException(nameof(request.SlotId), $"Power trading reservations must be scheduled within 7 days from now (allowed up to {maxFutureWindow:yyyy-MM-dd HH:mm UTC}). The selected slot is beyond this window.");
            }

            // 5. Generate Human-Readable Unique Reservation Number
            var timestampCode = DateTime.UtcNow.ToString("yyMMddHHmmss");
            var randomSuffix = Random.Shared.Next(100, 999);
            var reservationNumber = $"RES-{timestampCode}-{randomSuffix}";

            // 6. Generate Cryptographic QR Payload: { ReservationId, ProsumerNIC, StationId, SlotId, Timestamp, SignatureHash }
            var reservationId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
            var qrToken = _qrService.GenerateQrPayload(reservationId, cleanNic, station.Id!, slot.Id!, slotDateTimeUtc);

            // 7. Persist Reservation Record
            var reservation = new EnergyReservation
            {
                Id = reservationId,
                ReservationNumber = reservationNumber,
                ProsumerNIC = cleanNic,
                StationId = station.Id!,
                SlotId = slot.Id!,
                ReservationDate = DateTime.SpecifyKind(slot.SlotDate.Date, DateTimeKind.Utc),
                StartTime = slotDateTimeUtc,
                EndTime = DateTime.SpecifyKind(slot.SlotDate.Date.Add(slot.EndTime.TimeOfDay), DateTimeKind.Utc),
                EnergyAmountKW = request.EnergyAmountKW,
                TradeType = request.TradeType ?? "DropOff",
                Status = ReservationStatus.Approved,
                QrCodeToken = qrToken,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.EnergyReservations.InsertOneAsync(reservation);

            // 8. Deduct Slot Capacity
            var updatedCapacity = slot.AvailableCapacityKW - request.EnergyAmountKW;
            var slotStatus = updatedCapacity <= 0 ? SlotStatus.Booked : SlotStatus.Available;

            var slotUpdate = Builders<EnergyBookingSlot>.Update
                .Set(s => s.AvailableCapacityKW, Math.Max(0, updatedCapacity))
                .Set(s => s.Status, slotStatus)
                .Set(s => s.UpdatedAt, DateTime.UtcNow);

            await _context.EnergyBookingSlots.UpdateOneAsync(s => s.Id == slot.Id, slotUpdate);

            return MapToResponse(reservation, station.StationName);
        }

        public async Task<ReservationResponse> UpdateReservationAsync(string reservationId, string prosumerNic, UpdateReservationRequest request)
        {
            // Inline: Evaluates the 12-hour cancellation/update rule against combined UTC SlotDate + StartTime, updates slot or energy amount, and recalculates QR payload.
            var cleanNic = prosumerNic.Trim().ToUpperInvariant();
            var reservation = await _context.EnergyReservations.Find(r => r.Id == reservationId && r.ProsumerNIC == cleanNic).FirstOrDefaultAsync();
            if (reservation == null)
            {
                throw new KeyNotFoundException($"Reservation with ID '{reservationId}' for prosumer '{cleanNic}' was not found.");
            }

            if (reservation.Status != ReservationStatus.Approved && reservation.Status != ReservationStatus.Pending)
            {
                throw new InvalidOperationException($"Cannot modify a reservation with status '{reservation.Status}'.");
            }

            // Combine SlotDate + StartTime safely into UTC
            DateTime slotDateTimeUtc = DateTime.SpecifyKind(reservation.ReservationDate.Date.Add(reservation.StartTime.TimeOfDay), DateTimeKind.Utc);
            var nowUtc = DateTime.UtcNow;
            var timeRemaining = slotDateTimeUtc - nowUtc;

            if (timeRemaining < TimeSpan.FromHours(12))
            {
                throw new InvalidOperationException($"Updates and cancellations require at least 12 hours' advance notice. Only {timeRemaining.TotalHours:F1} hour(s) remain before this reservation.");
            }

            // If changing slot, validate new slot and the 7-day rule
            if (!string.IsNullOrWhiteSpace(request.NewSlotId) && request.NewSlotId != reservation.SlotId)
            {
                var newSlot = await _context.EnergyBookingSlots.Find(s => s.Id == request.NewSlotId).FirstOrDefaultAsync();
                if (newSlot == null)
                {
                    throw new KeyNotFoundException($"Target booking slot '{request.NewSlotId}' not found.");
                }

                DateTime newSlotDateTimeUtc = DateTime.SpecifyKind(newSlot.SlotDate.Date.Add(newSlot.StartTime.TimeOfDay), DateTimeKind.Utc);
                if (newSlotDateTimeUtc > nowUtc.AddDays(7))
                {
                    throw new ArgumentOutOfRangeException(nameof(request.NewSlotId), "New slot must also fall within the 7-day booking window.");
                }

                var requiredKW = request.NewEnergyAmountKW ?? reservation.EnergyAmountKW;
                if (newSlot.AvailableCapacityKW < requiredKW)
                {
                    throw new InvalidOperationException($"Target slot does not have sufficient capacity. Available: {newSlot.AvailableCapacityKW} kW.");
                }

                // Restore previous slot capacity
                var prevSlotUpdate = Builders<EnergyBookingSlot>.Update
                    .Inc(s => s.AvailableCapacityKW, reservation.EnergyAmountKW)
                    .Set(s => s.Status, SlotStatus.Available)
                    .Set(s => s.UpdatedAt, DateTime.UtcNow);
                await _context.EnergyBookingSlots.UpdateOneAsync(s => s.Id == reservation.SlotId, prevSlotUpdate);

                // Deduct from new slot
                var newCapacity = newSlot.AvailableCapacityKW - requiredKW;
                var newSlotUpdate = Builders<EnergyBookingSlot>.Update
                    .Set(s => s.AvailableCapacityKW, Math.Max(0, newCapacity))
                    .Set(s => s.Status, newCapacity <= 0 ? SlotStatus.Booked : SlotStatus.Available)
                    .Set(s => s.UpdatedAt, DateTime.UtcNow);
                await _context.EnergyBookingSlots.UpdateOneAsync(s => s.Id == newSlot.Id, newSlotUpdate);

                reservation.SlotId = newSlot.Id!;
                reservation.StationId = newSlot.StationId;
                reservation.ReservationDate = DateTime.SpecifyKind(newSlot.SlotDate.Date, DateTimeKind.Utc);
                reservation.StartTime = newSlotDateTimeUtc;
                reservation.EndTime = DateTime.SpecifyKind(newSlot.SlotDate.Date.Add(newSlot.EndTime.TimeOfDay), DateTimeKind.Utc);
                reservation.QrCodeToken = _qrService.GenerateQrPayload(reservation.Id!, reservation.ProsumerNIC, reservation.StationId, reservation.SlotId, reservation.StartTime);
            }

            if (request.NewEnergyAmountKW.HasValue && request.NewEnergyAmountKW.Value > 0)
            {
                reservation.EnergyAmountKW = request.NewEnergyAmountKW.Value;
            }

            if (!string.IsNullOrWhiteSpace(request.TradeType))
            {
                reservation.TradeType = request.TradeType;
            }

            reservation.UpdatedAt = DateTime.UtcNow;

            await _context.EnergyReservations.ReplaceOneAsync(r => r.Id == reservation.Id, reservation);

            var station = await _context.SolarStationInfo.Find(s => s.Id == reservation.StationId).FirstOrDefaultAsync();
            return MapToResponse(reservation, station?.StationName ?? "Solar Station");
        }

        public async Task<ReservationResponse> CancelReservationAsync(string reservationId, CancelReservationRequest request)
        {
            // Inline: Validates that cancellation request satisfies the mandatory 12-hour threshold against combined UTC SlotDate + StartTime; releases slot capacity if valid.
            var cleanNic = request.ProsumerNIC.Trim().ToUpperInvariant();
            var reservation = await _context.EnergyReservations.Find(r => r.Id == reservationId && r.ProsumerNIC == cleanNic).FirstOrDefaultAsync();
            if (reservation == null)
            {
                throw new KeyNotFoundException($"Reservation with ID '{reservationId}' for prosumer '{cleanNic}' was not found.");
            }

            if (reservation.Status == ReservationStatus.Cancelled)
            {
                throw new InvalidOperationException("This reservation has already been cancelled.");
            }

            if (reservation.Status == ReservationStatus.Completed)
            {
                throw new InvalidOperationException("Cannot cancel an already completed energy transfer reservation.");
            }

            // Combine SlotDate + StartTime safely into UTC
            DateTime slotDateTimeUtc = DateTime.SpecifyKind(reservation.ReservationDate.Date.Add(reservation.StartTime.TimeOfDay), DateTimeKind.Utc);
            var nowUtc = DateTime.UtcNow;
            var timeRemaining = slotDateTimeUtc - nowUtc;

            if (timeRemaining < TimeSpan.FromHours(12))
            {
                throw new InvalidOperationException($"Updates and cancellations require at least 12 hours' advance notice. Only {timeRemaining.TotalHours:F1} hour(s) remain before this reservation.");
            }

            // Restore slot capacity
            var slotUpdate = Builders<EnergyBookingSlot>.Update
                .Inc(s => s.AvailableCapacityKW, reservation.EnergyAmountKW)
                .Set(s => s.Status, SlotStatus.Available)
                .Set(s => s.UpdatedAt, DateTime.UtcNow);
            await _context.EnergyBookingSlots.UpdateOneAsync(s => s.Id == reservation.SlotId, slotUpdate);

            // Update reservation status to Cancelled
            reservation.Status = ReservationStatus.Cancelled;
            reservation.CancellationReason = request.Reason ?? "Cancelled by prosumer";
            reservation.CancelledAt = DateTime.UtcNow;
            reservation.UpdatedAt = DateTime.UtcNow;

            await _context.EnergyReservations.ReplaceOneAsync(r => r.Id == reservation.Id, reservation);

            var station = await _context.SolarStationInfo.Find(s => s.Id == reservation.StationId).FirstOrDefaultAsync();
            return MapToResponse(reservation, station?.StationName ?? "Solar Station");
        }

        public async Task<ReservationResponse> VerifyAndCompleteAsync(VerifyAndCompleteRequest request)
        {
            // Inline: Verifies QR token signature, confirms reservation is currently in Approved status, checks calling user has GridOperator role, sets status to Completed, and timestamps completion.
            bool isValidQr = _qrService.ValidateQrPayload(request.QrToken, out var reservationId, out var prosumerNic, out _, out _, out _);
            if (!isValidQr)
            {
                throw new ArgumentException("Invalid or forged QR code payload. Signature verification failed.");
            }

            // Verify operator identity and role
            var cleanOperatorId = request.OperatorId.Trim().ToUpperInvariant();
            var operatorUser = await _context.Users.Find(u => u.NIC == cleanOperatorId || u.Id == request.OperatorId).FirstOrDefaultAsync();
            if (operatorUser == null || operatorUser.Role != UserRole.GridOperator)
            {
                throw new UnauthorizedAccessException("Forbidden: Only users with the GridOperator role are authorized to verify and finalize energy transfers.");
            }

            // Find reservation and verify Approved status
            var reservation = await _context.EnergyReservations.Find(r => (r.Id == reservationId || r.ReservationNumber == reservationId) && r.ProsumerNIC == prosumerNic).FirstOrDefaultAsync();
            if (reservation == null)
            {
                throw new KeyNotFoundException($"No active reservation found matching identifier '{reservationId}'.");
            }

            if (reservation.Status != ReservationStatus.Approved)
            {
                throw new InvalidOperationException($"Cannot complete reservation. Current status is '{reservation.Status}', expected 'Approved'.");
            }

            reservation.Status = ReservationStatus.Completed;
            reservation.FinalizedByOperatorNIC = operatorUser.NIC;
            reservation.FinalizedAt = DateTime.UtcNow;
            reservation.EnergyAmountKW = request.EnergyDeliveredKWh > 0 ? request.EnergyDeliveredKWh : reservation.EnergyAmountKW;
            reservation.OperatorNotes = request.Notes;
            reservation.UpdatedAt = DateTime.UtcNow;

            await _context.EnergyReservations.ReplaceOneAsync(r => r.Id == reservation.Id, reservation);

            var station = await _context.SolarStationInfo.Find(s => s.Id == reservation.StationId).FirstOrDefaultAsync();
            return MapToResponse(reservation, station?.StationName ?? "Solar Station");
        }

        public async Task<ReservationResponse> FinalizeTransferAsync(FinalizeTransferRequest request)
        {
            // Inline: Adapter delegating to VerifyAndCompleteAsync with operator NIC and notes.
            return await VerifyAndCompleteAsync(new VerifyAndCompleteRequest
            {
                QrToken = request.QrToken,
                OperatorId = request.OperatorNIC,
                EnergyDeliveredKWh = 0,
                Notes = request.Notes
            });
        }

        public async Task<ReservationResponse?> GetReservationByIdAsync(string id)
        {
            // Inline: Queries an individual reservation by MongoDB document ObjectId.
            var reservation = await _context.EnergyReservations.Find(r => r.Id == id).FirstOrDefaultAsync();
            if (reservation == null) return null;

            var station = await _context.SolarStationInfo.Find(s => s.Id == reservation.StationId).FirstOrDefaultAsync();
            return MapToResponse(reservation, station?.StationName ?? "Solar Station");
        }

        public async Task<ReservationResponse?> GetReservationByNumberAsync(string reservationNumber)
        {
            // Inline: Queries an individual reservation by its unique human-readable reservation number.
            var reservation = await _context.EnergyReservations.Find(r => r.ReservationNumber == reservationNumber).FirstOrDefaultAsync();
            if (reservation == null) return null;

            var station = await _context.SolarStationInfo.Find(s => s.Id == reservation.StationId).FirstOrDefaultAsync();
            return MapToResponse(reservation, station?.StationName ?? "Solar Station");
        }

        public async Task<List<ReservationResponse>> GetReservationsAsync(ReservationFilterRequest filter)
        {
            // Inline: Filters reservations by prosumer NIC, station ID, reservation status, date range, or free-text search.
            var builder = Builders<EnergyReservation>.Filter;
            var query = builder.Empty;

            if (!string.IsNullOrWhiteSpace(filter.ProsumerNIC))
            {
                query &= builder.Eq(r => r.ProsumerNIC, filter.ProsumerNIC.Trim().ToUpperInvariant());
            }

            if (!string.IsNullOrWhiteSpace(filter.StationId))
            {
                query &= builder.Eq(r => r.StationId, filter.StationId.Trim());
            }

            if (filter.Status.HasValue)
            {
                query &= builder.Eq(r => r.Status, filter.Status.Value);
            }

            if (filter.FromDate.HasValue)
            {
                query &= builder.Gte(r => r.ReservationDate, filter.FromDate.Value.Date);
            }

            if (filter.ToDate.HasValue)
            {
                query &= builder.Lte(r => r.ReservationDate, filter.ToDate.Value.Date.AddDays(1).AddTicks(-1));
            }

            if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
            {
                var q = filter.SearchQuery.Trim();
                query &= builder.Or(
                    builder.Regex(r => r.ReservationNumber, new MongoDB.Bson.BsonRegularExpression(q, "i")),
                    builder.Regex(r => r.ProsumerNIC, new MongoDB.Bson.BsonRegularExpression(q, "i"))
                );
            }

            var reservations = await _context.EnergyReservations.Find(query).SortByDescending(r => r.CreatedAt).ToListAsync();

            var stationIds = reservations.Select(r => r.StationId).Distinct().ToList();
            var stations = await _context.SolarStationInfo.Find(s => stationIds.Contains(s.Id!)).ToListAsync();
            var stationMap = stations.ToDictionary(s => s.Id!, s => s.StationName);

            return reservations.Select(r => MapToResponse(r, stationMap.GetValueOrDefault(r.StationId, "Solar Station"))).ToList();
        }

        public async Task<List<ReservationResponse>> GetReservationsByProsumerAsync(string prosumerNic)
        {
            // Inline: Retrieves the full reservation history for a specific prosumer identified by NIC.
            return await GetReservationsAsync(new ReservationFilterRequest { ProsumerNIC = prosumerNic });
        }

        public async Task<DashboardSummaryResponse> GetDashboardSummaryAsync()
        {
            // Inline: Computes system-wide operational metrics including station health, prosumer counts, and active vs approved future reservations.
            var totalStations = (int)await _context.SolarStationInfo.CountDocumentsAsync(_ => true);
            var activeStations = (int)await _context.SolarStationInfo.CountDocumentsAsync(s => s.IsActive);

            var totalProsumers = (int)await _context.Users.CountDocumentsAsync(u => u.Role == UserRole.Prosumer);
            var pendingProsumers = (int)await _context.Users.CountDocumentsAsync(u => u.Role == UserRole.Prosumer && u.Status == AccountStatus.PendingApproval);

            var pendingReservations = (int)await _context.EnergyReservations.CountDocumentsAsync(r => r.Status == ReservationStatus.Pending);

            // Approved future reservations (start time in future)
            var nowUtc = DateTime.UtcNow;
            var approvedFuture = (int)await _context.EnergyReservations.CountDocumentsAsync(r =>
                r.Status == ReservationStatus.Approved && r.StartTime >= nowUtc);

            var completedReservations = (int)await _context.EnergyReservations.CountDocumentsAsync(r => r.Status == ReservationStatus.Completed);
            var cancelledReservations = (int)await _context.EnergyReservations.CountDocumentsAsync(r => r.Status == ReservationStatus.Cancelled);

            // Total energy traded for completed reservations
            var completedList = await _context.EnergyReservations.Find(r => r.Status == ReservationStatus.Completed).ToListAsync();
            var totalEnergyTraded = completedList.Sum(r => r.EnergyAmountKW);

            return new DashboardSummaryResponse
            {
                TotalStations = totalStations,
                ActiveStations = activeStations,
                TotalProsumers = totalProsumers,
                PendingProsumerApprovals = pendingProsumers,
                PendingReservationsCount = pendingReservations,
                ApprovedFutureReservationsCount = approvedFuture,
                CompletedReservationsCount = completedReservations,
                CancelledReservationsCount = cancelledReservations,
                TotalEnergyTradedKW = totalEnergyTraded
            };
        }

        public async Task<List<SlotResponse>> GetAvailableSlotsAsync(string stationId, DateTime? date = null)
        {
            // Inline: Queries available slots with capacity for the target solar station, optionally scoped to a particular date.
            var builder = Builders<EnergyBookingSlot>.Filter;
            var filter = builder.Eq(s => s.StationId, stationId) & builder.Eq(s => s.Status, SlotStatus.Available);

            if (date.HasValue)
            {
                var dayStart = date.Value.Date;
                var dayEnd = dayStart.AddDays(1);
                filter &= builder.Gte(s => s.SlotDate, dayStart) & builder.Lt(s => s.SlotDate, dayEnd);
            }

            var slots = await _context.EnergyBookingSlots.Find(filter).SortBy(s => s.StartTime).ToListAsync();
            return slots.Select(MapSlotToResponse).ToList();
        }

        public async Task<SlotResponse> CreateSlotAsync(CreateSlotRequest request)
        {
            // Inline: Adds a single booking slot to a microgrid station with UTC timestamps.
            var slot = new EnergyBookingSlot
            {
                StationId = request.StationId,
                SlotDate = DateTime.SpecifyKind(request.SlotDate.Date, DateTimeKind.Utc),
                StartTime = DateTime.SpecifyKind(request.StartTime, DateTimeKind.Utc),
                EndTime = DateTime.SpecifyKind(request.EndTime, DateTimeKind.Utc),
                MaxCapacityKW = request.MaxCapacityKW,
                AvailableCapacityKW = request.MaxCapacityKW,
                Status = SlotStatus.Available,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.EnergyBookingSlots.InsertOneAsync(slot);
            return MapSlotToResponse(slot);
        }

        public async Task<List<SlotResponse>> GenerateDailySlotsAsync(GenerateDailySlotsRequest request)
        {
            // Inline: Automates batch slot creation across operational hours in UTC for a target microgrid station and date.
            var station = await _context.SolarStationInfo.Find(s => s.Id == request.StationId).FirstOrDefaultAsync();
            if (station == null)
            {
                throw new KeyNotFoundException($"Station with ID '{request.StationId}' not found.");
            }

            var targetDate = DateTime.SpecifyKind(request.TargetDate.Date, DateTimeKind.Utc);
            var startHour = 8; // 08:00 AM
            var endHour = 18;  // 06:00 PM
            var durationMinutes = request.SlotDurationMinutes > 0 ? request.SlotDurationMinutes : 60;
            var capacityKW = request.SlotCapacityKW > 0 ? request.SlotCapacityKW : 25.0;

            var newSlots = new List<EnergyBookingSlot>();
            var current = targetDate.AddHours(startHour);
            var dayEnd = targetDate.AddHours(endHour);

            while (current < dayEnd)
            {
                var slotEnd = current.AddMinutes(durationMinutes);
                if (slotEnd > dayEnd) break;

                newSlots.Add(new EnergyBookingSlot
                {
                    StationId = request.StationId,
                    SlotDate = targetDate,
                    StartTime = current,
                    EndTime = slotEnd,
                    MaxCapacityKW = capacityKW,
                    AvailableCapacityKW = capacityKW,
                    Status = SlotStatus.Available,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

                current = slotEnd;
            }

            if (newSlots.Count > 0)
            {
                await _context.EnergyBookingSlots.InsertManyAsync(newSlots);
            }

            return newSlots.Select(MapSlotToResponse).ToList();
        }

        private static ReservationResponse MapToResponse(EnergyReservation res, string stationName)
        {
            // Inline: Transforms internal EnergyReservation entity into client ReservationResponse DTO.
            return new ReservationResponse
            {
                Id = res.Id ?? string.Empty,
                ReservationNumber = res.ReservationNumber,
                ProsumerNIC = res.ProsumerNIC,
                StationId = res.StationId,
                StationName = stationName,
                SlotId = res.SlotId,
                ReservationDate = res.ReservationDate,
                StartTime = res.StartTime,
                EndTime = res.EndTime,
                EnergyAmountKW = res.EnergyAmountKW,
                TradeType = res.TradeType,
                Status = res.Status.ToString(),
                QrCodeToken = res.QrCodeToken,
                CancellationReason = res.CancellationReason,
                CancelledAt = res.CancelledAt,
                FinalizedByOperatorNIC = res.FinalizedByOperatorNIC,
                FinalizedAt = res.FinalizedAt,
                OperatorNotes = res.OperatorNotes,
                CreatedAt = res.CreatedAt
            };
        }

        private static SlotResponse MapSlotToResponse(EnergyBookingSlot slot)
        {
            // Inline: Transforms internal EnergyBookingSlot entity into SlotResponse DTO.
            return new SlotResponse
            {
                Id = slot.Id ?? string.Empty,
                StationId = slot.StationId,
                SlotDate = slot.SlotDate,
                StartTime = slot.StartTime,
                EndTime = slot.EndTime,
                MaxCapacityKW = slot.MaxCapacityKW,
                AvailableCapacityKW = slot.AvailableCapacityKW,
                Status = slot.Status.ToString()
            };
        }
    }
}
