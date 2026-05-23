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
  const [loaded, setLoaded] = useState(demo); // true only after initial DB load finishes
  const [dbError, setDbError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Analyze mode
  const analyzeDbId = useRef<string | null>(null);
  const [analyzeName, _setAnalyzeName] = useState(
    demo ? DEMO_ANALYZE_NAME : "My Property"
  );
  const [analyzeData, _setAnalyzeData] = useState<PropertyData>(
    demo ? { ...DEMO_ANALYZE_DATA } : { ...defaultPropertyData }
  );

  // Compare mode
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

  // Debounce infrastructure — used ONLY for compare mode edits.
  // Analyze mode saves immediately (no debounce) so data is never lost on mode switch.
  const dirty = useRef<Map<string, () => Promise<void>>>(new Map());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function schedule(key: string, fn: () => Promise<void>) {
    if (demo) return;
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
    } catch (err: any) {
      setSaveStatus("error");
      setDbError(err?.message || "Save failed. Please sign in again.");
    }
  }

  // Force-flush any pending compare saves before unmount / mode switch.
  const flushPending = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    await flush();
  }, []);

  // Flush on unmount so a page refresh never drops pending compare edits.
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      // Synchronous flush of whatever is queued.
      const fns = [...dirty.current.values()];
      dirty.current.clear();
      if (fns.length) {
        Promise.all(fns.map((f) => f())).catch(() => {});
      }
    };
  }, []);

  // Load from Supabase (skipped in demo mode).
  // IMPORTANT: Never auto-create rows here. Creating on every load causes
  // duplicate rows when orphaned legacy rows exist. Rows are created lazily
  // on the first user edit.
  useEffect(() => {
    if (demo) return;

    (async () => {
      setLoading(true);
      setDbError(null);
      try {
        const { analyze, compare } = await dbLoadAll();

        // ─── Analyze mode ───
        if (analyze[0]) {
          analyzeDbId.current = analyze[0].id;
          _setAnalyzeName(analyze[0].name);
          _setAnalyzeData(analyze[0].data as PropertyData);
        } else {
          // No DB row yet — use in-memory defaults until the user edits.
          analyzeDbId.current = null;
          _setAnalyzeName("My Property");
          _setAnalyzeData({ ...defaultPropertyData });
        }

        // ─── Compare mode ───
        const existing: PortfolioEntry[] = compare.map((r) => ({
          id: r.id,
          name: r.name,
          data: r.data as PropertyData,
        }));
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
        setLoaded(true); // signal that DB load (or error) is complete
      }
    })();
  }, [demo]);

  // ─── Analyze setters ─── — save IMMEDIATELY (no debounce) so mode switch never loses data

  // Create analyze row lazily on first edit (avoids duplicate rows on load).
  async function ensureAnalyzeRow(data: PropertyData, name: string): Promise<string> {
    const id = analyzeDbId.current;
    if (id) return id;
    const row = await dbCreate({
      name,
      mode: "analyze",
      data,
      sort_order: 0,
    });
    analyzeDbId.current = row.id;
    return row.id;
  }

  const setAnalyzeName = useCallback(
    (name: string) => {
      _setAnalyzeName(name);
      if (!demo) {
        setSaveStatus("saving");
        const currentData = analyzeData;
        ensureAnalyzeRow(currentData, name)
          .then((id) => dbUpdate(id, { name }))
          .then(() => {
            setSaveStatus("saved");
            if (savedTimer.current) clearTimeout(savedTimer.current);
            savedTimer.current = setTimeout(() => setSaveStatus("idle"), 2500);
          })
          .catch((err: any) => {
            setSaveStatus("error");
            setDbError(err?.message || "Failed to save property name.");
          });
      }
    },
    [demo, analyzeData]
  );

  const setAnalyzeData = useCallback(
    (data: PropertyData) => {
      _setAnalyzeData(data);
      if (!demo) {
        setSaveStatus("saving");
        const currentName = analyzeName;
        ensureAnalyzeRow(data, currentName)
          .then((id) => dbUpdate(id, { data }))
          .then(() => {
            setSaveStatus("saved");
            if (savedTimer.current) clearTimeout(savedTimer.current);
            savedTimer.current = setTimeout(() => setSaveStatus("idle"), 2500);
          })
          .catch((err: any) => {
            setSaveStatus("error");
            setDbError(err?.message || "Failed to save property data.");
          });
      }
    },
    [demo, analyzeName]
  );

  // ─── Compare handlers ─── — debounced because multiple properties edit frequently

  const addCompareProperty = useCallback(async () => {
    const current = compareRef.current;
    if (demo) return;
    if (current.length >= 4) return;
    const idx = current.length;
    try {
      const row = await dbCreate({
        name: DEFAULT_NAMES[idx] ?? `Property ${idx + 1}`,
        mode: "compare",
        data: { ...defaultPropertyData },
        sort_order: idx,
      });
      setCompare([
        ...current,
        { id: row.id, name: row.name, data: row.data as PropertyData },
      ]);
    } catch (err: any) {
      setSaveStatus("error");
      setDbError(err?.message || "Failed to add property.");
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
        } catch (err: any) {
          setSaveStatus("error");
          setDbError(err?.message || "Failed to remove property.");
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
        try {
          await dbUpdate(targetId, { data: newData });
        } catch (err: any) {
          setSaveStatus("error");
          setDbError(err?.message || "Failed to copy data.");
        }
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
    saveStatus,
    dbError,
    // Lifecycle
    loaded,
    flushPending,
  };
}
