# Local HTTPS Demo

The frontend runs over **HTTPS** for local demos. The backend stays on plain **HTTP** (`http://localhost:8080`) and Vite proxies `/api`, `/actuator`, and WebSocket traffic to it.

Open the app at: **https://localhost:5173**

## Prerequisites

- Node.js 22.12+ (or 20.19+)
- mkcert installed on your machine
- Backend running on port 8080

## One-time setup

From the `grupo3aor_frontend` folder:

```bash
npm install
npm run certs
```

This creates local certificates in `certs/` (gitignored).

For a trusted padlock in the browser, install the local CA once:

| OS | Command |
|---|---|
| macOS | `mkcert -install` (may ask for your password) |
| Windows | Run `mkcert -install` in PowerShell or CMD **as Administrator** |

Without this step, HTTPS still works, but the browser may show a certificate warning you can accept for the demo.

### Install mkcert

**macOS**

```bash
brew install mkcert
```

**Windows** (use one)

```powershell
winget install FiloSottile.mkcert
```

```powershell
choco install mkcert
```

```powershell
scoop install mkcert
```

Alternative Windows script:

```powershell
.\scripts\generate-local-certs.ps1
```

## Run the demo

1. Start the backend (HTTP on port 8080):

   **macOS / Linux**

   ```bash
   cd ../grupo3aor_backend
   bash mvnw spring-boot:run
   ```

   **Windows**

   ```powershell
   cd ..\grupo3aor_backend
   mvnw.cmd spring-boot:run
   ```

2. Start the frontend:

   ```bash
   npm run dev
   ```

3. Open **https://localhost:5173**

## How it works

```text
Browser (HTTPS :5173)
    -> Vite dev server
        -> HTTP proxy -> Spring Boot (:8080)
```

The browser only talks to Vite over HTTPS. API calls use relative paths (`/api/...`), so there are no mixed-content issues even though the backend is HTTP.

## Troubleshooting

**`Local HTTPS certificates not found`**

Run `npm run certs` before `npm run dev`.

**`mkcert is required but was not found`**

Install mkcert using the commands above, then run `npm run certs` again.

**Login or WebSocket fails**

Make sure the backend is running on port 8080 before starting the frontend.
