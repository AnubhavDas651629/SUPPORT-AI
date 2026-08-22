"use client";

import { Bot, Quote, User, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/api/types";
import { MESSAGE_ROLE_META } from "@/lib/domain";
import { formatDateTime } from "@/lib/utils";

const ROLE_ICON = {
  USER: User,
  ASSISTANT: Bot,
  SUPPORT: User,
  SYSTEM: Wrench,
} as const;

export function MessageThread({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-[13px] text-subtle">
        No messages on this conversation yet.
      </p>
    );
  }

  return (
    <ol className="space-y-4 px-4 py-5 sm:px-5">
      {messages.map((message) => {
        const meta = MESSAGE_ROLE_META[message.role];
        const Icon = ROLE_ICON[message.role];
        const outbound = meta.align === "right";

        // A compressed-history marker written by the memory compressor.
        if (message.role === "SYSTEM") {
          return (
            <li key={message.id} className="flex justify-center">
              <p className="max-w-lg rounded-control border border-dashed border-line bg-surface-2 px-3 py-2 text-center text-[12px] leading-relaxed text-subtle">
                {message.content}
              </p>
            </li>
          );
        }

        return (
          <li
            key={message.id}
            className={cn("flex gap-2.5", outbound ? "justify-end" : "justify-start")}
          >
            {!outbound && (
              <span
                aria-hidden="true"
                className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-subtle"
              >
                <Icon className="size-3" />
              </span>
            )}

            <div className={cn("max-w-[min(38rem,85%)]", outbound && "text-right")}>
              <div
                className={cn(
                  "inline-block rounded-panel border px-3.5 py-2.5 text-left",
                  message.role === "ASSISTANT" &&
                    "border-accent-line bg-accent-soft",
                  message.role === "SUPPORT" && "border-line bg-surface-2",
                  message.role === "USER" && "border-line bg-surface",
                )}
              >
                <p className="text-[11px] uppercase tracking-[0.07em] text-subtle">
                  {meta.label}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-fg">
                  {message.content}
                </p>

                {message.citations && message.citations.length > 0 && (
                  <ul className="mt-2.5 space-y-1 border-t border-line pt-2">
                    {message.citations.map((citation, i) => (
                      <li
                        key={`${message.id}-cite-${i}`}
                        className="flex items-center gap-1.5 font-mono text-[10.5px] text-subtle"
                      >
                        <Quote className="size-3 shrink-0" aria-hidden="true" />
                        {citation.filename ?? "source"}
                        {typeof citation.chunk_index === "number" && (
                          <span>· chunk {citation.chunk_index}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="mt-1 text-[11.5px] text-subtle">
                {formatDateTime(message.created_at)}
              </p>
            </div>

            {outbound && (
              <span
                aria-hidden="true"
                className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border border-accent-line bg-accent-soft text-accent"
              >
                <Icon className="size-3" />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
