import { supabase } from "./supabase";
import { PropertyData } from "./calculations";

export interface DBProperty {
  id: string;
  name: string;
  mode: "analyze" | "compare";
  data: PropertyData;
  sort_order: number;
}

const COLS = "id, name, mode, data, sort_order";

export async function dbLoadAll(): Promise<{ analyze: DBProperty[]; compare: DBProperty[] }> {
  const { data, error } = await supabase
    .from("properties")
    .select(COLS)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as DBProperty[];
  return {
    analyze: rows.filter((r) => r.mode === "analyze"),
    compare: rows.filter((r) => r.mode === "compare"),
  };
}

export async function dbCreate(payload: Omit<DBProperty, "id">): Promise<DBProperty> {
  const { data, error } = await supabase
    .from("properties")
    .insert(payload)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as DBProperty;
}

export async function dbUpdate(
  id: string,
  payload: Partial<Pick<DBProperty, "name" | "data" | "sort_order">>
): Promise<void> {
  const { data, error } = await supabase.from("properties").update(payload).eq("id", id).select();
  console.log("[PERSIST] dbUpdate id:", id, "payload:", Object.keys(payload), "rows affected:", data?.length ?? 0, "error:", error);
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Update blocked — row not found or RLS prevented write. Check user_id on this row.");
  }
}

export async function dbDelete(id: string): Promise<void> {
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw error;
}
