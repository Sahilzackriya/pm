import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  signIn,
  getBoard,
  updateBoard,
  sendChat,
  type SignInResponse,
} from "@/lib/api";
import type { BoardData } from "@/lib/kanban";

// Mock fetch
global.fetch = vi.fn();

const mockBoardData: BoardData = {
  columns: [
    { id: "col-1", title: "Backlog", cardIds: ["card-1"] },
    { id: "col-2", title: "Done", cardIds: [] },
  ],
  cards: {
    "card-1": { id: "card-1", title: "Test", details: "Test details" },
  },
};

describe("API client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signIn", () => {
    it("sends correct request to signin endpoint", async () => {
      const mockResponse: SignInResponse = {
        user_id: "user-123",
        username: "testuser",
        token: "token-abc",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await signIn("testuser", "password");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/signin",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "testuser", password: "password" }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it("throws error on signin failure", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: "Invalid credentials" }),
      });

      await expect(signIn("user", "wrong")).rejects.toMatchObject({
        status: 401,
        message: "Invalid credentials",
      });
    });
  });

  describe("getBoard", () => {
    it("fetches board for user", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBoardData,
      });

      const result = await getBoard("user 123");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/boards?user_id=user%20123"
      );
      expect(result).toEqual(mockBoardData);
    });

    it("throws error on getBoard failure", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: "Board not found" }),
      });

      await expect(getBoard("nonexistent")).rejects.toMatchObject({
        status: 404,
        message: "Board not found",
      });
    });
  });

  describe("updateBoard", () => {
    it("sends board update to backend", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await updateBoard("user 123", mockBoardData);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/boards?user_id=user%20123",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            columns: mockBoardData.columns,
            cards: mockBoardData.cards,
          }),
        })
      );

      expect(result).toEqual({ success: true });
    });

    it("throws error on updateBoard failure", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: "Server error" }),
      });

      await expect(updateBoard("user-123", mockBoardData)).rejects.toMatchObject({
        status: 500,
        message: "Server error",
      });
    });
  });

  describe("sendChat", () => {
    it("sends the prompt, history, and user to the chat endpoint", async () => {
      const mockResponse = {
        response: "Moved the card.",
        model: "openai/gpt-oss-120b",
        board_updated: true,
        board: mockBoardData,
      };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const history = [
        { role: "assistant" as const, content: "How can I help?" },
      ];
      const result = await sendChat("user-123", "Move the card", history);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/chat",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "Move the card",
            history,
            user_id: "user-123",
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
