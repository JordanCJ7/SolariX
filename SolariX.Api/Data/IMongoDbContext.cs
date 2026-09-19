// ============================================================================
// File: IMongoDbContext.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Contract defining access to the 4 core MongoDB collections.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using MongoDB.Driver;
using SolariX.Api.Models;

namespace SolariX.Api.Data
{
    /// <summary>
    /// Abstraction for MongoDB collections targeting the SolariX enterprise schema.
    /// </summary>
    public interface IMongoDbContext
    {
        IMongoCollection<User> Users { get; }
        IMongoCollection<SolarStationInfo> SolarStationInfo { get; }
        IMongoCollection<EnergyBookingSlot> EnergyBookingSlots { get; }
        IMongoCollection<EnergyReservation> EnergyReservations { get; }
    }
}
