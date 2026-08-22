/**
 * The specialist agents the backend actually runs.
 *
 * Source of truth: `app/agents/router.py` (the routing enum + classifier) and
 * `app/agents/specialists.py` (the per-route system prompts). The router is an
 * LLM classifier that returns one of these routes with a confidence score, and
 * the matching prompt is then used to answer.
 *
 * There is no `/agents` endpoint — agents are code-level configuration, not
 * database rows — so this catalog is static. Per-agent runtime volume is
 * derived from conversation and escalation data, never invented.
 */
import type { LucideIcon } from "lucide-react";
import { CreditCard, LifeBuoy, Wrench } from "lucide-react";

export type AgentRoute = "billing" | "technical" | "general";

export interface AgentDefinition {
  route: AgentRoute;
  name: string;
  icon: LucideIcon;
  summary: string;
  /** Condensed from the backend system prompt for this route. */
  directives: string[];
  handles: string[];
  refuses: string[];
  /** Keywords the classifier is prompted to associate with this route. */
  signals: string[];
}

export const AGENTS: AgentDefinition[] = [
  {
    route: "billing",
    name: "Billing Agent",
    icon: CreditCard,
    summary:
      "Handles refunds, pricing questions and subscription changes with an empathetic, reassuring tone.",
    directives: [
      "Answer only from retrieved knowledge — never invent policy",
      "Stay polite, empathetic and reassuring",
      "Hand technical questions back to the router",
    ],
    handles: ["Refunds", "Pricing", "Subscriptions", "Invoices", "Payment failures"],
    refuses: ["Technical troubleshooting", "Bug reports"],
    signals: ["refund", "invoice", "pricing", "subscription", "charge"],
  },
  {
    route: "technical",
    name: "Technical Support Agent",
    icon: Wrench,
    summary:
      "Diagnoses bugs, errors and outages. Direct and analytical, asks for logs when a report is thin.",
    directives: [
      "Be direct and analytical",
      "Ask for error logs when the report lacks detail",
      "Never discuss pricing or refunds",
    ],
    handles: ["Bugs", "Errors", "How-to questions", "Integration issues", "Outages"],
    refuses: ["Pricing", "Refunds"],
    signals: ["error", "bug", "not working", "500", "how do I"],
  },
  {
    route: "general",
    name: "General Support Agent",
    icon: LifeBuoy,
    summary:
      "The default route. Answers everyday questions and escalates anything that belongs to a specialist.",
    directives: [
      "Friendly tone for everyday inquiries",
      "Escalate complex billing or technical questions",
      "Say \"I don't know\" rather than guessing",
    ],
    handles: ["Account questions", "Order status", "General product questions"],
    refuses: ["Complex billing disputes", "Deep technical debugging"],
    signals: ["hello", "account", "order", "where is"],
  },
];

export function getAgent(route: string): AgentDefinition | undefined {
  return AGENTS.find((a) => a.route === route);
}

/**
 * Best-effort route classification for display purposes only.
 *
 * The real routing decision is made server-side by an LLM during the chat call
 * and is not persisted on the conversation, so historical conversations carry
 * no route. This keyword pass lets the UI group past conversations by the agent
 * that most likely handled them; it is a display heuristic, not the router.
 */
export function guessRoute(text: string): AgentRoute {
  const t = text.toLowerCase();
  const billing = ["refund", "invoice", "billing", "price", "pricing", "subscription", "charge", "payment", "plan", "card"];
  const technical = ["error", "bug", "broken", "crash", "fail", "not working", "api", "500", "timeout", "integration", "install", "login issue"];
  if (billing.some((k) => t.includes(k))) return "billing";
  if (technical.some((k) => t.includes(k))) return "technical";
  return "general";
}
