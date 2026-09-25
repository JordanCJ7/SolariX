// ============================================================================
// File: AuthDtos.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Data transfer objects for user authentication, registration, and profile management.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using System.ComponentModel.DataAnnotations;
using SolariX.Api.Models;

namespace SolariX.Api.DTOs
{
    public class LoginRequest
    {
        [Required]
        public string Identifier { get; set; } = string.Empty; // NIC or Email

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public string NIC { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
    }

    public class RegisterProsumerRequest
    {
        [Required]
        public string NIC { get; set; } = string.Empty;

        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public double SolarCapacityKW { get; set; } = 5.0;
    }

    public class CreateOperatorRequest
    {
        [Required]
        public string NIC { get; set; } = string.Empty;

        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; } = UserRole.GridOperator;
    }

    public class UpdateProfileRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public double SolarCapacityKW { get; set; }
    }

    public class UserResponse
    {
        public string Id { get; set; } = string.Empty;
        public string NIC { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public double SolarCapacityKW { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
