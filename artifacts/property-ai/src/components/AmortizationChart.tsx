import { useMemo, useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { AmortizationSummary, formatCurrency, PropertyData } from "@/lib/calculations";
import { Calendar, TrendingUp, DollarSign, Percent } from "lucide-react";

interface AmortizationChartProps {
  summary: AmortizationSummary;
  data: PropertyData;
}

type ViewMode = "balance" | "equity" | "interest";

const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
  { key: "balance", label: "Balance & Equity" },
  { key: "equity",  label: "Equity Build" },
  { key: "interest", label: "Interest vs Principal" },
];

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-card/40 border border-border/50 rounded-xl p-4 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-xl font-mono font-bold ${color ?? "text-foreground"}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function compact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return formatCurrency(v);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl p-3 text-xs space-y-1.5 min-w-[200px]">
      <p className="font-bold text-foreground text-sm">Year {label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }} className="font-medium">{entry.name}</span>
          <span className="font-mono text-foreground">{compact(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AmortizationChart({ summary, data }: AmortizationChartProps) {
  const [view, setView] = useState<ViewMode>("balance");

  const chartData = useMemo(() => {
    return [
      { year: 0, balance: data.mortgageBalance, paydownEquity: 0, marketEquity: 0, totalEquity: 0, cumulativeInterest: 0, cumulativePrincipal: 0, yearlyInterest: 0, yearlyPrincipal: 0 },
      ...summary.rows.map((r) => ({
        year: r.year,
        balance: r.remainingBalance,
        paydownEquity: r.equityFromPaydown,
        marketEquity: r.propertyValue - data.currentValue,
        totalEquity: r.totalEquity,
        cumulativeInterest: r.cumulativeInterest,
        cumulativePrincipal: r.cumulativePrincipal,
        yearlyInterest: r.yearlyInterest,
        yearlyPrincipal: r.yearlyPrincipal,
      })),
    ];
  }, [summary, data]);

  const payoffLabel = summary.paysOff
    ? summary.payoffYears > 0
      ? `${summary.payoffYears}y ${summary.payoffMonths}m`
      : `${summary.payoffMonths} months`
    : "> 30 years";

  const firstMonthPct =
    data.mortgagePayment > 0
      ? ((summary.firstMonthInterest / data.mortgagePayment) * 100).toFixed(1)
      : "0";

  if (summary.rows.length === 0) {
    return (
      <div className="bg-card/30 border border-border/50 rounded-2xl p-8 text-center text-muted-foreground text-sm">
        Enter a valid mortgage balance, payment, and interest rate to see the amortization schedule.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Payoff Timeline"
          value={payoffLabel}
          sub={summary.paysOff ? "until mortgage free" : "payment too low"}
          color="text-primary"
        />
        <StatCard
          icon={<DollarSign className="h-3.5 w-3.5" />}
          label="Total Interest"
          value={compact(summary.totalInterestPaid)}
          sub="over life of loan"
          color="text-amber-400"
        />
        <StatCard
          icon={<Percent className="h-3.5 w-3.5" />}
          label="First Payment Split"
          value={`${firstMonthPct}% interest`}
          sub={`${formatCurrency(summary.firstMonthInterest)} interest · ${formatCurrency(summary.firstMonthPrincipal)} principal`}
        />
        <StatCard
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Equity at Payoff"
          value={compact(summary.rows[summary.rows.length - 1]?.totalEquity ?? 0)}
          sub="incl. appreciation"
          color="text-emerald-400"
        />
      </div>

      {/* Chart panel */}
      <div className="bg-card/30 border border-border/50 rounded-2xl p-5 md:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Amortization Schedule
          </h3>
          <div className="flex items-center gap-1 bg-background/60 border border-border/50 rounded-lg p-1">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setView(opt.key)}
                data-testid={`button-amort-view-${opt.key}`}
                className={`px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition-all ${
                  view === opt.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 md:h-80" data-testid="amortization-chart">
          <ResponsiveContainer width="100%" height="100%">
            {view === "balance" ? (
              <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210,70%,50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(210,70%,50%)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="paydownGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(168,70%,50%)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="hsl(168,70%,50%)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="marketGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(280,60%,60%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(280,60%,60%)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215,20%,22%)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(215,20%,55%)" }} tickLine={false} label={{ value: "Year", position: "insideBottomRight", offset: -4, fill: "hsl(215,20%,40%)", fontSize: 10 }} />
                <YAxis tickFormatter={compact} tick={{ fontSize: 10, fill: "hsl(215,20%,55%)" }} tickLine={false} axisLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Area type="monotone" dataKey="balance" name="Remaining Balance" stroke="hsl(210,70%,55%)" fill="url(#balanceGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="paydownEquity" name="Equity (Paydown)" stroke="hsl(168,70%,50%)" fill="url(#paydownGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="marketEquity" name="Equity (Appreciation)" stroke="hsl(280,60%,65%)" fill="url(#marketGrad)" strokeWidth={2} dot={false} />
                {summary.paysOff && (
                  <ReferenceLine x={summary.payoffYears} stroke="hsl(168,70%,50%)" strokeDasharray="4 3" label={{ value: "Paid off", position: "top", fill: "hsl(168,70%,50%)", fontSize: 10 }} />
                )}
              </ComposedChart>
            ) : view === "equity" ? (
              <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalEquityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(168,70%,50%)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="hsl(168,70%,50%)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215,20%,22%)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(215,20%,55%)" }} tickLine={false} />
                <YAxis tickFormatter={compact} tick={{ fontSize: 10, fill: "hsl(215,20%,55%)" }} tickLine={false} axisLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Area type="monotone" dataKey="totalEquity" name="Total Equity" stroke="hsl(168,70%,50%)" fill="url(#totalEquityGrad)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="paydownEquity" name="Paydown Equity" stroke="hsl(210,70%,60%)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                <Line type="monotone" dataKey="marketEquity" name="Market Equity" stroke="hsl(280,60%,65%)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </ComposedChart>
            ) : (
              <ComposedChart data={chartData.slice(1)} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215,20%,22%)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(215,20%,55%)" }} tickLine={false} label={{ value: "Year", position: "insideBottomRight", offset: -4, fill: "hsl(215,20%,40%)", fontSize: 10 }} />
                <YAxis tickFormatter={compact} tick={{ fontSize: 10, fill: "hsl(215,20%,55%)" }} tickLine={false} axisLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Area type="monotone" dataKey="yearlyInterest" name="Yearly Interest" stroke="hsl(45,90%,55%)" fill="hsl(45,90%,55%)" fillOpacity={0.25} strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="yearlyPrincipal" name="Yearly Principal" stroke="hsl(168,70%,50%)" fill="hsl(168,70%,50%)" fillOpacity={0.25} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cumulativeInterest" name="Cumulative Interest" stroke="hsl(10,80%,60%)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Year table — first 10 rows */}
        <div className="overflow-x-auto rounded-xl border border-border/40">
          <table className="w-full text-xs" style={{ minWidth: 520 }}>
            <thead>
              <tr className="border-b border-border/50 bg-card/60">
                {["Year", "Balance", "Yearly Principal", "Yearly Interest", "Cumulative Interest", "Property Value", "Total Equity"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.rows.slice(0, 10).map((row, i) => (
                <tr key={row.year} className={`border-b border-border/20 ${i % 2 === 0 ? "bg-card/20" : ""}`} data-testid={`amort-row-${row.year}`}>
                  <td className="px-3 py-2 font-mono font-bold text-foreground">{row.year}</td>
                  <td className="px-3 py-2 font-mono text-blue-400">{compact(row.remainingBalance)}</td>
                  <td className="px-3 py-2 font-mono text-emerald-400">{compact(row.yearlyPrincipal)}</td>
                  <td className="px-3 py-2 font-mono text-amber-400">{compact(row.yearlyInterest)}</td>
                  <td className="px-3 py-2 font-mono text-rose-400">{compact(row.cumulativeInterest)}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{compact(row.propertyValue)}</td>
                  <td className="px-3 py-2 font-mono text-primary font-bold">{compact(row.totalEquity)}</td>
                </tr>
              ))}
              {summary.rows.length > 10 && (
                <tr className="border-b border-border/20 bg-card/10">
                  <td colSpan={7} className="px-3 py-2 text-center text-muted-foreground italic text-[11px]">
                    Showing first 10 of {summary.rows.length} years — full data visible in chart
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
