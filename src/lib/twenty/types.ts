import type { LeadStage } from "@/lib/crm-data";

export type TwentyLead = {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  channel: string;
  source: string;
  capturedAt: string;
  responseSla: "On track" | "At risk" | "Breached";
  budget: string;
  requirement: string;
  location: string;
  stage: LeadStage;
  score: number;
  assignedTo: string;
  nextAction: string;
  lastActivity: string;
  aiOutcome: string;
};

export type TwentyProperty = {
  id: string;
  title: string;
  type: string;
  location: string;
  price: string;
  size: string;
  status: "Available" | "Reserved" | "Sold";
  fit: number;
  matchReason: string;
};

export type TwentyActivity = {
  id: string;
  leadId: string;
  type: string;
  title: string;
  detail: string;
  createdAt: string;
  actor: string;
};

export type CreateLeadInput = {
  name: string;
  phone: string;
  email?: string;
  channel?: string;
  source?: string;
  requirement?: string;
  location?: string;
  budget?: string;
};

export type ActivityInput = {
  type: string;
  title: string;
  detail: string;
  actor: string;
};
