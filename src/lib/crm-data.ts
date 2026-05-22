export type LeadStage =
  | "New"
  | "Contacted"
  | "Cold"
  | "Warm"
  | "Hot"
  | "Negotiation"
  | "Closed Won"
  | "Closed Lost";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  budget: string;
  requirement: string;
  location: string;
  stage: LeadStage;
  score: number;
  assignedTo: string;
  nextAction: string;
  lastActivity: string;
  aiOutcome: "Interested" | "Callback" | "No Answer" | "Not Interested" | "New";
};

export type Property = {
  id: string;
  title: string;
  type: "Apartment" | "Villa" | "Office" | "Warehouse" | "Plot";
  location: string;
  price: string;
  size: string;
  status: "Available" | "Reserved" | "Sold";
  fit: number;
};

export const pipelineStages: LeadStage[] = [
  "New",
  "Contacted",
  "Cold",
  "Warm",
  "Hot",
  "Negotiation",
  "Closed Won",
];

export const leads: Lead[] = [
  {
    id: "LD-1001",
    name: "Amit Sharma",
    phone: "+91 98xxxx3210",
    source: "Meta Lead Ads",
    budget: "₹85L–₹1.1Cr",
    requirement: "2BHK ready-to-move apartment",
    location: "Noida Extension",
    stage: "Hot",
    score: 92,
    assignedTo: "Riya",
    nextAction: "Send 3 shortlisted properties on WhatsApp",
    lastActivity: "AI call: Interested, wants site visit this weekend",
    aiOutcome: "Interested",
  },
  {
    id: "LD-1002",
    name: "Neha Kapoor",
    phone: "+91 88xxxx9081",
    source: "Google Form",
    budget: "₹45L–₹60L",
    requirement: "Commercial office space",
    location: "Gurugram Sector 62",
    stage: "Warm",
    score: 76,
    assignedTo: "Karan",
    nextAction: "Callback tomorrow at 11 AM",
    lastActivity: "AI call: Callback requested after discussing with partner",
    aiOutcome: "Callback",
  },
  {
    id: "LD-1003",
    name: "Rahul Mehta",
    phone: "+91 79xxxx1144",
    source: "99acres Email Parser",
    budget: "₹1.2Cr–₹1.5Cr",
    requirement: "3BHK with club amenities",
    location: "Dwarka Expressway",
    stage: "Contacted",
    score: 68,
    assignedTo: "Riya",
    nextAction: "Auto-call retry in 2 hours",
    lastActivity: "AI call: No answer, first retry scheduled",
    aiOutcome: "No Answer",
  },
  {
    id: "LD-1004",
    name: "Sana Khan",
    phone: "+91 97xxxx4509",
    source: "Walk-in",
    budget: "₹70L–₹90L",
    requirement: "2BHK near metro, family use",
    location: "Indirapuram",
    stage: "Negotiation",
    score: 88,
    assignedTo: "Aman",
    nextAction: "Manager approval on discount request",
    lastActivity: "Human agent note: price negotiation active",
    aiOutcome: "Interested",
  },
];

export const properties: Property[] = [
  {
    id: "PROP-221",
    title: "Skyline Residency 2BHK",
    type: "Apartment",
    location: "Noida Extension",
    price: "₹96L",
    size: "1180 sq ft",
    status: "Available",
    fit: 96,
  },
  {
    id: "PROP-184",
    title: "Metro Edge Commercial Suite",
    type: "Office",
    location: "Gurugram Sector 62",
    price: "₹58L",
    size: "640 sq ft",
    status: "Available",
    fit: 91,
  },
  {
    id: "PROP-339",
    title: "Expressway Heights 3BHK",
    type: "Apartment",
    location: "Dwarka Expressway",
    price: "₹1.34Cr",
    size: "1710 sq ft",
    status: "Reserved",
    fit: 87,
  },
];

export const automationModules = [
  {
    name: "Lead Capture",
    description: "Meta, Google, portals, referrals, walk-ins, website forms, and Sheets sync into one CRM spine.",
    status: "Phase 1",
  },
  {
    name: "AI Voice Calling",
    description: "Hindi + English outbound qualification with outcome classification and transcript logging.",
    status: "Phase 2",
  },
  {
    name: "Follow-up Engine",
    description: "WhatsApp/SMS sequences triggered by outcome: interested, callback, no answer, not interested.",
    status: "Phase 1–2",
  },
  {
    name: "Inventory Matching",
    description: "Rank properties against buyer requirements and send curated options instantly.",
    status: "Phase 3",
  },
];
