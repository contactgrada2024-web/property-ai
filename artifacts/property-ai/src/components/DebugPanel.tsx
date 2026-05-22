import { useState } from "react";
import { Bug, Database, RefreshCw, Save } from "lucide-react";
import { PropertyData } from "@/lib/calculations";
import { PersistDiagnostic } from "@/hooks/usePortfolio";

export default function DebugPanel({
  diagnostics,
  onSave,
  onReload,
  singleData,
}: {
  diagnostics: PersistDiagnostic[];
  onSave: (data: PropertyData) => Promise<PersistDiagnostic>;
  onReload: () => Promise<void>;
  singleData: PropertyData;
}) {
  const [lastResult, setLastResult] = useState<PersistDiagnostic | null>(null);
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await onSave({ ...singleData, currentValue: 654321 });
      setLastResult(result);
    } finally {
      setSaving(false);
    }
  }

  async function handleReload() {
    setReloading(true);
    try {
      await onReload();
    } finally {
      setReloading(false);
    }
  }

  const entries = lastResult ? [lastResult, ...diagnostics] : diagnostics;

  return (
    <div className="mt-8 border-2 border-primary/20 rounded-xl bg-card/40 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
          <Bug className="h-4 w-4 text-primary" />
          Persistence Diagnostics
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            <Save className="h-3 w-3" />
            {saving ? "Saving..." : "Save 654321"}
          </button>
          <button
            onClick={handleReload}
            disabled={reloading}
            className="flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded bg-card/80 text-foreground border border-border/50 hover:bg-card transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${reloading ? "animate-spin" : ""}`} />
            Reload Row
          </button>
        </div>
      </div>

      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No operations yet. Click "Save 654321" to write a test value and see the exact Supabase response here.
        </p>
      )}

      {entries.slice(0, 5).map((d, i) => (
        <div
          key={i}
          className="text-[11px] font-mono space-y-1.5 border-l-2 pl-3 py-2"
          style={{ borderColor: d.rowsAffected > 0 ? "rgb(52 211 153)" : "rgb(251 113 133)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {new Date(d.timestamp).toLocaleTimeString()}
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{
                background: d.rowsAffected > 0 ? "rgb(6 78 59)" : "rgb(127 29 29)",
                color: d.rowsAffected > 0 ? "rgb(52 211 153)" : "rgb(251 113 133)",
              }}
            >
              {d.rowsAffected > 0 ? "OK" : "FAIL"}
            </span>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-1">
            <span className="text-muted-foreground">user_id</span>
            <span className="text-foreground truncate">{d.userId}</span>

            <span className="text-muted-foreground">row_id</span>
            <span className="text-foreground truncate">{d.rowId}</span>

            <span className="text-muted-foreground">payload currentValue</span>
            <span className="text-emerald-400 font-bold">{d.payloadCurrentValue}</span>

            <span className="text-muted-foreground">returned currentValue</span>
            <span className={d.returnedRowCurrentValue === d.payloadCurrentValue ? "text-emerald-400" : "text-rose-400"}>
              {d.returnedRowCurrentValue ?? "null — RLS blocked or row missing"}
            </span>

            <span className="text-muted-foreground">rows_affected</span>
            <span className="text-foreground">{d.rowsAffected}</span>

            {d.errorMessage && (
              <>
                <span className="text-rose-400">error_message</span>
                <span className="text-rose-400">{d.errorMessage}</span>
              </>
            )}
            {d.errorCode && (
              <>
                <span className="text-muted-foreground">error_code</span>
                <span className="text-foreground">{d.errorCode}</span>
              </>
            )}
          </div>

          {d.rawReturnedRow && (
            <details className="mt-1">
              <summary className="text-muted-foreground cursor-pointer text-[10px] hover:text-foreground transition-colors">
                <Database className="h-3 w-3 inline mr-1" />
                Raw returned row (what Supabase sent back)
              </summary>
              <pre className="mt-1 p-2.5 bg-black/40 rounded text-[10px] text-foreground overflow-x-auto border border-border/20">
                {JSON.stringify(d.rawReturnedRow, null, 2)}
              </pre>
            </details>
          )}

          {d.rawReloadedRow && (
            <details className="mt-1">
              <summary className="text-muted-foreground cursor-pointer text-[10px] hover:text-foreground transition-colors">
                <RefreshCw className="h-3 w-3 inline mr-1" />
                Raw reloaded row (fresh SELECT after save)
              </summary>
              <pre className="mt-1 p-2.5 bg-black/40 rounded text-[10px] text-foreground overflow-x-auto border border-border/20">
                {JSON.stringify(d.rawReloadedRow, null, 2)}
              </pre>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}
