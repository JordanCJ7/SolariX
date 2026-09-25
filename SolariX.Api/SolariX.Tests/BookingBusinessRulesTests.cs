// ============================================================================
// File: BookingBusinessRulesTests.cs
// Project: SolariX - Smart Solar Microgrid Trading System
// Description: Unit tests validating the FAT service business rules: 7-day future window, 12-hour cancellation/update thresholds, node deactivation conflicts, and QR validation.
// Module: SE4040 Enterprise Application Development
// ============================================================================

using System.Threading;
using System.Threading.Tasks;
using MongoDB.Driver;
using Moq;
using SolariX.Api.Data;
using SolariX.Api.DTOs;
using SolariX.Api.Models;
using SolariX.Api.Services;
using Xunit;

namespace SolariX.Tests
{
    public class BookingBusinessRulesTests
    {
        private readonly Mock<IMongoDbContext> _mockContext;
        private readonly Mock<IQRService> _mockQrService;
        private readonly Mock<IMongoCollection<User>> _mockUsers;
        private readonly Mock<IMongoCollection<SolarStationInfo>> _mockStations;
        private readonly Mock<IMongoCollection<EnergyBookingSlot>> _mockSlots;
        private readonly Mock<IMongoCollection<EnergyReservation>> _mockReservations;

        public BookingBusinessRulesTests()
        {
            // Inline: Prepares mock MongoDB context and collections for isolated business rule verification.
            _mockContext = new Mock<IMongoDbContext>();
            _mockQrService = new Mock<IQRService>();

            _mockUsers = new Mock<IMongoCollection<User>>();
            _mockStations = new Mock<IMongoCollection<SolarStationInfo>>();
            _mockSlots = new Mock<IMongoCollection<EnergyBookingSlot>>();
            _mockReservations = new Mock<IMongoCollection<EnergyReservation>>();

            _mockContext.Setup(c => c.Users).Returns(_mockUsers.Object);
            _mockContext.Setup(c => c.SolarStationInfo).Returns(_mockStations.Object);
            _mockContext.Setup(c => c.EnergyBookingSlots).Returns(_mockSlots.Object);
            _mockContext.Setup(c => c.EnergyReservations).Returns(_mockReservations.Object);
        }

        [Fact]
        public void QRService_GeneratesAndValidates_TamperProofPayload()
        {
            // Inline: Verifies that QRService generates a valid signed payload with { ReservationId, ProsumerNIC, StationId, SlotId, Timestamp, SignatureHash } and detects tampering.
            var qrService = new QRService();
            var reservationId = "66ea1234567890abcdef1234";
            var prosumerNic = "200012345678";
            var stationId = "station123";
            var slotId = "slot456";
            var slotStartTime = DateTime.UtcNow.AddDays(2);

            var payload = qrService.GenerateQrPayload(reservationId, prosumerNic, stationId, slotId, slotStartTime);
            Assert.NotNull(payload);
            Assert.Contains("#", payload);

            // Validate authentic payload
            bool isValid = qrService.ValidateQrPayload(payload, out var extractedResId, out var extractedNic, out var extractedStationId, out var extractedSlotId, out _);
            Assert.True(isValid);
            Assert.Equal(reservationId, extractedResId);
            Assert.Equal(prosumerNic, extractedNic);
            Assert.Equal(stationId, extractedStationId);
            Assert.Equal(slotId, extractedSlotId);

            // Validate tampered payload fails
            var tamperedPayload = payload.Replace(prosumerNic, "999999999999");
            bool isTamperedValid = qrService.ValidateQrPayload(tamperedPayload, out _, out _, out _, out _, out _);
            Assert.False(isTamperedValid);
        }

        [Fact]
        public async Task CancelReservation_Fails_WhenLessThan12HoursRemaining()
        {
            // Inline: Enforces the 12-hour rule: attempting to cancel a slot scheduled in 5 hours must throw an InvalidOperationException.
            var reservationId = "res_001";
            var prosumerNic = "200012345678";
            var now = DateTime.UtcNow;

            // Reservation scheduled only 5 hours from now (< 12 hours)
            var reservation = new EnergyReservation
            {
                Id = reservationId,
                ReservationNumber = "RES-001",
                ProsumerNIC = prosumerNic,
                StationId = "station_001",
                SlotId = "slot_001",
                ReservationDate = now.Date,
                StartTime = now.AddHours(5),
                EndTime = now.AddHours(6),
                EnergyAmountKW = 10,
                Status = ReservationStatus.Approved
            };

            var mockCursor = new Mock<IAsyncCursor<EnergyReservation>>();
            mockCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            mockCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            mockCursor.Setup(c => c.Current).Returns(new List<EnergyReservation> { reservation });

            _mockReservations
                .Setup(r => r.FindAsync(
                    It.IsAny<FilterDefinition<EnergyReservation>>(),
                    It.IsAny<FindOptions<EnergyReservation, EnergyReservation>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockCursor.Object);

            var bookingService = new BookingService(_mockContext.Object, _mockQrService.Object);

            var cancelRequest = new CancelReservationRequest
            {
                ProsumerNIC = prosumerNic,
                Reason = "Need to cancel"
            };

            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                bookingService.CancelReservationAsync(reservationId, cancelRequest));

            Assert.Contains("at least 12 hours' advance notice", exception.Message);
        }

        [Fact]
        public async Task UpdateReservation_Fails_WhenLessThan12HoursRemaining()
        {
            // Inline: Enforces the 12-hour rule: attempting to modify a slot scheduled in 3 hours must throw an InvalidOperationException.
            var reservationId = "res_002";
            var prosumerNic = "200012345678";
            var now = DateTime.UtcNow;

            var reservation = new EnergyReservation
            {
                Id = reservationId,
                ReservationNumber = "RES-002",
                ProsumerNIC = prosumerNic,
                StationId = "station_001",
                SlotId = "slot_001",
                ReservationDate = now.Date,
                StartTime = now.AddHours(3),
                EndTime = now.AddHours(4),
                EnergyAmountKW = 10,
                Status = ReservationStatus.Approved
            };

            var mockCursor = new Mock<IAsyncCursor<EnergyReservation>>();
            mockCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            mockCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            mockCursor.Setup(c => c.Current).Returns(new List<EnergyReservation> { reservation });

            _mockReservations
                .Setup(r => r.FindAsync(
                    It.IsAny<FilterDefinition<EnergyReservation>>(),
                    It.IsAny<FindOptions<EnergyReservation, EnergyReservation>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockCursor.Object);

            var bookingService = new BookingService(_mockContext.Object, _mockQrService.Object);

            var updateRequest = new UpdateReservationRequest
            {
                NewEnergyAmountKW = 15.0
            };

            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                bookingService.UpdateReservationAsync(reservationId, prosumerNic, updateRequest));

            Assert.Contains("at least 12 hours' advance notice", exception.Message);
        }

        [Fact]
        public async Task CreateReservation_Fails_WhenBookingBeyond7DayFutureWindow()
        {
            // Inline: Enforces the 7-day rule: attempting to schedule a booking 10 days in the future must throw an ArgumentOutOfRangeException.
            var prosumerNic = "200012345678";
            var stationId = "station_001";
            var slotId = "slot_001";
            var now = DateTime.UtcNow;

            // User active
            var prosumer = new User { NIC = prosumerNic, Status = AccountStatus.Active, Role = UserRole.Prosumer };
            var mockUserCursor = new Mock<IAsyncCursor<User>>();
            mockUserCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            mockUserCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            mockUserCursor.Setup(c => c.Current).Returns(new List<User> { prosumer });
            _mockUsers.Setup(u => u.FindAsync(It.IsAny<FilterDefinition<User>>(), It.IsAny<FindOptions<User, User>>(), It.IsAny<CancellationToken>()))
                      .ReturnsAsync(mockUserCursor.Object);

            // Station active
            var station = new SolarStationInfo { Id = stationId, StationName = "Main Hub", IsActive = true };
            var mockStationCursor = new Mock<IAsyncCursor<SolarStationInfo>>();
            mockStationCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            mockStationCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            mockStationCursor.Setup(c => c.Current).Returns(new List<SolarStationInfo> { station });
            _mockStations.Setup(s => s.FindAsync(It.IsAny<FilterDefinition<SolarStationInfo>>(), It.IsAny<FindOptions<SolarStationInfo, SolarStationInfo>>(), It.IsAny<CancellationToken>()))
                         .ReturnsAsync(mockStationCursor.Object);

            // Slot scheduled 10 days in future (> 7 days)
            var futureSlot = new EnergyBookingSlot
            {
                Id = slotId,
                StationId = stationId,
                SlotDate = now.Date.AddDays(10),
                StartTime = now.Date.AddDays(10).AddHours(10),
                EndTime = now.Date.AddDays(10).AddHours(11),
                AvailableCapacityKW = 50,
                Status = SlotStatus.Available
            };
            var mockSlotCursor = new Mock<IAsyncCursor<EnergyBookingSlot>>();
            mockSlotCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            mockSlotCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            mockSlotCursor.Setup(c => c.Current).Returns(new List<EnergyBookingSlot> { futureSlot });
            _mockSlots.Setup(s => s.FindAsync(It.IsAny<FilterDefinition<EnergyBookingSlot>>(), It.IsAny<FindOptions<EnergyBookingSlot, EnergyBookingSlot>>(), It.IsAny<CancellationToken>()))
                      .ReturnsAsync(mockSlotCursor.Object);

            var bookingService = new BookingService(_mockContext.Object, _mockQrService.Object);

            var request = new CreateReservationRequest
            {
                ProsumerNIC = prosumerNic,
                StationId = stationId,
                SlotId = slotId,
                EnergyAmountKW = 10,
                TradeType = "DropOff"
            };

            var exception = await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
                bookingService.CreateReservationAsync(request));

            Assert.Contains("Power trading reservations must be scheduled within 7 days", exception.Message);
        }

        [Fact]
        public async Task DeactivateStation_Fails_WhenActiveReservationsExist()
        {
            // Inline: Enforces node deactivation rule: if active reservations exist for the solar hub, deactivation must be rejected with an InvalidOperationException.
            var stationId = "station_active_001";
            var station = new SolarStationInfo
            {
                Id = stationId,
                StationName = "Kaduwela Hub",
                IsActive = true
            };

            var mockStationCursor = new Mock<IAsyncCursor<SolarStationInfo>>();
            mockStationCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            mockStationCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            mockStationCursor.Setup(c => c.Current).Returns(new List<SolarStationInfo> { station });
            _mockStations.Setup(s => s.FindAsync(It.IsAny<FilterDefinition<SolarStationInfo>>(), It.IsAny<FindOptions<SolarStationInfo, SolarStationInfo>>(), It.IsAny<CancellationToken>()))
                         .ReturnsAsync(mockStationCursor.Object);

            _mockReservations
                .Setup(r => r.CountDocumentsAsync(It.IsAny<FilterDefinition<EnergyReservation>>(), It.IsAny<CountOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(3);

            var stationService = new StationService(_mockContext.Object);

            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                stationService.DeactivateStationAsync(stationId));

            Assert.Contains("Deactivation blocked", exception.Message);
            Assert.Contains("3 active or approved reservation(s)", exception.Message);
        }

        [Fact]
        public async Task ReactivateAccount_Fails_WhenNonBackofficeUserAttempts()
        {
            // Inline: Enforces prosumer lifecycle rule: only Backoffice officers can reactivate accounts; non-backoffice attempts must throw UnauthorizedAccessException.
            var operatorNic = "GO2000000002";
            var targetProsumerNic = "200012345678";

            var gridOperator = new User
            {
                NIC = operatorNic,
                FullName = "Field Operator",
                Role = UserRole.GridOperator,
                Status = AccountStatus.Active
            };

            var mockUserCursor = new Mock<IAsyncCursor<User>>();
            mockUserCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            mockUserCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            mockUserCursor.Setup(c => c.Current).Returns(new List<User> { gridOperator });
            _mockUsers.Setup(u => u.FindAsync(It.IsAny<FilterDefinition<User>>(), It.IsAny<FindOptions<User, User>>(), It.IsAny<CancellationToken>()))
                      .ReturnsAsync(mockUserCursor.Object);

            var userService = new UserService(_mockContext.Object);

            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                userService.ReactivateAccountByBackofficeAsync(targetProsumerNic, operatorNic));

            Assert.Contains("Only Backoffice officers are authorized to reactivate", exception.Message);
        }
    }
}
