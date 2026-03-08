export type Lead = {
  name: string;
  whatsapp: string;
  business: string;
  createdAt: string;
};

const STORAGE_KEY = "valsentra_leads";

function load(): Lead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Lead[]) : [];
  } catch {
    return [];
  }
}

function save(leads: Lead[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

export function addLead(input: { name: string; whatsapp: string; business: string }) {
  const leads = load();
  const lead: Lead = {
    ...input,
    createdAt: new Date().toISOString(),
  };
  leads.unshift(lead);
  save(leads);
}

export function getLeads(): Lead[] {
  return load();
}

export function clearLeads() {
  save([]);
}
