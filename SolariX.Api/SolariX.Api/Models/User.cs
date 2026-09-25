// ============================================================================
// File: User.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: User entity mapped to the MongoDB 'Users' collection. Supports Prosumers, Grid Operators, and Backoffice staff.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SolariX.Api.Models
{
    /// <summary>
    /// Represents an authenticated system user or prosumer registered on the microgrid platform.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        /// <summary>
        /// National Identity Card (NIC) number acting as primary identity key for Prosumers.
        /// </summary>
        [BsonElement("nic")]
        public string NIC { get; set; } = string.Empty;

        [BsonElement("fullName")]
        public string FullName { get; set; } = string.Empty;

        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;

        [BsonElement("phoneNumber")]
        public string PhoneNumber { get; set; } = string.Empty;

        [BsonElement("passwordHash")]
        public string PasswordHash { get; set; } = string.Empty;

        [BsonElement("role")]
        [BsonRepresentation(BsonType.String)]
        public UserRole Role { get; set; } = UserRole.Prosumer;

        [BsonElement("status")]
        [BsonRepresentation(BsonType.String)]
        public AccountStatus Status { get; set; } = AccountStatus.Active;

        [BsonElement("address")]
        public string Address { get; set; } = string.Empty;

        [BsonElement("solarCapacityKW")]
        public double SolarCapacityKW { get; set; } = 0.0;

        [BsonElement("deactivatedAt")]
        public DateTime? DeactivatedAt { get; set; }

        [BsonElement("deactivatedBy")]
        public string? DeactivatedBy { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Factory helper to build a new Prosumer record with initial timestamps.
        /// </summary>
        public static User CreateProsumer(string nic, string fullName, string email, string phone, string passwordHash, string address, double solarCapacityKW)
        {
            // Inline: Instantiates and returns a new Prosumer user model with active status and default timestamps.
            return new User
            {
                NIC = nic.Trim().ToUpperInvariant(),
                FullName = fullName.Trim(),
                Email = email.Trim().ToLowerInvariant(),
                PhoneNumber = phone.Trim(),
                PasswordHash = passwordHash,
                Role = UserRole.Prosumer,
                Status = AccountStatus.Active,
                Address = address.Trim(),
                SolarCapacityKW = solarCapacityKW,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }
    }
}
