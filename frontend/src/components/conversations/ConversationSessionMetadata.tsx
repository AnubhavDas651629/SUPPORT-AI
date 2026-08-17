"use client";

import React from "react";
import { User, Activity, FileText, AlertCircle, ShieldCheck, Zap } from "lucide-react";
import { ConversationItem } from "./ConversationListPane";

export function ConversationSessionMetadata({
  conversation,
}: {
  conversation: ConversationItem;
}) {
  return (
    <div className="w-72 lg:w-80 bg-slate-50 flex flex-col overflow-y-auto shrink-0 hidden xl:flex">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-fuchsia-600" />
          Session Intelligence
        </h4>
      </div>

      <div className="p-4 space-y-6 flex-1">
        
        {/* Customer Context */}
        <div>
          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Visitor Info</h5>
          <div className="space-y-1 text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Name</span>
              <span className="font-medium">Unknown Visitor</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Local Time</span>
              <span className="font-medium">2:45 PM (EST)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Location</span>
              <span className="font-medium">New York, USA</span>
            </div>
          </div>
        </div>

        {/* AI State */}
        <div>
          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">AI State</h5>
          <div className="space-y-2">
            <div className="bg-white border border-slate-200 rounded p-2 text-xs flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Status
              </span>
              <span className={`font-medium ${conversation.is_escalated ? 'text-rose-600' : 'text-fuchsia-600'}`}>
                {conversation.is_escalated ? 'Human Handover' : 'Generating Reply'}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded p-2 text-xs flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Detected Intent</span>
                <span className="font-medium text-slate-700">Order Status</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Confidence</span>
                <span className="font-medium text-emerald-600">94%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Knowledge Sources */}
        <div>
          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Knowledge Sources Used</h5>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 text-xs">
              <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-slate-700 truncate">Shipping Policy 2024</p>
                <p className="text-[10px] text-slate-500">Matched via semantic search</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-slate-700 truncate">Returns FAQ</p>
                <p className="text-[10px] text-slate-500">Matched via semantic search</p>
              </div>
            </div>
          </div>
        </div>

        {/* Escalation Rules */}
        <div>
          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Escalation Triggers</h5>
          <div className="bg-slate-100/50 border border-slate-200 rounded p-2 text-xs text-slate-600">
            {conversation.is_escalated ? (
              <div className="flex items-start gap-1.5 text-rose-700">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Escalated due to direct request for human agent ("I want to speak to a person").</span>
              </div>
            ) : (
              <span className="text-slate-500 italic">No triggers activated. Operating autonomously.</span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>End-to-End Encrypted</span>
      </div>
    </div>
  );
}
