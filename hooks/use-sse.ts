"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type SSEStatus = "connected" | "reconnecting" | "disconnected";

export function useSSE(onTask: () => void) {
  const [status, setStatus] = useState<SSEStatus>("disconnected");
  const attemptRef = useRef(0);
  const esRef = useRef<EventSource | null>(null);
  const onTaskRef = useRef(onTask);
  onTaskRef.current = onTask;

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = "/api/tasks/stream";
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("connected", () => {
      setStatus("connected");
      attemptRef.current = 0;
    });

    es.addEventListener("task", () => {
      onTaskRef.current();
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setStatus("reconnecting");
      const delay = Math.min(1000 * Math.pow(2, attemptRef.current), 30000);
      attemptRef.current += 1;
      setTimeout(() => connect(), delay);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);

  return { status };
}
