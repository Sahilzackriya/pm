"use client";

import { useState, type FormEvent } from "react";
import { Bot, Send, Trash2, User } from "lucide-react";
import { sendChat, type ChatMessage } from "@/lib/api";
import type { BoardData } from "@/lib/kanban";

type ChatSidebarProps = {
  userId: string;
  onBoardUpdate: (board: BoardData) => void;
};

export const ChatSidebar = ({
  userId,
  onBoardUpdate,
}: ChatSidebarProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = prompt.trim();
    if (!message || isSending) {
      return;
    }

    const history = messages;
    setMessages((current) => [...current, { role: "user", content: message }]);
    setPrompt("");
    setError(null);
    setIsSending(true);

    try {
      const result = await sendChat(userId, message, history);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.response },
      ]);
      if (result.board) {
        onBoardUpdate(result.board);
      }
    } catch (requestError) {
      const errorMessage =
        typeof requestError === "object" &&
        requestError !== null &&
        "message" in requestError &&
        typeof requestError.message === "string"
          ? requestError.message
          : "The assistant could not respond.";
      setError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <aside className="flex min-h-[520px] flex-col border border-[var(--stroke)] bg-white shadow-[var(--shadow)] xl:sticky xl:top-6 xl:h-[min(680px,calc(100vh-4rem))]">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--stroke)] px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center bg-[var(--navy-dark)] text-white">
            <Bot size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--navy-dark)]">
              Board assistant
            </h2>
            <p className="text-xs text-[var(--gray-text)]">OpenRouter AI</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setMessages([]);
            setError(null);
          }}
          disabled={messages.length === 0}
          className="grid h-9 w-9 place-items-center border border-[var(--stroke)] text-[var(--gray-text)] transition hover:bg-[var(--surface)] hover:text-[var(--navy-dark)] disabled:opacity-40"
          aria-label="Clear conversation"
          title="Clear conversation"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>

      <div
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="my-auto border-l-2 border-[var(--accent-yellow)] pl-4">
            <p className="text-sm font-semibold text-[var(--navy-dark)]">
              What should change?
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--gray-text)]">
              Ask me to create, edit, move, or delete cards on this board.
            </p>
          </div>
        ) : null}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex gap-3 ${
              message.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center ${
                message.role === "user"
                  ? "bg-[var(--primary-blue)] text-white"
                  : "bg-[var(--navy-dark)] text-white"
              }`}
            >
              {message.role === "user" ? (
                <User size={14} aria-hidden="true" />
              ) : (
                <Bot size={14} aria-hidden="true" />
              )}
            </span>
            <p
              className={`max-w-[85%] whitespace-pre-wrap px-3 py-2 text-sm leading-6 ${
                message.role === "user"
                  ? "bg-[var(--primary-blue)] text-white"
                  : "bg-[var(--surface)] text-[var(--navy-dark)]"
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}

        {isSending ? (
          <p className="text-xs font-semibold text-[var(--primary-blue)]">
            Thinking...
          </p>
        ) : null}
        {error ? (
          <p className="border-l-2 border-red-500 pl-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-[var(--stroke)] p-4"
      >
        <label htmlFor="chat-prompt" className="sr-only">
          Message the board assistant
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="chat-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            rows={3}
            placeholder="Ask about your board..."
            disabled={isSending}
            className="min-h-20 flex-1 resize-none border border-[var(--stroke)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 outline-none transition focus:border-[var(--primary-blue)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isSending}
            className="grid h-11 w-11 shrink-0 place-items-center bg-[var(--secondary-purple)] text-white transition hover:brightness-110 disabled:opacity-40"
            aria-label="Send message"
            title="Send message"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </div>
      </form>
    </aside>
  );
};
