export type Booking = {
  id: string;
  customer: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: "Pending Deposit" | "Confirmed" | "No-show";
  deposit: number;
  reminderSent?: boolean;
};

const STORAGE_KEY = "valsentra_bookings";

function load(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking[]) : [];
  } catch {
    return [];
  }
}

function save(bookings: Booking[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

// keep in-memory copy too
let bookings: Booking[] = [];

export function getBookings() {
  // always return the latest from storage
  bookings = load();
  return bookings;
}

export function addBooking(booking: Booking) {
  bookings = load();
  bookings.unshift(booking); // newest first
  save(bookings);
}

export function updateBookingStatus(id: string, status: Booking["status"]) {
  bookings = load();
  bookings = bookings.map((b) => (b.id === id ? { ...b, status } : b));
  save(bookings);
}

export function deleteBooking(id: string) {
  bookings = load();
  bookings = bookings.filter((b) => b.id !== id);
  save(bookings);
}

export function clearBookings() {
  bookings = [];
  save(bookings);
}