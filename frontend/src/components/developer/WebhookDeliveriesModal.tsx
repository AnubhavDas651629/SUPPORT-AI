"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Clock, RotateCw, ExternalLink, Code } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

interface DeliveryLog {
  id: string;
  event_type: string;
  status_code: number | null;
  duration_ms: number | null;
  created_at: string;
  payload: any;
  response_body: string | null;
  is_success: boolean;
}

export function WebhookDeliveriesModal({
  isOpen,
  onClose,
  webhookName,
  webhookUrl,
  webhookId,
}: {
  isOpen: boolean;
  onClose: () => void;
  webhookName: string;
  webhookUrl: string;
  webhookId: string;
}) {
  const [deliveries, setDeliveries] = useState<DeliveryLog[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { currentOrg } = useOrganization();

  useEffect(() => {
    if (!isOpen || !currentOrg || !webhookId) return;

    const fetchDeliveries = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/organizations/${currentOrg.id}/webhooks/${webhookId}/deliveries`);
        setDeliveries(res.data);
        if (res.data.length > 0) {
          setSelectedDelivery(res.data[0]);
        } else {
          setSelectedDelivery(null);
        }
      } catch (err) {
        console.error("Failed to fetch deliveries", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliveries();
  }, [isOpen, currentOrg, webhookId]);

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
            {isLoading ? (
              <div className="text-center p-4 text-xs text-slate-400">Loading logs...</div>
            ) : deliveries.length === 0 ? (
              <div className="text-center p-4 text-xs text-slate-400">No delivery logs found.</div>
            ) : (
              deliveries.map((del) => (
                <div
                  key={del.id}
                  onClick={() => setSelectedDelivery(del)}
                  className={`p-3 rounded-xl transition cursor-pointer text-xs space-y-1 ${
                    selectedDelivery?.id === del.id
                      ? "bg-white border border-fuchsia-300 shadow-xs"
                      : "hover:bg-white/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono px-1.5 py-0.2 rounded font-bold text-[10px] ${
                      del.is_success ? "text-emerald-700 bg-emerald-100" : "text-red-700 bg-red-100"
                    }`}>
                      {del.status_code || "ERR"} {del.is_success ? "OK" : "FAIL"}
                    </span>
                    <span className="text-[10px] text-slate-400">{new Date(del.created_at).toLocaleString()}</span>
                  </div>
                  <div className="font-bold text-slate-800 truncate">{del.event_type}</div>
                  <div className="text-[10px] text-slate-400">{del.duration_ms || 0}ms response time</div>
                </div>
              ))
            )}
          </div>

          {/* Right JSON Payload Viewer (7 cols) */}
          <div className="md:col-span-7 border border-slate-200/80 rounded-2xl p-4 bg-slate-950 text-slate-100 overflow-y-auto flex flex-col justify-between font-mono text-xs shadow-inner">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400 font-sans">
                <span>Payload Body</span>
                {selectedDelivery && (
                  <span className={`${selectedDelivery.is_success ? "text-emerald-400" : "text-red-400"} font-mono`}>
                    {selectedDelivery.status_code || "ERR"} • {selectedDelivery.duration_ms || 0}ms
                  </span>
                )}
              </div>
              <pre className="text-emerald-300 text-[11px] leading-relaxed overflow-x-auto">
                {selectedDelivery ? JSON.stringify(selectedDelivery.payload, null, 2) : "No log selected."}
              </pre>
            </div>
            
            {selectedDelivery && selectedDelivery.response_body && (
              <div className="mt-4 pt-4 border-t border-slate-800 text-xs">
                <div className="text-slate-400 mb-1 font-sans">Server Response:</div>
                <pre className="text-slate-300 whitespace-pre-wrap">{selectedDelivery.response_body}</pre>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-sans mt-4">
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
