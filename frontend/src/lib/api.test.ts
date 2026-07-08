import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  signIn,
  getBoard,
  updateBoard,
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

      (global.fetch as any).mockResolvedValueOnce({
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
      (global.fetch as any).mockResolvedValueOnce({
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
      (global.fetch as any).mockResolvedValueOnce({
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
      (global.fetch as any).mockResolvedValueOnce({
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
      (global.fetch as any).mockResolvedValueOnce({
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
      (global.fetch as any).mockResolvedValueOnce({
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
});
