// ============================================================================
// File: ReservationsController.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: API controller for energy reservations, enforcing the 7-day booking window, 12-hour cancellation/update thresholds, and operator QR completion.
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
    public class ReservationsController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public ReservationsController(IBookingService bookingService)
        {
            // Inline: Injects the central FAT booking service to coordinate reservations and enforce validation rules.
            _bookingService = bookingService;
        }

        /// <summary>
        /// Creates a new energy reservation. Enforces 7-day future window validation.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ReservationResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Create([FromBody] CreateReservationRequest request)
        {
            // Inline: Calls the FAT service to validate the 7-day scheduling window, confirm prosumer status and slot availability, and persist reservation with secure QR payload.
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await _bookingService.CreateReservationAsync(request);
                return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
            }
            catch (ArgumentOutOfRangeException ex)
            {
                return BadRequest(new { error = "ValidationError", message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = "InvalidOperation", message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = "NotFound", message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Modifies/updates an existing reservation. Enforces the 12-hour notice threshold.
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ReservationResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(string id, [FromQuery] string prosumerNic, [FromBody] UpdateReservationRequest request)
        {
            // Inline: Enforces at least 12 hours' notice prior to slot start time before allowing modification.
            if (string.IsNullOrWhiteSpace(prosumerNic))
            {
                return BadRequest(new { message = "prosumerNic query parameter is required." });
            }

            try
            {
                var updated = await _bookingService.UpdateReservationAsync(id, prosumerNic, request);
                return Ok(updated);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = "ThresholdError", message = ex.Message });
            }
            catch (ArgumentOutOfRangeException ex)
            {
                return BadRequest(new { error = "ValidationError", message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = "NotFound", message = ex.Message });
            }
        }

        /// <summary>
        /// Cancels an existing reservation. Enforces the minimum 12-hour notice threshold.
        /// </summary>
        [HttpPost("{id}/cancel")]
        [ProducesResponseType(typeof(ReservationResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Cancel(string id, [FromBody] CancelReservationRequest request)
        {
            // Inline: Validates that cancellation request satisfies the mandatory 12-hour threshold.
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var cancelled = await _bookingService.CancelReservationAsync(id, request);
                return Ok(cancelled);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = "CancellationWindowExpired", message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = "NotFound", message = ex.Message });
            }
        }

        /// <summary>
        /// Grid Operator mode: Verifies QR token, confirms Approved status, validates GridOperator role, and completes trade.
        /// </summary>
        [HttpPost("verify-and-complete")]
        [ProducesResponseType(typeof(ReservationResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> VerifyAndComplete([FromBody] VerifyAndCompleteRequest request)
        {
            // Inline: Verifies QR token signature, confirms reservation is currently in Approved status, validates GridOperator role, sets status to Completed, and timestamps completion.
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var completed = await _bookingService.VerifyAndCompleteAsync(request);
                return Ok(completed);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = "InvalidQRCode", message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { error = "Forbidden", message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = "InvalidOperation", message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = "NotFound", message = ex.Message });
            }
        }

        /// <summary>
        /// Grid Operator mode: Scans and verifies transaction QR token and finalizes energy transfer.
        /// </summary>
        [HttpPost("finalize-transfer")]
        [ProducesResponseType(typeof(ReservationResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> FinalizeTransfer([FromBody] FinalizeTransferRequest request)
        {
            // Inline: Authenticates the cryptographic QR token, logs the Grid Operator, and transitions reservation status to Completed.
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var completed = await _bookingService.FinalizeTransferAsync(request);
                return Ok(completed);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = "InvalidQRCode", message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { error = "Forbidden", message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = "InvalidOperation", message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = "NotFound", message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves an individual reservation by ID.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ReservationResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(string id)
        {
            // Inline: Fetches reservation details by MongoDB document ID.
            var reservation = await _bookingService.GetReservationByIdAsync(id);
            if (reservation == null)
            {
                return NotFound(new { message = $"Reservation with ID '{id}' was not found." });
            }

            return Ok(reservation);
        }

        /// <summary>
        /// Retrieves reservations with optional filters (prosumer NIC, station ID, status, date range, search).
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(List<ReservationResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetList([FromQuery] ReservationFilterRequest filter)
        {
            // Inline: Queries reservation records matching provided search and status filters.
            var list = await _bookingService.GetReservationsAsync(filter);
            return Ok(list);
        }

        /// <summary>
        /// Retrieves all bookings for a specific prosumer by NIC.
        /// </summary>
        [HttpGet("prosumer/{nic}")]
        [ProducesResponseType(typeof(List<ReservationResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetByProsumer(string nic)
        {
            // Inline: Returns the personal booking history and pending reservations for a prosumer.
            var list = await _bookingService.GetReservationsByProsumerAsync(nic);
            return Ok(list);
        }

        /// <summary>
        /// Returns system-wide operational metrics and reservation counts for web/mobile dashboards.
        /// </summary>
        [HttpGet("dashboard-summary")]
        [ProducesResponseType(typeof(DashboardSummaryResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDashboardSummary()
        {
            // Inline: Computes count of active stations, total prosumers, pending reservations, and count of approved future reservations.
            var summary = await _bookingService.GetDashboardSummaryAsync();
            return Ok(summary);
        }
    }
}
