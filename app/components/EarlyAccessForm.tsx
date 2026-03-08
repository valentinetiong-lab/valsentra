"use client";

import { useState } from "react";
import { addLead } from "../store/leadsStore";

export default function EarlyAccessForm() {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const name = String(formData.get("name") || "").trim();
      const whatsapp = String(formData.get("whatsapp") || "").trim();
      const business = String(formData.get("business") || "").trim();

      if (!name || !whatsapp || !business) {
        setStatus("error");
        return;
      }

      addLead({ name, whatsapp, business });
      form.reset();
      setStatus("saved");

      // optional: auto-reset message after 2s
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div id="early-access" className="rounded-2xl border border-zinc-200 p-6">
      <div className="font-semibold text-lg">Get early access</div>
      <p className="mt-1 text-sm text-zinc-600">
        Leave your details — we’ll WhatsApp you when it’s ready.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-3 sm:grid-cols-3">
        <input
          name="name"
          placeholder="Your name"
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none"
        />
        <input
          name="whatsapp"
          placeholder="WhatsApp number (e.g. 0123456789)"
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none"
        />
        <input
          name="business"
          placeholder="Business type (salon, barber...)"
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none"
        />

        <div className="sm:col-span-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={status === "saving"}
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {status === "saving" ? "Saving..." : "Request early access"}
          </button>

          {status === "saved" && <span className="text-sm text-green-700">Saved ✅</span>}
          {status === "error" && (
            <span className="text-sm text-red-600">Fill all fields (or try again).</span>
          )}
        </div>
      </form>

      <p className="mt-3 text-xs text-zinc-500">
        Local-only for now. (Phase B: database + email/WhatsApp automation)
      </p>
    </div>
  );
}


