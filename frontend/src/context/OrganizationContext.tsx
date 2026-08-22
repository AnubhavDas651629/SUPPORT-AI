"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { billingApi, membersApi, organizationsApi } from "@/lib/api";
import type {
  Organization,
  OrganizationRole,
  Subscription,
  UsageSummary,
} from "@/lib/api/types";
import { useAuth } from "./AuthContext";

const ACTIVE_ORG_KEY = "supportai_active_org_id";

interface OrganizationContextValue {
  organizations: Organization[];
  currentOrg: Organization | null;
  /** The signed-in user's role in `currentOrg`, or null while it resolves. */
  role: OrganizationRole | null;
  subscription: Subscription | null;
  usage: UsageSummary | null;
  isLoading: boolean;
  /** True once organizations have loaded and the list is empty. */
  needsOnboarding: boolean;
  error: string | null;
  selectOrg: (id: string) => void;
  createOrganization: (name: string) => Promise<Organization>;
  refresh: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [role, setRole] = useState<OrganizationRole | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loadedOrgs, setLoadedOrgs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrganizations = useCallback(async () => {
    try {
      const list = await organizationsApi.list();
      setOrganizations(list);
      setError(null);

      const saved =
        typeof window !== "undefined" ? localStorage.getItem(ACTIVE_ORG_KEY) : null;
      const next = list.find((o) => o.id === saved) ?? list[0] ?? null;
      setCurrentOrgId(next?.id ?? null);
    } catch {
      setError("Couldn't load your organizations.");
      setOrganizations([]);
    } finally {
      setLoadedOrgs(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      if (!cancelled) await loadOrganizations();
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loadOrganizations]);

  // Derived rather than toggled: we are loading until the list has come back.
  const isLoading = !loadedOrgs;

  const currentOrg = useMemo(
    () => organizations.find((o) => o.id === currentOrgId) ?? null,
    [organizations, currentOrgId],
  );

  // Subscription, usage and the viewer's role all follow the active org.
  const loadOrgDetail = useCallback(async () => {
    if (!currentOrgId || !user) return;

    const [sub, use, members] = await Promise.allSettled([
      billingApi.subscription(currentOrgId),
      billingApi.usage(currentOrgId),
      membersApi.list(currentOrgId),
    ]);

    setSubscription(sub.status === "fulfilled" ? sub.value : null);
    setUsage(use.status === "fulfilled" ? use.value : null);
    setRole(
      members.status === "fulfilled"
        ? (members.value.find((m) => m.id === user.id)?.role ?? null)
        : null,
    );
  }, [currentOrgId, user]);

  useEffect(() => {
    if (!currentOrgId) return;
    if (typeof window !== "undefined") localStorage.setItem(ACTIVE_ORG_KEY, currentOrgId);
    let cancelled = false;
    (async () => {
      if (!cancelled) await loadOrgDetail();
    })();
    return () => {
      cancelled = true;
    };
  }, [currentOrgId, loadOrgDetail]);

  const selectOrg = useCallback((id: string) => {
    setCurrentOrgId(id);
    setSubscription(null);
    setUsage(null);
    setRole(null);
  }, []);

  const createOrganization = useCallback(async (name: string) => {
    const org = await organizationsApi.create(name);
    setOrganizations((prev) => [...prev, org]);
    setCurrentOrgId(org.id);
    return org;
  }, []);

  const refresh = useCallback(async () => {
    await loadOrganizations();
    await loadOrgDetail();
  }, [loadOrganizations, loadOrgDetail]);

  const value = useMemo(
    () => ({
      organizations,
      currentOrg,
      role,
      subscription,
      usage,
      isLoading,
      needsOnboarding: loadedOrgs && organizations.length === 0,
      error,
      selectOrg,
      createOrganization,
      refresh,
    }),
    [
      organizations,
      currentOrg,
      role,
      subscription,
      usage,
      isLoading,
      loadedOrgs,
      error,
      selectOrg,
      createOrganization,
      refresh,
    ],
  );

  return (
    <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error("useOrganization must be used inside <OrganizationProvider>");
  return ctx;
}
