# SolariX — Deployment & Operations Runbook

This runbook documents all commands, operational workflows, and configuration details for running the **SolariX Smart Solar Microgrid Trading System** across MongoDB Atlas, Windows IIS, and the React Web Client.

---

## 1. MongoDB Atlas Configuration

- **Cluster Endpoint**: `cluster0.yo64min.mongodb.net`
- **Database Name**: `SolarixDb`
- **Config File (Ignored in Git)**: `SolariX.Api/SolariX.Api/appsettings.Development.json`
- **Template File (Committed)**: `SolariX.Api/SolariX.Api/appsettings.json`

### Seeded Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@solarix.com` | `Admin@123456` |
| **Station Operator** | `operator@solarix.com` | `Operator@123456` |
| **Prosumer** | `prosumer@solarix.com` | `Prosumer@123456` |

---

## 2. Publishing & Windows IIS Hosting (Step 2)

The .NET 8 Web API is published using the **In-Process Hosting Model** via `AspNetCoreModuleV2`.

### A. Publish Command
Generates the pre-compiled production binaries, JSON serializers, and `web.config`:
```powershell
dotnet publish SolariX.Api\SolariX.Api\SolariX.Api.csproj -c Release -o SolariX.Api\publish
```

### B. IIS Setup Commands (Run in PowerShell as Administrator)

```powershell
# 1. Enable IIS Windows Feature (with all required dependencies)
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpRedirect, IIS-ApplicationDevelopment -All

# 2. Add an Application Pool configured with No Managed Code (required for .NET Core / .NET 8)
& "C:\Windows\System32\inetsrv\appcmd.exe" add apppool /name:"SolariXAppPool" /managedRuntimeVersion:""

# 3. Create the Website pointing to the published output on port 5119
& "C:\Windows\System32\inetsrv\appcmd.exe" add site /name:"SolariXApi" /bindings:"http/*:5119:" /physicalPath:"f:\GitHub\SLIIT\EAD\SolariX\SolariX.Api\publish"

# 4. Bind the Website to the SolariX App Pool
& "C:\Windows\System32\inetsrv\appcmd.exe" set app "SolariXApi/" /applicationPool:"SolariXAppPool"

# 5. Grant read and execute permissions to IIS worker accounts (prevents HTTP 500.19 errors)
icacls "f:\GitHub\SLIIT\EAD\SolariX\SolariX.Api\publish" /grant "IIS_IUSRS:(OI)(CI)RX" /grant "IUSR:(OI)(CI)RX"
```

### C. Live URLs
- **Swagger Documentation**: `http://localhost:5119/` (served at root)
- **API Endpoints**: `http://localhost:5119/api/...`

---

## 3. IIS Operational & Management Commands

Use these commands anytime to start, stop, or restart the server without touching the GUI.

| Operation | Command | What It Does |
| :--- | :--- | :--- |
| **Stop SolariX Site** | `& "C:\Windows\System32\inetsrv\appcmd.exe" stop site "SolariXApi"` | Shuts down only the SolariX API site and frees port `5119`. Uses 0% CPU/RAM. |
| **Start SolariX Site** | `& "C:\Windows\System32\inetsrv\appcmd.exe" start site "SolariXApi"` | Starts the SolariX API site in IIS. |
| **Restart IIS Service** | `iisreset` | Completely restarts the Windows World Wide Web Publishing Service (`W3SVC`). |
| **Stop All IIS Services** | `net stop w3svc` | Turns off the entire Windows IIS service. |
| **Start All IIS Services** | `net start w3svc` | Turns on the Windows IIS service. |

### How to Update Deployed IIS Server After Code Changes

When you modify backend controllers, services, or models, the published binaries in `SolariX.Api/publish` must be updated and IIS recycled:

#### Step 1: Re-publish the API
Run from the repository root:
```powershell
dotnet publish SolariX.Api\SolariX.Api\SolariX.Api.csproj -c Release -o SolariX.Api\publish
```

#### Step 2: Recycle or Restart IIS (Run in PowerShell as Administrator)
Choose one of the following to reload the new DLLs:

- **Option A — Recycle AppPool (Zero Downtime / Recommended)**:
  ```powershell
  & "C:\Windows\System32\inetsrv\appcmd.exe" recycle apppool "SolariXAppPool"
  ```
- **Option B — Quick Restart of IIS Site**:
  ```powershell
  & "C:\Windows\System32\inetsrv\appcmd.exe" stop site "SolariXApi"
  & "C:\Windows\System32\inetsrv\appcmd.exe" start site "SolariXApi"
  ```
- **Option C — Full IIS Service Reset**:
  ```powershell
  iisreset
  ```

#### One-Liner Script (Build, Publish & Recycle)
```powershell
dotnet publish SolariX.Api\SolariX.Api\SolariX.Api.csproj -c Release -o SolariX.Api\publish; & "C:\Windows\System32\inetsrv\appcmd.exe" recycle apppool "SolariXAppPool"
```

---

## 4. React Web Client (Step 3)

- **Directory**: `web-client/`
- **Environment File**: `web-client/.env`
  ```env
  VITE_API_BASE_URL=http://localhost:5119/api
  ```
- **Local Dev Server**: `http://localhost:5173/`

### Commands
```powershell
# Install dependencies
npm install

# Run the dev server
npm run dev

# Build for production
npm run build
```

---

## 5. Android Mobile Client (Step 4)

- **Directory**: `mobile-client/`
- **Default Base URL**: `http://10.0.2.2:5119/api/` (configured in `RetrofitClient.kt` & editable via login screen UI)
- **APK Output**: `mobile-client/app/build/outputs/apk/debug/app-debug.apk`

### Why `10.0.2.2`?
In the standard Android Emulator, `10.0.2.2` is the special alias mapped to the host loopback interface (`localhost` on Windows). It routes emulator network calls directly to IIS running on `localhost:5119`.

### Build & Run Commands
```powershell
# From the mobile-client directory:
cd mobile-client

# Clean and compile debug APK
.\gradlew.bat assembleDebug

# Install on running emulator or connected device
.\gradlew.bat installDebug
```

