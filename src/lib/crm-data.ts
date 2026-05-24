export type LeadStage =
  | "New"
  | "Contacted"
  | "Cold"
  | "Warm"
  | "Hot"
  | "Negotiation"
  | "Closed Won"
  | "Closed Lost";

export type LeadChannel = "Meta" | "Google" | "99acres" | "MagicBricks" | "Website" | "Walk-in" | "WhatsApp" | "Referral";

export type Lead = {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  channel: LeadChannel;
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
  aiOutcome: "Interested" | "Callback" | "No Answer" | "Not Interested" | "New";
};

export type InboundLead = {
  id: string;
  source: Lead["source"];
  channel: LeadChannel;
  receivedAt: string;
  name: string;
  phone: string;
  requirement: string;
  location: string;
  budget: string;
  duplicateRisk: "Low" | "Medium" | "High";
  routingRule: string;
  ownerSuggestion: string;
  status: "Ready to create" | "Needs review" | "Duplicate found";
};

export type Activity = {
  id: string;
  leadId: string;
  type: "Lead captured" | "Stage changed" | "AI call" | "WhatsApp draft" | "Task" | "Property match" | "Human note" | "CRM agent update";
  title: string;
  detail: string;
  createdAt: string;
  actor: "System" | "Hermes" | "AI Voice" | "Agent" | "Manager" | "AI Sales Agent";
};

export type AgentCommand = {
  id: string;
  userRequest: string;
  agentResponse: string;
  crmUpdate: string;
  status: "Updated CRM" | "Needs approval" | "Queued";
  approvalType: "None" | "WhatsApp send" | "Voice call" | "Manager approval";
};

export type AgentCapability = {
  name: string;
  description: string;
};

export type IntegrationOption = {
  id: string;
  name: string;
  category: "Lead source" | "Messaging" | "Voice agent" | "Automation" | "CRM system" | "AI model";
  status: "Available now" | "Add credentials" | "Optional later" | "Demo ready";
  description: string;
  setupAction: string;
  guardrail: string;
};

export type PipelineSummary = {
  stage: LeadStage;
  count: number;
  value: string;
  leakageRisk: string;
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
  matchReason: string;
};

export const pipelineStages: LeadStage[] = [
  "New",
  "Contacted",
  "Cold",
  "Warm",
  "Hot",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

export const leads: Lead[] = [
  {
    id: "LD-1001",
    tenantId: "TNT-PRATAP-DEMO",
    name: "Amit Sharma",
    phone: "+91 98xxxx3210",
    email: "amit@example.com",
    channel: "Meta",
    source: "Meta Lead Ads",
    capturedAt: "Today, 10:02 AM",
    responseSla: "On track",
    budget: "₹85L–₹1.1Cr",
    requirement: "2BHK ready-to-move apartment",
    location: "Noida Extension",
    stage: "Hot",
    score: 92,
    assignedTo: "Riya",
    nextAction: "Approve WhatsApp shortlist and book weekend site visit",
    lastActivity: "AI call: Interested, wants site visit this weekend",
    aiOutcome: "Interested",
  },
  {
    id: "LD-1002",
    tenantId: "TNT-PRATAP-DEMO",
    name: "Neha Kapoor",
    phone: "+91 88xxxx9081",
    email: "neha@example.com",
    channel: "Google",
    source: "Google Form",
    capturedAt: "Today, 9:41 AM",
    responseSla: "At risk",
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
    tenantId: "TNT-PRATAP-DEMO",
    name: "Rahul Mehta",
    phone: "+91 79xxxx1144",
    channel: "99acres",
    source: "99acres Email Parser",
    capturedAt: "Today, 8:55 AM",
    responseSla: "Breached",
    budget: "₹1.2Cr–₹1.5Cr",
    requirement: "3BHK with club amenities",
    location: "Dwarka Expressway",
    stage: "Contacted",
    score: 68,
    assignedTo: "Riya",
    nextAction: "Auto-call retry in 2 hours, then route to agent if no answer",
    lastActivity: "AI call: No answer, first retry scheduled",
    aiOutcome: "No Answer",
  },
  {
    id: "LD-1004",
    tenantId: "TNT-PRATAP-DEMO",
    name: "Sana Khan",
    phone: "+91 97xxxx4509",
    channel: "Walk-in",
    source: "Walk-in",
    capturedAt: "Yesterday, 5:20 PM",
    responseSla: "On track",
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
  {
    id: "LD-1005",
    tenantId: "TNT-PRATAP-DEMO",
    name: "Vikram Sethi",
    phone: "+91 90xxxx4421",
    channel: "Website",
    source: "Website enquiry",
    capturedAt: "Today, 10:14 AM",
    responseSla: "On track",
    budget: "₹1.8Cr–₹2.2Cr",
    requirement: "Villa or large plot for family home",
    location: "Sohna Road",
    stage: "New",
    score: 83,
    assignedTo: "Unassigned",
    nextAction: "Route to luxury team and start qualification call",
    lastActivity: "Inbound form captured with high-budget requirement",
    aiOutcome: "New",
  },
  {
    id: "LD-1006",
    tenantId: "TNT-PRATAP-DEMO",
    name: "Priyanka Rao",
    phone: "+91 99xxxx2401",
    email: "priyanka@example.com",
    channel: "WhatsApp",
    source: "WhatsApp inquiry",
    capturedAt: "Today, 11:02 AM",
    responseSla: "On track",
    budget: "₹95L–₹1.25Cr",
    requirement: "Premium 2.5BHK near schools",
    location: "Sector 150 Noida",
    stage: "Contacted",
    score: 81,
    assignedTo: "Riya",
    nextAction: "Send approved school-distance shortlist on WhatsApp",
    lastActivity: "WhatsApp reply drafted; waiting for agent approval",
    aiOutcome: "Interested",
  },
  {
    id: "LD-1007",
    tenantId: "TNT-PRATAP-DEMO",
    name: "Arjun Bansal",
    phone: "+91 82xxxx6504",
    email: "arjun@example.com",
    channel: "Referral",
    source: "Broker partner referral",
    capturedAt: "Yesterday, 2:10 PM",
    responseSla: "On track",
    budget: "₹2.5Cr–₹3.1Cr",
    requirement: "Investment plot with resale upside",
    location: "Jewar Airport corridor",
    stage: "Hot",
    score: 94,
    assignedTo: "Aman",
    nextAction: "Book investor consultation and prepare ROI sheet",
    lastActivity: "Manager marked as strategic investor lead",
    aiOutcome: "Interested",
  },
  {
    id: "LD-1008",
    tenantId: "TNT-PRATAP-DEMO",
    name: "Meera Iyer",
    phone: "+91 87xxxx3320",
    email: "meera@example.com",
    channel: "MagicBricks",
    source: "MagicBricks listing",
    capturedAt: "Yesterday, 12:25 PM",
    responseSla: "At risk",
    budget: "₹55L–₹70L",
    requirement: "Studio or 1BHK for rental income",
    location: "Pune Hinjewadi",
    stage: "Cold",
    score: 54,
    assignedTo: "Karan",
    nextAction: "Move to nurture unless callback confirms timeline",
    lastActivity: "AI call: budget mismatch, asked for lower-ticket options",
    aiOutcome: "Callback",
  },
  {
    id: "LD-1009",
    tenantId: "TNT-PRATAP-DEMO",
    name: "Farhan Ali",
    phone: "+91 91xxxx5018",
    channel: "Google",
    source: "Google Search Ads",
    capturedAt: "2 days ago",
    responseSla: "On track",
    budget: "₹1.4Cr–₹1.7Cr",
    requirement: "Ready 3BHK close to office hub",
    location: "Bangalore Whitefield",
    stage: "Closed Won",
    score: 90,
    assignedTo: "Aman",
    nextAction: "Collect testimonial and ask for referral",
    lastActivity: "Booking amount received; handover task created",
    aiOutcome: "Interested",
  },
];

export const inboundLeads: InboundLead[] = [
  {
    id: "IN-2401",
    source: "Website enquiry",
    channel: "Website",
    receivedAt: "38 sec ago",
    name: "Vikram Sethi",
    phone: "+91 90xxxx4421",
    requirement: "Villa or plot",
    location: "Sohna Road",
    budget: "₹1.8Cr–₹2.2Cr",
    duplicateRisk: "Low",
    routingRule: "Luxury budget + South Gurgaon",
    ownerSuggestion: "Aman",
    status: "Ready to create",
  },
  {
    id: "IN-2402",
    source: "Meta Lead Ads",
    channel: "Meta",
    receivedAt: "4 min ago",
    name: "Pooja Malhotra",
    phone: "+91 96xxxx1102",
    requirement: "2BHK ready possession",
    location: "Noida Extension",
    budget: "₹80L–₹95L",
    duplicateRisk: "Medium",
    routingRule: "Project interest: Skyline Residency",
    ownerSuggestion: "Riya",
    status: "Needs review",
  },
  {
    id: "IN-2403",
    source: "MagicBricks",
    channel: "MagicBricks",
    receivedAt: "11 min ago",
    name: "Sameer Batra",
    phone: "+91 88xxxx7790",
    requirement: "Office space",
    location: "Gurugram Sector 62",
    budget: "₹50L–₹65L",
    duplicateRisk: "High",
    routingRule: "Duplicate phone found in Warm stage",
    ownerSuggestion: "Karan",
    status: "Duplicate found",
  },
];

export const pipelineSummary: PipelineSummary[] = pipelineStages.map((stage) => {
  const stageLeads = leads.filter((lead) => lead.stage === stage);
  const risk = stage === "New" ? "Assign within 60 sec" : stage === "Contacted" ? "Retry no-answer leads" : stage === "Cold" ? "Nurture campaign" : stage === "Negotiation" ? "Manager review" : "Healthy";

  return {
    stage,
    count: stageLeads.length,
    value: stage === "Hot" ? "₹1.0Cr" : stage === "Negotiation" ? "₹80L" : stage === "Warm" ? "₹58L" : stage === "New" ? "₹2Cr" : "—",
    leakageRisk: risk,
  };
});

export const agentCapabilities: AgentCapability[] = [
  {
    name: "Talk to the sales team",
    description: "Users can ask for lead summaries, stale opportunities, assignments, callbacks, notes, and manager follow-ups in plain language.",
  },
  {
    name: "Update CRM records",
    description: "The agent can change owner, stage, next action, notes, requirements, tasks, and activity entries through audited CRM actions.",
  },
  {
    name: "Prepare external communication",
    description: "It drafts WhatsApp replies, property shortlists, and voice-call plans while keeping external sends behind approval gates.",
  },
  {
    name: "Operate across channels",
    description: "Inbound forms, portals, WhatsApp, voice calls, and n8n workflows feed one central AI operating layer.",
  },
];

export const agentCommands: AgentCommand[] = [
  {
    id: "CMD-901",
    userRequest: "Assign Vikram to Aman and start luxury follow-up.",
    agentResponse: "I found Vikram as a fresh high-budget website lead. I assigned Aman, set the stage to New, and queued a qualification call for approval.",
    crmUpdate: "Owner → Aman · Next action → approve voice qualification · Activity logged",
    status: "Needs approval",
    approvalType: "Voice call",
  },
  {
    id: "CMD-902",
    userRequest: "Which hot leads need action today?",
    agentResponse: "Amit is the highest-priority hot lead. He wants a weekend site visit and needs a WhatsApp shortlist approved.",
    crmUpdate: "Priority task created for Riya · Shortlist draft attached",
    status: "Needs approval",
    approvalType: "WhatsApp send",
  },
  {
    id: "CMD-903",
    userRequest: "Update Neha's callback and keep her warm.",
    agentResponse: "Neha's callback is set for tomorrow at 11 AM. I kept her in Warm and added the partner-discussion note.",
    crmUpdate: "Callback task created · Note added · Activity logged",
    status: "Updated CRM",
    approvalType: "None",
  },
];

export const activities: Activity[] = [
  {
    id: "ACT-500",
    leadId: "LD-1005",
    type: "CRM agent update",
    title: "AI Sales Agent accepted an internal request",
    detail: "User asked to assign Vikram and start luxury follow-up; CRM owner, next action, and approval queue were updated.",
    createdAt: "Just now",
    actor: "AI Sales Agent",
  },
  {
    id: "ACT-501",
    leadId: "LD-1005",
    type: "Lead captured",
    title: "Website lead captured and queued for routing",
    detail: "Payload normalized, duplicate scan passed, luxury-team rule matched.",
    createdAt: "38 sec ago",
    actor: "System",
  },
  {
    id: "ACT-502",
    leadId: "LD-1001",
    type: "WhatsApp draft",
    title: "Shortlist message drafted for approval",
    detail: "3 matching properties prepared; agent must approve before sending.",
    createdAt: "8 min ago",
    actor: "Hermes",
  },
  {
    id: "ACT-503",
    leadId: "LD-1003",
    type: "AI call",
    title: "No-answer call outcome logged",
    detail: "Retry scheduled with human handoff after second failed attempt.",
    createdAt: "22 min ago",
    actor: "AI Voice",
  },
  {
    id: "ACT-504",
    leadId: "LD-1004",
    type: "Human note",
    title: "Discount approval requested",
    detail: "Manager review required before sharing final offer externally.",
    createdAt: "Yesterday",
    actor: "Agent",
  },
];

export const integrationOptions: IntegrationOption[] = [
  {
    id: "INT-TWENTY",
    name: "Twenty CRM demo workspace",
    category: "CRM system",
    status: "Demo ready",
    description: "Self-hosted Twenty is running with a seeded Apple demo workspace so prospects can inspect a real CRM surface separately from the custom brokerage dashboard.",
    setupAction: "Use the demo URL/account for evaluation; production should move Twenty to a stable domain or managed CRM tenant.",
    guardrail: "Do not put real brokerage PII into the temporary public tunnel; use it only for demo/sample data.",
  },
  {
    id: "INT-LLM",
    name: "Agent model provider",
    category: "AI model",
    status: "Add credentials",
    description: "The current dashboard agent is a safe deterministic demo. Production should start with OpenRouter for the custom backend because one OpenAI-compatible key can route to multiple models.",
    setupAction: "Add OPENROUTER_API_KEY, select model, define tool permissions/spend limits, then run sandbox tests before enabling writes. For Twenty AI, verify native provider support first; if OpenRouter is not exposed, use an OpenAI-compatible adapter/proxy.",
    guardrail: "Model calls can propose CRM updates; writes and external WhatsApp/voice actions remain audited, permissioned, and approval-gated.",
  },
  {
    id: "INT-META",
    name: "Meta / Google lead capture",
    category: "Lead source",
    status: "Available now",
    description: "Route ad-form payloads into the inbound lead queue through n8n or direct API ingestion.",
    setupAction: "Create source webhook and map fields",
    guardrail: "Dedupe by normalized phone/email before creating a CRM lead.",
  },
  {
    id: "INT-WA",
    name: "WhatsApp Business Cloud",
    category: "Messaging",
    status: "Add credentials",
    description: "Optional add-on for approved templates, replies, property shortlists, and outcome follow-ups.",
    setupAction: "Use a guided owner setup screen: add phone number ID, WABA ID, access token, app secret, verify token, then send a test message",
    guardrail: "AI drafts messages; agents approve high-value outbound sends.",
  },
  {
    id: "INT-VOICE",
    name: "Hindi/English voice agent",
    category: "Voice agent",
    status: "Add credentials",
    description: "Optional AI qualification calls with transcript, outcome, retry policy, and call-cost logging.",
    setupAction: "Use a guided setup screen: choose hosted provider, add key/from-number/webhook secret, set calling hours, test internally, then enable approval-gated campaigns",
    guardrail: "Never auto-call DND or unconsented leads; log transcript and outcome as activity.",
  },
  {
    id: "INT-N8N",
    name: "n8n workflow bridge",
    category: "Automation",
    status: "Optional later",
    description: "Low-code glue for portals, Sheets, manager alerts, and enrichment workflows.",
    setupAction: "Configure webhook secret and source-specific workflows",
    guardrail: "n8n can enqueue work; CRM API remains the audited write path.",
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
    matchReason: "Budget, location, ready-possession need, and family 2BHK preference align.",
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
    matchReason: "Office use, sector match, and budget range align for Neha Kapoor.",
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
    matchReason: "Strong amenities and location match; availability needs manager check.",
  },
];

export const automationModules = [
  {
    name: "AI Sales Agent",
    description: "The central agent talks to users, takes CRM requests, updates records, drafts follow-ups, and queues approvals.",
    status: "Center",
  },
  {
    name: "Inbound Lead Pipeline",
    description: "Every Meta, Google, portal, website, walk-in, and WhatsApp inquiry enters one deduped queue before CRM creation.",
    status: "Now",
  },
  {
    name: "Pipeline CRM",
    description: "New → Contacted → Cold/Warm/Hot → Negotiation → Closed Won/Lost with owner, SLA, next action, and activity trail.",
    status: "Now",
  },
  {
    name: "WhatsApp Add-on",
    description: "Optional Business Cloud setup for approved templates, two-way replies, property shortlists, and follow-up sequences.",
    status: "Configurable",
  },
  {
    name: "Voice Agent Add-on",
    description: "Optional Hindi/English qualification calls with transcript, retry logic, outcomes, and human handoff.",
    status: "Configurable",
  },
  {
    name: "Inventory Matching",
    description: "Rank properties against buyer requirements and send curated options after agent approval.",
    status: "Next",
  },
];
