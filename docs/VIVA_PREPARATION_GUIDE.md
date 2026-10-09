# SolariX — Comprehensive Viva & Technical Defense Guide
**Module**: SE4040 Enterprise Application Development | Year 4 Semester 2 (2026)  
**System**: SolariX - Smart Solar Microgrid Trading System  
**Target Audience**: Examiners, Panel Members & Student Defense  

---

## 1. High-Level Architectural Defense

### Core Architectural Philosophy: The "FAT Service" Pattern
In accordance with **Specification Clause (c)**:
- **FAT Service Concept**: All business rules, validation logic, state machine transitions, cryptographic signing, and data persistence reside **exclusively** in the central C# ASP.NET Core 8 Web API.
- **Thin Clients**: Both the **React Web Application** and the **Native Android Mobile Application** act strictly as presentation/UI interfaces. Neither client makes independent business decisions (e.g., neither client calculates whether a cancellation is within 12 hours or whether a slot has capacity; both delegate to the API and handle HTTP responses/errors gracefully).
- **Communication Protocol**: Pure RESTful API over HTTP/JSON. No direct database drivers or socket connections from clients to MongoDB.

```mermaid
graph TD
    subgraph Client Layer (Thin Clients)
        WA["Web Application (React 18 + Vite + Tailwind)"]
        MA["Mobile Application (Native Android + Kotlin + Room SQLite)"]
    end

    subgraph Hosting & Web Server
        IIS["Windows IIS (W3SVC)"]
        ANCM["AspNetCoreModuleV2 (In-Process Hosting)"]
    end

    subgraph The FAT Service (C# .NET 8 Web API)
        CTRL["API Controllers (Auth, Users, Stations, Slots, Reservations)"]
        SVC["Service Layer (UserService, StationService, BookingService, QRService)"]
        DAL["Data Access Layer (MongoDbContext, MongoDbSettings)"]
    end

    subgraph Database Layer
        MDB[("MongoDB Atlas (SolarixDb NoSQL)")]
    end

    WA -->|HTTPS / REST API| IIS
    MA -->|HTTP/REST 10.0.2.2:5119| IIS
    IIS --> ANCM
    ANCM --> CTRL
    CTRL --> SVC
    SVC --> DAL
    DAL --> MDB
```

---

## 2. Technology Stack & Scaffolding Justification

### 1. Central Web API (Backend)
- **Framework**: ASP.NET Core 8.0 Web API (`net8.0`).
- **Initial Scaffolding**: Generated via `dotnet new webapi -n SolariX.Api --no-openapi` and structured with Clean/Layered architecture:
  - `Controllers/`: HTTP routing, request model binding, and status codes (200, 201, 400, 403, 404).
  - `Services/`: Core business logic, validation rules, QR HMAC signing.
  - `Models/`: Domain entities mapped directly to MongoDB BSON collections.
  - `DTOs/`: Strictly typed Data Transfer Objects preventing over-posting and circular serialization.
  - `Data/`: MongoDB context and automated seeding (`DbSeeder.cs`).
- **Hosting Model**: **In-Process Hosting** in IIS using `AspNetCoreModuleV2`. Configured via `web.config`.
- **Database Driver**: Official `MongoDB.Driver` (v2.28+).

### 2. Backoffice & Grid Operator Web Portal
- **Framework**: React 18 + Vite (SPA) + Tailwind CSS + Lucide Icons + Axios.
- **Scaffolding**: Initialized via `npm create vite@latest web-client -- --template react`.
- **Styling Choice**: Tailwind CSS for responsive utility styling and custom dark-mode glassmorphic theme.
- **State & Routing**: React Router v6 for protected client routes; Context API (`AuthContext.jsx`) for JWT session state.

### 3. Solar Prosumer & Grid Operator Mobile Client
- **Platform**: **Pure Native Android** using Kotlin (API Level 26+ / Android 8.0+ to Android 14+).
- **Constraint Compliance**: **Zero cross-platform frameworks** (No Flutter, React Native, or Cordova).
- **Architecture**: MVVM with Android Architecture Components (Activities, Repositories, ViewModels/Coroutines).
- **Local Persistence**: **Room Persistence Library over SQLite** (`solarix_database.db`), providing local offline caching of user credentials and bookings as required by the brief.
- **Networking**: Retrofit 2 + OkHttp 3 with `HttpLoggingInterceptor`.
- **Hardware Integrations**:
  - **Camera**: ZXing Android Embedded (`BarcodeView` / `CaptureActivity`) for real-time QR token scanning.
  - **GPS & Maps**: Google Play Services Maps SDK (`com.google.android.gms:play-services-maps`) with custom markers and station detail bottom sheets.

---

## 3. Database Design & Data Modeling (MongoDB NoSQL)

As explicitly specified in the brief and Table 1 of the rubric, the database consists of **exactly four primary collections**:

| Collection Name | C# Model Entity | Primary Key / Index | Key Fields & Role |
| :--- | :--- | :--- | :--- |
| `Users` | `User.cs` | `NIC` (Unique string index) | `NIC`, `FullName`, `Email`, `PasswordHash` (BCrypt), `Role` (`Backoffice`, `GridOperator`, `Prosumer`), `Status` (`Active`, `PendingApproval`, `Deactivated`), `SolarCapacityKW`. |
| `SolarStationInfo` | `SolarStationInfo.cs` | `Id` (`ObjectId`) | `StationCode` (Unique string), `StationName`, `Location`, `Latitude`, `Longitude`, `MaxCapacityKWh`, `AvailableSlotsCount`, `IsActive`. |
| `EnergyBookingSlots` | `EnergyBookingSlot.cs` | `Id` (`ObjectId`) | `StationId`, `SlotDate`, `StartTime`, `EndTime`, `MaxCapacityKW`, `AvailableCapacityKW`, `Status` (`Available`, `Booked`, `Blocked`). |
| `EnergyReservations` | `EnergyReservation.cs` | `Id` (`ObjectId`) / `ReservationNumber` | `ReservationNumber` (Human-readable, e.g. `RES-261009-847`), `ProsumerNIC`, `StationId`, `SlotId`, `ReservationDate`, `StartTime`, `EndTime`, `EnergyAmountKW`, `TradeType` (`Charge`, `DropOff`), `Status` (`Pending`, `Approved`, `Completed`, `Cancelled`), `QrCodeToken`, `FinalizedByOperatorNIC`. |

---

## 4. Requirement-by-Requirement Implementation & Viva Defense

### Requirement 1: User & Prosumer Management
- **The Rule**: NIC must be the primary key. Deactivated accounts can only be reactivated by a Backoffice officer.
- **How We Implemented It**:
  - `UserService.cs` enforces `NIC` as the unique lookup key across all operations (`GetUserByNicAsync`).
  - When a user requests deactivation, `DeactivateAccountAsync` sets `Status = AccountStatus.Deactivated`.
  - In `ReactivateAccountByBackofficeAsync(nic, backofficeNic)`, the API looks up the requester by `backofficeNic` and checks:
    ```csharp
    if (adminUser == null || adminUser.Role != UserRole.Backoffice)
        throw new UnauthorizedAccessException("Forbidden: Only Backoffice officers are authorized to reactivate deactivated user accounts.");
    ```
  - This rule is enforced at the API layer and validated in unit tests (`BookingBusinessRulesTests.cs`).

### Requirement 2: Microgrid Node Management & Deactivation Conflict
- **The Rule**: Hubs have GPS locations, capacity specs, and slots. Deactivation is strictly blocked if active reservations exist.
- **How We Implemented It**:
  - When Backoffice requests `PUT /api/stations/{id}/deactivate`, `StationService.cs` queries `EnergyReservations` for that station:
    ```csharp
    var activeReservationsCount = await GetActiveReservationsCountForStationAsync(id);
    if (activeReservationsCount > 0)
        throw new InvalidOperationException($"Deactivation blocked: Solar station '{station.StationName}' currently has {activeReservationsCount} active or approved reservation(s).");
    ```
  - Tested and verified in unit tests (`NodeDeactivation_Blocked_WhenActiveReservationsExist`).

### Requirement 3: 7-Day Future Window & 12-Hour Cancellation Rule
- **The Rule**: Reservations must be scheduled within 7 days. Modifications and cancellations require at least 12 hours' advance notice.
- **How We Implemented It**:
  - **7-Day Window**: In `BookingService.CreateReservationAsync`:
    ```csharp
    DateTime slotDateTimeUtc = DateTime.SpecifyKind(slot.SlotDate.Date.Add(slot.StartTime.TimeOfDay), DateTimeKind.Utc);
    if (slotDateTimeUtc > DateTime.UtcNow.AddDays(7))
        throw new ArgumentOutOfRangeException("Power trading reservations must be scheduled within 7 days from now.");
    ```
  - **12-Hour Cancellation/Update Rule**: In `BookingService.CancelReservationAsync` & `UpdateReservationAsync`:
    ```csharp
    var timeRemaining = slotDateTimeUtc - DateTime.UtcNow;
    if (timeRemaining < TimeSpan.FromHours(12))
        throw new InvalidOperationException($"Updates and cancellations require at least 12 hours' advance notice. Only {timeRemaining.TotalHours:F1} hour(s) remain.");
    ```
  - Upon cancellation, the slot's `AvailableCapacityKW` is automatically refunded back to the station slot (`$inc: reservation.EnergyAmountKW`).

### Requirement 4: The 3-Stage Booking Lifecycle & QR Dispatch
- **The Rule**: Once a booking is approved, a secure transaction QR code is generated. Grid operators scan and finalize the trade.
- **How We Implemented It**:
  1. **Creation**: Prosumer creates a booking via mobile app $\rightarrow$ Saved with `Status = ReservationStatus.Pending`.
  2. **Operator Audit**: Grid Operator views Pending bookings on the Web Portal and clicks **"Approve"** (`POST /api/reservations/{id}/approve`).
  3. **QR Dispatch**: Once `Approved`, the prosumer's mobile app displays the **"View QR"** button. The QR code contains an HMAC-SHA256 tamper-proof payload:
     `{ReservationId}#{ProsumerNIC}#{StationId}#{SlotId}#{Timestamp}#{HMACSignature}`
  4. **On-Site Scan**: Grid Operator scans the QR code via mobile camera (`QRScannerActivity.kt`). The app submits the token to `POST /api/reservations/verify-and-complete`. The API checks the HMAC signature, confirms the operator's role, transitions status to `Completed`, and records `FinalizedByOperatorNIC`.

---

## 5. Walkthrough of Every Project File

### Backend (`SolariX.Api/`)
| File Path | Purpose & Responsibilities |
| :--- | :--- |
| `Program.cs` | Application entry point. Configures DI, MongoDB connection, CORS (`AllowAll`), JSON serializers, Swagger UI, and calls `DbSeeder`. |
| `web.config` | Configures IIS In-Process hosting via `AspNetCoreModuleV2`. |
| `Data/MongoDbContext.cs` | Database context exposing typed `IMongoCollection<T>` for the 4 core collections. |
| `Data/DbSeeder.cs` | Automatically seeds default Admin, Operator, Prosumer, Colombo Hub, and 3 days of booking slots if database is empty. |
| `Models/` (`User.cs`, `SolarStationInfo.cs`, `EnergyBookingSlot.cs`, `EnergyReservation.cs`, `Enums.cs`) | Domain entities with BSON attributes mapping directly to MongoDB documents. |
| `DTOs/` (`AuthDtos.cs`, `StationDtos.cs`, `SlotDtos.cs`, `ReservationDtos.cs`) | Data contracts for HTTP request/response payloads with validation attributes. |
| `Services/BookingService.cs` | Core business engine enforcing 7-day limits, 12-hour cancellation rules, slot capacity, approval, and QR verification. |
| `Services/StationService.cs` | Manages solar hubs, GPS coordinates, operating schedules, and deactivation conflict checks. |
| `Services/UserService.cs` | Handles BCrypt password hashing, registration, profile updates, and backoffice reactivation. |
| `Services/QRService.cs` | Generates and validates cryptographic HMAC-SHA256 signatures for QR transaction payloads. |
| `Controllers/` (`AuthController.cs`, `UsersController.cs`, `StationsController.cs`, `SlotsController.cs`, `ReservationsController.cs`) | REST API endpoints exposing CRUD operations and returning clean HTTP status codes. |
| `SolariX.Tests/` (`BookingBusinessRulesTests.cs`, `ControllerValidationTests.cs`) | 11 unit tests using xUnit and Moq verifying all business rules in isolation. |

### Web Client (`web-client/`)
| File Path | Purpose & Responsibilities |
| :--- | :--- |
| `src/context/AuthContext.jsx` | React Context managing JWT authentication token, current user object, role checks, and localStorage. |
| `src/api/` (`apiClient.js`, `authApi.js`, `stationsApi.js`, `usersApi.js`, `reservationsApi.js`) | Axios API clients handling HTTP requests and bearer tokens. |
| `src/pages/Home.jsx` | Public landing page required by rubric (Table 1: User Interface & Experience Design). |
| `src/pages/Login.jsx` | Universal login page with role-based routing (redirects to Backoffice or Grid Operator dashboard). |
| `src/pages/backoffice/` | Backoffice portal pages: `BackofficeDashboard.jsx`, `NodeManagement.jsx`, `ProsumerManagement.jsx`, `StaffManagement.jsx`. |
| `src/pages/operator/SlotManagement.jsx` | Grid Operator console housing slot schedule viewer and live reservation monitor. |
| `src/components/operator/SlotScheduleList.jsx` | Displays 1-hour battery slot cards, batch slot generation button, and bookable quota. |
| `src/components/operator/ReservationMonitor.jsx` | Live reservation audit table with status filter chips (`ALL`, `Pending`, `Approved`, `Completed`, `Cancelled`), Approve button, and QR validation modal. |

### Mobile Client (`mobile-client/`)
| File Path | Purpose & Responsibilities |
| :--- | :--- |
| `data/local/AppDatabase.kt` | Room Database class initializing SQLite database `solarix_database.db`. |
| `data/local/entities/` (`UserEntity.kt`, `CachedBookingEntity.kt`) | SQLite table definitions caching user session (NIC as PK) and offline bookings. |
| `data/remote/RetrofitClient.kt` | Retrofit HTTP client configured with OkHttp and base URL `http://10.0.2.2:5119/api/`. |
| `ui/auth/` (`LoginActivity.kt`, `RegisterActivity.kt`) | Handles user login and prosumer self-registration with NIC primary key. |
| `ui/prosumer/ProsumerDashboardActivity.kt` | Prosumer home screen displaying live pending/approved counts, recent bookings, and quick action cards. |
| `ui/prosumer/CreateBookingActivity.kt` | 7-day slot selector, station dropdown, trade type picker, and quota validation. |
| `ui/prosumer/BookingSummaryActivity.kt` | Mandatory summary screen displayed after creating, editing, or cancelling a booking. |
| `ui/prosumer/QRDisplayActivity.kt` | Renders high-contrast QR code bitmap using ZXing for approved bookings. |
| `ui/operator/OperatorDashboardActivity.kt` | Grid Operator mobile home screen showing station stats and scanner launch button. |
| `ui/operator/QRScannerActivity.kt` | Real-time camera scanner using ZXing decoding prosumer QR tokens. |
| `ui/operator/JobCompletionActivity.kt` | Displays scanned booking details and finalizes energy transfer on the server. |
| `ui/map/StationsMapActivity.kt` | Google Maps activity plotting all microgrid hubs from stored coordinates. |

---

## 6. Likely Viva Questions & Winning Answers

### Q1: "Why did you use the FAT Service pattern instead of putting logic on Android or React?"
> **Answer**: "The coursework specification explicitly dictates the FAT Service pattern where all business logic resides strictly in the central API. In an enterprise energy trading grid, client devices cannot be trusted to enforce regulatory constraints (such as the 12-hour cancellation notice or slot capacity limits). If business logic resided on the mobile device, an attacker could manipulate client code to over-book slots or cancel late. By centralizing all rules in `BookingService.cs`, both the Web portal and Android app act purely as presentation interfaces, guaranteeing complete system integrity and audit compliance."

### Q2: "How is your Web API hosted on IIS, and what hosting model does it use?"
> **Answer**: "Our API is published as a self-contained release package into Windows IIS and configured with `AspNetCoreModuleV2` using the **In-Process Hosting Model** (`hostingModel='inprocess'` inside `web.config`). This means our .NET 8 application runs inside the same worker process (`w3wp.exe`) as IIS itself, minimizing network overhead and delivering maximum request throughput. We also verified that the IIS Application Pool is configured with 'No Managed Code', allowing .NET 8's own runtime to manage execution."

### Q3: "How does the system enforce the 12-hour rule across different timezones?"
> **Answer**: "All dates and timestamps across MongoDB, the C# API, and the clients are normalized to **UTC** (`DateTimeKind.Utc`). When validating cancellations or modifications in `BookingService.cs`, the API combines `SlotDate` and `StartTime` into a UTC `DateTime`, and computes the delta against `DateTime.UtcNow`. If `(slotTimeUtc - DateTime.UtcNow) < 12 Hours`, the API rejects the operation with an `InvalidOperationException`. Neither client can bypass this check."

### Q4: "How does the QR Code prevent tampering or fraud?"
> **Answer**: "The QR code does not contain plain unverified text. In `QRService.cs`, we assemble a structured token containing the `ReservationId`, `ProsumerNIC`, `StationId`, `SlotId`, and `Timestamp`, and sign it using **HMAC-SHA256** with a secret key known only to the central API. When the Operator scans the QR code, `ValidateQrPayload` recalculates the cryptographic hash. If a user tampers with the NIC, station, or energy amount in the QR code, the signature check fails immediately with HTTP 400."

### Q5: "How did you fulfill the SQLite requirement on Android?"
> **Answer**: "We used Android's official Jetpack **Room Persistence Library**, which is an abstraction layer directly over native SQLite (`solarix_database.db`). We created two primary tables: `UserEntity` (with `NIC` as the primary key for local user management) and `CachedBookingEntity` (caching prosumer reservations). This allows the mobile app to persist login sessions and display cached bookings even when network connectivity is temporarily unavailable."

### Q6: "Why are some bookings marked as Pending?"
> **Answer**: "To satisfy Table 2, Criterion 4 of the marking rubric, which explicitly awards 2 marks for 'Pending reservations' and 2 marks for 'Count of approved future reservations'. When a prosumer reserves a slot, it enters the `Pending` state. The Grid Operator reviews and clicks 'Approve' on the web management console. Once approved, the QR code is generated and unlocked on the prosumer's mobile app, strictly adhering to the specification statement: *'Once approved, the app generates a secure transaction QR code.'*"
