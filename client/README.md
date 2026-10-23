# KURO MANAGER — EXE Client Integration Guide

This directory contains standalone clients and reference implementations for connecting any desktop application or EXE client to **KURO MANAGER** via HTTPS and JSON.

---

## 1. Precompiled Native Windows Binary (`kuro-client.exe`)

A standalone zero-dependency Windows executable is ready in this directory:
`client/kuro-client.exe`

### Usage (Command Line):
```powershell
# Query authorization & remaining balance
.\client\kuro-client.exe --server http://localhost:3000 --key KURO-1001

# Authorize AND consume 1 credit
.\client\kuro-client.exe --server http://localhost:3000 --key KURO-1001 --consume 1

# Interactive mode (prompts for server & registration number)
.\client\kuro-client.exe
```

When run interactively, it saves your preferred server URL and registration key to `kuro-config.json` so you do not have to type them every time.

---

## 2. API Contract: `POST /api/authorize`

### Endpoint:
- **URL:** `https://your-domain.vercel.app/api/authorize` (or `http://localhost:3000/api/authorize`)
- **Method:** `POST`
- **Header:** `Content-Type: application/json`
- **Optional Header:** `x-kuro-api-key: <KURO_CLIENT_API_KEY>` (if configured on server)

### Request Payload:
```json
{
  "registrationNumber": "KURO-1001",
  "consumeCredits": 0,
  "reason": "EXE batch job execution"
}
```
- `registrationNumber` (required, string): The client's unique registration key.
- `consumeCredits` (optional, integer >= 0, default 0): Number of credits to deduct atomically in a database transaction. Set to 0 to only check authorization and credit balance.
- `reason` (optional, string): Explanation recorded in the credit transactions audit log.

### Response Codes & Bodies:

#### Authorized (HTTP 200)
```json
{
  "authorized": true,
  "creditsRemaining": 42
}
```

#### Registration Not Found (HTTP 404)
```json
{
  "authorized": false,
  "message": "Registration not found"
}
```

#### Registration Disabled (HTTP 403)
```json
{
  "authorized": false,
  "message": "Registration is disabled",
  "status": "disabled"
}
```

#### Insufficient Credits (HTTP 402, when consumeCredits > balance)
```json
{
  "authorized": false,
  "creditsRemaining": 0,
  "message": "Insufficient credits. Required: 1, Remaining: 0"
}
```

#### Rate Limit Exceeded (HTTP 429)
```json
{
  "authorized": false,
  "message": "Rate limit exceeded. Please slow down your requests."
}
```

---

## 3. Reference Implementations

1. **Go (Compiled to `kuro-client.exe`)**:
   - Source: `client/kuro-client.go`
   - Recompile: `go build -o kuro-client.exe kuro-client.go`

2. **Python**:
   - Script: `client/kuro_client.py`
   - Run: `python client/kuro_client.py --server http://localhost:3000 --key KURO-1001`
   - Compile to single EXE with PyInstaller:
     ```bash
     pip install pyinstaller
     pyinstaller --onefile client/kuro_client.py
     ```

3. **C# / .NET**:
   - Code: `client/KuroClient.cs`
   - Drop into any .NET 6/7/8/9 WinForms, WPF, Console, or Unity desktop app.
