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

const DEFAULT_NAMES_ES = ["Propiedad A", "Propiedad B", "Propiedad C", "Propiedad D"];
const DEFAULT_NAMES_EN = ["Property A", "Property B", "Property C", "Property D"];

function getDefaultNames(lang: string) {
  return lang === "es" ? DEFAULT_NAMES_ES : DEFAULT_NAMES_EN;
}

function getDefaultPropertyName(index: number, lang: string) {
  const names = getDefaultNames(lang);
  return names[index] ?? (lang === "es" ? `Propiedad ${index + 1}` : `Property ${index + 1}`);
}

function getMyPropertyName(lang: string) {
  return lang === "es" ? "Mi Propiedad" : "My Property";
}
const MAX_ANALYZE_SLOTS = 3;

export function usePortfolio({ demo = false, lang = "en" }: { demo?: boolean; lang?: string } = {}) {
  const [loading, setLoading] = useState(!demo);
  const [loaded, setLoaded] = useState(demo);
  const [dbError, setDbError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // ─── Analyze state ───
  // Saved properties (up to MAX_ANALYZE_SLOTS). In demo mode there is exactly 1 entry.
  const [analyzeEntries, _setAnalyzeEntries] = useState<PortfolioEntry[]>(
    demo
      ? [{ id: "demo-analyze", name: DEMO_ANALYZE_NAME, data: { ...DEMO_ANALYZE_DATA } }]
      : []
  );
  const analyzeEntriesRef = useRef<PortfolioEntry[]>(
    demo
      ? [{ id: "demo-analyze", name: DEMO_ANALYZE_NAME, data: { ...DEMO_ANALYZE_DATA } }]
      : []
  );

  function setAnalyzeEntries(entries: PortfolioEntry[]) {
    analyzeEntriesRef.current = entries;
    _setAnalyzeEntries(entries);
  }

  const [activeAnalyzeId, _setActiveAnalyzeId] = useState<string | null>(
    demo ? "demo-analyze" : null
  );
  const activeAnalyzeIdRef = useRef<string | null>(demo ? "demo-analyze" : null);

  function setActiveAnalyzeId(id: string | null) {
    activeAnalyzeIdRef.current = id;
    _setActiveAnalyzeId(id);
  }

  // Refs for the active property values (avoid stale closures in setters)
  const analyzeNameRef = useRef<string>(demo ? DEMO_ANALYZE_NAME : getMyPropertyName(lang));
  const analyzeDataRef = useRef<PropertyData>(
    demo ? { ...DEMO_ANALYZE_DATA } : { ...defaultPropertyData }
  );
  const creatingAnalyzeRef = useRef(false);

  // Primary state for the active property (drives the form & results)
  const [analyzeName, _setAnalyzeName] = useState(analyzeNameRef.current);
  const [analyzeData, _setAnalyzeData] = useState<PropertyData>(analyzeDataRef.current);

  function setAnalyzeNameState(name: string) {
    analyzeNameRef.current = name;
    _setAnalyzeName(name);
  }

  function setAnalyzeDataState(data: PropertyData) {
    analyzeDataRef.current = data;
    _setAnalyzeData(data);
  }

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

  const flushPending = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    await flush();
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      const fns = [...dirty.current.values()];
      dirty.current.clear();
      if (fns.length) {
        Promise.all(fns.map((f) => f())).catch(() => {});
      }
    };
  }, []);

  // ─── Lazy row creation for analyze ───
  async function ensureAnalyzeRow(): Promise<string> {
    const activeId = activeAnalyzeIdRef.current;
    if (activeId) return activeId;
    if (demo) return "demo-analyze";
    if (creatingAnalyzeRef.current) {
      await new Promise((r) => setTimeout(r, 50));
      return ensureAnalyzeRow();
    }
    creatingAnalyzeRef.current = true;
    try {
      const row = await dbCreate({
        name: analyzeNameRef.current,
        mode: "analyze",
        data: analyzeDataRef.current,
        sort_order: 0,
      });
      const entry = {
        id: row.id,
        name: row.name,
        data: row.data as PropertyData,
      };
      setAnalyzeEntries([entry]);
      setActiveAnalyzeId(row.id);
      return row.id;
    } finally {
      creatingAnalyzeRef.current = false;
    }
  }

  // Load from Supabase (skipped in demo mode).
  useEffect(() => {
    if (demo) return;
    (async () => {
      setLoading(true);
      setDbError(null);
      try {
        const { analyze, compare } = await dbLoadAll();

        // ─── Analyze mode ───
        const entries = analyze.map((r) => ({
          id: r.id,
          name: r.name,
          data: r.data as PropertyData,
        }));
        setAnalyzeEntries(entries);

        if (entries.length > 0) {
          const first = entries[0];
          setActiveAnalyzeId(first.id);
          setAnalyzeNameState(first.name);
          setAnalyzeDataState({ ...first.data });
        } else {
          setActiveAnalyzeId(null);
          setAnalyzeNameState(getMyPropertyName(lang));
          setAnalyzeDataState({ ...defaultPropertyData });
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
        setLoaded(true);
      }
    })();
  }, [demo]);

  // ─── Analyze setters ─── — save IMMEDIATELY (no debounce)

  const setAnalyzeName = useCallback(
    (name: string) => {
      setAnalyzeNameState(name);
      if (demo) return;
      const activeId = activeAnalyzeIdRef.current;
      if (activeId) {
        setAnalyzeEntries(
          analyzeEntriesRef.current.map((e) =>
            e.id === activeId ? { ...e, name } : e
          )
        );
        setSaveStatus("saving");
        dbUpdate(activeId, { name })
          .then(() => {
            setSaveStatus("saved");
            if (savedTimer.current) clearTimeout(savedTimer.current);
            savedTimer.current = setTimeout(() => setSaveStatus("idle"), 2500);
          })
          .catch((err: any) => {
            setSaveStatus("error");
            setDbError(err?.message || "Failed to save property name.");
          });
      } else {
        setSaveStatus("saving");
        ensureAnalyzeRow()
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
    [demo]
  );

  const setAnalyzeData = useCallback(
    (data: PropertyData) => {
      setAnalyzeDataState(data);
      if (demo) return;
      const activeId = activeAnalyzeIdRef.current;
      if (activeId) {
        setAnalyzeEntries(
          analyzeEntriesRef.current.map((e) =>
            e.id === activeId ? { ...e, data } : e
          )
        );
        setSaveStatus("saving");
        dbUpdate(activeId, { data })
          .then(() => {
            setSaveStatus("saved");
            if (savedTimer.current) clearTimeout(savedTimer.current);
            savedTimer.current = setTimeout(() => setSaveStatus("idle"), 2500);
          })
          .catch((err: any) => {
            setSaveStatus("error");
            setDbError(err?.message || "Failed to save property data.");
          });
      } else {
        setSaveStatus("saving");
        ensureAnalyzeRow()
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
    [demo]
  );

  const selectAnalyzeProperty = useCallback((id: string) => {
    const entry = analyzeEntriesRef.current.find((e) => e.id === id);
    if (!entry) return;
    setActiveAnalyzeId(id);
    setAnalyzeNameState(entry.name);
    setAnalyzeDataState({ ...entry.data });
  }, []);

  const addAnalyzeProperty = useCallback(async () => {
    if (demo) return;
    const current = analyzeEntriesRef.current;
    if (current.length >= MAX_ANALYZE_SLOTS) return;

    const newName = getDefaultPropertyName(current.length, lang);
    const newData = { ...defaultPropertyData };

    setSaveStatus("saving");
    try {
      const row = await dbCreate({
        name: newName,
        mode: "analyze",
        data: newData,
        sort_order: current.length,
      });
      const entry = {
        id: row.id,
        name: row.name,
        data: row.data as PropertyData,
      };
      setAnalyzeEntries([...current, entry]);
      setActiveAnalyzeId(row.id);
      setAnalyzeNameState(row.name);
      setAnalyzeDataState(newData);
      setSaveStatus("saved");
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err: any) {
      setSaveStatus("error");
      setDbError(err?.message || "Failed to add property.");
    }
  }, [demo]);

  const deleteAnalyzeProperty = useCallback(
    async (id: string) => {
      if (demo) return;
      const current = analyzeEntriesRef.current;
      const remaining = current.filter((e) => e.id !== id);
      setAnalyzeEntries(remaining);

      if (activeAnalyzeIdRef.current === id) {
        if (remaining.length > 0) {
          const first = remaining[0];
          setActiveAnalyzeId(first.id);
          setAnalyzeNameState(first.name);
          setAnalyzeDataState({ ...first.data });
        } else {
          setActiveAnalyzeId(null);
          setAnalyzeNameState(getMyPropertyName(lang));
          setAnalyzeDataState({ ...defaultPropertyData });
        }
      }

      try {
        await dbDelete(id);
        for (let i = 0; i < remaining.length; i++) {
          await dbUpdate(remaining[i].id, { sort_order: i });
        }
        setSaveStatus("saved");
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaveStatus("idle"), 2500);
      } catch (err: any) {
        setSaveStatus("error");
        setDbError(err?.message || "Failed to delete property.");
      }
    },
    [demo]
  );

  // ─── Compare handlers ─── — debounced because multiple properties edit frequently

  const addCompareProperty = useCallback(async () => {
    const current = compareRef.current;
    if (demo) return;
    if (current.length >= 4) return;
    const idx = current.length;
    try {
      const row = await dbCreate({
        name: getDefaultPropertyName(idx, lang),
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
    analyzeEntries,
    activeAnalyzeId,
    selectAnalyzeProperty,
    addAnalyzeProperty,
    deleteAnalyzeProperty,
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
