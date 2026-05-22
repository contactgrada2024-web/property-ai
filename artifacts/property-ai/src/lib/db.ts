import { supabase } from "./supabase";
import { PropertyData } from "./calculations";

export interface DBProperty {
  id: string;
  name: string;
  mode: "analyze" | "compare";
  data: PropertyData;
  sort_order: number;
  user_id?: string;
}

const COLS = "id, name, mode, data, sort_order, user_id";

export async function dbLoadAll(): Promise<{ analyze: DBProperty[]; compare: DBProperty[] }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not authenticated — cannot load portfolio.");

  const { data, error } = await supabase
    .from("properties")
    .select(COLS)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  const rows = (data ?? []) as DBProperty[];
  return {
    analyze: rows.filter((r) => r.mode === "analyze"),
    compare: rows.filter((r) => r.mode === "compare"),
  };
}

export async function dbCreate(payload: Omit<DBProperty, "id" | "user_id">): Promise<DBProperty> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not authenticated — cannot create property.");

  const insertPayload = { ...payload, user_id: userId };

  const { data, error } = await supabase
    .from("properties")
    .insert(insertPayload)
    .select(COLS)
    .single();

  if (error) throw error;
  if (!data) {
    throw new Error(
      "dbCreate FAILED — Supabase returned no row after insert. " +
      "Check that the properties table exists, RLS INSERT policy allows auth.uid()=user_id, " +
      "and the user_id column accepts the authenticated user's UUID."
    );
  }
  return data as DBProperty;
}

export async function dbUpdate(
  id: string,
  payload: Partial<Pick<DBProperty, "name" | "data" | "sort_order">>
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not authenticated — cannot update property.");

  const { data, error } = await supabase
    .from("properties")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select(COLS)
    .single();

  if (error) throw error;
  if (!data) {
    throw new Error(
      `dbUpdate FAILED — no row returned for properties.id=${id}. ` +
      `Possible causes: (1) row does not exist, (2) row belongs to a different user, ` +
      `(3) RLS UPDATE policy blocked the write. Authenticated user=${userId}.`
    );
  }
}

export async function dbDelete(id: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not authenticated — cannot delete property.");

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
