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
  const { data: sessionData } = await supabase.auth.getSession();
  console.log("[TRACE] auth uid:", sessionData.session?.user?.id ?? "NO SESSION");
  const { data, error } = await supabase
    .from("properties")
    .select(COLS)
    .order("sort_order", { ascending: true });
  console.log("[TRACE] dbLoadAll raw:", { data, error, rowCount: data?.length ?? 0 });
  if (error) throw error;
  const rows = (data ?? []) as DBProperty[];
  const result = {
    analyze: rows.filter((r) => r.mode === "analyze"),
    compare: rows.filter((r) => r.mode === "compare"),
  };
  console.log("[TRACE] dbLoadAll result:", { analyzeCount: result.analyze.length, compareCount: result.compare.length, firstAnalyze: result.analyze[0] ?? null });
  return result;
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
  const { error } = await supabase.from("properties").update(payload).eq("id", id);
  if (error) throw error;
}

export async function dbDelete(id: string): Promise<void> {
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw error;
}
