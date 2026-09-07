# Pathfinder

An AI career-coaching app: get advice, a structured learning roadmap toward a goal, and a
chat assistant — backed by Gemini (via `@google/generative-ai`), with a Firebase-authenticated
backend and a React frontend.

The name is a holdover from an earlier, literal geo-routing pivot (A*/Dijkstra/BFS over
lat/lng coordinates) that never became a real feature — the "algorithms" were straight-line
interpolation between two points dressed up with fabricated metadata claiming a real graph
search had run. That code has been removed entirely (see [Changelog](CHANGELOG.md)); this
README describes what the app actually does today.

## What's here

- **Advice** (`POST /api/advice`) — ask a question, get AI-generated advice with action items
  and resources.
- **Roadmap** (`POST /api/roadmap`) — describe a goal, get a phased learning plan (foundation →
  practice → mastery) with milestones per phase.
- **Chat** (`POST /api/chat`) — a conversational assistant with message history and follow-up
  suggestions.
- **Auth** (`/api/auth/*`) — Firebase-authenticated registration, profile, logout, account
  deletion.
- **Frontend** (`frontend/`) — React app: Login, Profile, Roadmap, Chat, Recommendations pages.

## Quick start (mock mode — no API keys needed)

```bash
git clone https://github.com/king-defender/pathfinder.git
cd pathfinder
npm install

cp .env.development .env
npm run dev            # backend on :3000
npm run dev:frontend   # frontend, separate terminal
```

`.env.development` ships with `MOCK_EXTERNAL_APIS`-friendly defaults (no `GOOGLE_AI_API_KEY`
needed — `VertexAIService` detects the missing/placeholder key and returns clearly-labeled
mock responses instead of calling Gemini for real). Verified directly: advice, roadmap, and
chat all respond correctly with mock data with zero credentials configured.

### Connecting real Gemini output

Set a real key and restart:

```bash
GOOGLE_AI_API_KEY=your_real_key
```

`VertexAIService`'s mock-mode check goes away the moment a real, non-placeholder key is
present — no other code change needed.

## API Reference

```
POST /api/advice   { query, context?, preferences? }        → advice + action items
POST /api/roadmap  { goal, timeframe?, skills?, experience? } → phased learning plan
POST /api/chat     { messages: [{ role, content }], context? } → assistant reply + suggestions
POST /api/auth/register  { idToken, additionalData? }
GET  /api/auth/profile   (requires Authorization: Bearer <idToken>)
GET  /health              — basic status
GET  /health/detailed     — includes real Firestore/Firebase Auth/Maps API checks (will show
                             "unhealthy"/"degraded" without real credentials - that's the
                             checks working correctly, not a bug)
```

## Configuration

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default `3000`) |
| `NODE_ENV` | `development` / `test` / `production` |
| `FIREBASE_PROJECT_ID` | Firebase project for Auth + Firestore |
| `GOOGLE_AI_API_KEY` | Gemini API key — omit or leave as `mock_development_key` for mock mode |
| `GOOGLE_MAPS_API_KEY` | Used only by `/health/detailed`'s external-API check |
| `BYPASS_AUTH` | Skips auth — **only takes effect when `NODE_ENV=test`**, deliberately not in `development`, so a misconfigured deployment can't silently disable authentication |

## Testing

```bash
npm run type-check
npm test              # vitest - unit + integration
npm run test:e2e       # playwright, needs the server running
```

`/health/detailed`'s integration tests deliberately exercise real external checks with no
credentials configured and assert on the resulting degraded response, rather than mocking
them out - they need real network round-trip time, not a fast fail (`testTimeout: 15000` in
`vitest.config.ts` accounts for this).

## Architecture

```
src/
├── api/routes/       auth, advice, roadmap, chat, health
├── middleware/        Firebase-auth middleware, error handling
└── services/          VertexAIService (Gemini + mock mode)
frontend/               React app - Login, Profile, Roadmap, Chat, Recommendations
```

## Security

- Firebase Authentication (ID token verification via `firebase-admin/auth`)
- Rate limiting, tighter on the AI endpoints (5/min advice, 3/min roadmap) than general API
  traffic
- Helmet security headers, input validation via `express-validator`
- `BYPASS_AUTH` is test-environment-only by design (see Configuration above)

## Deployment

Designed for Google Cloud Run (backend) + Firebase Hosting (frontend):

```bash
npm run build
npm run deploy:cloud-run    # backend
firebase deploy --only hosting   # frontend
```

Needs a real Firebase project (`firebase init hosting firestore`) and Google Cloud project
with Cloud Run enabled — see `DEPLOYMENT.md` for the full walkthrough.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes, following ESLint/Prettier config
4. Open a Pull Request

## License

MIT - see [LICENSE](LICENSE).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
