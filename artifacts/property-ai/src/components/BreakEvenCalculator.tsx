import { useMemo, useState } from "react";
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import {
  BreakEvenResult,
  PropertyData,
  calculateBreakEven,
  formatCurrency,
} from "@/lib/calculations";
import { useI18n } from "@/lib/i18n";
import { AlertTriangle, CheckCircle2, Percent, TrendingDown } from "lucide-react";

interface BreakEvenCalculatorProps {
  data: PropertyData;
}

const KEY_RATES = [3, 4, 5, 6, 7, 7.5, 8, 9, 10, 12, 15];

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

function CustomTooltip({ active, payload, label, effectiveRent, t }: any) {
  if (!active || !payload?.length) return null;
  const beRent = payload.find((p: any) => p.dataKey === "breakEvenRent")?.value as number | undefined;
  const gap = beRent !== undefined ? effectiveRent - beRent : undefined;
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl p-3 text-xs space-y-1.5 min-w-[200px]">
      <p className="font-bold text-foreground text-sm">{Number(label).toFixed(1)}% {t("interestRate")}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }} className="font-medium">{entry.name}</span>
          <span className="font-mono text-foreground">{formatCurrency(entry.value)}</span>
        </div>
      ))}
      {gap !== undefined && (
        <div className={`flex justify-between gap-4 border-t border-border/50 pt-1 mt-1 font-semibold ${gap >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
          <span>{t("cashFlow")}</span>
          <span className="font-mono">{formatCurrency(gap)}</span>
        </div>
      )}
    </div>
  );
}

export default function BreakEvenCalculator({ data }: BreakEvenCalculatorProps) {
  const { t } = useI18n();
  const [vacancy, setVacancy] = useState(0);

  const result: BreakEvenResult = useMemo(
    () => calculateBreakEven(data, vacancy),
    [data, vacancy]
  );

  const effectiveRent = data.rentalIncome * (1 - vacancy / 100);
  const isPositive = result.currentCashFlow >= 0;

  const chartData = result.rows.map((r) => ({
    rate: r.rate,
    breakEvenRent: Math.round(r.breakEvenRent),
  }));

  const snapshotRates = Array.from(
    new Set([...KEY_RATES, data.interestRate])
  ).sort((a, b) => a - b);

  const snapshotRows = snapshotRates
    .map((targetRate) => {
      const closest = result.rows.reduce((prev, curr) =>
        Math.abs(curr.rate - targetRate) < Math.abs(prev.rate - targetRate) ? curr : prev
      );
      return { targetRate, ...closest };
    });

  const maxRate = result.maxAffordableRate;
  const safeZoneEnd = maxRate !== null ? Math.min(maxRate, 15) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          icon={<TrendingDown className="h-3.5 w-3.5" />}
          label={t("breakEvenRent")}
          value={formatCurrency(result.currentBreakEven)}
          sub={t("totalMonthlyExpenses")}
          color="text-foreground"
        />
        <StatCard
          icon={isPositive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          label={vacancy > 0 ? `${t("cashFlow")} (${vacancy}% ${t("vacancyStressTest")})` : t("cashFlow")}
          value={formatCurrency(result.currentCashFlow)}
          sub={isPositive ? t("aboveBreakEven") : t("belowBreakEven")}
          color={isPositive ? "text-emerald-400" : "text-rose-400"}
        />
        <StatCard
          icon={<Percent className="h-3.5 w-3.5" />}
          label={t("maxAffordableRate")}
          value={maxRate !== null ? `${maxRate.toFixed(2)}%` : t("allRatesPositive")}
          sub={
            maxRate !== null
              ? maxRate > data.interestRate
                ? `${(maxRate - data.interestRate).toFixed(2)}% ${t("bufferAboveCurrent")}`
                : t("currentRateExceeds")
              : t("allRatesPositive")
          }
          color={
            maxRate === null
              ? "text-emerald-400"
              : maxRate > data.interestRate
              ? "text-emerald-400"
              : "text-rose-400"
          }
        />
      </div>

      <div className="bg-card/30 border border-border/50 rounded-2xl p-5 md:p-6 space-y-5">
        {/* Vacancy slider */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-52 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="uppercase tracking-widest font-semibold">{t("vacancyStressTest")}</span>
              <span className="font-mono font-bold text-foreground">{vacancy}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={vacancy}
              onChange={(e) => setVacancy(Number(e.target.value))}
              data-testid="slider-vacancy"
              className="w-full h-2 rounded-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{t("fullyOccupied")}</span>
              <span>{t("oneInFiveVacant")}</span>
            </div>
          </div>
          <div className="text-xs space-y-0.5 text-right">
            <p className="text-muted-foreground">{t("effectiveRent")}</p>
            <p className="font-mono font-bold text-amber-400 text-base">{formatCurrency(effectiveRent)}</p>
            {vacancy > 0 && (
              <p className="text-muted-foreground text-[10px]">
                ({formatCurrency(data.rentalIncome - effectiveRent)}{t("lostToVacancy")})
              </p>
            )}
          </div>
        </div>

        {/* Chart */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            {t("breakEvenRentVsRate")}
          </p>
          <div className="h-72 md:h-80" data-testid="breakeven-chart">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="beGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210,70%,55%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(210,70%,55%)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215,20%,22%)" />
                <XAxis
                  dataKey="rate"
                  type="number"
                  domain={[0.5, 15]}
                  tickCount={10}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10, fill: "hsl(215,20%,55%)" }}
                  tickLine={false}
                  label={{ value: t("interestRate"), position: "insideBottomRight", offset: -4, fill: "hsl(215,20%,40%)", fontSize: 10 }}
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  tick={{ fontSize: 10, fill: "hsl(215,20%,55%)" }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />
                <Tooltip content={<CustomTooltip effectiveRent={effectiveRent} t={t} />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />

                {safeZoneEnd !== null && safeZoneEnd > 0.5 && (
                  <ReferenceArea
                    x1={0.5}
                    x2={safeZoneEnd}
                    fill="hsl(168,70%,50%)"
                    fillOpacity={0.04}
                    ifOverflow="hidden"
                  />
                )}

                {safeZoneEnd !== null && safeZoneEnd < 15 && (
                  <ReferenceArea
                    x1={safeZoneEnd}
                    x2={15}
                    fill="hsl(0,70%,50%)"
                    fillOpacity={0.05}
                    ifOverflow="hidden"
                  />
                )}

                <Area
                  type="monotone"
                  dataKey="breakEvenRent"
                  name={t("breakEvenRentLabel")}
                  stroke="hsl(210,70%,60%)"
                  fill="url(#beGrad)"
                  strokeWidth={2}
                  dot={false}
                />

                <ReferenceLine
                  y={data.rentalIncome}
                  stroke="hsl(168,70%,50%)"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  label={{ value: `${t("rent")} ${formatCurrency(data.rentalIncome)}`, position: "right", fill: "hsl(168,70%,50%)", fontSize: 9 }}
                />

                {vacancy > 0 && (
                  <ReferenceLine
                    y={effectiveRent}
                    stroke="hsl(45,90%,55%)"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    label={{ value: `${t("net")} ${formatCurrency(effectiveRent)}`, position: "right", fill: "hsl(45,90%,55%)", fontSize: 9 }}
                  />
                )}

                <ReferenceLine
                  x={data.interestRate}
                  stroke="hsl(215,20%,65%)"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  label={{ value: `${t("current")} ${data.interestRate}%`, position: "top", fill: "hsl(215,20%,65%)", fontSize: 9 }}
                />

                {maxRate !== null && (
                  <ReferenceLine
                    x={parseFloat(maxRate.toFixed(2))}
                    stroke="hsl(168,70%,50%)"
                    strokeWidth={2}
                    label={{ value: `${t("max")} ${maxRate.toFixed(1)}%`, position: "insideTopLeft", fill: "hsl(168,70%,50%)", fontSize: 9 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Snapshot table */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {t("rateScenarios")}
          </p>
          <div className="overflow-x-auto rounded-xl border border-border/40">
            <table className="w-full text-xs" style={{ minWidth: 480 }}>
              <thead>
                <tr className="border-b border-border/50 bg-card/60">
                  {[t("rate"), t("mortgagePayment"), t("breakEvenRentLabel"), `${t("cashFlow")}${vacancy > 0 ? ` (${vacancy}% ${t("vacancyStressTest")})` : ""}`, t("status")].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapshotRows.map((row, i) => {
                  const isCurrent = row.targetRate === data.interestRate;
                  const positive = row.cashFlow >= 0;
                  return (
                    <tr
                      key={row.targetRate}
                      data-testid={`breakeven-row-${row.targetRate}`}
                      className={`border-b border-border/20 ${isCurrent ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : i % 2 === 0 ? "bg-card/20" : ""}`}
                    >
                      <td className="px-3 py-2 font-mono font-bold text-foreground">
                        {row.rate.toFixed(1)}%
                        {isCurrent && <span className="ml-1.5 text-[9px] text-primary bg-primary/15 px-1.5 py-0.5 rounded-full uppercase tracking-wide">{t("current")}</span>}
                      </td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{formatCurrency(row.mortgagePayment)}</td>
                      <td className="px-3 py-2 font-mono text-blue-400">{formatCurrency(row.breakEvenRent)}</td>
                      <td className={`px-3 py-2 font-mono font-semibold ${positive ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatCurrency(row.cashFlow)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${positive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                          {positive ? t("profitable") : t("negative")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
