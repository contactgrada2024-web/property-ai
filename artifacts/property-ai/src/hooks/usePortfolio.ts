import { useState, useEffect, useRef, useCallback } from "react";
import { defaultPropertyData, PropertyData } from "@/lib/calculations";
import { dbCreate, dbDelete, dbLoadAll, dbUpdate } from "@/lib/db";

export interface PortfolioEntry {
  id: string;
  name: string;
  data: PropertyData;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const DEFAULT_NAMES = ["Property A", "Property B", "Property C", "Property D"];

export function usePortfolio() {
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Analyze mode
  const analyzeDbId = useRef<string | null>(null);
  const [analyzeName, _setAnalyzeName] = useState("My Property");
  const [analyzeData, _setAnalyzeData] = useState<PropertyData>({ ...defaultPropertyData });

  // Compare mode — keep a ref in sync so callbacks always see fresh state
  const [compareProperties, _setCompare] = useState<PortfolioEntry[]>([]);
  const compareRef = useRef<PortfolioEntry[]>([]);
  function setCompare(entries: PortfolioEntry[]) {
    compareRef.current = entries;
    _setCompare(entries);
  }

  // Debounce infrastructure
  const dirty = useRef<Map<string, () => Promise<void>>>(new Map());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function schedule(key: string, fn: () => Promise<void>) {
    dirty.current.set(key, fn);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(flush, 1500);
  }

  async function flush() {
    debounceTimer.current = null;
    const fns = [...dirty.current.values()];
    dirty.current.clear();
    if (!fns.length) return;
    setSaveStatus("saving");
    try {
      await Promise.all(fns.map((f) => f()));
      setSaveStatus("saved");
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
    }
  }

  // Load all properties on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      setDbError(null);
      try {
        const { analyze, compare } = await dbLoadAll();

        // --- Analyze mode ---
        if (analyze[0]) {
          analyzeDbId.current = analyze[0].id;
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
              data: { ...defaultPropertyData },
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
  }, []);

  // ─── Analyze setters ───────────────────────────────────────────────────────

  const setAnalyzeName = useCallback((name: string) => {
    _setAnalyzeName(name);
    const id = analyzeDbId.current;
    if (id) schedule("analyze-name", () => dbUpdate(id, { name }));
  }, []);

  const setAnalyzeData = useCallback((data: PropertyData) => {
    _setAnalyzeData(data);
    const id = analyzeDbId.current;
    if (id) schedule("analyze-data", () => dbUpdate(id, { data }));
  }, []);

  // ─── Compare handlers ──────────────────────────────────────────────────────

  const addCompareProperty = useCallback(async () => {
    const current = compareRef.current;
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
      setSaveStatus("error");
    }
  }, []);

  const removeCompareProperty = useCallback(async (id: string) => {
    const current = compareRef.current;
    if (current.length <= 2) return;
    setCompare(current.filter((p) => p.id !== id));
    try {
      await dbDelete(id);
    } catch {
      setSaveStatus("error");
    }
  }, []);

  const updateComparePropertyName = useCallback((id: string, name: string) => {
    setCompare(compareRef.current.map((p) => (p.id === id ? { ...p, name } : p)));
    schedule(`cname-${id}`, () => dbUpdate(id, { name }));
  }, []);

  const updateComparePropertyData = useCallback((id: string, data: PropertyData) => {
    setCompare(compareRef.current.map((p) => (p.id === id ? { ...p, data } : p)));
    schedule(`cdata-${id}`, () => dbUpdate(id, { data }));
  }, []);

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
    // Status
    loading,
    saveStatus,
    dbError,
  };
}
