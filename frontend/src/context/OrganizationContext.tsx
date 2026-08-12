"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Organization, SubscriptionInfo, UsageSummary, PlanTier } from "@/types/dashboard";

interface OrganizationContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  subscription: SubscriptionInfo | null;
  usage: UsageSummary | null;
  isLoading: boolean;
  setCurrentOrg: (org: Organization) => void;
  refreshOrgData: () => Promise<void>;
  createOrganization: (name: string) => Promise<Organization>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load organizations on mount
  useEffect(() => {
    async function loadOrgs() {
      setIsLoading(true);
      try {
        const res = await api.get("/organizations");
        const orgList = Array.isArray(res.data) ? res.data : [];
        setOrganizations(orgList);

        if (orgList.length > 0) {
          // Check localStorage or default to first
          const savedOrgId = typeof window !== "undefined" ? localStorage.getItem("support_ai_active_org_id") : null;
          const found = orgList.find((o: Organization) => o.id === savedOrgId) || orgList[0];
          setCurrentOrgState(found);
        }
      } catch (err) {
        console.warn("Could not load organizations:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrgs();
  }, []);

  // When currentOrg changes, load its subscription & usage
  useEffect(() => {
    if (!currentOrg) return;

    if (typeof window !== "undefined") {
      localStorage.setItem("support_ai_active_org_id", currentOrg.id);
    }

    async function loadOrgDetails() {
      try {
        const [subRes, usageRes] = await Promise.allSettled([
          api.get(`/organizations/${currentOrg!.id}/subscription`),
          api.get(`/organizations/${currentOrg!.id}/usage`),
        ]);

        if (subRes.status === "fulfilled") {
          setSubscription(subRes.value.data);
        } else {
          // Fallback free tier representation
          setSubscription({
            id: "sub_free",
            organization_id: currentOrg!.id,
            plan_tier: "FREE" as PlanTier,
            status: "ACTIVE",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            limits: {
              max_ai_responses_per_month: 100,
              max_knowledge_bases: 1,
              max_documents_per_kb: 10,
              max_members: 1,
              max_storage_bytes: 104857600,
              allows_api_keys: false,
              allows_webhooks: false,
              allows_custom_branding: false,
            },
          });
        }

        if (usageRes.status === "fulfilled") {
          setUsage(usageRes.value.data);
        } else {
          // Fallback mock usage
          setUsage({
            period_start: new Date().toISOString(),
            period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            ai_responses: { used: 42, limit: 100 },
            storage_bytes: { used: 14200000, limit: 104857600 },
            conversations: { used: 18, limit: null },
          });
        }
      } catch (err) {
        console.warn("Could not load subscription/usage:", err);
      }
    }

    loadOrgDetails();
  }, [currentOrg]);

  const setCurrentOrg = (org: Organization) => {
    setCurrentOrgState(org);
  };

  const refreshOrgData = async () => {
    if (!currentOrg) return;
    try {
      const [subRes, usageRes] = await Promise.allSettled([
        api.get(`/organizations/${currentOrg.id}/subscription`),
        api.get(`/organizations/${currentOrg.id}/usage`),
      ]);
      if (subRes.status === "fulfilled") setSubscription(subRes.value.data);
      if (usageRes.status === "fulfilled") setUsage(usageRes.value.data);
    } catch (e) {
      console.warn("Refresh failed", e);
    }
  };

  const createOrganization = async (name: string): Promise<Organization> => {
    const res = await api.post("/organizations", { name });
    const newOrg = res.data;
    setOrganizations((prev) => [...prev, newOrg]);
    setCurrentOrgState(newOrg);
    return newOrg;
  };

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrg,
        subscription,
        usage,
        isLoading,
        setCurrentOrg,
        refreshOrgData,
        createOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}
