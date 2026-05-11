"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  kind: string;
  title: string;
  body: string;
  created_at: string;
  href?: string;
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setItems(data.items.slice(0, 20));
        setUnread(data.unread_count ?? 0);
      }
    } catch {
      // silent
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", { method: "POST" });
      setUnread(0);
    } catch {
      // silent
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread > 0) markAllRead();
        }}
        className="relative p-2 rounded-lg hover:bg-[var(--background)] transition-colors"
        title="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b border-[var(--card-border)] flex justify-between items-center">
            <p className="font-semibold text-sm">Recent activity</p>
            <button
              onClick={() => {
                load();
              }}
              className="text-xs text-[var(--muted)] hover:text-white"
            >
              Refresh
            </button>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--muted)] text-center">
              No notifications yet.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--card-border)]">
              {items.map((n) => {
                const inner = (
                  <div className="px-4 py-3 hover:bg-[var(--background)] transition-colors">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {n.body}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                );
                return n.href ? (
                  <li key={n.id}>
                    <Link href={n.href}>{inner}</Link>
                  </li>
                ) : (
                  <li key={n.id}>{inner}</li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
