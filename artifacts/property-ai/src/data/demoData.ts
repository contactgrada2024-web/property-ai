import { PropertyData } from "@/lib/calculations";

export interface DemoEntry {
  id: string;
  name: string;
  data: PropertyData;
}

export const DEMO_ANALYZE_NAME = "123 Maple Street";

export const DEMO_ANALYZE_DATA: PropertyData = {
  currentValue: 345000,
  purchasePrice: 320000,
  mortgageBalance: 248000,
  interestRate: 6.75,
  rentalIncome: 2200,
  mortgagePayment: 1658,
  propertyTax: 280,
  insurance: 120,
  maintenance: 180,
  hoa: 0,
  sellingCostsPercent: 6,
  appreciationRatePercent: 3,
};

export const DEMO_COMPARE_PROPERTIES: DemoEntry[] = [
  {
    id: "demo-a",
    name: "123 Maple Street",
    data: { ...DEMO_ANALYZE_DATA },
  },
  {
    id: "demo-b",
    name: "456 Oak Avenue",
    data: {
      currentValue: 510000,
      purchasePrice: 485000,
      mortgageBalance: 358000,
      interestRate: 6.5,
      rentalIncome: 3100,
      mortgagePayment: 2430,
      propertyTax: 420,
      insurance: 165,
      maintenance: 290,
      hoa: 180,
      sellingCostsPercent: 6,
      appreciationRatePercent: 4,
    },
  },
];
