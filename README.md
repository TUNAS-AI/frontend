# TUNAS Frontend

React, TypeScript, Vite, Tailwind, and the shared TUNAS semantic design-system foundation.

The application includes Google authentication, farm onboarding, and a local farm-fields workspace. Authentication, session verification, onboarding, and farm reset call the API configured by `VITE_TUNAS_API_URL`. Farm records and ordinary farm edits remain visibly labeled placeholder or local-session data.

## Local setup

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

## Verify

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```
