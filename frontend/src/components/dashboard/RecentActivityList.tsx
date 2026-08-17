"use client";

import React, { useState, useEffect } from "react";
import { TicketItem } from "@/types/dashboard";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";
import { Clock, MessageSquare, Plus, CheckCircle2 } from "lucide-react";

export function RecentActivityList() {
  const { currentOrg } = useOrganization();
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;
    setIsLoading(true);
    api.get(`/tickets?organization_id=${currentOrg.id}`)
      .then(res => {
        const items = res.data?.items || [];
        // Treat recent tickets as "activity"
        const recent = items.slice(0, 5).map((t: any) => ({
          id: t.id,
          type: t.status === 'RESOLVED' ? 'resolved' : t.status === 'OPEN' ? 'created' : 'updated',
          title: t.subject,
          time: new Date(t.updated_at || t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          user: t.customer_name || 'Customer'
        }));
        setActivities(recent);
      })
      .catch(err => {
        console.warn("Could not load activity:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentOrg]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
      </div>
      <div className="p-4 flex-1">
        {isLoading ? (
          <div className="text-xs text-slate-400">Loading...</div>
        ) : activities.length === 0 ? (
          <div className="text-xs text-slate-400">No recent activity.</div>
        ) : (
          <div className="space-y-4">
            {activities.map((act, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-0.5 shrink-0">
                  {act.type === 'resolved' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : act.type === 'created' ? (
                    <Plus className="w-4 h-4 text-blue-500" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900 line-clamp-1">{act.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                    <span className="font-medium text-slate-600">{act.user}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{act.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
