import { useState, useEffect, useRef, useCallback } from "react";
import { defaultPropertyData, PropertyData } from "@/lib/calculations";
import { dbCreate, dbDelete, dbLoadAll, dbUpdate } from "@/lib/db";
import {
  DEMO_ANALYZE_DATA,
  DEMO_ANALYZE_NAME,
  DEMO_COMPARE_PROPERTIES,
} from "@/data/demoData";

export interface PortfolioEntry {
  id: string;
  name: string;
  data: PropertyData;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const DEFAULT_NAMES = ["Property A", "Property B", "Property C", "Property D"];

export function usePortfolio({ demo = false }: { demo?: boolean } = {}) {
  const [loading, setLoading] = useState(!demo);
  const [dbError, setDbError] = useState<string | null>(null);
  const [saveStatus] = useState<SaveStatus>("idle");

  // Analyze mode
  const analyzeDbId = useRef<string | null>(null);
  const [analyzeName, _setAnalyzeName] = useState(
    demo ? DEMO_ANALYZE_NAME : "My Property"
  );
  const [analyzeData, _setAnalyzeData] = useState<PropertyData>(
    demo ? { ...DEMO_ANALYZE_DATA } : { ...defaultPropertyData }
  );

  // Compare mode — keep a ref in sync so callbacks always see fresh state
  const [compareProperties, _setCompare] = useState<PortfolioEntry[]>(
    demo ? DEMO_COMPARE_PROPERTIES.map((p) => ({ ...p, data: { ...p.data } })) : []
  );
  const compareRef = useRef<PortfolioEntry[]>(
    demo ? DEMO_COMPARE_PROPERTIES.map((p) => ({ ...p, data: { ...p.data } })) : []
  );

  function setCompare(entries: PortfolioEntry[]) {
    compareRef.current = entries;
    _setCompare(entries);
  }

  // Debounce infrastructure (no-op in demo mode)
  const [_saveStatus, _setSaveStatus] = useState<SaveStatus>("idle");
  const dirty = useRef<Map<string, () => Promise<void>>>(new Map());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function schedule(key: string, fn: () => Promise<void>) {
    if (demo) return; // no-op in demo
    dirty.current.set(key, fn);
    console.log("[PERSIST] schedule queued:", key, "dirty count:", dirty.current.size);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(flush, 1500);
  }

  async function flush() {
    debounceTimer.current = null;
    const fns = [...dirty.current.values()];
    dirty.current.clear();
    console.log("[PERSIST] flush firing with", fns.length, "queued save(s)");
    if (!fns.length) return;
    _setSaveStatus("saving");
    try {
      await Promise.all(fns.map((f) => f()));
      _setSaveStatus("saved");
      console.log("[PERSIST] flush succeeded");
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => _setSaveStatus("idle"), 2500);
    } catch (err: any) {
      console.error("[PERSIST] flush FAILED:", err?.message || String(err));
      _setSaveStatus("error");
    }
  }

  // Load from Supabase (skipped in demo mode)
  useEffect(() => {
    if (demo) return;

    (async () => {
      setLoading(true);
      setDbError(null);
      try {
        const { analyze, compare } = await dbLoadAll();

        // --- Analyze mode ---
        if (analyze[0]) {
          analyzeDbId.current = analyze[0].id;
          console.log("[PERSIST] load effect set analyzeDbId:", analyzeDbId.current, "data:", analyze[0].data);
          _setAnalyzeName(analyze[0].name);
          _setAnalyzeData(analyze[0].data as PropertyData);
        } else {
          const row = await dbCreate({
            name: "My Property",
            mode: "analyze",
            data: { ...defaultPropertyData },
            sort_order: 0,
          });
          analyzeDbId.current = row.id;
          console.log("[PERSIST] load effect created fallback analyze row, id:", analyzeDbId.current);
        }

        // --- Compare mode ---
        const existing: PortfolioEntry[] = compare.map((r) => ({
          id: r.id,
          name: r.name,
          data: r.data as PropertyData,
        }));

        if (existing.length < 2) {
          const needed = 2 - existing.length;
          for (let i = 0; i < needed; i++) {
            const idx = existing.length;
            const row = await dbCreate({
              name: DEFAULT_NAMES[idx] ?? `Property ${idx + 1}`,
              mode: "compare",
              data: analyze[0]?.data ? { ...(analyze[0].data as PropertyData) } : { ...defaultPropertyData },
              sort_order: idx,
            });
            existing.push({ id: row.id, name: row.name, data: row.data as PropertyData });
          }
        }
        setCompare(existing);
      } catch (e: any) {
        const msg: string = e?.message ?? String(e);
        if (
          msg.includes("does not exist") ||
          e?.code === "42P01" ||
          e?.code === "PGRST200" ||
          msg.includes("relation")
        ) {
          setDbError("setup_required");
        } else {
          setDbError(msg);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [demo]);

  // ─── Analyze setters ───────────────────────────────────────────────────────

  const setAnalyzeName = useCallback(
    (name: string) => {
      _setAnalyzeName(name);
      if (!demo) {
        const id = analyzeDbId.current;
        if (id) schedule("analyze-name", () => dbUpdate(id, { name }));
      }
    },
    [demo]
  );

  const setAnalyzeData = useCallback(
    (data: PropertyData) => {
      _setAnalyzeData(data);
      if (!demo) {
        const id = analyzeDbId.current;
        console.log("[PERSIST] setAnalyzeData called, analyzeDbId:", id);
        if (id) schedule("analyze-data", () => dbUpdate(id, { data }));
        else console.warn("[PERSIST] setAnalyzeData skipped — no analyzeDbId");
      }
    },
    [demo]
  );

  // ─── Compare handlers ──────────────────────────────────────────────────────

  const addCompareProperty = useCallback(async () => {
    const current = compareRef.current;
    if (demo) {
      // Demo limited to 2 — handled by UI, but guard here too
      return;
    }
    if (current.length >= 4) return;
    const idx = current.length;
    try {
      const row = await dbCreate({
        name: DEFAULT_NAMES[idx] ?? `Property ${idx + 1}`,
        mode: "compare",
        data: { ...defaultPropertyData },
        sort_order: idx,
      });
      setCompare([...current, { id: row.id, name: row.name, data: row.data as PropertyData }]);
    } catch {
      _setSaveStatus("error");
    }
  }, [demo]);

  const removeCompareProperty = useCallback(
    async (id: string) => {
      const current = compareRef.current;
      if (current.length <= 2) return;
      setCompare(current.filter((p) => p.id !== id));
      if (!demo) {
        try {
          await dbDelete(id);
        } catch {
          _setSaveStatus("error");
        }
      }
    },
    [demo]
  );

  const updateComparePropertyName = useCallback(
    (id: string, name: string) => {
      setCompare(compareRef.current.map((p) => (p.id === id ? { ...p, name } : p)));
      if (!demo) schedule(`cname-${id}`, () => dbUpdate(id, { name }));
    },
    [demo]
  );

  const updateComparePropertyData = useCallback(
    (id: string, data: PropertyData) => {
      setCompare(compareRef.current.map((p) => (p.id === id ? { ...p, data } : p)));
      if (!demo) schedule(`cdata-${id}`, () => dbUpdate(id, { data }));
    },
    [demo]
  );

  const copyFromAnalyze = useCallback(
    async (targetId: string) => {
      const current = compareRef.current;
      const idx = current.findIndex((p) => p.id === targetId);
      if (idx === -1) return;
      const newData = { ...analyzeData };
      const updated = current.map((p, i) => (i === idx ? { ...p, data: newData } : p));
      setCompare(updated);
      if (!demo) {
        await dbUpdate(targetId, { data: newData });
      }
    },
    [demo, analyzeData]
  );

  return {
    // Analyze
    analyzeName,
    analyzeData,
    setAnalyzeName,
    setAnalyzeData,
    // Compare
    compareProperties,
    addCompareProperty,
    removeCompareProperty,
    updateComparePropertyName,
    updateComparePropertyData,
    copyFromAnalyze,
    // Status
    loading,
    saveStatus: demo ? saveStatus : _saveStatus,
    dbError,
  };
}
