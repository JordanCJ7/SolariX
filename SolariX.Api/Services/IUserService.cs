// ============================================================================
// File: IUserService.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Contract defining user authentication, prosumer lifecycle (NIC primary key), and role-based administration.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using SolariX.Api.DTOs;
using SolariX.Api.Models;

namespace SolariX.Api.Services
{
    public interface IUserService
    {
        Task<LoginResponse?> AuthenticateAsync(LoginRequest request);
        Task<UserResponse> RegisterProsumerAsync(RegisterProsumerRequest request);
        Task<UserResponse> CreateStaffUserAsync(CreateOperatorRequest request);
        Task<UserResponse?> GetUserByNicAsync(string nic);
        Task<List<UserResponse>> GetUsersAsync(UserRole? role = null, AccountStatus? status = null);
        Task<List<UserResponse>> GetPendingProsumersAsync();
        Task<UserResponse> UpdateProsumerProfileAsync(string nic, UpdateProfileRequest request);
        Task<bool> DeactivateAccountAsync(string nic, string requestedByNic);
        Task<bool> ReactivateAccountByBackofficeAsync(string nic, string backofficeNic);
        Task<bool> ApproveProsumerRegistrationAsync(string nic, string backofficeNic);
    }
}
