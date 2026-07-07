# Frontend AGENTS.md

## Purpose

This document describes the current frontend codebase in `frontend/`, the main components, the test setup, and the next work needed to support the project plan.

## Current implementation

- `src/app/page.tsx`
  - Renders the `KanbanBoard` component as the main app.

- `src/components/KanbanBoard.tsx`
  - Maintains board state in local React state.
  - Handles drag-and-drop via `@dnd-kit/core`.
  - Supports renaming columns, adding cards, and deleting cards.
  - Uses `kanban` helpers for initial data, moving cards, and creating IDs.

- `src/components/KanbanColumn.tsx`
  - Renders a single Kanban column.
  - Uses `useDroppable` and `SortableContext` to allow dropping and reordering.
  - Shows current card count, title input, card list, and `NewCardForm`.

- `src/components/KanbanCard.tsx`
  - Renders an individual card.
  - Uses `useSortable` to make cards draggable.
  - Includes a delete button.

- `src/components/KanbanCardPreview.tsx`
  - Renders the drag overlay preview when a card is being dragged.

- `src/components/NewCardForm.tsx`
  - Provides a toggleable form to add a new card.
  - Validates title and resets on submit.

- `src/lib/kanban.ts`
  - Defines types: `Card`, `Column`, `BoardData`.
  - Provides `initialData` with five columns and sample cards.
  - Implements `moveCard` for same-column and cross-column drag logic.
  - Provides `createId` helper.

## Test setup

- Vitest is configured in `frontend/vitest.config.ts`.
- Unit tests run in `jsdom`.
- `frontend/src/components/KanbanBoard.test.tsx` currently covers:
  - rendering the five columns,
  - renaming a column,
  - adding and removing a card.
- Playwright is configured in `frontend/playwright.config.ts` for end-to-end tests in `frontend/tests`.

## Observations

- The app currently uses purely local state; no backend integration exists yet.
- Drag-and-drop, board persistence, and auth are not connected to the planned backend.
- There is one component test file; additional unit tests should cover the column, card, form, and helper logic.
- There is no frontend-specific documentation yet for component boundaries or expected API behavior.

## Next work

- Add a login/auth flow with a dummy `user` / `password` experience.
- Replace local board state with API calls to the backend.
- Add unit tests for `KanbanColumn`, `KanbanCard`, `NewCardForm`, and helper functions.
- Add frontend integration tests for load, auth, add/edit/delete, drag/drop, and persistence.
- Ensure at least 80% Vitest coverage before moving to backend integration.
- Document the intended API contract once backend endpoints are defined.
