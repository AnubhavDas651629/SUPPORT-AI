"use client";

import React, { useState } from "react";
import { X, CheckCircle2, AlertCircle, Clock, RotateCw, ExternalLink, Code } from "lucide-react";

interface DeliveryLog {
  id: string;
  event: string;
  status_code: number;
  duration_ms: number;
  timestamp: string;
  payload: string;
}

const SAMPLE_DELIVERIES: DeliveryLog[] = [
  {
    id: "del_1",
    event: "ticket.escalated",
    status_code: 200,
    duration_ms: 64,
    timestamp: "10 mins ago",
    payload: JSON.stringify(
      {
        event: "ticket.escalated",
        ticket_id: "88392",
        customer_email: "sarah.j@enterprise.com",
        reason: "Refund request exceeding $50 threshold",
        created_at: "2026-08-12T07:45:00Z",
      },
      null,
      2
    ),
  },
  {
    id: "del_2",
    event: "message.created",
    status_code: 200,
    duration_ms: 42,
    timestamp: "25 mins ago",
    payload: JSON.stringify(
      {
        event: "message.created",
        conversation_id: "conv_88392",
        sender: "customer",
        content: "I want an immediate refund of $500",
      },
      null,
      2
    ),
  },
];

export function WebhookDeliveriesModal({
  isOpen,
  onClose,
  webhookName,
  webhookUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  webhookName: string;
  webhookUrl: string;
}) {
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryLog>(SAMPLE_DELIVERIES[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Webhook Delivery Logs</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">{webhookUrl}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Two-Pane Log Viewer */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 h-[400px]">
          {/* Left Deliveries List (5 cols) */}
          <div className="md:col-span-5 border border-slate-200/80 rounded-2xl p-2 space-y-1.5 overflow-y-auto bg-slate-50/50">
            {SAMPLE_DELIVERIES.map((del) => (
              <div
                key={del.id}
                onClick={() => setSelectedDelivery(del)}
                className={`p-3 rounded-xl transition cursor-pointer text-xs space-y-1 ${
                  selectedDelivery.id === del.id
                    ? "bg-white border border-fuchsia-300 shadow-xs"
                    : "hover:bg-white/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold text-[10px]">
                    {del.status_code} OK
                  </span>
                  <span className="text-[10px] text-slate-400">{del.timestamp}</span>
                </div>
                <div className="font-bold text-slate-800 truncate">{del.event}</div>
                <div className="text-[10px] text-slate-400">{del.duration_ms}ms response time</div>
              </div>
            ))}
          </div>

          {/* Right JSON Payload Viewer (7 cols) */}
          <div className="md:col-span-7 border border-slate-200/80 rounded-2xl p-4 bg-slate-950 text-slate-100 overflow-y-auto flex flex-col justify-between font-mono text-xs shadow-inner">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400 font-sans">
                <span>Payload Body</span>
                <span className="text-emerald-400 font-mono">200 OK • {selectedDelivery.duration_ms}ms</span>
              </div>
              <pre className="text-emerald-300 text-[11px] leading-relaxed overflow-x-auto">
                {selectedDelivery.payload}
              </pre>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-sans">
              Signed with HMAC-SHA256 in <code>X-SupportAI-Signature</code>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Close Logs
          </button>
        </div>
      </div>
    </div>
  );
}
