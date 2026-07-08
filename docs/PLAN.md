# High level steps for project

## Part 1: Plan

Goal: Turn the outline into an executable delivery plan with clear substeps, acceptance criteria, and test requirements.

- [x] Review current frontend demo and confirm component responsibilities.
- [x] Create `frontend/AGENTS.md` describing the current frontend code, tests, and next work.
- [x] Define unit and integration testing goals:
  - Frontend unit coverage: target ~80% where it is sensible.
  - Avoid adding tests only to hit a coverage number; prioritize valuable behavior coverage.
  - Robust integration coverage: core app flows end to end.
- [x] Confirm technology choices: Next.js frontend, FastAPI backend, SQLite persistence, Docker packaging, OpenRouter AI.
- [x] Get user sign-off on the plan before implementation.

Success criteria:
- `docs/PLAN.md` includes actionable substeps for all major phases.
- `frontend/AGENTS.md` exists and documents the current code base.
- Test expectations are explicit.

## Part 2: Scaffolding

Goal: Add backend and Docker scaffolding, then verify the app can serve a static page.

- [x] Add `backend/` FastAPI skeleton.
- [x] Add Dockerfile and container config.
- [x] Add `scripts/` start/stop scripts for Windows, macOS, and Linux.
- [x] Verify a static `Hello world` page is served from the backend.
- [x] Confirm the frontend build can be served from the backend.

Tests:
- Backend unit test for a sample health endpoint.
- Docker smoke test that the container starts and responds.

Success criteria:
- Backend runs and returns a valid HTTP response.
- Container builds and starts successfully.

## Part 3: Add in Frontend

Goal: Serve the existing Next.js Kanban demo from the backend and verify the UI.

- [x] Build the frontend statically.
- [x] Configure backend to serve the built frontend.
- [x] Verify `/` loads the Kanban board.
- [x] Add frontend unit tests for components and helper utilities.
- [x] Add integration tests for page load and core UI behavior.

Tests:
- Vitest coverage for `KanbanBoard`, `KanbanColumn`, `KanbanCard`, `NewCardForm`, and `kanban` helpers where it adds value.
- Playwright test for initial render and visible UI elements.

Success criteria:
- Frontend served from backend.
- `npm run test:unit` passes with 80%+ coverage.
- `npm run test:e2e` passes for core UI render.

## Part 4: Add fake user sign in experience

Goal: Require hardcoded auth before showing the Kanban board.

- [x] Add login screen and auth state.
- [x] Validate credentials against `user` / `password`.
- [x] Add logout support.
- [x] Protect the board until auth succeeds.
- [x] Add tests for auth flow.

Tests:
- Unit tests for login UI and auth state.
- Playwright sign-in and logout flow tests.

Success criteria:
- Unauthorized access redirects to login.
- Correct credentials unlock the board.
- Logout returns to login.

## Part 5: Database modeling

Goal: Document a SQLite schema for persistent Kanban state.

- [x] Design schema for users, boards, columns, cards, and order metadata.
- [x] Consider JSON storage for board state to simplify early MVP persistence.
- [x] Document the schema and reasoning in `docs/`.
- [x] Confirm support for one board per user and future multi-user work.

Tests:
- Schema validation through backend unit tests.
- Review that schema matches frontend board state requirements.

Success criteria:
- Database schema documented.
- Schema supports persistent board reload.

## Part 6: Backend

Goal: Add API routes to read and update the Kanban board.

- [x] Implement auth route and board GET/PATCH routes.
- [x] Ensure the database is created if it does not exist.
- [x] Add backend unit tests for API behavior.
- [x] Validate API contract with realistic board payloads.

Tests:
- Backend tests for auth, board read, board update, and persistence.
- Database creation test.

Success criteria:
- Backend exposes working board API.
- Tests confirm read/write behavior.

## Part 7: Frontend + Backend

Goal: Wire the frontend to the backend API for persistent Kanban state.

- [x] Replace local-only board state with API load and update flows.
- [x] Sync rename, add card, delete card, and drag/drop moves.
- [x] Add loading and error handling.
- [x] Add frontend API integration tests.

Tests:
- Unit tests for client helpers and state synchronization.
- Playwright tests for persistence after refresh.

Success criteria:
- Board state persists across reloads.
- UI and backend stay in sync.

Implementation notes:
- Frontend API calls use `/api` by default and `NEXT_PUBLIC_API_BASE_URL` for local Next.js development against FastAPI.
- The signed-in MVP user is restored from `sessionStorage` so browser refresh can reload the persisted board instead of returning to login.
- Board saves are debounced and only begin after the initial API board load completes, preventing the frontend sample state from overwriting persisted data.
- Board API requests encode `user_id` query parameters.
- FastAPI allows CORS from `http://127.0.0.1:3000` and `http://localhost:3000` for local frontend development.
- Playwright starts both FastAPI and Next.js for integration tests. It uses `PM_DB_PATH=frontend/test-results/e2e.db` so e2e tests do not modify the main `pm.db`.
- Playwright can use an installed browser channel with `PLAYWRIGHT_BROWSER_CHANNEL=chrome` when the managed Playwright browser is not installed.

## Part 8: AI connectivity

Goal: Connect backend to OpenRouter for AI request handling.

- [ ] Implement OpenRouter client code in backend.
- [ ] Add a simple AI endpoint for sanity checks.
- [ ] Validate with a test call such as `2+2`.
- [ ] Manage API key through `.env`.

Tests:
- Backend test for AI request flow.
- Mocked AI response test.

Success criteria:
- AI endpoint works and returns a valid response.
- OpenRouter integration is documented.

## Part 9: Structured AI board updates

Goal: Send board JSON and user question to AI, then apply structured updates.

- [ ] Include current board state and conversation history in AI requests.
- [ ] Define structured output with response text plus optional board changes.
- [ ] Parse structured responses safely in the backend.
- [ ] Add tests for response parsing and update application.

Tests:
- Unit tests for structured output parsing.
- Integration tests with mocked AI payloads.

Success criteria:
- AI responses can update the board.
- Updates apply without breaking state.

## Part 10: AI chat sidebar

Goal: Add a polished AI chat sidebar that can update the Kanban board.

- [ ] Build chat sidebar UI for history and prompt input.
- [ ] Connect to backend AI endpoint.
- [ ] Refresh the board automatically when AI updates state.
- [ ] Add end-to-end tests for chat and updates.

Tests:
- Playwright test for send prompt, receive response, and board refresh.
- Coverage for chat state and UI rendering.

Success criteria:
- Chat sidebar works end to end.
- AI-driven board updates are visible and reflected.

---

## Project test strategy

- Frontend unit tests should cover important component behavior and helper logic.
- Target approximately 80% frontend unit coverage before proceeding to backend integration, but do not add unnecessary tests just to hit the number.
- Playwright tests should cover the main user journeys, including auth, board interaction, and AI chat.
- Backend tests should cover auth, persistence, API contract, and AI integration.

## Current frontend context

- Existing app is a Next.js Kanban app with `KanbanBoard`, `KanbanColumn`, `KanbanCard`, `KanbanCardPreview`, and `NewCardForm`.
- Shared board state logic lives in `src/lib/kanban.ts`.
- API helpers live in `src/lib/api.ts` and call the FastAPI auth and board endpoints.
- Frontend tests cover login, session restore, board loading, rename, add, delete, API helpers, and persistence after reload.
- Playwright is configured to run the Next.js dev server and FastAPI backend together for integration tests.
