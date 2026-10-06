"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import type { AssistantTopic } from "@/lib/assistant-topics";

type Target = AssistantTopic | "receipt" | "appointment";
const Context = createContext<{
  request: { target: Target } | null;
  launch: (target: Target) => void;
  restoreFocus: () => void;
} | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<{ target: Target } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  function launch(target: Target) {
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setRequest({ target });
  }
  function restoreFocus() { const element = trigger.current; trigger.current = null; if (element?.isConnected) element.focus(); }
  return <Context.Provider value={{ request, launch, restoreFocus }}>{children}</Context.Provider>;
}

export function useAssistant() {
  const context = useContext(Context);
  if (!context) throw new Error("AssistantProvider ausente.");
  return context;
}
