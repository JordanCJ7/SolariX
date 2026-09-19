// ============================================================================
// File: AuthController.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: API controller handling authentication, prosumer onboarding, and credential verification.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using Microsoft.AspNetCore.Mvc;
using SolariX.Api.DTOs;
using SolariX.Api.Services;

namespace SolariX.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;

        public AuthController(IUserService userService)
        {
            // Inline: Injects the user management service for credential validation and token generation.
            _userService = userService;
        }

        /// <summary>
        /// Authenticates a prosumer, grid operator, or backoffice administrator.
        /// </summary>
        [HttpPost("login")]
        [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Inline: Validates credentials through the FAT user service and returns authenticated identity or 401 Unauthorized.
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await _userService.AuthenticateAsync(request);
                if (response == null)
                {
                    return Unauthorized(new { message = "Invalid NIC/Email or password." });
                }

                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Registers a new prosumer using their NIC as the unique key.
        /// </summary>
        [HttpPost("register-prosumer")]
        [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RegisterProsumer([FromBody] RegisterProsumerRequest request)
        {
            // Inline: Processes prosumer registration, enforces unique NIC and email constraints, and creates an active profile.
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var created = await _userService.RegisterProsumerAsync(request);
                return CreatedAtAction(nameof(GetProfile), new { nic = created.NIC }, created);
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
        /// Retrieves profile details for a specified NIC.
        /// </summary>
        [HttpGet("profile/{nic}")]
        [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProfile(string nic)
        {
            // Inline: Fetches user details by NIC and returns 404 if no matching user exists.
            var user = await _userService.GetUserByNicAsync(nic);
            if (user == null)
            {
                return NotFound(new { message = $"User with NIC '{nic}' was not found." });
            }

            return Ok(user);
        }
    }
}
