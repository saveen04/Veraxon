## Veraxon Fix Plan (in progress)

- [ ] Fix GitHub push protection blockers by removing hardcoded Firebase/Gemini/Google/other secrets from source files
- [x] Create `.env.example` (done)
- [x] Create `.env.local` (done)
- [x] Move Firebase client config to environment variables (`src/lib/firebase.js`)
- [ ] Re-run `npm run lint` non-interactively (ESLint dependency conflict addressed)
- [ ] Fix Firebase Admin/service-account env handling if needed
- [ ] Verify assistant route streaming/error handling (ensure env-only keys)
- [ ] Verify authentication flow + role/onboarding redirects (bugs, undefined vars, hydration)
- [ ] Verify dashboards API calls and Firestore queries
- [ ] Verify assessment builder CRUD + Firestore sync
- [ ] Performance: reduce unnecessary reads/rerenders/useEffect deps
- [ ] Run final validation: `npm run build`, `npm run lint`, `npm run dev`

