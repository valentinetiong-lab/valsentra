import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/admin";

function mapOrderFromDb(row: Record<string, any>) {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    orderType: row.order_type,
    amount: Number(row.amount),
    guests: Number(row.guests),
    reservationTime: row.reservation_time,
    itemSummary: row.item_summary,
    status: row.status,
    depositRequired: row.deposit_required,
    depositPaid: row.deposit_paid,
    reliabilityScore: Number(row.reliability_score),
    terminalMismatch: row.terminal_mismatch,
    notes: row.notes,
    assignedStaff: row.assigned_staff,
    riskLevel: row.risk_level ?? "LOW",
    protectionReason: row.protection_reason ?? "",
    createdAt: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (id) {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(mapOrderFromDb(data));
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data ?? []).map(mapOrderFromDb));
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const payload = {
      id: body.id,
      customer_name: body.customerName,
      phone: body.phone,
      order_type: body.orderType,
      amount: body.amount,
      guests: body.guests,
      reservation_time: body.reservationTime,
      item_summary: body.itemSummary,
      status: body.status,
      deposit_required: body.depositRequired,
      deposit_paid: body.depositPaid,
      reliability_score: body.reliabilityScore,
      terminal_mismatch: body.terminalMismatch,
      notes: body.notes,
      assigned_staff: body.assignedStaff,
      risk_level: body.riskLevel ?? "LOW",
      protection_reason: body.protectionReason ?? "",
    };

    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapOrderFromDb(data));
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const updates: Record<string, any> = {};

    if (body.customerName !== undefined) updates.customer_name = body.customerName;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.orderType !== undefined) updates.order_type = body.orderType;
    if (body.amount !== undefined) updates.amount = body.amount;
    if (body.guests !== undefined) updates.guests = body.guests;
    if (body.reservationTime !== undefined) updates.reservation_time = body.reservationTime;
    if (body.itemSummary !== undefined) updates.item_summary = body.itemSummary;
    if (body.status !== undefined) updates.status = body.status;
    if (body.depositRequired !== undefined) updates.deposit_required = body.depositRequired;
    if (body.depositPaid !== undefined) updates.deposit_paid = body.depositPaid;
    if (body.reliabilityScore !== undefined) updates.reliability_score = body.reliabilityScore;
    if (body.terminalMismatch !== undefined) updates.terminal_mismatch = body.terminalMismatch;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.assignedStaff !== undefined) updates.assigned_staff = body.assignedStaff;
    if (body.riskLevel !== undefined) updates.risk_level = body.riskLevel;
    if (body.protectionReason !== undefined) updates.protection_reason = body.protectionReason;

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update(updates)
      .eq("id", body.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapOrderFromDb(data));
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update order" },
      { status: 500 }
    );
  }
}