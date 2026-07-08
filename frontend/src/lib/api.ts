import { type BoardData } from "@/lib/kanban";

export type SignInResponse = {
  user_id: string;
  username: string;
  token: string;
};

export type ApiError = {
  message: string;
  status: number;
};

const API_BASE = "/api";

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message: `API error: ${response.status}`,
    };

    try {
      const data = await response.json();
      if (data.detail) {
        error.message = data.detail;
      }
    } catch {
      // Ignore JSON parse errors
    }

    throw error;
  }

  return response.json();
}

export async function signIn(
  username: string,
  password: string
): Promise<SignInResponse> {
  const response = await fetch(`${API_BASE}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  return handleResponse(response);
}

export async function getBoard(userId: string): Promise<BoardData> {
  const response = await fetch(`${API_BASE}/boards?user_id=${userId}`);
  return handleResponse(response);
}

export async function updateBoard(
  userId: string,
  board: BoardData
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/boards?user_id=${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      columns: board.columns,
      cards: board.cards,
    }),
  });

  return handleResponse(response);
}
