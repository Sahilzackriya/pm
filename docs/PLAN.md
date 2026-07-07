# High level steps for project

## Part 1: Plan

Goal: Turn the outline into an executable delivery plan with clear substeps, acceptance criteria, and test requirements.

- [ ] Review current frontend demo and confirm component responsibilities.
- [ ] Create `frontend/AGENTS.md` describing the current frontend code, tests, and next work.
- [ ] Define unit and integration testing goals:
  - Frontend unit coverage: target ~80% where it is sensible.
  - Avoid adding tests only to hit a coverage number; prioritize valuable behavior coverage.
  - Robust integration coverage: core app flows end to end.
- [ ] Confirm technology choices: Next.js frontend, FastAPI backend, SQLite persistence, Docker packaging, OpenRouter AI.
- [ ] Get user sign-off on the plan before implementation.

Success criteria:
- `docs/PLAN.md` includes actionable substeps for all major phases.
- `frontend/AGENTS.md` exists and documents the current code base.
- Test expectations are explicit.

## Part 2: Scaffolding

Goal: Add backend and Docker scaffolding, then verify the app can serve a static page.

- [ ] Add `backend/` FastAPI skeleton.
- [ ] Add Dockerfile and container config.
- [ ] Add `scripts/` start/stop scripts for Windows, macOS, and Linux.
- [ ] Verify a static `Hello world` page is served from the backend.
- [ ] Confirm the frontend build can be served from the backend.

Tests:
- Backend unit test for a sample health endpoint.
- Docker smoke test that the container starts and responds.

Success criteria:
- Backend runs and returns a valid HTTP response.
- Container builds and starts successfully.

## Part 3: Add in Frontend

Goal: Serve the existing Next.js Kanban demo from the backend and verify the UI.

- [ ] Build the frontend statically.
- [ ] Configure backend to serve the built frontend.
- [ ] Verify `/` loads the Kanban board.
- [ ] Add frontend unit tests for components and helper utilities.
- [ ] Add integration tests for page load and core UI behavior.

Tests:
- Vitest coverage for `KanbanBoard`, `KanbanColumn`, `KanbanCard`, `NewCardForm`, and `kanban` helpers where it adds value.
- Playwright test for initial render and visible UI elements.

Success criteria:
- Frontend served from backend.
- `npm run test:unit` passes with 80%+ coverage.
- `npm run test:e2e` passes for core UI render.

## Part 4: Add fake user sign in experience

Goal: Require hardcoded auth before showing the Kanban board.

- [ ] Add login screen and auth state.
- [ ] Validate credentials against `user` / `password`.
- [ ] Add logout support.
- [ ] Protect the board until auth succeeds.
- [ ] Add tests for auth flow.

Tests:
- Unit tests for login UI and auth state.
- Playwright sign-in and logout flow tests.

Success criteria:
- Unauthorized access redirects to login.
- Correct credentials unlock the board.
- Logout returns to login.

## Part 5: Database modeling

Goal: Document a SQLite schema for persistent Kanban state.

- [ ] Design schema for users, boards, columns, cards, and order metadata.
- [ ] Consider JSON storage for board state to simplify early MVP persistence.
- [ ] Document the schema and reasoning in `docs/`.
- [ ] Confirm support for one board per user and future multi-user work.

Tests:
- Schema validation through backend unit tests.
- Review that schema matches frontend board state requirements.

Success criteria:
- Database schema documented.
- Schema supports persistent board reload.

## Part 6: Backend

Goal: Add API routes to read and update the Kanban board.

- [ ] Implement auth route and board GET/POST or PATCH routes.
- [ ] Ensure the database is created if it does not exist.
- [ ] Add backend unit tests for API behavior.
- [ ] Validate API contract with realistic board payloads.

Tests:
- Backend tests for auth, board read, board update, and persistence.
- Database creation test.

Success criteria:
- Backend exposes working board API.
- Tests confirm read/write behavior.

## Part 7: Frontend + Backend

Goal: Wire the frontend to the backend API for persistent Kanban state.

- [ ] Replace local-only board state with API load and update flows.
- [ ] Sync rename, add card, delete card, and drag/drop moves.
- [ ] Add loading and error handling.
- [ ] Add frontend API integration tests.

Tests:
- Unit tests for client helpers and state synchronization.
- Playwright tests for persistence after refresh.

Success criteria:
- Board state persists across reloads.
- UI and backend stay in sync.

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

- Existing app is a Next.js demo with `KanbanBoard`, `KanbanColumn`, `KanbanCard`, `KanbanCardPreview`, and `NewCardForm`.
- Shared board state logic lives in `src/lib/kanban.ts`.
- Existing frontend test file covers render, rename, add, and delete flows.
- Playwright is configured to run against a local dev server.
