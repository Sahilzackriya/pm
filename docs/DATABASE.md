# Database Schema for Project Management MVP

## Design Decision: JSON Storage for Board State

For the MVP, we use SQLite with **JSON-based board state storage** to keep the implementation simple while maintaining structured user/board relationships for future multi-user support.

### Rationale

- **Simplicity**: Single JSON blob per board eliminates complex joins and normalization for the MVP phase
- **Flexibility**: Allows frontend board state to evolve without schema migrations
- **Scalability path**: Easy to migrate to normalized schema later when multi-board features are needed
- **Requirement alignment**: MVP only supports 1 board per user, so denormalization is acceptable now

### Schema Design

```sql
-- Users table (supports future multi-user work)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Boards table (one board per user in MVP)
CREATE TABLE boards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT DEFAULT 'My Board',
  board_data TEXT NOT NULL, -- JSON: { columns: [...], cards: {...} }
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for common query: get user's board
CREATE INDEX idx_boards_user_id ON boards(user_id);
```

### Board Data Structure (JSON)

The `board_data` column stores JSON matching the frontend `BoardData` type:

```json
{
  "columns": [
    {
      "id": "col-backlog",
      "title": "Backlog",
      "cardIds": ["card-1", "card-2"]
    }
  ],
  "cards": {
    "card-1": {
      "id": "card-1",
      "title": "Align roadmap themes",
      "details": "Draft quarterly themes with impact statements and metrics."
    }
  }
}
```

### API Contracts

**Get Board**
```
GET /api/boards
Response:
{
  "id": "board-123",
  "title": "My Board",
  "columns": [...],
  "cards": {...}
}
```

**Update Board**
```
PATCH /api/boards
Request:
{
  "columns": [...],
  "cards": {...}
}
Response: { "success": true }
```

### Future Normalization (Post-MVP)

When the app grows to support:
- Multiple boards per user
- Shared boards / team collaboration
- Advanced filtering/reporting

Migrate to normalized schema:

```sql
CREATE TABLE columns (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  column_id TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
);

CREATE INDEX idx_columns_board_id ON columns(board_id);
CREATE INDEX idx_cards_column_id ON cards(column_id);
```

The `board_data` column would then be deprecated in favor of joins.

## Implementation Notes

- Use Python's `json` module to serialize/deserialize board state
- Validate JSON structure on update to ensure frontend compatibility
- Track `updated_at` to detect concurrent edits (for future conflict resolution)
- For MVP auth, store password hashes (use `bcrypt` or `argon2`)
