import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AmortizationSummary, CalculationResults, PropertyData, formatCurrency } from "./calculations";
import { translations } from "./i18n";

const NAVY = [13, 22, 38] as [number, number, number];
const TEAL = [0, 190, 165] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];
const LIGHT_GRAY = [245, 247, 250] as [number, number, number];
const MID_GRAY = [160, 172, 190] as [number, number, number];
const DARK_GRAY = [55, 65, 81] as [number, number, number];
const OFF_WHITE = [248, 250, 252] as [number, number, number];

const SIGNAL_FG: Record<string, [number, number, number]> = {
  Hold:      [22, 163, 74],
  Refinance: [37, 99, 235],
  Optimize:  [202, 138, 4],
  Sell:      [220, 38, 38],
};
const SIGNAL_BG: Record<string, [number, number, number]> = {
  Hold:      [220, 252, 231],
  Refinance: [219, 234, 254],
  Optimize:  [254, 249, 195],
  Sell:      [254, 226, 226],
};
const GREEN = [22, 163, 74] as [number, number, number];
const RED   = [220, 38, 38]  as [number, number, number];

function fmt(v: number) { return `${v.toFixed(1)}%`; }
function fmtScore(v: number) { return `${v.toFixed(1)} / 2.0`; }
function compact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return formatCurrency(v);
}

const AMBER = [202, 138, 4] as [number, number, number];
const EMERALD = [5, 150, 105] as [number, number, number];
const BLUE_TEXT = [37, 99, 235] as [number, number, number];
const ROSE = [220, 38, 38] as [number, number, number];

type TFunc = (key: keyof (typeof translations)["en"], vars?: Record<string, string | number>) => string;

function getT(lang: "en" | "es"): TFunc {
  return (key, vars) => {
    const dict = translations[lang];
    let text = (dict[key] ?? translations.en[key] ?? key) as string;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }
    return text;
  };
}

function drawHeader(doc: jsPDF, subtitle: string, rightLabel: string, pdfLang: "en" | "es") {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 36, "F");
  doc.setFillColor(...TEAL);
  doc.rect(0, 34, W, 2.5, "F");

  // Logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  const logoWord = pdfLang === "es" ? "Propiedad" : "Property";
  doc.text(logoWord, 14, 17);
  const pw = doc.getTextWidth(logoWord);
  doc.setTextColor(...TEAL);
  doc.text("AI", 14 + pw + 1, 17);

  // Right side
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  const rw = doc.getTextWidth(rightLabel);
  doc.text(rightLabel, W - 14 - rw, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MID_GRAY);
  doc.text(subtitle, 14, 26);

  const date = new Date().toLocaleDateString(pdfLang === "es" ? "es-ES" : "en-US", { year: "numeric", month: "long", day: "numeric" });
  const dw = doc.getTextWidth(date);
  doc.text(date, W - 14 - dw, 26);
}

function drawFooter(doc: jsPDF, t: TFunc) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setFillColor(...NAVY);
  doc.rect(0, H - 12, W, 12, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...MID_GRAY);
  const generated = `${t("generatedBy")} \u2022 ${t("forInformationalPurposes")}`;
  doc.text(generated, 14, H - 4.5);
  const pg = String((doc as any).internal.getCurrentPageInfo().pageNumber);
  const pageText = `${t("page")} ${pg}`;
  doc.text(pageText, W - 14 - doc.getTextWidth(pageText), H - 4.5);
}

function sectionLabel(doc: jsPDF, text: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...TEAL);
  doc.text(text.toUpperCase(), 14, y);
  doc.setFillColor(...TEAL);
  doc.rect(14, y + 1, doc.internal.pageSize.getWidth() - 28, 0.4, "F");
  return y + 6;
}

function drawSignalBanner(doc: jsPDF, signal: string, description: string, y: number): number {
  const W = doc.internal.pageSize.getWidth();
  const fg = SIGNAL_FG[signal] ?? DARK_GRAY;
  const bg = SIGNAL_BG[signal] ?? LIGHT_GRAY;

  doc.setFillColor(...bg);
  doc.roundedRect(14, y, W - 28, 20, 3, 3, "F");
  doc.setDrawColor(...fg);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, W - 28, 20, 3, 3, "S");

  doc.setFillColor(...fg);
  doc.roundedRect(14, y, 38, 20, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  const sw = doc.getTextWidth(signal.toUpperCase());
  doc.text(signal.toUpperCase(), 14 + (38 - sw) / 2, y + 12.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...DARK_GRAY);
  doc.text(description, 58, y + 12.5);

  return y + 26;
}

function drawMetricsGrid(
  doc: jsPDF,
  items: { label: string; value: string; sub?: string; color?: [number, number, number] }[],
  y: number,
  cols = 2
): number {
  const W = doc.internal.pageSize.getWidth();
  const gap = 4;
  const colW = (W - 28 - (cols - 1) * gap) / cols;
  const cellH = 18;

  items.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = 14 + col * (colW + gap);
    const cy = y + row * (cellH + gap);

    doc.setFillColor(...LIGHT_GRAY);
    doc.roundedRect(cx, cy, colW, cellH, 2, 2, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...MID_GRAY);
    doc.text(item.label.toUpperCase(), cx + 5, cy + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...(item.color ?? DARK_GRAY));
    doc.text(item.value, cx + 5, cy + 13.5);

    if (item.sub) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(...MID_GRAY);
      const sw = doc.getTextWidth(item.sub);
      doc.text(item.sub, cx + colW - 5 - sw, cy + 13.5);
    }
  });

  const rows = Math.ceil(items.length / cols);
  return y + rows * (cellH + gap) + 2;
}

export function exportSinglePropertyPdf(
  propertyName: string,
  data: PropertyData,
  results: CalculationResults,
  amortization?: AmortizationSummary,
  pdfLang: "en" | "es" = "en"
) {
  const t = getT(pdfLang);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  drawHeader(doc, t("assetEvaluationReport"), propertyName, pdfLang);

  let y = 46;

  y = sectionLabel(doc, t("strategySignalSection"), y);
  const strategyDescKey: any =
    results.strategySignal === "Hold"
      ? "holdDesc"
      : results.strategySignal === "Refinance"
        ? "refinanceDesc"
        : results.strategySignal === "Optimize"
          ? "optimizeDesc"
          : "sellDesc";
  y = drawSignalBanner(doc, results.strategySignal, t(strategyDescKey), y);

  y = sectionLabel(doc, t("cashFlowSection"), y);
  y = drawMetricsGrid(doc, [
    {
      label: t("monthlyCashFlowPdf"),
      value: formatCurrency(results.monthlyCashFlow),
      sub: `${formatCurrency(results.monthlyExpenses)} ${t("totalExpensesSub")}`,
      color: results.monthlyCashFlow >= 0 ? GREEN : RED,
    },
    {
      label: t("annualCashFlowPdf"),
      value: formatCurrency(results.annualCashFlow),
      color: results.annualCashFlow >= 0 ? GREEN : RED,
    },
  ], y);

  y = sectionLabel(doc, t("equityAndExitValue"), y);
  y = drawMetricsGrid(doc, [
    {
      label: t("availableEquityPdf"),
      value: formatCurrency(results.availableEquity),
      sub: `${fmt(results.equityStrengthPercent)} ${t("equityStrengthSub")}`,
    },
    {
      label: t("cashIfSoldTodayPdf"),
      value: formatCurrency(results.estimatedCashIfSoldToday),
      sub: `-${formatCurrency(results.estimatedSellingCosts)} ${t("sellingCostsSub")}`,
    },
  ], y);

  y = sectionLabel(doc, t("performanceSection"), y);
  y = drawMetricsGrid(doc, [
    { label: t("equityStrengthPdf"), value: fmt(results.equityStrengthPercent) },
    { label: t("capitalEfficiencyPdf"), value: fmt(results.capitalEfficiencyPercent) },
    { label: t("healthScorePdf"), value: fmtScore(results.propertyHealthScore) },
  ], y, 3);

  y = sectionLabel(doc, t("propertyInputsSection"), y);

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [[t("parameter"), t("value")]],
    body: [
      [t("currentMarketValue"),     formatCurrency(data.currentValue)],
      [t("originalPurchasePrice"),  formatCurrency(data.purchasePrice)],
      [t("outstandingMortgage"),     formatCurrency(data.mortgageBalance)],
      [t("mortgageInterestRate"),   `${data.interestRate}%`],
      [t("monthlyRentalIncome"),    formatCurrency(data.rentalIncome)],
      [t("monthlyMortgagePayment"), formatCurrency(data.mortgagePayment)],
      [t("monthlyPropertyTaxPdf"),     formatCurrency(data.propertyTax)],
      [t("monthlyInsurancePdf"),        formatCurrency(data.insurance)],
      [t("monthlyMaintenancePdf"),      formatCurrency(data.maintenance)],
      [t("hoaOtherFees"),         formatCurrency(data.hoa)],
      [t("estimatedSellingCostsPdf"),  `${data.sellingCostsPercent}%`],
      [t("annualAppreciationRatePdf"), `${data.appreciationRatePercent}%`],
    ],
    styles: { fontSize: 8, cellPadding: 2.5, textColor: DARK_GRAY },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: OFF_WHITE },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
  });

  drawFooter(doc, t);

  // ── Amortization page ──────────────────────────────────────────────────────
  if (amortization && amortization.rows.length > 0) {
    doc.addPage();
    drawHeader(doc, t("mortgageAmortizationSchedule"), propertyName, pdfLang);

    let ay = 46;

    // Summary stats
    ay = sectionLabel(doc, t("amortizationSummary"), ay);

    const payoffLabel = amortization.paysOff
      ? amortization.payoffYears > 0
        ? `${amortization.payoffYears}${t("yearsShort")} ${amortization.payoffMonths}${t("monthsShort")}`
        : `${amortization.payoffMonths} ${t("monthsSuffix")}`
      : t("moreThan30Years");

    const lastRow = amortization.rows[amortization.rows.length - 1];

    ay = drawMetricsGrid(doc, [
      {
        label: t("payoffTimelinePdf"),
        value: payoffLabel,
        sub: amortization.paysOff ? t("untilMortgageFreePdf") : t("paymentTooLowPdf"),
        color: TEAL,
      },
      {
        label: t("totalInterestPaid"),
        value: compact(amortization.totalInterestPaid),
        sub: t("overLifeOfLoanPdf"),
        color: AMBER,
      },
      {
        label: t("firstMonthInterest"),
        value: formatCurrency(amortization.firstMonthInterest),
        sub: t("ofPayment", { payment: formatCurrency(data.mortgagePayment) }),
        color: ROSE,
      },
      {
        label: t("firstMonthPrincipal"),
        value: formatCurrency(amortization.firstMonthPrincipal),
        sub: t("percentOfPayment", { percent: ((amortization.firstMonthPrincipal / data.mortgagePayment) * 100).toFixed(1) }),
        color: EMERALD,
      },
      {
        label: t("totalPrincipalPaid"),
        value: compact(amortization.totalPrincipalPaid),
        color: BLUE_TEXT,
      },
      {
        label: t("equityAtPayoffPdf"),
        value: compact(lastRow.totalEquity),
        sub: t("inclAppreciationPdf"),
        color: GREEN,
      },
    ], ay, 3);

    ay = sectionLabel(doc, t("yearByYearSchedule"), ay);

    const tableRows = amortization.rows.map((r) => [
      String(r.year),
      compact(r.remainingBalance),
      compact(r.yearlyPrincipal),
      compact(r.yearlyInterest),
      compact(r.cumulativePrincipal),
      compact(r.cumulativeInterest),
      compact(r.propertyValue),
      compact(r.totalEquity),
    ]);

    autoTable(doc, {
      startY: ay,
      margin: { left: 14, right: 14 },
      head: [[t("yearShort"), t("balanceShort"), t("yrPrincipalShort"), t("yrInterestShort"), t("cumPrincipalShort"), t("cumInterestShort"), t("propValueShort"), t("totalEquityShort")]],
      body: tableRows,
      styles: { fontSize: 7, cellPadding: 2, textColor: DARK_GRAY, halign: "right" },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: "bold", fontSize: 6.5 },
      alternateRowStyles: { fillColor: OFF_WHITE },
      columnStyles: {
        0: { halign: "center", fontStyle: "bold", cellWidth: 12 },
        1: { textColor: BLUE_TEXT as [number, number, number] },
        2: { textColor: EMERALD as [number, number, number] },
        3: { textColor: AMBER as [number, number, number] },
        5: { textColor: ROSE as [number, number, number] },
        7: { textColor: GREEN as [number, number, number], fontStyle: "bold" },
      },
    });

    drawFooter(doc, t);
  }

  doc.save(`PropertyAI_${propertyName.replace(/\s+/g, "_")}_Report.pdf`);
}

export function exportComparisonPdf(
  properties: Array<{ id: string; name: string; data: PropertyData; results: CalculationResults }>,
  pdfLang: "en" | "es" = "en"
) {
  const t = getT(pdfLang);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  drawHeader(doc, t("portfolioComparisonReport"), t("propertiesCount", { count: properties.length }), pdfLang);

  const top = properties.reduce((a, b) =>
    a.results.propertyHealthScore >= b.results.propertyHealthScore ? a : b
  );

  let y = 46;

  // Best property callout
  const topLabel = t("topPerformingAsset");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK_GRAY);
  doc.text(topLabel, 14, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEAL);
  doc.text(top.name, 14 + doc.getTextWidth(topLabel), y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MID_GRAY);
  const sigKey: any =
    top.results.strategySignal === "Hold"
      ? "hold"
      : top.results.strategySignal === "Refinance"
        ? "refinance"
        : top.results.strategySignal === "Optimize"
          ? "optimize"
          : "sell";
  const topSuffix = `${t("healthScoreShort")} ${fmtScore(top.results.propertyHealthScore)} \u2022 ${t(sigKey)}`;
  doc.text(
    topSuffix,
    14 + doc.getTextWidth(topLabel + " " + top.name + " "),
    y
  );

  y += 8;

  // Numeric metric rows — find best values
  const metricDefs: { label: string; get: (r: CalculationResults) => number; fmt: (v: number) => string }[] = [
    { label: t("monthlyCashFlowPdf"),  get: r => r.monthlyCashFlow,        fmt: formatCurrency },
    { label: t("annualCashFlowPdf"),   get: r => r.annualCashFlow,         fmt: formatCurrency },
    { label: t("availableEquityPdf"),   get: r => r.availableEquity,        fmt: formatCurrency },
    { label: t("equityStrengthPdf"),    get: r => r.equityStrengthPercent,  fmt: v => fmt(v) },
    { label: t("cashIfSoldTodayPdf"), get: r => r.estimatedCashIfSoldToday, fmt: formatCurrency },
    { label: t("capitalEfficiencyPdf"), get: r => r.capitalEfficiencyPercent, fmt: v => fmt(v) },
    { label: t("healthScorePdf"),       get: r => r.propertyHealthScore,    fmt: fmtScore },
  ];

  const bestIdx: Record<string, number> = {};
  metricDefs.forEach(({ label, get }) => {
    const vals = properties.map(p => get(p.results));
    const max = Math.max(...vals);
    bestIdx[label] = vals.indexOf(max);
  });

  const tableBody: string[][] = [
    ...metricDefs.map(({ label, get, fmt: f }) =>
      [label, ...properties.map(p => f(get(p.results)))]
    ),
    [t("strategySignalPdf"),  ...properties.map(p => {
      const sk: any = p.results.strategySignal === "Hold" ? "hold" : p.results.strategySignal === "Refinance" ? "refinance" : p.results.strategySignal === "Optimize" ? "optimize" : "sell";
      return t(sk);
    })],
    [t("currentValuePdf"),    ...properties.map(p => formatCurrency(p.data.currentValue))],
    [t("purchasePricePdf"),   ...properties.map(p => formatCurrency(p.data.purchasePrice))],
    [t("mortgageBalancePdf"), ...properties.map(p => formatCurrency(p.data.mortgageBalance))],
    [t("interestRatePdf"),    ...properties.map(p => `${p.data.interestRate}%`)],
    [t("monthlyRentPdf"),     ...properties.map(p => formatCurrency(p.data.rentalIncome))],
    [t("totalExpensesPdf"),   ...properties.map(p => formatCurrency(p.results.monthlyExpenses))],
  ];

  const cashFlowRowLabel = t("monthlyCashFlowPdf");
  const annualCashFlowRowLabel = t("annualCashFlowPdf");
  const strategySignalRowLabel = t("strategySignalPdf");

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [[t("metricPdf"), ...properties.map(p => p.name)]],
    body: tableBody,
    styles: { fontSize: 8, cellPadding: 2.5, textColor: DARK_GRAY },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: OFF_WHITE },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 44 } },
    didParseCell(data) {
      if (data.section !== "body") return;
      const rawRow = data.row.raw as string[];
      const rowLabel = String(rawRow[0]);
      const colIdx = data.column.index - 1;
      if (colIdx < 0) return;

      const cashFlowRows = [cashFlowRowLabel, annualCashFlowRowLabel];
      if (cashFlowRows.includes(rowLabel)) {
        const p = properties[colIdx];
        if (p) {
          const val = rowLabel === cashFlowRowLabel
            ? p.results.monthlyCashFlow
            : p.results.annualCashFlow;
          data.cell.styles.textColor = val >= 0 ? GREEN : RED;
        }
      }

      if (metricDefs.some(m => m.label === rowLabel)) {
        if (bestIdx[rowLabel] === colIdx && properties.length > 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = GREEN;
        }
      }

      if (rowLabel === strategySignalRowLabel) {
        const sig = properties[colIdx]?.results.strategySignal;
        if (sig && SIGNAL_FG[sig]) data.cell.styles.textColor = SIGNAL_FG[sig];
      }
    },
  });

  drawFooter(doc, t);
  doc.save(`PropertyAI_Portfolio_Comparison_${properties.length}_Properties.pdf`);
}
