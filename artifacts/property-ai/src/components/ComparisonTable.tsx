import { useMemo } from "react";
import { CalculationResults, formatCurrency, formatPercent } from "@/lib/calculations";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PropertyEntry {
  id: string;
  name: string;
  results: CalculationResults;
}

interface ComparisonTableProps {
  properties: PropertyEntry[];
}

const SIGNAL_STYLES: Record<string, string> = {
  Hold: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Refinance: "bg-primary/15 text-primary border-primary/30",
  Optimize: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Sell: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

const COLUMN_COLORS = [
  { header: "text-primary", highlight: "bg-primary/10 border-primary/20" },
  { header: "text-[hsl(280,70%,60%)]", highlight: "bg-[hsl(280,70%,60%)]/10 border-[hsl(280,70%,60%)]/20" },
  { header: "text-[hsl(45,95%,55%)]", highlight: "bg-[hsl(45,95%,55%)]/10 border-[hsl(45,95%,55%)]/20" },
  { header: "text-[hsl(10,80%,60%)]", highlight: "bg-[hsl(10,80%,60%)]/10 border-[hsl(10,80%,60%)]/20" },
];

type Direction = "high" | "low" | "none";

interface RowDef {
  label: string;
  subLabel?: string;
  getValue: (r: CalculationResults) => number;
  format: (v: number) => string;
  direction: Direction;
  highlight: boolean;
}

const ROWS: RowDef[] = [
  {
    label: "Monthly Cash Flow",
    getValue: (r) => r.monthlyCashFlow,
    format: formatCurrency,
    direction: "high",
    highlight: true,
  },
  {
    label: "Annual Cash Flow",
    getValue: (r) => r.annualCashFlow,
    format: formatCurrency,
    direction: "high",
    highlight: false,
  },
  {
    label: "Available Equity",
    getValue: (r) => r.availableEquity,
    format: formatCurrency,
    direction: "high",
    highlight: true,
  },
  {
    label: "Equity Strength",
    getValue: (r) => r.equityStrengthPercent,
    format: (v) => `${v.toFixed(1)}%`,
    direction: "high",
    highlight: false,
  },
  {
    label: "Cash If Sold Today",
    getValue: (r) => r.estimatedCashIfSoldToday,
    format: formatCurrency,
    direction: "high",
    highlight: true,
  },
  {
    label: "Capital Efficiency",
    getValue: (r) => r.capitalEfficiencyPercent,
    format: (v) => `${v.toFixed(1)}%`,
    direction: "high",
    highlight: false,
  },
  {
    label: "Health Score",
    getValue: (r) => r.propertyHealthScore,
    format: (v) => `${v.toFixed(1)} / 2.0`,
    direction: "high",
    highlight: true,
  },
];

function getBestWorst(values: number[], direction: Direction): { best: number; worst: number } {
  if (direction === "none" || values.length < 2) return { best: -Infinity, worst: Infinity };
  const best = Math.max(...values);
  const worst = Math.min(...values);
  return { best, worst };
}

function CashFlowIndicator({ value }: { value: number }) {
  if (value > 0) return <TrendingUp className="h-3.5 w-3.5 inline-block ml-1 text-emerald-400" />;
  if (value < 0) return <TrendingDown className="h-3.5 w-3.5 inline-block ml-1 text-rose-400" />;
  return <Minus className="h-3.5 w-3.5 inline-block ml-1 text-muted-foreground" />;
}

function HealthDots({ score }: { score: number }) {
  const filled = Math.round(score * 2);
  return (
    <span className="inline-flex gap-0.5 ml-1.5 align-middle">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`inline-block w-1.5 h-1.5 rounded-full ${i < filled ? "bg-emerald-400" : "bg-border"}`}
        />
      ))}
    </span>
  );
}

export default function ComparisonTable({ properties }: ComparisonTableProps) {
  const ranked = useMemo(() => {
    return properties.map((p) => ({
      ...p,
      rank: p.results.propertyHealthScore,
    }));
  }, [properties]);

  const topId = useMemo(() => {
    if (ranked.length === 0) return null;
    return ranked.reduce((a, b) => (a.rank >= b.rank ? a : b)).id;
  }, [ranked]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
      data-testid="comparison-table"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold tracking-tight text-foreground uppercase text-xs text-muted-foreground tracking-widest">
          Side-by-Side Analysis
        </h2>
        {topId && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Best:{" "}
            <span className="text-primary font-semibold">
              {properties.find((p) => p.id === topId)?.name}
            </span>
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full text-sm border-collapse" style={{ minWidth: `${180 + properties.length * 160}px` }}>
          <thead>
            <tr className="border-b border-border/60 bg-card/60">
              <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-widest font-medium w-44">
                Metric
              </th>
              {properties.map((p, i) => (
                <th
                  key={p.id}
                  className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest ${COLUMN_COLORS[i % COLUMN_COLORS.length].header}`}
                  data-testid={`col-header-${p.id}`}
                >
                  {p.id === topId ? (
                    <span className="inline-flex items-center gap-1">
                      {p.name}
                      <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold tracking-wider">TOP</span>
                    </span>
                  ) : (
                    p.name
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, rowIdx) => {
              const values = properties.map((p) => row.getValue(p.results));
              const { best, worst } = getBestWorst(values, row.direction);

              return (
                <tr
                  key={row.label}
                  className={`border-b border-border/30 ${rowIdx % 2 === 0 ? "bg-card/20" : "bg-transparent"}`}
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium whitespace-nowrap">
                    {row.label}
                  </td>
                  {properties.map((p, colIdx) => {
                    const val = row.getValue(p.results);
                    const isBest = row.direction !== "none" && properties.length > 1 && val === best;
                    const isWorst = row.direction !== "none" && properties.length > 1 && val === worst && worst !== best;

                    const isCashFlow = row.label === "Monthly Cash Flow" || row.label === "Annual Cash Flow";
                    const isHealth = row.label === "Health Score";

                    return (
                      <td
                        key={p.id}
                        className={`px-4 py-3 text-center font-mono text-sm whitespace-nowrap ${
                          isBest
                            ? `font-bold text-emerald-400`
                            : isWorst
                            ? "text-rose-400"
                            : "text-foreground"
                        }`}
                        data-testid={`cell-${row.label.toLowerCase().replace(/\s/g, "-")}-${p.id}`}
                      >
                        {row.format(val)}
                        {isCashFlow && <CashFlowIndicator value={val} />}
                        {isHealth && <HealthDots score={val} />}
                        {isBest && properties.length > 1 && (
                          <span className="ml-1.5 text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded font-bold">
                            BEST
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            <tr className="border-b border-border/30 bg-card/40">
              <td className="px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Strategy Signal
              </td>
              {properties.map((p) => (
                <td key={p.id} className="px-4 py-3 text-center" data-testid={`cell-strategy-${p.id}`}>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      SIGNAL_STYLES[p.results.strategySignal] ?? ""
                    }`}
                  >
                    {p.results.strategySignal}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
