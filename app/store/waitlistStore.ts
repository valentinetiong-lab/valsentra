export type WaitlistEntry = {
  id: string;
  customer: string;
  phone: string;
  service: string;
  createdAt: number;
};

const KEY = "valsentra_waitlist";

export function getWaitlist(): WaitlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WaitlistEntry[]) : [];
  } catch {
    return [];
  }
}

export function addToWaitlist(entry: Omit<WaitlistEntry, "id" | "createdAt">) {
  const waitlist = getWaitlist();
  const newEntry: WaitlistEntry = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    ...entry,
  };
  waitlist.push(newEntry);
  localStorage.setItem(KEY, JSON.stringify(waitlist));
}

export function removeFromWaitlist(id: string) {
  const waitlist = getWaitlist().filter((w) => w.id !== id);
  localStorage.setItem(KEY, JSON.stringify(waitlist));
}

export function clearWaitlist() {
  localStorage.removeItem(KEY);
}