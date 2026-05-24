import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Lang = "en" | "es";

const STORAGE_KEY = "propertyai_language";

export const translations = {
  en: {
    // Navigation
    analyze: "Analyze",
    compare: "Compare",
    signIn: "Sign in",
    createAccount: "Create account",
    signOut: "Sign out",

    // Analyze page
    assetEvaluation: "Asset Evaluation",
    enterPropertyParameters: "Enter your property parameters to generate an instant strategic analysis.",
    propertyName: "Property Name",
    exportPdf: "Export PDF",
    addProperty: "Add Property",
    deleteProperty: "Delete property",
    maxPropertiesReached: "Max 3 saved properties reached",
    slotLocked: "Slot 2",
    createAccountToSave: "Create a free account to save properties",

    // Form sections
    valuation: "Valuation",
    incomeAndExpenses: "Income & Expenses",
    assumptions: "Assumptions",

    // Form labels
    currentValue: "Current Value",
    originalPrice: "Original Price",
    purchasePrice: "Purchase Price",
    mortgageBalance: "Mortgage Balance",
    interestRate: "Interest Rate",
    monthlyRent: "Monthly Rent",
    monthlyPrincipalInterest: "Monthly Principal & Interest",
    mortgagePayment: "Mortgage Payment",
    monthlyPropertyTax: "Monthly Property Tax",
    propertyTax: "Property Tax",
    monthlyInsurance: "Monthly Insurance",
    insurance: "Insurance",
    monthlyMaintenance: "Monthly Maintenance",
    maintenance: "Maintenance",
    monthlyHoaOther: "Monthly HOA / Other",
    hoaOther: "HOA / Other",
    sellingCostsPercent: "Selling Costs %",
    appreciationRatePercent: "Appreciation %",

    // Results
    terminalOutput: "Terminal Output",
    recommendedAction: "Recommended Action",
    monthlyCashFlow: "Monthly Cash Flow",
    availableEquity: "Available Equity",
    cashIfSoldToday: "Cash If Sold Today",
    capitalEfficiency: "Capital Efficiency",
    healthScore: "Health Score",
    strategySignal: "Strategy Signal",
    perYear: "/yr",
    costs: "costs",

    // Strategy signals
    hold: "Hold",
    refinance: "Refinance",
    optimize: "Optimize",
    sell: "Sell",

    // Strategy descriptions
    holdDesc: "Strong performing asset. Continue collecting cash flow and riding appreciation.",
    refinanceDesc: "High trapped equity. Consider cash-out refi or line of credit to redeploy capital.",
    optimizeDesc: "Asset is underperforming. Raise rents or cut expenses to return to positive cash flow.",
    sellDesc: "Dead equity or severe negative cash flow. Capital is better deployed elsewhere.",

    // Amortization
    amortizationSchedule: "Amortization Schedule",
    payoffTimeline: "Payoff Timeline",
    totalInterest: "Total Interest",
    firstPaymentSplit: "First Payment Split",
    equityAtPayoff: "Equity at Payoff",
    untilMortgageFree: "until mortgage free",
    paymentTooLow: "payment too low",
    overLifeOfLoan: "over life of loan",
    interest: "interest",
    principal: "principal",
    inclAppreciation: "incl. appreciation",
    year: "Year",
    balance: "Balance",
    yearlyPrincipal: "Yearly Principal",
    yearlyInterest: "Yearly Interest",
    cumulativeInterest: "Cumulative Interest",
    propertyValue: "Property Value",
    totalEquity: "Total Equity",
    showingFirst10: "Showing first 10 of {count} years \u2014 full data visible in chart",
    enterValidMortgage: "Enter a valid mortgage balance, payment, and interest rate to see the amortization schedule.",
    paidOff: "Paid off",

    // Amortization chart labels
    remainingBalance: "Remaining Balance",
    equityPaydown: "Equity (Paydown)",
    equityAppreciation: "Equity (Appreciation)",
    totalEquityLabel: "Total Equity",
    paydownEquity: "Paydown Equity",
    marketEquity: "Market Equity",
    yearlyInterestLabel: "Yearly Interest",
    yearlyPrincipalLabel: "Yearly Principal",
    cumulativeInterestLabel: "Cumulative Interest",
    balanceEquity: "Balance & Equity",
    equityBuild: "Equity Build",
    interestVsPrincipal: "Interest vs Principal",

    // Break-even
    breakEvenRentCalculator: "Break-Even Rent Calculator",
    breakEvenRent: "Break-Even Rent",
    totalMonthlyExpenses: "total monthly expenses",
    cashFlow: "Cash Flow",
    aboveBreakEven: "above break-even",
    belowBreakEven: "below break-even",
    maxAffordableRate: "Max Affordable Rate",
    bufferAboveCurrent: "% buffer above current",
    currentRateExceeds: "Current rate exceeds limit",
    allRatesPositive: "cash flow positive at all rates",
    vacancyStressTest: "Vacancy Stress Test",
    fullyOccupied: "0% (fully occupied)",
    oneInFiveVacant: "20% (1 in 5 months vacant)",
    effectiveRent: "Effective rent",
    lostToVacancy: "/mo lost to vacancy",
    breakEvenRentVsRate: "Break-Even Rent vs. Interest Rate",
    rent: "Rent",
    net: "Net",
    current: "current",
    max: "Max",
    rateScenarios: "Rate Scenarios",
    rate: "Rate",
    breakEvenRentLabel: "Break-Even Rent",
    status: "Status",
    profitable: "Profitable",
    negative: "Negative",

    // Compare
    portfolioComparison: "Portfolio Comparison",
    compareDescription: "Evaluate up to 4 properties side by side. Best values are highlighted automatically.",
    compareDemoDescription: "Compare 2 sample properties. Sign up to add up to 4 and save your portfolio.",
    sideBySideAnalysis: "Side-by-Side Analysis",
    best: "Best",
    top: "TOP",
    metric: "Metric",
    copyFromAnalyze: "Copy values from Analyze property",
    fullVersion: "Full version",

    // Auth
    welcomeBack: "Welcome back",
    getStarted: "Get started",
    signInToAccess: "Sign in to access your property portfolio.",
    createToStart: "Create an account to start analysing properties.",
    checkYourEmail: "Check your email",
    confirmationLinkSent: "We sent a confirmation link to {email}. Click it to activate your account, then sign in.",
    backToSignIn: "Back to Sign In",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    noAccount: "No account?",
    createOne: "Create one",
    alreadyHaveAccount: "Already have an account?",
    continueWithGoogle: "Continue with Google",
    tryDemo: "Try Demo \u2014 no account needed",

    // Validation / Errors
    emailPasswordRequired: "Email and password are required.",
    passwordsDoNotMatch: "Passwords do not match.",
    passwordMinLength: "Password must be at least 6 characters.",
    databaseError: "Database error",

    // Demo
    demoMode: "Demo mode",
    demoBanner: "sample data loaded, edits are local only, and compare is limited to 2 properties.",
    demoBannerCta: "to save your portfolio and unlock the full version.",
    demoExportNote: "full branded PDFs with your logo and custom header are available on a full account.",

    // Setup
    setupRequired: "One-time database setup required",
    setupDescription: "To persist your portfolio across sessions, run the following SQL once in your Supabase dashboard \u2192 SQL Editor \u2192 New query, then refresh this page.",
    sqlFileLocation: "The full SQL is in",

    // Misc
    saving: "Saving\u2026",
    saved: "Saved",
    saveFailed: "Save failed",
    untitled: "Untitled",
    english: "English",
    spanish: "Spanish",
    dismissDemoBanner: "Dismiss demo banner",

    // Default property names
    myProperty: "My Property",
    propertyA: "Property A",
    propertyB: "Property B",
    propertyC: "Property C",
    propertyD: "Property D",

    // PDF labels
    assetEvaluationReport: "Asset Evaluation Report",
    portfolioComparisonReport: "Portfolio Comparison Report",
    strategySignalSection: "Strategy Signal",
    cashFlowSection: "Cash Flow",
    equityAndExitValue: "Equity & Exit Value",
    performanceSection: "Performance",
    propertyInputsSection: "Property Inputs",
    parameter: "Parameter",
    value: "Value",
    currentMarketValue: "Current Market Value",
    originalPurchasePrice: "Original Purchase Price",
    outstandingMortgage: "Outstanding Mortgage",
    mortgageInterestRate: "Mortgage Interest Rate",
    monthlyRentalIncome: "Monthly Rental Income",
    monthlyMortgagePayment: "Monthly Mortgage Payment",
    monthlyPropertyTaxPdf: "Monthly Property Tax",
    monthlyInsurancePdf: "Monthly Insurance",
    monthlyMaintenancePdf: "Monthly Maintenance",
    hoaOtherFees: "HOA / Other Fees",
    estimatedSellingCostsPdf: "Estimated Selling Costs",
    annualAppreciationRatePdf: "Annual Appreciation Rate",
    mortgageAmortizationSchedule: "Mortgage Amortization Schedule",
    amortizationSummary: "Amortization Summary",
    payoffTimelinePdf: "Payoff Timeline",
    totalInterestPaid: "Total Interest Paid",
    firstMonthInterest: "1st Month: Interest",
    firstMonthPrincipal: "1st Month: Principal",
    ofPayment: "of {payment} payment",
    totalPrincipalPaid: "Total Principal Paid",
    equityAtPayoffPdf: "Equity at Payoff",
    yearByYearSchedule: "Year-by-Year Schedule",
    yearShort: "Year",
    balanceShort: "Balance",
    yrPrincipalShort: "Yr Principal",
    yrInterestShort: "Yr Interest",
    cumPrincipalShort: "Cum. Principal",
    cumInterestShort: "Cum. Interest",
    propValueShort: "Prop. Value",
    totalEquityShort: "Total Equity",
    topPerformingAsset: "Top performing asset:",
    healthScoreShort: "Health Score",
    metricPdf: "Metric",
    monthlyCashFlowPdf: "Monthly Cash Flow",
    annualCashFlowPdf: "Annual Cash Flow",
    availableEquityPdf: "Available Equity",
    equityStrengthPdf: "Equity Strength",
    cashIfSoldTodayPdf: "Cash If Sold Today",
    capitalEfficiencyPdf: "Capital Efficiency",
    healthScorePdf: "Health Score",
    strategySignalPdf: "Strategy Signal",
    currentValuePdf: "Current Value",
    purchasePricePdf: "Purchase Price",
    mortgageBalancePdf: "Mortgage Balance",
    interestRatePdf: "Interest Rate",
    monthlyRentPdf: "Monthly Rent",
    totalExpensesPdf: "Total Expenses",
    generatedBy: "Generated by PropertyAI",
    forInformationalPurposes: "For informational purposes only. Not financial advice.",
    page: "Page",
    totalExpensesSub: "total expenses",
    equityStrengthSub: "equity strength",
    sellingCostsSub: "selling costs",
    untilMortgageFreePdf: "until mortgage-free",
    paymentTooLowPdf: "payment too low",
    overLifeOfLoanPdf: "over life of loan",
    inclAppreciationPdf: "incl. appreciation",
    percentOfPayment: "{percent}% of payment",
    yearsShort: "y",
    monthsShort: "m",
    monthsSuffix: " months",
    yearsSuffix: " years",
    moreThan30Years: "> 30 years",
    propertiesCount: "{count} Properties",
  },
  es: {
    // Navigation
    analyze: "Analizar",
    compare: "Comparar",
    signIn: "Iniciar sesi\u00f3n",
    createAccount: "Crear cuenta",
    signOut: "Cerrar sesi\u00f3n",

    // Analyze page
    assetEvaluation: "Evaluaci\u00f3n del activo",
    enterPropertyParameters: "Introduce los datos de la propiedad para generar un an\u00e1lisis estrat\u00e9gico instant\u00e1neo.",
    propertyName: "Nombre de la propiedad",
    exportPdf: "Exportar PDF",
    addProperty: "A\u00f1adir propiedad",
    deleteProperty: "Eliminar propiedad",
    maxPropertiesReached: "M\u00e1ximo de 3 propiedades guardadas alcanzado",
    slotLocked: "Espacio 2",
    createAccountToSave: "Crea una cuenta gratuita para guardar propiedades",

    // Form sections
    valuation: "Valoraci\u00f3n",
    incomeAndExpenses: "Ingresos y gastos",
    assumptions: "Supuestos",

    // Form labels
    currentValue: "Valor actual",
    originalPrice: "Precio original",
    purchasePrice: "Precio de compra",
    mortgageBalance: "Saldo hipotecario",
    interestRate: "Tipo de inter\u00e9s",
    monthlyRent: "Renta mensual",
    monthlyPrincipalInterest: "Principal e intereses mensuales",
    mortgagePayment: "Pago hipotecario",
    monthlyPropertyTax: "Impuesto mensual sobre la propiedad",
    propertyTax: "Impuesto sobre la propiedad",
    monthlyInsurance: "Seguro mensual",
    insurance: "Seguro",
    monthlyMaintenance: "Mantenimiento mensual",
    maintenance: "Mantenimiento",
    monthlyHoaOther: "HOA / otros mensual",
    hoaOther: "HOA / otros",
    sellingCostsPercent: "Costes de venta %",
    appreciationRatePercent: "Revalorizaci\u00f3n %",

    // Results
    terminalOutput: "Resultado del an\u00e1lisis",
    recommendedAction: "Acci\u00f3n recomendada",
    monthlyCashFlow: "Flujo de caja mensual",
    availableEquity: "Equity disponible",
    cashIfSoldToday: "Efectivo si se vende hoy",
    capitalEfficiency: "Eficiencia del capital",
    healthScore: "Puntuaci\u00f3n del activo",
    strategySignal: "Se\u00f1al estrat\u00e9gica",
    perYear: "/a\u00f1o",
    costs: "costes",

    // Strategy signals
    hold: "Mantener",
    refinance: "Refinanciar",
    optimize: "Optimizar",
    sell: "Vender",

    // Strategy descriptions
    holdDesc: "Activo de alto rendimiento. Sigue generando flujo de caja y benefici\u00e1ndote de la apreciaci\u00f3n.",
    refinanceDesc: "Mucho equity atrapado. Considera refinanciar o una l\u00ednea de cr\u00e9dito para redistribuir el capital.",
    optimizeDesc: "El activo est\u00e1 subrendiendo. Aumenta las rentas o reduce gastos para volver a flujo positivo.",
    sellDesc: "Equity muerto o flujo negativo severo. El capital rinde mejor en otro lugar.",

    // Amortization
    amortizationSchedule: "Tabla de amortizaci\u00f3n",
    payoffTimeline: "Plazo de amortizaci\u00f3n",
    totalInterest: "Intereses totales",
    firstPaymentSplit: "Desglose del primer pago",
    equityAtPayoff: "Equity al finalizar el pr\u00e9stamo",
    untilMortgageFree: "hasta liberar hipoteca",
    paymentTooLow: "pago insuficiente",
    overLifeOfLoan: "a lo largo del pr\u00e9stamo",
    interest: "inter\u00e9s",
    principal: "principal",
    inclAppreciation: "incl. apreciaci\u00f3n",
    year: "A\u00f1o",
    balance: "Saldo",
    yearlyPrincipal: "Principal anual",
    yearlyInterest: "Inter\u00e9s anual",
    cumulativeInterest: "Inter\u00e9s acumulado",
    propertyValue: "Valor de la propiedad",
    totalEquity: "Equity total",
    showingFirst10: "Mostrando los primeros 10 de {count} a\u00f1os \u2014 datos completos en el gr\u00e1fico",
    enterValidMortgage: "Introduce un saldo, pago y tipo de inter\u00e9s v\u00e1lidos para ver la tabla de amortizaci\u00f3n.",
    paidOff: "Pagado",

    // Amortization chart labels
    remainingBalance: "Saldo restante",
    equityPaydown: "Equity (Amortizaci\u00f3n)",
    equityAppreciation: "Equity (Apreciaci\u00f3n)",
    totalEquityLabel: "Equity total",
    paydownEquity: "Equity amortizado",
    marketEquity: "Equity de mercado",
    yearlyInterestLabel: "Inter\u00e9s anual",
    yearlyPrincipalLabel: "Principal anual",
    cumulativeInterestLabel: "Inter\u00e9s acumulado",
    balanceEquity: "Saldo y equity",
    equityBuild: "Acumulaci\u00f3n de equity",
    interestVsPrincipal: "Inter\u00e9s vs Principal",

    // Break-even
    breakEvenRentCalculator: "Calculadora de renta de equilibrio",
    breakEvenRent: "Renta de equilibrio",
    totalMonthlyExpenses: "gastos mensuales totales",
    cashFlow: "Flujo de caja",
    aboveBreakEven: "por encima del equilibrio",
    belowBreakEven: "por debajo del equilibrio",
    maxAffordableRate: "Tipo m\u00e1ximo asequible",
    bufferAboveCurrent: "% margen sobre el actual",
    currentRateExceeds: "El tipo actual supera el l\u00edmite",
    allRatesPositive: "flujo positivo a todos los tipos",
    vacancyStressTest: "Prueba de vacancia",
    fullyOccupied: "0% (totalmente ocupado)",
    oneInFiveVacant: "20% (1 de 5 meses vac\u00edo)",
    effectiveRent: "Renta efectiva",
    lostToVacancy: "/mes perdido por vacancia",
    breakEvenRentVsRate: "Renta de equilibrio vs. Tipo de inter\u00e9s",
    rent: "Renta",
    net: "Neto",
    current: "actual",
    max: "M\u00e1x",
    rateScenarios: "Escenarios de tipos",
    rate: "Tipo",
    breakEvenRentLabel: "Renta equilibrio",
    status: "Estado",
    profitable: "Rentable",
    negative: "Negativo",

    // Compare
    portfolioComparison: "Comparaci\u00f3n de cartera",
    compareDescription: "Compara hasta 4 propiedades lado a lado. Los mejores valores se resaltan autom\u00e1ticamente.",
    compareDemoDescription: "Compara 2 propiedades de muestra. Reg\u00edstrate para a\u00f1adir hasta 4 y guardar tu cartera.",
    sideBySideAnalysis: "An\u00e1lisis comparativo",
    best: "Mejor",
    top: "TOP",
    metric: "M\u00e9trica",
    copyFromAnalyze: "Copiar valores desde la propiedad analizada",
    fullVersion: "Versi\u00f3n completa",

    // Auth
    welcomeBack: "Bienvenido de nuevo",
    getStarted: "Empezar",
    signInToAccess: "Inicia sesi\u00f3n para acceder a tu cartera de propiedades.",
    createToStart: "Crea una cuenta para empezar a analizar propiedades.",
    checkYourEmail: "Revisa tu correo",
    confirmationLinkSent: "Enviamos un enlace de confirmaci\u00f3n a {email}. Haz clic para activar tu cuenta, luego inicia sesi\u00f3n.",
    backToSignIn: "Volver a iniciar sesi\u00f3n",
    email: "Correo electr\u00f3nico",
    password: "Contrase\u00f1a",
    confirmPassword: "Confirmar contrase\u00f1a",
    noAccount: "\u00bfNo tienes cuenta?",
    createOne: "Crear una",
    alreadyHaveAccount: "\u00bfYa tienes una cuenta?",
    continueWithGoogle: "Continuar con Google",
    tryDemo: "Probar demo \u2014 sin cuenta",

    // Validation / Errors
    emailPasswordRequired: "El correo y la contrase\u00f1a son obligatorios.",
    passwordsDoNotMatch: "Las contrase\u00f1as no coinciden.",
    passwordMinLength: "La contrase\u00f1a debe tener al menos 6 caracteres.",
    databaseError: "Error de base de datos",

    // Demo
    demoMode: "Modo demo",
    demoBanner: "datos de muestra cargados, las ediciones son solo locales, y la comparaci\u00f3n est\u00e1 limitada a 2 propiedades.",
    demoBannerCta: "para guardar tu cartera y desbloquear la versi\u00f3n completa.",
    demoExportNote: "PDFs con marca personalizada y encabezado personalizado disponibles con una cuenta completa.",

    // Setup
    setupRequired: "Configuraci\u00f3n inicial de base de datos requerida",
    setupDescription: "Para persistir tu cartera entre sesiones, ejecuta el siguiente SQL una vez en tu panel de Supabase \u2192 Editor SQL \u2192 Nueva consulta, luego refresca esta p\u00e1gina.",
    sqlFileLocation: "El SQL completo est\u00e1 en",

    // Misc
    saving: "Guardando\u2026",
    saved: "Guardado",
    saveFailed: "Error al guardar",
    untitled: "Sin t\u00edtulo",
    english: "Ingl\u00e9s",
    spanish: "Espa\u00f1ol",
    dismissDemoBanner: "Cerrar aviso de demo",

    // Default property names
    myProperty: "Mi Propiedad",
    propertyA: "Propiedad A",
    propertyB: "Propiedad B",
    propertyC: "Propiedad C",
    propertyD: "Propiedad D",

    // PDF labels
    assetEvaluationReport: "Informe de Evaluaci\u00f3n del Activo",
    portfolioComparisonReport: "Informe de Comparaci\u00f3n de Cartera",
    strategySignalSection: "Se\u00f1al Estrat\u00e9gica",
    cashFlowSection: "Flujo de Caja",
    equityAndExitValue: "Equity y Valor de Salida",
    performanceSection: "Rendimiento",
    propertyInputsSection: "Datos de la Propiedad",
    parameter: "Par\u00e1metro",
    value: "Valor",
    currentMarketValue: "Valor de Mercado Actual",
    originalPurchasePrice: "Precio de Compra Original",
    outstandingMortgage: "Hipoteca Pendiente",
    mortgageInterestRate: "Tipo de Inter\u00e9s Hipotecario",
    monthlyRentalIncome: "Ingresos por Alquiler Mensual",
    monthlyMortgagePayment: "Pago Hipotecario Mensual",
    monthlyPropertyTaxPdf: "Impuesto sobre la Propiedad Mensual",
    monthlyInsurancePdf: "Seguro Mensual",
    monthlyMaintenancePdf: "Mantenimiento Mensual",
    hoaOtherFees: "HOA / Otros Gastos",
    estimatedSellingCostsPdf: "Costes de Venta Estimados",
    annualAppreciationRatePdf: "Tasa de Revalorizaci\u00f3n Anual",
    mortgageAmortizationSchedule: "Tabla de Amortizaci\u00f3n Hipotecaria",
    amortizationSummary: "Resumen de Amortizaci\u00f3n",
    payoffTimelinePdf: "Plazo de Amortizaci\u00f3n",
    totalInterestPaid: "Intereses Totales Pagados",
    firstMonthInterest: "1er Mes: Inter\u00e9s",
    firstMonthPrincipal: "1er Mes: Principal",
    ofPayment: "del pago de {payment}",
    totalPrincipalPaid: "Principal Total Pagado",
    equityAtPayoffPdf: "Equity al Finalizar",
    yearByYearSchedule: "Desglose A\u00f1o por A\u00f1o",
    yearShort: "A\u00f1o",
    balanceShort: "Saldo",
    yrPrincipalShort: "Principal A\u00f1o",
    yrInterestShort: "Inter\u00e9s A\u00f1o",
    cumPrincipalShort: "Principal Acum.",
    cumInterestShort: "Inter\u00e9s Acum.",
    propValueShort: "Valor Prop.",
    totalEquityShort: "Equity Total",
    topPerformingAsset: "Activo m\u00e1s rentable:",
    healthScoreShort: "Puntuaci\u00f3n",
    metricPdf: "M\u00e9trica",
    monthlyCashFlowPdf: "Flujo de Caja Mensual",
    annualCashFlowPdf: "Flujo de Caja Anual",
    availableEquityPdf: "Equity Disponible",
    equityStrengthPdf: "Fuerza del Equity",
    cashIfSoldTodayPdf: "Efectivo si se Vende Hoy",
    capitalEfficiencyPdf: "Eficiencia del Capital",
    healthScorePdf: "Puntuaci\u00f3n del Activo",
    strategySignalPdf: "Se\u00f1al Estrat\u00e9gica",
    currentValuePdf: "Valor Actual",
    purchasePricePdf: "Precio de Compra",
    mortgageBalancePdf: "Saldo Hipotecario",
    interestRatePdf: "Tipo de Inter\u00e9s",
    monthlyRentPdf: "Renta Mensual",
    totalExpensesPdf: "Gastos Totales",
    generatedBy: "Generado por PropertyAI",
    forInformationalPurposes: "Solo para fines informativos. No es asesoramiento financiero.",
    page: "P\u00e1gina",
    totalExpensesSub: "gastos totales",
    equityStrengthSub: "fuerza del equity",
    sellingCostsSub: "costes de venta",
    untilMortgageFreePdf: "hasta liberar hipoteca",
    paymentTooLowPdf: "pago insuficiente",
    overLifeOfLoanPdf: "a lo largo del pr\u00e9stamo",
    inclAppreciationPdf: "incl. apreciaci\u00f3n",
    percentOfPayment: "{percent}% del pago",
    yearsShort: "a",
    monthsShort: "m",
    monthsSuffix: " meses",
    yearsSuffix: " años",
    moreThan30Years: "> 30 años",
    propertiesCount: "{count} Propiedades",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "es") return "es";
  } catch {
    // localStorage unavailable
  }
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dict = translations[lang];
      let text = (dict[key] ?? translations.en[key] ?? key) as string;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        });
      }
      return text;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
