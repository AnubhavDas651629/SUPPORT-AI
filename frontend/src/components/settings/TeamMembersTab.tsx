"use client";

import React, { useState, useEffect } from "react";
import { Users, UserPlus, Shield, Trash2, Mail, CheckCircle2, Lock, Sparkles, Loader2 } from "lucide-react";
import { InviteMemberModal } from "./InviteMemberModal";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

interface MemberItem {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joined_at?: string;
}

export function TeamMembersTab({ onOpenUpgrade }: { onOpenUpgrade: () => void }) {
  const { currentOrg, subscription } = useOrganization();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const planTier = subscription?.plan_tier || "FREE";
  const maxMembers = subscription?.limits?.max_members ?? 1;
  const isFreePlan = planTier === "FREE" && maxMembers <= 1;

  const loadMembers = async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/organizations/${currentOrg.id}/members`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setMembers(res.data);
      } else {
        setMembers([
          {
            id: "mem_1",
            user_id: "usr_1",
            email: "owner@workspace.com",
            full_name: "Workspace Owner",
            role: "OWNER",
            joined_at: "Aug 10, 2026",
          },
        ]);
      }
    } catch (err) {
      setMembers([
        {
          id: "mem_1",
          user_id: "usr_1",
          email: "owner@workspace.com",
          full_name: "Workspace Owner",
          role: "OWNER",
          joined_at: "Aug 10, 2026",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [currentOrg]);

  const handleMemberInvited = (newMem: any) => {
    loadMembers();
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentOrg) return;
    if (confirm("Are you sure you want to remove this team member?")) {
      try {
        await api.delete(`/organizations/${currentOrg.id}/members/${userId}`);
        setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      } catch (err) {
        alert("Failed to remove member.");
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Team Members & Roles</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
              {members.length} / {maxMembers} Seat{maxMembers > 1 ? "s" : ""}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Grant support agents access to reply to escalated tickets and manage knowledge bases.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isFreePlan) {
              onOpenUpgrade();
            } else {
              setIsInviteOpen(true);
            }
          }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xs transition cursor-pointer ${
            isFreePlan
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-slate-950 hover:bg-black text-white"
          }`}
        >
          {isFreePlan ? <Lock className="w-3.5 h-3.5 text-fuchsia-600" /> : <UserPlus className="w-3.5 h-3.5" />}
          <span>{isFreePlan ? "Unlock Team Seats (Pro)" : "Invite Member"}</span>
        </button>
      </div>

      {/* Free Plan Warning */}
      {isFreePlan && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FDF2F8] to-[#F5F3FF] border border-fuchsia-200/80 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Single User Free Workspace</span>
              <span className="text-slate-500 text-[11px]">Upgrade to Pro to add up to 10 agent seats with granular permission roles.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenUpgrade}
            className="px-3.5 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-bold shrink-0 shadow-xs cursor-pointer"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Members List Table */}
      <div className="divide-y divide-slate-100">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-fuchsia-600" />
            <span>Loading team members...</span>
          </div>
        ) : (
          members.map((m) => (
            <div
              key={m.id}
              className="py-4 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  {m.full_name ? m.full_name.charAt(0).toUpperCase() : m.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 truncate">
                      {m.full_name || m.email.split("@")[0]}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.2 rounded-md uppercase ${
                        m.role === "OWNER"
                          ? "bg-purple-100 text-purple-700"
                          : m.role === "ADMIN"
                          ? "bg-fuchsia-100 text-fuchsia-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {m.role}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] truncate">{m.email}</div>
                </div>
              </div>

              {m.role !== "OWNER" && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(m.user_id)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="Remove Member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onMemberInvited={handleMemberInvited}
        onOpenUpgrade={onOpenUpgrade}
      />
    </div>
  );
}
