import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { KanbanBoard } from "@/components/KanbanBoard";
import * as api from "@/lib/api";
import { initialData } from "@/lib/kanban";

// Mock the API module
vi.mock("@/lib/api");

const getFirstColumn = () => screen.getAllByTestId(/column-/i)[0];

const signIn = async (username: string, password: string) => {
  await userEvent.type(screen.getByLabelText(/username/i), username);
  await userEvent.type(screen.getByLabelText(/password/i), password);
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
};

describe("KanbanBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    // Mock successful API responses
    (api.signIn as any).mockResolvedValue({
      user_id: "user-default",
      username: "user",
      token: "token-123",
    });
    (api.getBoard as any).mockResolvedValue(initialData);
    (api.updateBoard as any).mockResolvedValue({ success: true });
  });

  it("shows login screen before authentication", () => {
    render(<KanbanBoard />);
    expect(screen.getByRole("heading", { name: /sign in to kanban studio/i })).toBeInTheDocument();
    expect(screen.queryByTestId(/column-/i)).not.toBeInTheDocument();
  });

  it("rejects invalid credentials", async () => {
    (api.signIn as any).mockRejectedValueOnce({
      status: 401,
      message: "Invalid credentials",
    });
    render(<KanbanBoard />);
    await signIn("invalid", "invalid");
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: /sign in to kanban studio/i })).toBeInTheDocument();
  });

  it("allows a user to sign in and then logout", async () => {
    render(<KanbanBoard />);
    await signIn("user", "password");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /kanban studio/i })).toBeInTheDocument();
    });
    expect(screen.getAllByTestId(/column-/i)).toHaveLength(5);

    await userEvent.click(screen.getByRole("button", { name: /logout/i }));
    expect(screen.getByRole("heading", { name: /sign in to kanban studio/i })).toBeInTheDocument();
    expect(window.sessionStorage.getItem("pm-auth")).toBeNull();
  });

  it("restores the signed-in user after a page reload", async () => {
    window.sessionStorage.setItem(
      "pm-auth",
      JSON.stringify({ user_id: "user-default", username: "user" })
    );

    render(<KanbanBoard />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/column-/i)).toHaveLength(5);
    });
    expect(api.getBoard).toHaveBeenCalledWith("user-default");
  });

  it("renames a column", async () => {
    render(<KanbanBoard />);
    await signIn("user", "password");
    
    await waitFor(() => {
      expect(screen.getAllByTestId(/column-/i)).toHaveLength(5);
    });

    const column = getFirstColumn();
    const input = within(column).getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "New Name");
    expect(input).toHaveValue("New Name");
  });

  it("adds and removes a card", async () => {
    render(<KanbanBoard />);
    await signIn("user", "password");
    
    await waitFor(() => {
      expect(screen.getAllByTestId(/column-/i)).toHaveLength(5);
    });

    const column = getFirstColumn();
    const addButton = within(column).getByRole("button", {
      name: /add a card/i,
    });
    await userEvent.click(addButton);

    const titleInput = within(column).getByPlaceholderText(/card title/i);
    await userEvent.type(titleInput, "New card");
    const detailsInput = within(column).getByPlaceholderText(/details/i);
    await userEvent.type(detailsInput, "Notes");

    await userEvent.click(within(column).getByRole("button", { name: /add card/i }));

    expect(within(column).getByText("New card")).toBeInTheDocument();

    const deleteButton = within(column).getByRole("button", {
      name: /delete new card/i,
    });
    await userEvent.click(deleteButton);

    expect(within(column).queryByText("New card")).not.toBeInTheDocument();
  });
});
