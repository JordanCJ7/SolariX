// ============================================================================
// File: UsersController.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: API controller for managing user profiles, role-based administration, deactivations, and Backoffice-only reactivations.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using Microsoft.AspNetCore.Mvc;
using SolariX.Api.DTOs;
using SolariX.Api.Models;
using SolariX.Api.Services;

namespace SolariX.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            // Inline: Injects user service for lifecycle, updates, and authorization validations.
            _userService = userService;
        }

        /// <summary>
        /// Retrieves all users filtered optionally by role and status.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(List<UserResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] UserRole? role, [FromQuery] AccountStatus? status)
        {
            // Inline: Retrieves a list of platform users based on requested role and status filters.
            var users = await _userService.GetUsersAsync(role, status);
            return Ok(users);
        }

        /// <summary>
        /// Retrieves pending prosumer registrations requiring Backoffice verification.
        /// </summary>
        [HttpGet("pending-prosumers")]
        [ProducesResponseType(typeof(List<UserResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPendingProsumers()
        {
            // Inline: Queries all prosumer profiles currently awaiting administrator approval.
            var list = await _userService.GetPendingProsumersAsync();
            return Ok(list);
        }

        /// <summary>
        /// Creates a new Backoffice or Grid Operator staff user.
        /// </summary>
        [HttpPost("staff")]
        [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateStaff([FromBody] CreateOperatorRequest request)
        {
            // Inline: Enforces creation of operational roles with role restrictions and unique identity keys.
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var created = await _userService.CreateStaffUserAsync(request);
                return CreatedAtAction("GetAll", new { id = created.Id }, created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Updates a prosumer profile (name, phone, address, solar capacity).
        /// </summary>
        [HttpPut("prosumer/{nic}")]
        [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateProfile(string nic, [FromBody] UpdateProfileRequest request)
        {
            // Inline: Updates profile information for the specified prosumer NIC.
            try
            {
                var updated = await _userService.UpdateProsumerProfileAsync(nic, request);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Deactivates a user account.
        /// </summary>
        [HttpPost("{nic}/deactivate")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Deactivate(string nic, [FromQuery] string requestedByNic)
        {
            // Inline: Updates account status to Deactivated and logs the requesting identity.
            if (string.IsNullOrWhiteSpace(requestedByNic))
            {
                return BadRequest(new { message = "requestedByNic parameter is required." });
            }

            var success = await _userService.DeactivateAccountAsync(nic, requestedByNic);
            if (!success)
            {
                return BadRequest(new { message = $"Could not deactivate user with NIC '{nic}'." });
            }

            return Ok(new { message = $"Account '{nic}' has been successfully deactivated." });
        }

        /// <summary>
        /// Reactivates a deactivated account. Strictly requires Backoffice authorization.
        /// </summary>
        [HttpPost("{nic}/reactivate")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Reactivate(string nic, [FromQuery] string backofficeNic)
        {
            // Inline: Enforces that only Backoffice personnel can reactivate deactivated accounts as per assignment requirements.
            if (string.IsNullOrWhiteSpace(backofficeNic))
            {
                return BadRequest(new { message = "backofficeNic parameter is required." });
            }

            try
            {
                var success = await _userService.ReactivateAccountByBackofficeAsync(nic, backofficeNic);
                if (!success)
                {
                    return BadRequest(new { message = $"Could not reactivate user with NIC '{nic}'." });
                }

                return Ok(new { message = $"Account '{nic}' has been successfully reactivated by Backoffice officer '{backofficeNic}'." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Approves a pending prosumer registration. Requires Backoffice authorization.
        /// </summary>
        [HttpPost("{nic}/approve")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> Approve(string nic, [FromQuery] string backofficeNic)
        {
            // Inline: Approves prosumer registration by a Backoffice user.
            try
            {
                var success = await _userService.ApproveProsumerRegistrationAsync(nic, backofficeNic);
                if (!success)
                {
                    return BadRequest(new { message = $"Could not approve user with NIC '{nic}'." });
                }

                return Ok(new { message = $"Prosumer account '{nic}' approved." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
        }
    }
}
