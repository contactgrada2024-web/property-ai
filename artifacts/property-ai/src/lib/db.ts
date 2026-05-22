import { supabase } from "./supabase";
import { PropertyData } from "./calculations";

export interface DBProperty {
  id: string;
  name: string;
  mode: "analyze" | "compare";
  data: PropertyData;
  sort_order: number;
}

const COLS = "id, name, mode, data, sort_order, user_id";

export async function dbLoadAll(): Promise<{ analyze: DBProperty[]; compare: DBProperty[] }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? "none";

  const { data, error } = await supabase
    .from("properties")
    .select(COLS)
    .order("sort_order", { ascending: true });

  const rows = (data ?? []) as DBProperty[];
  console.error("[PERSIST] dbLoadAll", {
    userId,
    totalRows: rows.length,
    analyzeRows: rows.filter((r) => r.mode === "analyze").length,
    compareRows: rows.filter((r) => r.mode === "compare").length,
    firstRowUserId: rows[0] ? (rows[0] as any).user_id : null,
    errorMessage: error?.message ?? null,
  });

  if (error) throw error;
  return {
    analyze: rows.filter((r) => r.mode === "analyze"),
    compare: rows.filter((r) => r.mode === "compare"),
  };
}

export async function dbCreate(payload: Omit<DBProperty, "id">): Promise<DBProperty> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? "none";

  const { data, error } = await supabase
    .from("properties")
    .insert(payload)
    .select(COLS)
    .single();

  console.error("[PERSIST] dbCreate", {
    table: "properties",
    userId,
    payloadMode: payload.mode,
    payloadName: payload.name,
    returnedRow: data ? { id: data.id, name: data.name, mode: data.mode, user_id: (data as any).user_id } : null,
    errorMessage: error?.message ?? null,
    errorCode: error?.code ?? null,
  });

  if (error) throw error;
  if (!data) {
    throw new Error(
      `dbCreate FAILED on properties — no row returned after insert. ` +
      `Authenticated user=${userId}. Check RLS insert policy and user_id trigger.`
    );
  }
  return data as DBProperty;
}

export async function dbUpdate(
  id: string,
  payload: Partial<Pick<DBProperty, "name" | "data" | "sort_order">>
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? "none";

  const { data, error } = await supabase
    .from("properties")
    .update(payload)
    .eq("id", id)
    .select(COLS)
    .single();

  const payloadCv = (payload.data as PropertyData | undefined)?.currentValue ?? null;
  console.error("[PERSIST] dbUpdate", {
    table: "properties",
    rowId: id,
    userId,
    payloadCurrentValue: payloadCv,
    returnedRow: data ? { id: data.id, name: data.name, mode: data.mode, user_id: (data as any).user_id } : null,
    errorMessage: error?.message ?? null,
    errorCode: error?.code ?? null,
    errorDetails: error?.details ?? null,
  });

  if (error) throw error;
  if (!data) {
    throw new Error(
      `dbUpdate FAILED on properties.id=${id} — no row returned after update. ` +
      `Either the row does not exist, or RLS blocked the write. ` +
      `Authenticated user=${userId}. Check that the row's user_id matches auth.uid().`
    );
  }
}

export async function dbDelete(id: string): Promise<void> {
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw error;
}
