import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PropertyForm from "@/components/PropertyForm";
import ResultsCard from "@/components/ResultsCard";
import PropertyCard from "@/components/PropertyCard";
import ComparisonTable from "@/components/ComparisonTable";
import AmortizationChart from "@/components/AmortizationChart";
import { defaultPropertyData, calculatePropertyMetrics, generateAmortization, PropertyData } from "@/lib/calculations";
import { exportSinglePropertyPdf, exportComparisonPdf } from "@/lib/exportPdf";
import { Radar, Plus, BarChart2, SlidersHorizontal, Download, Loader2, ChevronDown, ChevronUp } from "lucide-react";

const queryClient = new QueryClient();

interface PropertyEntry {
  id: string;
  name: string;
  data: PropertyData;
}

function makeId() {
  return Math.random().toString(36).slice(2, 8);
}

function makeDefault(index: number): PropertyEntry {
  const names = ["Property A", "Property B", "Property C", "Property D"];
  return { id: makeId(), name: names[index] ?? `Property ${index + 1}`, data: { ...defaultPropertyData } };
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

  // Analyze mode state
  const [singleName, setSingleName] = useState("My Property");
  const [singleData, setSingleData] = useState<PropertyData>(defaultPropertyData);
  const singleResults = useMemo(() => calculatePropertyMetrics(singleData), [singleData]);
  const amortizationSummary = useMemo(() => generateAmortization(singleData), [singleData]);
  const [showAmortization, setShowAmortization] = useState(true);
  const [exportingAnalyze, setExportingAnalyze] = useState(false);

  // Compare mode state
  const [properties, setProperties] = useState<PropertyEntry[]>([makeDefault(0), makeDefault(1)]);
  const [exportingCompare, setExportingCompare] = useState(false);

  const handleNameChange = useCallback((id: string, name: string) => {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  const handleDataChange = useCallback((id: string, data: PropertyData) => {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, data } : p)));
  }, []);

  const handleRemove = useCallback((id: string) => {
    setProperties((prev) => (prev.length > 2 ? prev.filter((p) => p.id !== id) : prev));
  }, []);

  const handleAdd = useCallback(() => {
    setProperties((prev) => {
      if (prev.length >= 4) return prev;
      return [...prev, makeDefault(prev.length)];
    });
  }, []);

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

          <div className="text-xs font-mono text-muted-foreground hidden sm:block">
            TERMINAL v1.0 // ACTIVE
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {mode === "analyze" ? (
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
        )}
      </AnimatePresence>
    </div>
  );
}

function Router() {
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
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
