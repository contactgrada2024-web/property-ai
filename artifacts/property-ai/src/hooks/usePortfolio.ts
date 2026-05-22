import { useState, useEffect, useRef, useCallback } from "react";
import { defaultPropertyData, PropertyData } from "@/lib/calculations";
import { dbCreate, dbDelete, dbLoadAll, dbUpdate, dbGetRow, DbUpdateDiagnostic } from "@/lib/db";
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

export interface PersistDiagnostic {
  timestamp: string;
  userId: string;
  rowId: string;
  payloadCurrentValue: number;
  returnedRowCurrentValue: number | null;
  rowsAffected: number;
  errorMessage: string | null;
  errorCode: string | null;
  rawReturnedRow: Record<string, unknown> | null;
  rawReloadedRow: Record<string, unknown> | null;
}

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

  // In-app diagnostics (visible on screen, not console)
  const [persistDiagnostics, _setPersistDiagnostics] = useState<PersistDiagnostic[]>([]);

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
  const dirty = useRef<Map<string, () => Promise<unknown>>>(new Map());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function schedule(key: string, fn: () => Promise<unknown>) {
    if (demo) return; // no-op in demo
    dirty.current.set(key, fn);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(flush, 1500);
  }

  async function flush() {
    debounceTimer.current = null;
    const fns = [...dirty.current.values()];
    dirty.current.clear();
    if (!fns.length) return;
    _setSaveStatus("saving");
    try {
      await Promise.all(fns.map((f) => f()));
      _setSaveStatus("saved");
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => _setSaveStatus("idle"), 2500);
    } catch (err: any) {
      _setSaveStatus("error");
      setDbError(err?.message || "Save failed. Check console for details.");
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
        if (id) schedule("analyze-name", () => dbUpdate(id, { name }).then(() => {}));
      }
    },
    [demo]
  );

  const setAnalyzeData = useCallback(
    (data: PropertyData) => {
      _setAnalyzeData(data);
      if (!demo) {
        const id = analyzeDbId.current;
        if (id) schedule("analyze-data", () => dbUpdate(id, { data }).then(() => {}));
      }
    },
    [demo]
  );

  // ─── Diagnostic: immediate save + reload (no debounce) ───────────────────

  const saveAndDiagnose = useCallback(
    async (data: PropertyData): Promise<PersistDiagnostic> => {
      const id = analyzeDbId.current;
      if (!id) {
        throw new Error("No analyzeDbId — cannot save.");
      }
      const { data: userData } = await (await import("@/lib/supabase")).supabase.auth.getUser();
      const userId = userData.user?.id ?? "none";

      let diag: DbUpdateDiagnostic;
      try {
        diag = await dbUpdate(id, { data });
      } catch (e: any) {
        diag = {
          table: "properties",
          rowId: id,
          userId,
          payload: { data },
          returnedRow: null,
          errorMessage: e?.message ?? String(e),
          errorCode: e?.code ?? null,
          errorDetails: null,
        };
      }

      // Reload row immediately to prove persistence
      let reloaded: any = null;
      try {
        reloaded = await dbGetRow(id);
      } catch {
        /* ignore reload errors — update result is what matters */
      }

      const entry: PersistDiagnostic = {
        timestamp: new Date().toISOString(),
        userId: diag.userId,
        rowId: id,
        payloadCurrentValue: data.currentValue,
        returnedRowCurrentValue: diag.returnedRow?.data?.currentValue ?? null,
        rowsAffected: diag.returnedRow ? 1 : 0,
        errorMessage: diag.errorMessage,
        errorCode: diag.errorCode,
        rawReturnedRow: diag.returnedRow as any,
        rawReloadedRow: reloaded as any,
      };

      _setPersistDiagnostics((prev) => [entry, ...prev].slice(0, 10));
      _setAnalyzeData(data);
      return entry;
    },
    []
  );

  const reloadDiagnostics = useCallback(async () => {
    const id = analyzeDbId.current;
    if (!id) return;
    const { data: userData } = await (await import("@/lib/supabase")).supabase.auth.getUser();
    const userId = userData.user?.id ?? "none";
    let reloaded: any = null;
    try {
      reloaded = await dbGetRow(id);
    } catch (e: any) {
      _setPersistDiagnostics((prev) => [{
        timestamp: new Date().toISOString(),
        userId,
        rowId: id,
        payloadCurrentValue: analyzeData.currentValue,
        returnedRowCurrentValue: null,
        rowsAffected: 0,
        errorMessage: e?.message ?? String(e),
        errorCode: e?.code ?? null,
        rawReturnedRow: null,
        rawReloadedRow: null,
      }, ...prev].slice(0, 10));
      return;
    }
    _setPersistDiagnostics((prev) => [{
      timestamp: new Date().toISOString(),
      userId,
      rowId: id,
      payloadCurrentValue: analyzeData.currentValue,
      returnedRowCurrentValue: reloaded?.data?.currentValue ?? null,
      rowsAffected: 1,
      errorMessage: null,
      errorCode: null,
      rawReturnedRow: null,
      rawReloadedRow: reloaded as any,
    }, ...prev].slice(0, 10));
  }, [analyzeData]);

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
      if (!demo) schedule(`cname-${id}`, () => dbUpdate(id, { name }).then(() => {}));
    },
    [demo]
  );

  const updateComparePropertyData = useCallback(
    (id: string, data: PropertyData) => {
      setCompare(compareRef.current.map((p) => (p.id === id ? { ...p, data } : p)));
      if (!demo) schedule(`cdata-${id}`, () => dbUpdate(id, { data }).then(() => {}));
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
    // Diagnostics
    persistDiagnostics,
    saveAndDiagnose,
    reloadDiagnostics,
  };
}
