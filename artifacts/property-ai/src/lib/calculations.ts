import { z } from "zod";

export const propertySchema = z.object({
  currentValue: z.coerce.number().min(0, "Must be >= 0"),
  purchasePrice: z.coerce.number().min(0, "Must be >= 0"),
  mortgageBalance: z.coerce.number().min(0, "Must be >= 0"),
  interestRate: z.coerce.number().min(0, "Must be >= 0").max(30, "Max 30%"),
  rentalIncome: z.coerce.number().min(0, "Must be >= 0"),
  mortgagePayment: z.coerce.number().min(0, "Must be >= 0"),
  propertyTax: z.coerce.number().min(0, "Must be >= 0"),
  insurance: z.coerce.number().min(0, "Must be >= 0"),
  maintenance: z.coerce.number().min(0, "Must be >= 0"),
  hoa: z.coerce.number().min(0, "Must be >= 0"),
  sellingCostsPercent: z.coerce.number().min(0).max(100, "Between 0 and 100"),
  appreciationRatePercent: z.coerce.number().min(0).max(100, "Between 0 and 100"),
});

export type PropertyData = z.infer<typeof propertySchema>;

export const defaultPropertyData: PropertyData = {
  currentValue: 400000,
  purchasePrice: 300000,
  mortgageBalance: 200000,
  interestRate: 6.5,
  rentalIncome: 2800,
  mortgagePayment: 1400,
  propertyTax: 400,
  insurance: 150,
  maintenance: 200,
  hoa: 0,
  sellingCostsPercent: 6,
  appreciationRatePercent: 3,
};

export type CalculationResults = {
  monthlyExpenses: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  availableEquity: number;
  estimatedSellingCosts: number;
  estimatedCashIfSoldToday: number;
  equityStrengthPercent: number;
  capitalEfficiencyPercent: number;
  propertyHealthScore: number;
  strategySignal: "Hold" | "Refinance" | "Optimize" | "Sell";
  strategyDescription: string;
};

export function calculatePropertyMetrics(data: PropertyData): CalculationResults {
  const monthlyExpenses = data.mortgagePayment + data.propertyTax + data.insurance + data.maintenance + data.hoa;
  const monthlyCashFlow = data.rentalIncome - monthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;

  const availableEquity = Math.max(0, data.currentValue - data.mortgageBalance);
  const estimatedSellingCosts = data.currentValue * (data.sellingCostsPercent / 100);
  const estimatedCashIfSoldToday = data.currentValue - data.mortgageBalance - estimatedSellingCosts;

  const equityStrengthPercent = data.currentValue > 0 ? (availableEquity / data.currentValue) * 100 : 0;
  const capitalEfficiencyPercent = data.purchasePrice > 0 ? (annualCashFlow / data.purchasePrice) * 100 : 0;

  let propertyHealthScore = 0;
  if (monthlyCashFlow > 0) propertyHealthScore += 1.0;
  if (equityStrengthPercent > 30) propertyHealthScore += 0.5;
  if (capitalEfficiencyPercent > 5) propertyHealthScore += 0.5;

  let strategySignal: "Hold" | "Refinance" | "Optimize" | "Sell";
  let strategyDescription = "";

  if (propertyHealthScore >= 1.5 && monthlyCashFlow > 0) {
    strategySignal = "Hold";
    strategyDescription = "Strong performing asset. Continue collecting cash flow and riding appreciation.";
  } else if (propertyHealthScore >= 1.0 && equityStrengthPercent > 40) {
    strategySignal = "Refinance";
    strategyDescription = "High trapped equity. Consider cash-out refi or line of credit to redeploy capital.";
  } else if (propertyHealthScore >= 0.5 && monthlyCashFlow < 0) {
    strategySignal = "Optimize";
    strategyDescription = "Asset is underperforming. Raise rents or cut expenses to return to positive cash flow.";
  } else {
    strategySignal = "Sell";
    strategyDescription = "Dead equity or severe negative cash flow. Capital is better deployed elsewhere.";
  }

  return {
    monthlyExpenses,
    monthlyCashFlow,
    annualCashFlow,
    availableEquity,
    estimatedSellingCosts,
    estimatedCashIfSoldToday,
    equityStrengthPercent,
    capitalEfficiencyPercent,
    propertyHealthScore,
    strategySignal,
    strategyDescription,
  };
}

// ─── Amortization ──────────────────────────────────────────────────────────────

export type AmortizationRow = {
  year: number;
  remainingBalance: number;
  equityFromPaydown: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
  yearlyInterest: number;
  yearlyPrincipal: number;
  /** Property value with appreciation applied */
  propertyValue: number;
  /** Total equity = market equity + paydown equity */
  totalEquity: number;
};

export type AmortizationSummary = {
  rows: AmortizationRow[];
  payoffYears: number;
  payoffMonths: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  /** Monthly interest in the first payment */
  firstMonthInterest: number;
  /** Monthly principal in the first payment */
  firstMonthPrincipal: number;
  /** Whether the loan pays off within 30 years at the given payment */
  paysOff: boolean;
};

export function generateAmortization(data: PropertyData): AmortizationSummary {
  const { mortgageBalance, mortgagePayment, interestRate, currentValue, appreciationRatePercent } = data;

  if (mortgageBalance <= 0 || mortgagePayment <= 0 || interestRate <= 0) {
    return {
      rows: [],
      payoffYears: 0,
      payoffMonths: 0,
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      firstMonthInterest: 0,
      firstMonthPrincipal: mortgagePayment,
      paysOff: true,
    };
  }

  const monthlyRate = interestRate / 100 / 12;
  const annualAppreciationRate = appreciationRatePercent / 100;

  // If payment doesn't even cover first month's interest, bail out
  const firstInterest = mortgageBalance * monthlyRate;
  const firstPrincipal = mortgagePayment - firstInterest;
  if (firstPrincipal <= 0) {
    return {
      rows: [],
      payoffYears: 0,
      payoffMonths: 0,
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      firstMonthInterest: firstInterest,
      firstMonthPrincipal: 0,
      paysOff: false,
    };
  }

  let remaining = mortgageBalance;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  let totalMonths = 0;
  const rows: AmortizationRow[] = [];

  for (let year = 1; year <= 30 && remaining > 0.01; year++) {
    let yearInterest = 0;
    let yearPrincipal = 0;

    for (let m = 0; m < 12 && remaining > 0.01; m++) {
      const interest = remaining * monthlyRate;
      const principal = Math.min(mortgagePayment - interest, remaining);
      if (principal <= 0) break;
      remaining = Math.max(0, remaining - principal);
      yearInterest += interest;
      yearPrincipal += principal;
      totalMonths++;
    }

    cumulativeInterest += yearInterest;
    cumulativePrincipal += yearPrincipal;

    const propertyValue = currentValue * Math.pow(1 + annualAppreciationRate, year);
    const marketEquityGain = propertyValue - currentValue;
    const totalEquity = cumulativePrincipal + marketEquityGain;

    rows.push({
      year,
      remainingBalance: Math.max(0, remaining),
      equityFromPaydown: cumulativePrincipal,
      cumulativePrincipal,
      cumulativeInterest,
      yearlyInterest: yearInterest,
      yearlyPrincipal: yearPrincipal,
      propertyValue,
      totalEquity,
    });

    if (remaining <= 0.01) break;
  }

  const paysOff = remaining <= 0.01;

  return {
    rows,
    payoffYears: Math.floor(totalMonths / 12),
    payoffMonths: totalMonths % 12,
    totalInterestPaid: cumulativeInterest,
    totalPrincipalPaid: cumulativePrincipal,
    firstMonthInterest: firstInterest,
    firstMonthPrincipal: firstPrincipal,
    paysOff,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
