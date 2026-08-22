/**
 * PLACEHOLDER DATA — see ./README.md.
 *
 * The backend has no customer model. Widget visitors are anonymous: a
 * conversation is created with an organization and knowledge base but no
 * contact details. This directory exists so the customer-context surface can be
 * designed and reviewed now; swap it for a real endpoint when one ships.
 *
 * Every screen using it renders <PreviewDataBadge />.
 */

export type CustomerPlan = "Free" | "Growth" | "Scale" | "Enterprise";
export type CustomerHealth = "healthy" | "at_risk" | "churn_risk";

export interface MockCustomer {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: CustomerPlan;
  health: CustomerHealth;
  location: string;
  signedUpAt: string;
  lastSeenAt: string;
  lifetimeValueUsd: number;
  openTickets: number;
  totalConversations: number;
  externalIds: { key: string; value: string }[];
  attributes: { label: string; value: string }[];
}

const DAY = 86_400_000;
const daysAgo = (n: number, hours = 0) =>
  new Date(Date.now() - n * DAY - hours * 3_600_000).toISOString();

export const MOCK_CUSTOMERS: MockCustomer[] = [
  {
    id: "cus_01",
    name: "Priya Raman",
    email: "priya@northwind.io",
    company: "Northwind Logistics",
    plan: "Scale",
    health: "healthy",
    location: "Bengaluru, IN",
    signedUpAt: daysAgo(412),
    lastSeenAt: daysAgo(0, 2),
    lifetimeValueUsd: 28_800,
    openTickets: 1,
    totalConversations: 34,
    externalIds: [
      { key: "stripe_customer", value: "cus_QxT8mA1kR" },
      { key: "crm_account", value: "ACC-2291" },
    ],
    attributes: [
      { label: "Seats", value: "48 of 60" },
      { label: "Renewal", value: "14 Mar 2027" },
      { label: "Region", value: "APAC" },
    ],
  },
  {
    id: "cus_02",
    name: "Daniel Okafor",
    email: "d.okafor@lumenpay.com",
    company: "LumenPay",
    plan: "Enterprise",
    health: "at_risk",
    location: "Lagos, NG",
    signedUpAt: daysAgo(689),
    lastSeenAt: daysAgo(1, 4),
    lifetimeValueUsd: 141_200,
    openTickets: 3,
    totalConversations: 117,
    externalIds: [
      { key: "stripe_customer", value: "cus_PLm42vBnZ" },
      { key: "crm_account", value: "ACC-0043" },
    ],
    attributes: [
      { label: "Seats", value: "310 of 350" },
      { label: "Renewal", value: "02 Nov 2026" },
      { label: "Region", value: "EMEA" },
    ],
  },
  {
    id: "cus_03",
    name: "Sofia Marchetti",
    email: "sofia@atelier-nine.com",
    company: "Atelier Nine",
    plan: "Growth",
    health: "healthy",
    location: "Milan, IT",
    signedUpAt: daysAgo(203),
    lastSeenAt: daysAgo(0, 7),
    lifetimeValueUsd: 9_400,
    openTickets: 0,
    totalConversations: 21,
    externalIds: [{ key: "stripe_customer", value: "cus_Nb77zQeWq" }],
    attributes: [
      { label: "Seats", value: "12 of 15" },
      { label: "Renewal", value: "28 Jan 2027" },
      { label: "Region", value: "EMEA" },
    ],
  },
  {
    id: "cus_04",
    name: "Marcus Feld",
    email: "marcus.feld@grovehq.dev",
    company: "Grove HQ",
    plan: "Growth",
    health: "churn_risk",
    location: "Berlin, DE",
    signedUpAt: daysAgo(96),
    lastSeenAt: daysAgo(11),
    lifetimeValueUsd: 3_150,
    openTickets: 2,
    totalConversations: 42,
    externalIds: [{ key: "stripe_customer", value: "cus_Kd19pLmXs" }],
    attributes: [
      { label: "Seats", value: "4 of 10" },
      { label: "Renewal", value: "19 Sep 2026" },
      { label: "Region", value: "EMEA" },
    ],
  },
  {
    id: "cus_05",
    name: "Hannah Cole",
    email: "hannah@driftboard.app",
    company: "Driftboard",
    plan: "Free",
    health: "healthy",
    location: "Austin, US",
    signedUpAt: daysAgo(18),
    lastSeenAt: daysAgo(0, 1),
    lifetimeValueUsd: 0,
    openTickets: 1,
    totalConversations: 6,
    externalIds: [],
    attributes: [
      { label: "Seats", value: "2 of 3" },
      { label: "Trial ends", value: "in 12 days" },
      { label: "Region", value: "AMER" },
    ],
  },
  {
    id: "cus_06",
    name: "Kenji Watanabe",
    email: "k.watanabe@soraworks.jp",
    company: "Sora Works",
    plan: "Scale",
    health: "healthy",
    location: "Osaka, JP",
    signedUpAt: daysAgo(331),
    lastSeenAt: daysAgo(2),
    lifetimeValueUsd: 22_600,
    openTickets: 0,
    totalConversations: 58,
    externalIds: [
      { key: "stripe_customer", value: "cus_Rt66yHnBd" },
      { key: "crm_account", value: "ACC-1187" },
    ],
    attributes: [
      { label: "Seats", value: "35 of 40" },
      { label: "Renewal", value: "07 Jun 2027" },
      { label: "Region", value: "APAC" },
    ],
  },
  {
    id: "cus_07",
    name: "Amara Nwosu",
    email: "amara@brightlane.co",
    company: "Brightlane",
    plan: "Growth",
    health: "at_risk",
    location: "Toronto, CA",
    signedUpAt: daysAgo(144),
    lastSeenAt: daysAgo(4),
    lifetimeValueUsd: 7_800,
    openTickets: 2,
    totalConversations: 29,
    externalIds: [{ key: "stripe_customer", value: "cus_Vy31wErCa" }],
    attributes: [
      { label: "Seats", value: "9 of 12" },
      { label: "Renewal", value: "22 Dec 2026" },
      { label: "Region", value: "AMER" },
    ],
  },
  {
    id: "cus_08",
    name: "Tomás Herrera",
    email: "tomas@verdeflow.mx",
    company: "Verdeflow",
    plan: "Free",
    health: "healthy",
    location: "Mexico City, MX",
    signedUpAt: daysAgo(31),
    lastSeenAt: daysAgo(1, 9),
    lifetimeValueUsd: 0,
    openTickets: 0,
    totalConversations: 11,
    externalIds: [],
    attributes: [
      { label: "Seats", value: "1 of 3" },
      { label: "Trial ends", value: "expired" },
      { label: "Region", value: "AMER" },
    ],
  },
];

export const CUSTOMER_HEALTH_META: Record<
  CustomerHealth,
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  healthy: { label: "Healthy", tone: "success" },
  at_risk: { label: "At risk", tone: "warning" },
  churn_risk: { label: "Churn risk", tone: "danger" },
};

export function findCustomer(id: string) {
  return MOCK_CUSTOMERS.find((c) => c.id === id);
}
