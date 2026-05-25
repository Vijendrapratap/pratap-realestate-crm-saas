"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { useWorkspace } from "@/app/dashboard/workspace-context";

type PropertyMatch = {
  id: string;
  title: string;
  price: string;
  score?: number;
  reason: string;
};

type AgentResponse = {
  agentResponse?: string;
  proposedCrmUpdates?: string[];
  recommendedProperties?: PropertyMatch[];
};

type ChatTurn =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; updates?: string[]; matches?: PropertyMatch[] };

const suggestions = [
  "Which hot leads need action today?",
  "Show stale leads",
  "Draft a WhatsApp follow-up",
  "Match properties for the selected lead",
];

export default function ChatPage() {
  const { tenantId, leads, selectedLeadId } = useWorkspace();
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, loading]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setMessages((m) => [...m, { role: "user", text: trimmed }]);
      setInput("");
      setLoading(true);
      try {
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            leadId: selectedLeadId ?? undefined,
          }),
        });

        const contentType = response.headers.get("content-type") ?? "";

        if (contentType.includes("application/json")) {
          const data: AgentResponse = await response.json();
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              text: data.agentResponse ?? "I don't have an answer yet.",
              updates: data.proposedCrmUpdates,
              matches: data.recommendedProperties,
            },
          ]);
          return;
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const META_DELIMITER = "\n__META__\n";
        let assistantIndex = -1;
        setMessages((m) => {
          assistantIndex = m.length;
          return [...m, { role: "assistant", text: "" }];
        });

        const patchAssistant = (
          patch: Partial<Extract<ChatTurn, { role: "assistant" }>>,
        ) => {
          setMessages((m) => {
            const next = [...m];
            const existing = next[assistantIndex];
            if (existing && existing.role === "assistant") {
              next[assistantIndex] = { ...existing, ...patch };
            }
            return next;
          });
        };

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let metaSplit = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const metaIdx = buffer.indexOf(META_DELIMITER);
          if (metaIdx !== -1 && !metaSplit) {
            const textPart = buffer.slice(0, metaIdx);
            const metaPart = buffer.slice(metaIdx + META_DELIMITER.length);
            metaSplit = true;
            patchAssistant({ text: textPart });
            buffer = metaPart;
          } else if (!metaSplit) {
            patchAssistant({ text: buffer });
          }
        }
        buffer += decoder.decode();

        if (metaSplit && buffer.trim()) {
          try {
            const meta = JSON.parse(buffer) as {
              proposedCrmUpdates?: string[];
              recommendedProperties?: PropertyMatch[];
            };
            patchAssistant({
              updates: meta.proposedCrmUpdates,
              matches: meta.recommendedProperties,
            });
          } catch {
            // Ignore — meta payload malformed; text already shown.
          }
        }
      } catch {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: "Couldn't reach the agent. Try again." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, selectedLeadId],
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? null;

  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-200/60 bg-white/40 px-6 py-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{tenantId || "—"}</p>
          <p className="text-sm font-semibold tracking-tight">
            {selectedLead ? selectedLead.name : "AI workspace"}
          </p>
        </div>
        <Link href="/" className="text-sm font-medium text-slate-600 transition hover:text-[#111827]">
          Home
        </Link>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-10">
          {messages.length === 0 ? (
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.04em]">How can I help today?</h2>
              <p className="mt-2 text-sm text-slate-500">
                {selectedLead
                  ? `Focused on ${selectedLead.name} · ${selectedLead.stage}`
                  : "Pick a lead in the sidebar, or just ask."}
              </p>
              <div className="mt-8 grid gap-2 sm:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => void send(suggestion)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-[#111827] hover:text-[#111827]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <ChatBubble key={index} message={message} />
              ))}
              {loading ? <ChatThinking /> : null}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={onSubmit} className="border-t border-slate-200/60 bg-white/40 px-6 py-4">
        <div className="mx-auto flex w-full max-w-2xl items-end gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-[#111827]">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder="Ask anything about your leads…"
            className="max-h-40 flex-1 resize-none border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#111827] text-sm font-semibold text-white transition disabled:bg-slate-300"
            aria-label="Send"
          >
            ↑
          </button>
        </div>
      </form>
    </>
  );
}

function ChatBubble({ message }: { message: ChatTurn }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#111827] px-4 py-2.5 text-sm leading-6 text-white">
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="max-w-[90%] whitespace-pre-wrap text-sm leading-6 text-slate-800">
        {message.text}
      </div>
      {message.updates && message.updates.length > 0 ? (
        <div className="rounded-2xl bg-white px-4 py-3 text-xs text-slate-600 ring-1 ring-slate-200">
          <p className="text-xs font-semibold text-slate-700">Proposed CRM updates</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4">
            {message.updates.map((update) => (
              <li key={update}>{update}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {message.matches && message.matches.length > 0 ? (
        <div className="grid gap-2">
          {message.matches.map((match) => (
            <div key={match.id} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <div className="flex items-center justify-between text-sm">
                <strong className="font-semibold">{match.title}</strong>
                <span className="text-xs text-slate-500">{match.price}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{match.reason}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ChatThinking() {
  return (
    <div className="flex items-center gap-1.5 text-slate-400">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]" />
    </div>
  );
}
