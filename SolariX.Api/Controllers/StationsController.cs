// ============================================================================
// File: StationsController.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: API controller for solar microgrid hub management, location mapping, and reservation-guarded node deactivation.
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
    public class StationsController : ControllerBase
    {
        private readonly IStationService _stationService;

        public StationsController(IStationService stationService)
        {
            // Inline: Injects station management service for hub operations and deactivation validation.
            _stationService = stationService;
        }

        /// <summary>
        /// Retrieves all solar stations, optionally filtered to only active hubs.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(List<StationResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] bool? activeOnly)
        {
            // Inline: Returns solar stations including coordinates, capacity, and slot metrics.
            var stations = await _stationService.GetAllStationsAsync(activeOnly);
            return Ok(stations);
        }

        /// <summary>
        /// Retrieves a single station by its unique MongoDB identifier.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(StationResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(string id)
        {
            // Inline: Fetches detailed specifications and battery slot information for a single hub.
            var station = await _stationService.GetStationByIdAsync(id);
            if (station == null)
            {
                return NotFound(new { message = $"Station with ID '{id}' was not found." });
            }

            return Ok(station);
        }

        /// <summary>
        /// Creates a new solar microgrid hub.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(StationResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreateStationRequest request)
        {
            // Inline: Validates and persists a new solar station hub.
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var created = await _stationService.CreateStationAsync(request);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Updates solar station specifications, operational hours, or battery slot counts.
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(StationResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateStationRequest request)
        {
            // Inline: Modifies station attributes; guards against deactivation if active reservations exist.
            try
            {
                var updated = await _stationService.UpdateStationAsync(id, request);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Deactivates a solar station hub. Checks for active reservations before proceeding.
        /// </summary>
        [HttpPost("{id}/deactivate")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Deactivate(string id)
        {
            // Inline: Enforces the FAT service rule: deactivation is blocked if active reservations exist.
            try
            {
                var success = await _stationService.DeactivateStationAsync(id);
                if (!success)
                {
                    return BadRequest(new { message = "Unable to deactivate station." });
                }

                return Ok(new { message = $"Solar station with ID '{id}' was successfully deactivated." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Reactivates an inactive solar station hub.
        /// </summary>
        [HttpPost("{id}/reactivate")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Reactivate(string id)
        {
            // Inline: Re-enables operational status for a station.
            try
            {
                var success = await _stationService.ReactivateStationAsync(id);
                if (!success)
                {
                    return BadRequest(new { message = "Unable to reactivate station." });
                }

                return Ok(new { message = $"Solar station with ID '{id}' was reactivated." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
