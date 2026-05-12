"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "elexa_chat";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hydrate from session storage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setMessages(data.messages ?? []);
        setCorrelationId(data.correlation_id ?? null);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages, correlation_id: correlationId })
      );
    } catch {
      // ignore
    }
  }, [messages, correlationId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);
    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, correlation_id: correlationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: `⚠️ ${data.error ?? "Couldn't respond. Try again."}`,
          },
        ]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
        setCorrelationId(data.correlation_id);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "⚠️ Network error. Try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setMessages([]);
    setCorrelationId(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 bg-indigo-600 hover:bg-indigo-500 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl transition-transform hover:scale-110"
        aria-label="Open chat"
      >
        {open ? "×" : "💬"}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 md:right-6 z-40 w-[calc(100vw-2rem)] md:w-96 max-w-md bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl flex flex-col h-[60vh] max-h-[600px]">
          {/* Header */}
          <div className="border-b border-[var(--card-border)] px-4 py-3 flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">💬 Support Agent</p>
              <p className="text-xs text-[var(--muted)]">
                Ask anything about the platform. Not financial advice.
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={reset}
                className="text-xs text-[var(--muted)] hover:text-white"
                title="Clear chat"
              >
                Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          >
            {messages.length === 0 ? (
              <div className="text-center text-[var(--muted)] text-sm py-8 space-y-2">
                <p>👋 Hi! I&apos;m here to help.</p>
                <p className="text-xs">
                  Try: &quot;How do I place a trade?&quot; · &quot;What does
                  the Risk Agent do?&quot; · &quot;How do I export trades?&quot;
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-[var(--background)] border border-[var(--card-border)]"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-2xl px-3 py-2 text-sm">
                  <span className="inline-block animate-pulse">●●●</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={send}
            className="border-t border-[var(--card-border)] px-3 py-3 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              disabled={sending}
              className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
