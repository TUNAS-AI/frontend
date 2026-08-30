# TUNAS Frontend

AI-assisted shallot harvest-planning frontend for Indonesian farmers, built with React, TypeScript, and Vite.

## Run locally

### Requirements

- [Node.js 22 LTS](https://nodejs.org/)
- npm, included with Node.js
- Git

### Start the development server

From PowerShell, clone the repository if needed and enter the project folder:

```powershell
# The current remote keeps its legacy repository name during the migration.
git clone https://github.com/5calvinw/hijauAI-FE.git tunas-frontend
cd tunas-frontend
```

Install the exact dependency versions from `package-lock.json`:

```powershell
npm ci
```

Create the local environment file:

```powershell
Copy-Item .env.example .env.local
```

The default local configuration uses the frontend-only mission demo:

```dotenv
VITE_TUNAS_API_URL=http://localhost:3000
VITE_MISSION_TRANSPORT=demo
```

The demo transport does not require a local backend for the current placeholder flows. `VITE_TUNAS_API_URL` is the preferred API setting; legacy `VITE_API_URL` remains supported for existing deployments.

During onboarding, **Load demo farm** fills the canonical zero-mission demo
state from `docs/tunas demo scenario.md`. It creates one READY Bima Brebes batch
in Blok Utara with a 650 kg estimate and the documented workers, hours, outdoor
drying, and tarpaulin context. It does not submit until onboarding is finished.

Start Vite:

```powershell
npm run dev
```

Open the URL printed in the terminal, normally:

```text
http://localhost:5173
```

If port `5173` is already in use, Vite automatically selects another port and prints the correct URL. Press `Ctrl+C` in the terminal to stop the server.

### Verify the project

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

To preview the production build locally:

```powershell
npm run preview
```

The preview URL is normally `http://localhost:4173`.

### Run with Docker instead

With Docker Desktop installed and running:

```powershell
docker compose up --build
```

Open `http://127.0.0.1:5173`. Stop the container with:

```powershell
docker compose down
```

The Docker build defaults to the separately managed backend at
`http://localhost:3000`. Start it from `backend/` with `docker compose up
--build`. Override `VITE_TUNAS_API_URL` before building when using another API.

## UI components

The shared component foundation uses shadcn/ui with Radix primitives and intentionally remains on Tailwind CSS 3.4 for broader browser support.

Add components with the Tailwind 3-compatible CLI version:

```powershell
npx shadcn@2.10.0 add dialog
```

Do not use `shadcn@latest` until the project intentionally migrates to Tailwind CSS 4. The current CLI generates Tailwind 4-only utilities and directives. Generated primitives belong in `src/components/ui/`, and the shared `cn` helper belongs in `src/utils/cn.ts`.

## API configuration

Mission scheduling v2 previews include exact harvest windows and buyer pickup timestamps, rain-risk priority, partial-fulfillment intent, structured recommendation evidence, and timed activities with `actionKind`. Mission creation shows every candidate timeline and separate rationale sections; no schedule is persisted or synced until explicit approval. Calendar entries honor `scheduleType`, so drying inspections and protection actions remain timed checkpoints rather than inferred all-day drying periods.

Production builds use:

```text
https://api.hijau-ai.web.id
```

The current production endpoint keeps its legacy hostname until the API/DNS migration is scheduled. For local development, copy `.env.example` to `.env.local` and adjust `VITE_TUNAS_API_URL` if needed. Legacy `VITE_API_URL` is still read as a compatibility fallback.

Use the shared API helper in `src/api/http.ts`:

```ts
import { apiFetch, getHealth } from "./api/http";

const health = await getHealth();
const response = await apiFetch("/some-endpoint");
```

## Google sign-in

The login page redirects through `GET /api/auth/google`, then receives the
Supabase token at `/auth/callback`. Set `VITE_TUNAS_API_URL` to the backend URL
and ensure its `CORS_ORIGIN` allows the frontend origin. The backend's
`FRONTEND_URL` must match the frontend origin so Supabase can return to the
callback route.

## VPS deployment

On pushes to `main`, GitHub Actions runs the frontend checks, SSHes into the VPS, pulls the latest source, and builds the frontend with Docker Compose. No GHCR token is needed.

Set these GitHub Actions secrets:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_FRONTEND_APP_DIR` — the absolute path to this frontend repository on the VPS

The VPS checkout must be able to run `git pull origin main`. The frontend container listens only on `127.0.0.1:5173`, ready for the Nginx site at the configured domain.

### Nginx reverse proxy

Copy `nginx/tunas-frontend.vps.conf.example` to your VPS Nginx sites directory,
replace `example.com` with your domain, then enable and reload the site. The
configuration proxies public web traffic to the Docker service on port `5173`.

```bash
sudo ln -s /etc/nginx/sites-available/tunas-frontend /etc/nginx/sites-enabled/tunas-frontend
sudo nginx -t && sudo systemctl reload nginx
```
