# SolariX - Smart Solar Microgrid Trading System

> **SE4040 Enterprise Application Development (EAD)**  
> Comprehensive enterprise solution for decentralized solar microgrid energy reservations, hub operations, and peer-to-peer clean energy trading.

---

## 1. System Architecture & Directory Structure

SolariX is architected using the **FAT Service Pattern** with strict separation between centralized business domain enforcement, responsive web administration, and pure native mobile execution.

```text
SolariX/
├── .gitignore
├── README.md
├── docs/                                  # Course briefs & architecture specifications
│   └── EAD Assignment 01.pdf
├── SolariX.Api/                           # Encapsulated .NET 8 Backend (FAT Service)
│   ├── SolariX.sln                        # Visual Studio Solution
│   ├── Directory.Build.props              # Roslyn compiler strictness & nullable settings
│   ├── SolariX.Api/                       # ASP.NET Core 8 Web API Project
│   │   ├── Controllers/                   # Auth, Reservations, Slots, Stations, Users
│   │   ├── Services/                      # FAT BookingService, UserService, StationService, QRService
│   │   ├── Models/                        # MongoDB collections (Users, SolarStationInfo, EnergyBookingSlots, EnergyReservation)
│   │   ├── DTOs/                          # Request & response data transfer contracts
│   │   ├── Data/                          # MongoDbContext & automated database seeder
│   │   ├── Program.cs                     # Dependency injection & pipeline configuration
│   │   ├── web.config                     # IIS In-Process ASP.NET Core Module hosting configuration
│   │   └── SolariX.Api.csproj
│   └── SolariX.Tests/                     # Comprehensive xUnit & Moq Test Suite (11/11 passing)
│       ├── BookingBusinessRulesTests.cs   # FAT rule unit tests (7-day window, 12h threshold, station guard)
│       ├── ControllerValidationTests.cs   # Controller integration & status code tests
│       └── SolariX.Tests.csproj
├── web-client/                            # Presentation UI Layer (Vite + React 18 + Tailwind CSS)
│   ├── src/
│   │   ├── components/                    # Navigation shell, protected routes, stat cards
│   │   ├── contexts/                      # AuthContext for role-based sessions (Backoffice & GridOperator)
│   │   ├── pages/                         # Dashboards, station management, user verification
│   │   └── services/                      # Axios HTTP client targeting Web API
│   ├── package.json
│   └── vite.config.js
└── mobile-client/                         # Pure Native Android Application (Android 14+ / API 34-35)
    ├── build.gradle.kts
    ├── settings.gradle.kts
    ├── gradlew / gradlew.bat
    └── app/
        ├── build.gradle.kts               # Kotlin + AndroidX + Room KSP + ZXing + Google Maps SDK
        └── src/main/
            ├── AndroidManifest.xml        # Camera, Internet, Geolocation permissions
            ├── java/com/solarix/mobile/
            │   ├── data/
            │   │   ├── local/             # Room Database (AppDatabase, UserDao, BookingDao, SQLite entities)
            │   │   ├── remote/            # Retrofit2 client, AuthInterceptor, ApiService, DTOs
            │   │   └── repository/        # AuthRepository, StationRepository, ReservationRepository
            │   ├── ui/
            │   │   ├── auth/              # LoginActivity, RegisterActivity (NIC as key)
            │   │   ├── prosumer/          # ProsumerDashboard, CreateBooking, EditBooking, BookingHistory, QRDisplay, Profile
            │   │   ├── operator/          # OperatorDashboard, QRScanner (Camera ZXing), JobCompletion
            │   │   └── map/               # StationsMapActivity (Google Maps custom markers & station specs)
            │   └── utils/                 # QRCodeGenerator, SessionManager, NetworkUtils
            └── res/                       # Material XML layouts, enterprise palette colors, drawables
```

---

## 2. Core Business Rules (FAT Service Pattern)

All business validation and state rules are strictly enforced by the backend service layer (`SolariX.Api/SolariX.Api/Services/BookingService.cs`). Client applications contain **zero local business logic** and surface server responses directly.

1. **7-Day Booking Window**: Reservations can only be scheduled within a future window of 7 days from the booking date.
2. **12-Hour Modification & Cancellation Threshold**: Reservations can only be updated or cancelled if there are at least 12 hours remaining before the slot commencement time. Requests with `< 12 hours` return `400 Bad Request` with an explanatory threshold denial.
3. **Station Deactivation Guard**: A solar microgrid station cannot be deactivated if it has any active or pending energy reservations.
4. **Administrative Exclusivity**: Deactivated prosumer accounts and microgrid nodes can only be reactivated by authenticated `Backoffice` administrators.
5. **Cryptographic QR Code Lifecycle**: Approved reservations generate a signed HMAC-SHA256 token (`QrCodeToken`). On-site Grid Operators scan the token with their device camera, submit physical metered energy (`kWh`), and transition the reservation to `Completed` status via `POST /api/reservations/verify-and-complete`.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Backend API** | C# .NET 8, ASP.NET Core Web API, MongoDB C# Driver, xUnit, Moq, IIS In-Process Module |
| **Web Client** | React 18, Vite, Tailwind CSS, Lucide Icons, Axios, React Router v6 |
| **Mobile Client** | Kotlin, Android SDK 34/35, Android Room (SQLite), Retrofit2, OkHttp3, ZXing Android Embedded, Google Maps Android SDK |
| **Database** | MongoDB (Collections: `Users`, `SolarStationInfo`, `EnergyBookingSlots`, `EnergyReservation`) |

---

## 4. Getting Started & Setup

### Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/) & `npm`
- [JDK 17](https://adoptium.net/) & Android SDK (API 34 or 35)
- MongoDB running locally on `mongodb://localhost:27017` (or configured via connection string)

---

### Running the .NET 8 Backend API

```bash
# Navigate to the backend directory
cd SolariX.Api

# Run automated tests (11/11 passing)
dotnet test

# Run the API server (starts on http://localhost:5000)
dotnet run --project SolariX.Api/SolariX.Api.csproj
```

*Swagger documentation is accessible at `http://localhost:5000/swagger`.*

---

### Running the Web Client

```bash
# Navigate to the web client directory
cd web-client

# Install dependencies
npm install

# Start Vite development server (starts on http://localhost:5173)
npm run dev
```

---

### Building the Native Android Client

```bash
# Navigate to the mobile client directory
cd mobile-client

# Build debug APK using Gradle wrapper
./gradlew assembleDebug
```

*The generated APK is output to `mobile-client/app/build/outputs/apk/debug/app-debug.apk`.*  
*By default, the Android app connects to the backend at `http://10.0.2.2:5000/api/` on the official Android emulator, with a quick server configuration dialog available on the login screen for physical devices.*
