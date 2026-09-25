// ============================================================================
// File: ControllerValidationTests.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Unit tests validating HTTP status codes and error payloads returned by API controllers under business rule violations.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SolariX.Api.Controllers;
using SolariX.Api.DTOs;
using SolariX.Api.Services;
using Xunit;

namespace SolariX.Tests
{
    public class ControllerValidationTests
    {
        [Fact]
        public async Task CancelReservation_Returns400BadRequest_WhenUnder12HourThreshold()
        {
            // Inline: Tests that ReservationsController.Cancel catches the threshold exception from the FAT service and returns HTTP 400 Bad Request.
            var mockBookingService = new Mock<IBookingService>();
            var reservationId = "res_test_123";
            var request = new CancelReservationRequest
            {
                ProsumerNIC = "200012345678",
                Reason = "Late cancellation attempt"
            };

            mockBookingService
                .Setup(s => s.CancelReservationAsync(reservationId, request))
                .ThrowsAsync(new InvalidOperationException("Updates and cancellations require at least 12 hours' advance notice."));

            var controller = new ReservationsController(mockBookingService.Object);

            var result = await controller.Cancel(reservationId, request);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400, badRequestResult.StatusCode);
        }

        [Fact]
        public async Task CreateReservation_Returns400BadRequest_WhenBeyond7DayFutureWindow()
        {
            // Inline: Tests that ReservationsController.Create returns HTTP 400 Bad Request when 7-day future window is exceeded.
            var mockBookingService = new Mock<IBookingService>();
            var request = new CreateReservationRequest
            {
                ProsumerNIC = "200012345678",
                StationId = "station_test",
                SlotId = "slot_future",
                EnergyAmountKW = 10
            };

            mockBookingService
                .Setup(s => s.CreateReservationAsync(request))
                .ThrowsAsync(new ArgumentOutOfRangeException(nameof(request.SlotId), "Power trading reservations must be scheduled within 7 days."));

            var controller = new ReservationsController(mockBookingService.Object);

            var result = await controller.Create(request);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400, badRequestResult.StatusCode);
        }

        [Fact]
        public async Task VerifyAndComplete_Returns403Forbidden_WhenOperatorRoleInvalid()
        {
            // Inline: Tests that VerifyAndComplete endpoint returns HTTP 403 Forbidden when caller is not an authorized GridOperator.
            var mockBookingService = new Mock<IBookingService>();
            var request = new VerifyAndCompleteRequest
            {
                QrToken = "valid_token#hash",
                OperatorId = "NOT_AN_OPERATOR",
                EnergyDeliveredKWh = 20.0
            };

            mockBookingService
                .Setup(s => s.VerifyAndCompleteAsync(request))
                .ThrowsAsync(new UnauthorizedAccessException("Forbidden: Only users with the GridOperator role are authorized to verify and finalize energy transfers."));

            var controller = new ReservationsController(mockBookingService.Object);

            var result = await controller.VerifyAndComplete(request);

            var forbiddenResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(403, forbiddenResult.StatusCode);
        }

        [Fact]
        public async Task DeactivateStation_Returns400BadRequest_WhenActiveReservationsExist()
        {
            // Inline: Tests that StationsController.Deactivate returns HTTP 400 Bad Request when active reservations block deactivation.
            var mockStationService = new Mock<IStationService>();
            var stationId = "station_blocked_1";

            mockStationService
                .Setup(s => s.DeactivateStationAsync(stationId))
                .ThrowsAsync(new InvalidOperationException("Deactivation blocked: Solar station currently has active reservations."));

            var controller = new StationsController(mockStationService.Object);

            var result = await controller.Deactivate(stationId);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400, badRequestResult.StatusCode);
        }

        [Fact]
        public async Task ReactivateAccount_Returns403Forbidden_WhenNotBackoffice()
        {
            // Inline: Tests that UsersController.Reactivate returns HTTP 403 Forbidden if a non-backoffice caller attempts reactivation.
            var mockUserService = new Mock<IUserService>();
            var targetNic = "200012345678";
            var nonAdminNic = "GO2000000002";

            mockUserService
                .Setup(s => s.ReactivateAccountByBackofficeAsync(targetNic, nonAdminNic))
                .ThrowsAsync(new UnauthorizedAccessException("Forbidden: Only Backoffice officers are authorized to reactivate deactivated user accounts."));

            var controller = new UsersController(mockUserService.Object);

            var result = await controller.Reactivate(targetNic, nonAdminNic);

            var statusResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(403, statusResult.StatusCode);
        }
    }
}
