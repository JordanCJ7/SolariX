// ============================================================================
// File: StationService.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Implements microgrid station hub lifecycle, slot tracking, and reservation conflict guards during node deactivation.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using MongoDB.Driver;
using SolariX.Api.Data;
using SolariX.Api.DTOs;
using SolariX.Api.Models;

namespace SolariX.Api.Services
{
    public class StationService : IStationService
    {
        private readonly IMongoDbContext _context;

        public StationService(IMongoDbContext context)
        {
            // Inline: Injects the central MongoDB context providing access to the SolarStationInfo and EnergyReservation collections.
            _context = context;
        }

        public async Task<StationResponse> CreateStationAsync(CreateStationRequest request)
        {
            // Inline: Checks if station code is unique, initializes slot availability, and saves the new solar grid hub.
            var cleanCode = request.StationCode.Trim().ToUpperInvariant();
            var existing = await _context.SolarStationInfo.Find(s => s.StationCode == cleanCode).FirstOrDefaultAsync();
            if (existing != null)
            {
                throw new ArgumentException($"A station with code '{cleanCode}' already exists.");
            }

            var station = new SolarStationInfo
            {
                StationCode = cleanCode,
                StationName = request.StationName.Trim(),
                LocationName = request.LocationName.Trim(),
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                CapacityKWh = request.CapacityKWh,
                TotalBatterySlots = request.TotalBatterySlots,
                AvailableBatterySlots = request.TotalBatterySlots,
                IsActive = true,
                OperationalHours = request.OperationalHours.Trim(),
                ContactNumber = request.ContactNumber.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.SolarStationInfo.InsertOneAsync(station);
            return MapToResponse(station);
        }

        public async Task<StationResponse> UpdateStationAsync(string id, UpdateStationRequest request)
        {
            // Inline: Applies updates to station specifications, location, hours, and operational status, ensuring deactivations are validated against active reservations.
            var station = await _context.SolarStationInfo.Find(s => s.Id == id).FirstOrDefaultAsync();
            if (station == null)
            {
                throw new KeyNotFoundException($"Solar station with ID '{id}' was not found.");
            }

            // If an update attempts to deactivate the station, route through active reservation verification
            if (request.IsActive.HasValue && !request.IsActive.Value && station.IsActive)
            {
                var activeCount = await GetActiveReservationsCountForStationAsync(id);
                if (activeCount > 0)
                {
                    throw new InvalidOperationException($"Cannot deactivate solar station '{station.StationName}'. There are {activeCount} active or approved reservations currently scheduled.");
                }
            }

            var update = Builders<SolarStationInfo>.Update
                .Set(s => s.StationName, string.IsNullOrWhiteSpace(request.StationName) ? station.StationName : request.StationName.Trim())
                .Set(s => s.LocationName, string.IsNullOrWhiteSpace(request.LocationName) ? station.LocationName : request.LocationName.Trim())
                .Set(s => s.Latitude, request.Latitude != 0 ? request.Latitude : station.Latitude)
                .Set(s => s.Longitude, request.Longitude != 0 ? request.Longitude : station.Longitude)
                .Set(s => s.CapacityKWh, request.CapacityKWh > 0 ? request.CapacityKWh : station.CapacityKWh)
                .Set(s => s.TotalBatterySlots, request.TotalBatterySlots > 0 ? request.TotalBatterySlots : station.TotalBatterySlots)
                .Set(s => s.AvailableBatterySlots, request.AvailableBatterySlots >= 0 ? request.AvailableBatterySlots : station.AvailableBatterySlots)
                .Set(s => s.OperationalHours, string.IsNullOrWhiteSpace(request.OperationalHours) ? station.OperationalHours : request.OperationalHours.Trim())
                .Set(s => s.ContactNumber, string.IsNullOrWhiteSpace(request.ContactNumber) ? station.ContactNumber : request.ContactNumber.Trim())
                .Set(s => s.IsActive, request.IsActive ?? station.IsActive)
                .Set(s => s.UpdatedAt, DateTime.UtcNow);

            var options = new FindOneAndUpdateOptions<SolarStationInfo> { ReturnDocument = ReturnDocument.After };
            var updated = await _context.SolarStationInfo.FindOneAndUpdateAsync<SolarStationInfo>(s => s.Id == id, update, options);

            return MapToResponse(updated!);
        }

        public async Task<StationResponse?> GetStationByIdAsync(string id)
        {
            // Inline: Fetches a single solar station record by its MongoDB ObjectId.
            var station = await _context.SolarStationInfo.Find(s => s.Id == id).FirstOrDefaultAsync();
            return station != null ? MapToResponse(station) : null;
        }

        public async Task<List<StationResponse>> GetAllStationsAsync(bool? activeOnly = null)
        {
            // Inline: Queries all solar stations, optionally filtering only actively operating hubs.
            var filter = Builders<SolarStationInfo>.Filter.Empty;
            if (activeOnly.HasValue && activeOnly.Value)
            {
                filter = Builders<SolarStationInfo>.Filter.Eq(s => s.IsActive, true);
            }

            var stations = await _context.SolarStationInfo.Find(filter).ToListAsync();
            return stations.Select(MapToResponse).ToList();
        }

        public async Task<bool> DeactivateStationAsync(string id)
        {
            // Inline: Enforces FAT service business rule: queries for active reservations before proceeding with solar station node deactivation.
            var station = await _context.SolarStationInfo.Find(s => s.Id == id).FirstOrDefaultAsync();
            if (station == null)
            {
                throw new KeyNotFoundException($"Solar station with ID '{id}' was not found.");
            }

            // Check if any active or approved reservations are linked to this station
            var activeReservationsCount = await GetActiveReservationsCountForStationAsync(id);
            if (activeReservationsCount > 0)
            {
                throw new InvalidOperationException($"Deactivation blocked: Solar station '{station.StationName}' currently has {activeReservationsCount} active or approved reservation(s). All reservations must be completed or cancelled before node deactivation.");
            }

            var update = Builders<SolarStationInfo>.Update
                .Set(s => s.IsActive, false)
                .Set(s => s.UpdatedAt, DateTime.UtcNow);

            var result = await _context.SolarStationInfo.UpdateOneAsync(s => s.Id == id, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> ReactivateStationAsync(string id)
        {
            // Inline: Re-enables operational status for a previously deactivated solar microgrid hub.
            var update = Builders<SolarStationInfo>.Update
                .Set(s => s.IsActive, true)
                .Set(s => s.UpdatedAt, DateTime.UtcNow);

            var result = await _context.SolarStationInfo.UpdateOneAsync(s => s.Id == id, update);
            return result.ModifiedCount > 0;
        }

        public async Task<int> GetActiveReservationsCountForStationAsync(string stationId)
        {
            // Inline: Counts reservations linked to the station that are currently in Pending or Approved status.
            var activeStatuses = new[] { ReservationStatus.Pending, ReservationStatus.Approved };
            var filter = Builders<EnergyReservation>.Filter.And(
                Builders<EnergyReservation>.Filter.Eq(r => r.StationId, stationId),
                Builders<EnergyReservation>.Filter.In(r => r.Status, activeStatuses)
            );

            var count = await _context.EnergyReservations.CountDocumentsAsync(filter);
            return (int)count;
        }

        private static StationResponse MapToResponse(SolarStationInfo station)
        {
            // Inline: Maps the domain SolarStationInfo model to the outwards StationResponse DTO.
            return new StationResponse
            {
                Id = station.Id ?? string.Empty,
                StationCode = station.StationCode,
                StationName = station.StationName,
                LocationName = station.LocationName,
                Latitude = station.Latitude,
                Longitude = station.Longitude,
                CapacityKWh = station.CapacityKWh,
                TotalBatterySlots = station.TotalBatterySlots,
                AvailableBatterySlots = station.AvailableBatterySlots,
                IsActive = station.IsActive,
                OperationalHours = station.OperationalHours,
                ContactNumber = station.ContactNumber,
                CreatedAt = station.CreatedAt
            };
        }
    }
}
