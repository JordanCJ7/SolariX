// ============================================================================
// File: UserService.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Implements user authentication, profile management, and account lifecycle with Backoffice-only reactivation rules.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using MongoDB.Driver;
using SolariX.Api.Data;
using SolariX.Api.DTOs;
using SolariX.Api.Models;

namespace SolariX.Api.Services
{
    public class UserService : IUserService
    {
        private readonly IMongoDbContext _context;

        public UserService(IMongoDbContext context)
        {
            // Inline: Injects the central MongoDB context targeting the Users collection.
            _context = context;
        }

        public async Task<LoginResponse?> AuthenticateAsync(LoginRequest request)
        {
            // Inline: Locates user by NIC or email, verifies BCrypt password hash, confirms account is active, and returns an authenticated profile response.
            var trimmedId = request.Identifier.Trim();
            var user = await _context.Users.Find(u =>
                u.NIC.Equals(trimmedId, StringComparison.OrdinalIgnoreCase) ||
                u.Email.Equals(trimmedId, StringComparison.OrdinalIgnoreCase)
            ).FirstOrDefaultAsync();

            if (user == null)
            {
                return null;
            }

            bool passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!passwordValid)
            {
                return null;
            }

            if (user.Status == AccountStatus.Deactivated)
            {
                throw new InvalidOperationException("This account is deactivated. Please contact Backoffice administration for reactivation.");
            }

            // Generate bearer token representation for client session persistence
            var token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{user.NIC}:{user.Role}:{DateTime.UtcNow.Ticks}"));

            return new LoginResponse
            {
                NIC = user.NIC,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString(),
                Status = user.Status.ToString(),
                Token = token
            };
        }

        public async Task<UserResponse> RegisterProsumerAsync(RegisterProsumerRequest request)
        {
            // Inline: Validates that NIC and email are unique across the system, hashes password, and persists a new prosumer profile.
            var cleanNic = request.NIC.Trim().ToUpperInvariant();
            var cleanEmail = request.Email.Trim().ToLowerInvariant();

            var existingByNic = await _context.Users.Find(u => u.NIC == cleanNic).FirstOrDefaultAsync();
            if (existingByNic != null)
            {
                throw new ArgumentException($"A user with NIC '{cleanNic}' is already registered.");
            }

            var existingByEmail = await _context.Users.Find(u => u.Email == cleanEmail).FirstOrDefaultAsync();
            if (existingByEmail != null)
            {
                throw new ArgumentException($"A user with Email '{cleanEmail}' is already registered.");
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            var prosumer = User.CreateProsumer(
                cleanNic,
                request.FullName,
                cleanEmail,
                request.PhoneNumber,
                passwordHash,
                request.Address,
                request.SolarCapacityKW
            );

            await _context.Users.InsertOneAsync(prosumer);
            return MapToResponse(prosumer);
        }

        public async Task<UserResponse> CreateStaffUserAsync(CreateOperatorRequest request)
        {
            // Inline: Provisions internal operational personnel (Backoffice or GridOperator) with validated roles and security credentials.
            var cleanNic = request.NIC.Trim().ToUpperInvariant();
            var cleanEmail = request.Email.Trim().ToLowerInvariant();

            var existing = await _context.Users.Find(u => u.NIC == cleanNic || u.Email == cleanEmail).FirstOrDefaultAsync();
            if (existing != null)
            {
                throw new ArgumentException("A staff user with this NIC or Email already exists.");
            }

            var user = new User
            {
                NIC = cleanNic,
                FullName = request.FullName.Trim(),
                Email = cleanEmail,
                PhoneNumber = request.PhoneNumber.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = request.Role,
                Status = AccountStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Users.InsertOneAsync(user);
            return MapToResponse(user);
        }

        public async Task<UserResponse?> GetUserByNicAsync(string nic)
        {
            // Inline: Queries the Users collection using NIC as the unique lookup key.
            var cleanNic = nic.Trim().ToUpperInvariant();
            var user = await _context.Users.Find(u => u.NIC == cleanNic).FirstOrDefaultAsync();
            return user != null ? MapToResponse(user) : null;
        }

        public async Task<List<UserResponse>> GetUsersAsync(UserRole? role = null, AccountStatus? status = null)
        {
            // Inline: Retrieves a list of users filtered optionally by role and account status.
            var builder = Builders<User>.Filter;
            var filter = builder.Empty;

            if (role.HasValue)
            {
                filter &= builder.Eq(u => u.Role, role.Value);
            }

            if (status.HasValue)
            {
                filter &= builder.Eq(u => u.Status, status.Value);
            }

            var list = await _context.Users.Find(filter).ToListAsync();
            return list.Select(MapToResponse).ToList();
        }

        public async Task<List<UserResponse>> GetPendingProsumersAsync()
        {
            // Inline: Queries all prosumer registrations that are pending approval for Backoffice administrators.
            var filter = Builders<User>.Filter.And(
                Builders<User>.Filter.Eq(u => u.Role, UserRole.Prosumer),
                Builders<User>.Filter.Eq(u => u.Status, AccountStatus.PendingApproval)
            );
            var list = await _context.Users.Find(filter).ToListAsync();
            return list.Select(MapToResponse).ToList();
        }

        public async Task<UserResponse> UpdateProsumerProfileAsync(string nic, UpdateProfileRequest request)
        {
            // Inline: Updates profile metadata such as full name, phone number, address, and solar capacity for the specified prosumer.
            var cleanNic = nic.Trim().ToUpperInvariant();
            var update = Builders<User>.Update
                .Set(u => u.FullName, request.FullName.Trim())
                .Set(u => u.PhoneNumber, request.PhoneNumber.Trim())
                .Set(u => u.Address, request.Address.Trim())
                .Set(u => u.SolarCapacityKW, request.SolarCapacityKW)
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            var options = new FindOneAndUpdateOptions<User> { ReturnDocument = ReturnDocument.After };
            var updated = await _context.Users.FindOneAndUpdateAsync<User>(u => u.NIC == cleanNic, update, options);

            if (updated == null)
            {
                throw new KeyNotFoundException($"User with NIC '{cleanNic}' was not found.");
            }

            return MapToResponse(updated);
        }

        public async Task<bool> DeactivateAccountAsync(string nic, string requestedByNic)
        {
            // Inline: Marks the user profile as Deactivated and records the deactivation timestamp and requester NIC.
            var cleanNic = nic.Trim().ToUpperInvariant();
            var update = Builders<User>.Update
                .Set(u => u.Status, AccountStatus.Deactivated)
                .Set(u => u.DeactivatedAt, DateTime.UtcNow)
                .Set(u => u.DeactivatedBy, requestedByNic.Trim().ToUpperInvariant())
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            var result = await _context.Users.UpdateOneAsync(u => u.NIC == cleanNic, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> ReactivateAccountByBackofficeAsync(string nic, string backofficeNic)
        {
            // Inline: Enforces business requirement that only a Backoffice officer can reactivate a deactivated user profile.
            var adminUser = await _context.Users.Find(u => u.NIC == backofficeNic.Trim().ToUpperInvariant()).FirstOrDefaultAsync();
            if (adminUser == null || adminUser.Role != UserRole.Backoffice)
            {
                throw new UnauthorizedAccessException("Forbidden: Only Backoffice officers are authorized to reactivate deactivated user accounts.");
            }

            var cleanNic = nic.Trim().ToUpperInvariant();
            var update = Builders<User>.Update
                .Set(u => u.Status, AccountStatus.Active)
                .Set(u => u.DeactivatedAt, (DateTime?)null)
                .Set(u => u.DeactivatedBy, (string?)null)
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            var result = await _context.Users.UpdateOneAsync(u => u.NIC == cleanNic, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> ApproveProsumerRegistrationAsync(string nic, string backofficeNic)
        {
            // Inline: Allows Backoffice officers to approve a pending prosumer registration into Active status.
            var adminUser = await _context.Users.Find(u => u.NIC == backofficeNic.Trim().ToUpperInvariant()).FirstOrDefaultAsync();
            if (adminUser == null || adminUser.Role != UserRole.Backoffice)
            {
                throw new UnauthorizedAccessException("Forbidden: Only Backoffice officers can approve prosumer accounts.");
            }

            var cleanNic = nic.Trim().ToUpperInvariant();
            var update = Builders<User>.Update
                .Set(u => u.Status, AccountStatus.Active)
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            var result = await _context.Users.UpdateOneAsync(u => u.NIC == cleanNic, update);
            return result.ModifiedCount > 0;
        }

        private static UserResponse MapToResponse(User user)
        {
            // Inline: Projects internal User entity model to outward-facing UserResponse DTO.
            return new UserResponse
            {
                Id = user.Id ?? string.Empty,
                NIC = user.NIC,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role.ToString(),
                Status = user.Status.ToString(),
                Address = user.Address,
                SolarCapacityKW = user.SolarCapacityKW,
                CreatedAt = user.CreatedAt
            };
        }
    }
}
