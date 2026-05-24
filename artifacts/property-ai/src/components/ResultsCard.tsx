import { CalculationResults, formatCurrency, formatPercent } from "@/lib/calculations";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Target, ArrowRightCircle } from "lucide-react";

const signalColors: Record<string, string> = {
  Hold: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Refinance: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Optimize: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Sell: "bg-red-500/15 text-red-400 border-red-500/30",
};

const strategyKeyMap: Record<string, string> = {
  Hold: "hold",
  Refinance: "refinance",
  Optimize: "optimize",
  Sell: "sell",
};

const strategyDescKeyMap: Record<string, string> = {
  Hold: "holdDesc",
  Refinance: "refinanceDesc",
  Optimize: "optimizeDesc",
  Sell: "sellDesc",
};

interface ResultsCardProps {
  results: CalculationResults;
}

export default function ResultsCard({ results }: ResultsCardProps) {
  const { t } = useI18n();
  const isPositiveCashFlow = results.monthlyCashFlow >= 0;

  const translatedSignal = t(strategyKeyMap[results.strategySignal] as any) || results.strategySignal;
  const translatedDesc = t(strategyDescKeyMap[results.strategySignal] as any) || results.strategyDescription;

  return (
    <Card className="border-border bg-card/50 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {t("terminalOutput")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">

        {/* Strategy Signal */}
        <div className="bg-background/50 rounded-xl p-6 border border-border">
          <div className="flex flex-col items-start gap-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t("recommendedAction")}</span>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={results.strategySignal}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className={`text-4xl font-bold px-4 py-2 rounded-lg border ${signalColors[results.strategySignal]}`}
                data-testid="text-strategy-signal"
              >
                {translatedSignal}
              </motion.div>
            </AnimatePresence>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed" data-testid="text-strategy-desc">
              {translatedDesc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          {/* Cash Flow */}
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider block">{t("monthlyCashFlow")}</span>
            <span
              className={`text-2xl font-mono tracking-tight block ${isPositiveCashFlow ? 'text-emerald-400' : 'text-red-400'}`}
              data-testid="text-monthly-cf"
            >
              {formatCurrency(results.monthlyCashFlow)}
            </span>
            <span className="text-xs text-muted-foreground block font-mono">
              {formatCurrency(results.annualCashFlow)} {t("perYear")}
            </span>
          </div>

          {/* Equity */}
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider block">{t("availableEquity")}</span>
            <span className="text-2xl font-mono tracking-tight block text-foreground" data-testid="text-available-equity">
              {formatCurrency(results.availableEquity)}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={Math.min(100, results.equityStrengthPercent)} className="h-1.5 w-16" />
              <span className="text-xs text-muted-foreground font-mono">
                {formatPercent(results.equityStrengthPercent)}
              </span>
            </div>
          </div>

          <div className="col-span-2 h-px bg-border/50" />

          {/* Cash If Sold */}
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider block">{t("cashIfSoldToday")}</span>
            <span className="text-xl font-mono tracking-tight block text-foreground" data-testid="text-cash-sold">
              {formatCurrency(results.estimatedCashIfSoldToday)}
            </span>
            <span className="text-xs text-muted-foreground block font-mono text-red-400/80">
              -{formatCurrency(results.estimatedSellingCosts)} {t("costs")}
            </span>
          </div>

          {/* Efficiency & Health */}
          <div className="space-y-4 col-span-2 sm:col-span-1">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                {t("capitalEfficiency")}
              </span>
              <span className="text-lg font-mono tracking-tight block text-primary" data-testid="text-capital-efficiency">
                {formatPercent(results.capitalEfficiencyPercent)}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                {t("healthScore")}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0.5, 1.0, 1.5, 2.0].map((threshold) => (
                    <div
                      key={threshold}
                      className={`h-2 w-4 rounded-sm transition-colors ${
                        results.propertyHealthScore >= threshold
                          ? 'bg-primary'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-mono text-muted-foreground" data-testid="text-health-score">
                  {results.propertyHealthScore.toFixed(1)} / 2.0
                </span>
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
