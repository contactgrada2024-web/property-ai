import { z } from "zod";

export const propertySchema = z.object({
  currentValue: z.coerce.number().min(0, "Must be >= 0"),
  purchasePrice: z.coerce.number().min(0, "Must be >= 0"),
  mortgageBalance: z.coerce.number().min(0, "Must be >= 0"),
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
    strategyDescription
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
