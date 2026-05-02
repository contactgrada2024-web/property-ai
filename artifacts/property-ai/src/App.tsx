import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PropertyForm from "@/components/PropertyForm";
import ResultsCard from "@/components/ResultsCard";
import PropertyCard from "@/components/PropertyCard";
import ComparisonTable from "@/components/ComparisonTable";
import AmortizationChart from "@/components/AmortizationChart";
import BreakEvenCalculator from "@/components/BreakEvenCalculator";
import { defaultPropertyData, calculatePropertyMetrics, generateAmortization, PropertyData } from "@/lib/calculations";
import { exportSinglePropertyPdf, exportComparisonPdf } from "@/lib/exportPdf";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Radar, Plus, BarChart2, SlidersHorizontal, Download, Loader2, ChevronDown, ChevronUp, LogOut, Cloud, CloudOff, Check, AlertCircle, Terminal } from "lucide-react";

const queryClient = new QueryClient();

function UserNav() {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  }

  if (!user) return null;

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] font-mono text-muted-foreground hidden sm:block max-w-[160px] truncate">
        {user.email}
      </span>
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        data-testid="btn-signout"
        title="Sign out"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/50 bg-card/40 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all disabled:opacity-50"
      >
        {signingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  );
}

interface PropertyEntry {
  id: string;
  name: string;
  data: PropertyData;
}

function SaveStatusIndicator({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") return null;
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono px-2">
      {status === "saving" && <><Cloud className="h-3 w-3 text-muted-foreground animate-pulse" /><span className="text-muted-foreground">Saving…</span></>}
      {status === "saved"  && <><Check className="h-3 w-3 text-emerald-400" /><span className="text-emerald-400">Saved</span></>}
      {status === "error"  && <><CloudOff className="h-3 w-3 text-rose-400" /><span className="text-rose-400">Save failed</span></>}
    </div>
  );
}

function SetupBanner() {
  return (
    <div className="m-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-amber-400" />
        <p className="font-semibold text-amber-300">One-time database setup required</p>
      </div>
      <p className="text-sm text-muted-foreground">
        To persist your portfolio across sessions, run the following SQL once in your{" "}
        <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
          Supabase dashboard
        </a>{" "}
        → SQL Editor → New query, then refresh this page.
      </p>
      <pre className="text-[11px] font-mono bg-background/60 border border-border/50 rounded-xl p-4 overflow-x-auto text-foreground/80 select-all whitespace-pre-wrap">{`-- See supabase_setup.sql in the project root for the full script
-- Or copy from: artifacts/property-ai/supabase_setup.sql`}</pre>
      <p className="text-xs text-muted-foreground">
        The full SQL is in <code className="text-primary">artifacts/property-ai/supabase_setup.sql</code>
      </p>
    </div>
  );
}

function ExportButton({
  onClick,
  loading,
  label,
  "data-testid": testId,
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
  "data-testid"?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      data-testid={testId}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}

function Home() {
  const [mode, setMode] = useState<"analyze" | "compare">("analyze");
  const [showAmortization, setShowAmortization] = useState(true);
  const [showBreakEven, setShowBreakEven] = useState(true);
  const [exportingAnalyze, setExportingAnalyze] = useState(false);
  const [exportingCompare, setExportingCompare] = useState(false);

  const {
    analyzeName: singleName,
    analyzeData: singleData,
    setAnalyzeName: setSingleName,
    setAnalyzeData: setSingleData,
    compareProperties: properties,
    addCompareProperty: handleAdd,
    removeCompareProperty: handleRemove,
    updateComparePropertyName: handleNameChange,
    updateComparePropertyData: handleDataChange,
    loading,
    saveStatus,
    dbError,
  } = usePortfolio();

  const singleResults = useMemo(() => calculatePropertyMetrics(singleData), [singleData]);
  const amortizationSummary = useMemo(() => generateAmortization(singleData), [singleData]);

  const comparisonEntries = useMemo(
    () => properties.map((p) => ({ id: p.id, name: p.name, results: calculatePropertyMetrics(p.data) })),
    [properties]
  );

  function handleExportAnalyze() {
    setExportingAnalyze(true);
    setTimeout(() => {
      try {
        exportSinglePropertyPdf(singleName || "My Property", singleData, singleResults, amortizationSummary);
      } finally {
        setExportingAnalyze(false);
      }
    }, 50);
  }

  function handleExportCompare() {
    setExportingCompare(true);
    setTimeout(() => {
      try {
        exportComparisonPdf(
          properties.map((p) => ({
            id: p.id,
            name: p.name,
            data: p.data,
            results: calculatePropertyMetrics(p.data),
          }))
        );
      } finally {
        setExportingCompare(false);
      }
    }, 50);
  }

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground selection:bg-primary/30 font-sans">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary">
            <Radar className="h-6 w-6" />
            <span className="font-bold tracking-wider uppercase text-lg text-foreground">
              Property<span className="text-primary">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-1 bg-card/60 border border-border/50 rounded-lg p-1">
            <button
              onClick={() => setMode("analyze")}
              data-testid="button-mode-analyze"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                mode === "analyze"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Analyze
            </button>
            <button
              onClick={() => setMode("compare")}
              data-testid="button-mode-compare"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                mode === "compare"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Compare
            </button>
          </div>

          <div className="flex items-center gap-2">
            <SaveStatusIndicator status={saveStatus} />
            <UserNav />
          </div>
        </div>
      </header>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Loading your portfolio…</p>
          </div>
        </div>
      )}

      {/* Setup required banner */}
      {!loading && dbError === "setup_required" && <SetupBanner />}

      {/* Generic DB error */}
      {!loading && dbError && dbError !== "setup_required" && (
        <div className="m-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <p className="text-sm text-rose-300">Database error: {dbError}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
      {(!loading && !dbError) && (mode === "analyze" ? (
          <motion.main
            key="analyze"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="container mx-auto max-w-7xl px-4 py-8 md:py-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                        Asset Evaluation
                      </h1>
                    </div>
                    <p className="text-muted-foreground">
                      Enter your property parameters to generate an instant strategic analysis.
                    </p>
                  </div>
                </div>

                {/* Property name + export row */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">
                      Property Name
                    </label>
                    <input
                      value={singleName}
                      onChange={(e) => setSingleName(e.target.value)}
                      className="w-full bg-card/30 border border-border/60 rounded-lg px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary transition-colors"
                      placeholder="e.g. 123 Main St"
                      maxLength={48}
                      data-testid="input-single-property-name"
                    />
                  </div>
                  <div className="mt-5">
                    <ExportButton
                      onClick={handleExportAnalyze}
                      loading={exportingAnalyze}
                      label="Export PDF"
                      data-testid="button-export-analyze"
                    />
                  </div>
                </div>

                <div className="bg-card/30 p-6 md:p-8 rounded-2xl border border-border/50">
                  <PropertyForm onChange={setSingleData} />
                </div>
              </div>
              <div className="lg:col-span-5 lg:sticky lg:top-24">
                <ResultsCard results={singleResults} />
              </div>
            </div>

            {/* Amortization section */}
            <div className="mt-10 space-y-4">
              <button
                onClick={() => setShowAmortization((v) => !v)}
                data-testid="button-toggle-amortization"
                className="flex items-center gap-2 w-full text-left group"
              >
                <div className="flex-1 h-px bg-border/50" />
                <span className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-card/40 text-xs font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-foreground group-hover:border-primary/40 transition-all">
                  Amortization Schedule
                  {showAmortization ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </button>

              <AnimatePresence>
                {showAmortization && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <AmortizationChart summary={amortizationSummary} data={singleData} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Break-even section */}
            <div className="mt-6 space-y-4">
              <button
                onClick={() => setShowBreakEven((v) => !v)}
                data-testid="button-toggle-breakeven"
                className="flex items-center gap-2 w-full text-left group"
              >
                <div className="flex-1 h-px bg-border/50" />
                <span className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-card/40 text-xs font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-foreground group-hover:border-primary/40 transition-all">
                  Break-Even Rent Calculator
                  {showBreakEven ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </button>

              <AnimatePresence>
                {showBreakEven && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <BreakEvenCalculator data={singleData} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.main>
        ) : (
          <motion.main
            key="compare"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="container mx-auto max-w-7xl px-4 py-8 md:py-12 space-y-10"
          >
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  Portfolio Comparison
                </h1>
                <p className="text-muted-foreground mt-2">
                  Evaluate up to 4 properties side by side. Best values are highlighted automatically.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {properties.length < 4 && (
                  <button
                    onClick={handleAdd}
                    data-testid="button-add-property"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/50 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Property
                  </button>
                )}
                <ExportButton
                  onClick={handleExportCompare}
                  loading={exportingCompare}
                  label="Export PDF"
                  data-testid="button-export-compare"
                />
              </div>
            </div>

            <AnimatePresence>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {properties.map((p, i) => (
                  <PropertyCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    data={p.data}
                    index={i}
                    canRemove={properties.length > 2}
                    onNameChange={handleNameChange}
                    onChange={handleDataChange}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </AnimatePresence>

            <ComparisonTable properties={comparisonEntries} />
          </motion.main>
        )
      )}
      </AnimatePresence>
    </div>
  );
}

function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthGate />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
