import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "@/components/KanbanBoard";

const getFirstColumn = () => screen.getAllByTestId(/column-/i)[0];

const signIn = async (username: string, password: string) => {
  await userEvent.type(screen.getByLabelText(/username/i), username);
  await userEvent.type(screen.getByLabelText(/password/i), password);
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
};

describe("KanbanBoard", () => {
  it("shows login screen before authentication", () => {
    render(<KanbanBoard />);
    expect(screen.getByRole("heading", { name: /sign in to kanban studio/i })).toBeInTheDocument();
    expect(screen.queryByTestId(/column-/i)).not.toBeInTheDocument();
  });

  it("rejects invalid credentials", async () => {
    render(<KanbanBoard />);
    await signIn("invalid", "invalid");
    expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /sign in to kanban studio/i })).toBeInTheDocument();
  });

  it("allows a user to sign in and then logout", async () => {
    render(<KanbanBoard />);
    await signIn("user", "password");

    expect(screen.getByText(/kanban studio/i)).toBeInTheDocument();
    expect(screen.getAllByTestId(/column-/i)).toHaveLength(5);

    await userEvent.click(screen.getByRole("button", { name: /logout/i }));
    expect(screen.getByRole("heading", { name: /sign in to kanban studio/i })).toBeInTheDocument();
  });

  it("renames a column", async () => {
    render(<KanbanBoard />);
    await signIn("user", "password");
    const column = getFirstColumn();
    const input = within(column).getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "New Name");
    expect(input).toHaveValue("New Name");
  });

  it("adds and removes a card", async () => {
    render(<KanbanBoard />);
    await signIn("user", "password");
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
