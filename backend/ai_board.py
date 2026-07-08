"""Structured AI responses for board updates."""

import json

from pydantic import BaseModel, ValidationError, model_validator


class Card(BaseModel):
    id: str
    title: str
    details: str


class Column(BaseModel):
    id: str
    title: str
    cardIds: list[str]


class BoardData(BaseModel):
    columns: list[Column]
    cards: dict[str, Card]

    @model_validator(mode="after")
    def validate_card_references(self) -> "BoardData":
        column_ids = [column.id for column in self.columns]
        if len(column_ids) != len(set(column_ids)):
            raise ValueError("Column IDs must be unique")

        referenced_ids = [
            card_id for column in self.columns for card_id in column.cardIds
        ]
        if len(referenced_ids) != len(set(referenced_ids)):
            raise ValueError("Each card must appear in exactly one column")
        if set(referenced_ids) != set(self.cards):
            raise ValueError("Column card references must match the cards object")
        if any(card_id != card.id for card_id, card in self.cards.items()):
            raise ValueError("Card keys must match card IDs")
        return self


class StructuredAIResponse(BaseModel):
    response: str
    board: BoardData | None = None


def parse_ai_response(content: str, current_board: BoardData) -> StructuredAIResponse:
    try:
        parsed = StructuredAIResponse.model_validate(json.loads(content))
    except (json.JSONDecodeError, ValidationError) as error:
        raise ValueError("AI returned an invalid structured response") from error

    if not parsed.response.strip():
        raise ValueError("AI response text cannot be empty")

    if parsed.board is not None:
        current_column_ids = [column.id for column in current_board.columns]
        updated_column_ids = [column.id for column in parsed.board.columns]
        if updated_column_ids != current_column_ids:
            raise ValueError("AI cannot add, remove, or reorder board columns")

    return parsed


def build_ai_messages(
    message: str,
    history: list[dict[str, str]],
    board: BoardData,
) -> list[dict[str, str]]:
    system_prompt = """You are a project management assistant operating a Kanban board.
Return one JSON object with exactly these top-level fields:
- "response": a concise plain-text reply to the user.
- "board": the complete updated board, or null when no board change is needed.

The board shape is {"columns":[{"id","title","cardIds":[]}],"cards":{"card-id":{"id","title","details"}}}.
You may rename columns and create, edit, move, or delete cards. Preserve column IDs, order,
and count. Every card key must equal its id and appear exactly once in one column.
Do not include Markdown or text outside the JSON object."""

    return [
        {"role": "system", "content": system_prompt},
        *history,
        {
            "role": "user",
            "content": (
                f"Current board:\n{board.model_dump_json()}\n\n"
                f"User request:\n{message}"
            ),
        },
    ]
