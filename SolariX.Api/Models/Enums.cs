// ============================================================================
// File: Enums.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Domain enumerations for roles, account statuses, reservation statuses, and slot statuses.
// Module: SE4040 Enterprise Application Development
// ============================================================================

namespace SolariX.Api.Models
{
    /// <summary>
    /// User roles recognized by the SolariX platform.
    /// </summary>
    public enum UserRole
    {
        Backoffice,
        GridOperator,
        Prosumer
    }

    /// <summary>
    /// Lifecycle status of a user profile.
    /// </summary>
    public enum AccountStatus
    {
        PendingApproval,
        Active,
        Deactivated
    }

    /// <summary>
    /// Lifecycle status of an energy trading reservation.
    /// </summary>
    public enum ReservationStatus
    {
        Pending,
        Approved,
        Completed,
        Cancelled
    }

    /// <summary>
    /// Operational status of an energy booking slot.
    /// </summary>
    public enum SlotStatus
    {
        Available,
        Booked,
        Blocked
    }
}
