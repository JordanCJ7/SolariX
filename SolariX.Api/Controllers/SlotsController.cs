// ============================================================================
// File: SlotsController.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: API controller for querying available time slots and scheduling battery storage intervals.
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
    public class SlotsController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public SlotsController(IBookingService bookingService)
        {
            // Inline: Injects central booking service to manage and retrieve battery storage slots.
            _bookingService = bookingService;
        }

        /// <summary>
        /// Retrieves available energy booking slots for a station, optionally filtered by date.
        /// </summary>
        [HttpGet("station/{stationId}")]
        [ProducesResponseType(typeof(List<SlotResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSlots(string stationId, [FromQuery] DateTime? date)
        {
            // Inline: Queries available slots with capacity for the target station.
            var slots = await _bookingService.GetAvailableSlotsAsync(stationId, date);
            return Ok(slots);
        }

        /// <summary>
        /// Creates an individual energy booking slot.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(SlotResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateSlot([FromBody] CreateSlotRequest request)
        {
            // Inline: Adds a new booking slot to the station schedule.
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var created = await _bookingService.CreateSlotAsync(request);
            return CreatedAtAction(nameof(GetSlots), new { stationId = created.StationId }, created);
        }

        /// <summary>
        /// Batch-generates hourly slots for a station for an entire operational day.
        /// </summary>
        [HttpPost("generate-daily")]
        [ProducesResponseType(typeof(List<SlotResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GenerateDaily([FromBody] GenerateDailySlotsRequest request)
        {
            // Inline: Automatically populates daily recurring slots across operational hours for a station.
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var slots = await _bookingService.GenerateDailySlotsAsync(request);
                return Ok(slots);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
