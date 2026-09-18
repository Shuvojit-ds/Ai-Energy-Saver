export type Season = "Summer" | "Monsoon" | "Autumn" | "Winter" | "Spring";

export type MonthName =
  | "January"
  | "February"
  | "March"
  | "April"
  | "May"
  | "June"
  | "July"
  | "August"
  | "September"
  | "October"
  | "November"
  | "December";

export interface Appliance {
  id: string;
  name: string;
  category: "Climate Control" | "Cooling/Ventilation" | "Refrigeration" | "Computing & Media" | "Lighting" | "Water Heating" | "Kitchen & Laundry" | "Other";
  wattage: number; // in Watts
  usageHoursDaily: number; // hours per day
  timePeriod: "Morning" | "Afternoon" | "Peak Evening (6-10 PM)" | "Night (10 PM-6 AM)" | "All Day (24h)" | "Flexible";
  activeSeasons: Season[]; // which seasons this device is active in
  isActiveManual: boolean; // manual toggle (user active/deactive)
  isUserAdded?: boolean; // created by user
  efficiencyTip: string;
  savingPotentialPct: number; // e.g. 25 = 25% savings possible
  iconName?: string;
}

export type ApplianceStatus = "active" | "user_deactivated" | "seasonal_off";

export interface ApplianceCalculation {
  appliance: Appliance;
  isSeasonallyActive: boolean;
  status: ApplianceStatus;
  effectiveDailyHours: number;
  dailyEnergyKwh: number;
  dailyCost: number;
  monthlyCost: number;
  annualCost: number;
  savingRecommendation: string;
  monthlySavings: number;
  newReducedBill: number;
}

export interface KaggleRecord {
  id: number;
  date: string;
  time: string;
  hour: number;
  month: number;
  dayOfWeek: number; // 0 = Sun, 6 = Sat
  season: Season;
  temperatureC: number;
  humidityPct: number;
  voltage: number;
  globalActivePowerKw: number; // Global active power in kW
  globalReactivePowerKw: number;
  subMetering1KitchenWh: number;
  subMetering2LaundryWh: number;
  subMetering3ClimateWh: number;
  totalEnergyKwh: number;
}

export interface RidgeModelMetrics {
  r2Score: number;
  rmse: number;
  mae: number;
  alpha: number;
  trainSamples: number;
  testSamples: number;
  coefficients: { feature: string; weight: number; description: string }[];
  intercept: number;
}

export interface RagDocument {
  id: string;
  title: string;
  category: "Appliance Standards" | "Tariff & Load" | "Thermal & Insulation" | "Renewable Solar" | "Maintenance";
  source: string;
  summary: string;
  fullText: string;
  keywords: string[];
}

export interface RagRetrievalResult {
  doc: RagDocument;
  score: number;
  matchedSnippets: string[];
}

export interface AgentStep {
  stepNumber: number;
  title: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput: Record<string, unknown>;
  thought: string;
  status: "pending" | "running" | "completed";
}

export interface AgentAuditPlan {
  summary: string;
  primaryCulprit: string;
  totalPotentialMonthlySavings: number;
  reducedMonthlyCost: number;
  roiMonths: number;
  co2ReductionKg: number;
  steps: {
    priority: "Immediate (0 Cost)" | "Medium Term" | "High ROI Upgrade";
    action: string;
    monthlySavings: string;
    impact: "High" | "Medium" | "Low";
  }[];
  agentNotes?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: string;
  toolCalls?: string[];
}

export type CsvColumnKey =
  | "device"
  | "category"
  | "powerWatts"
  | "dailyHours"
  | "quantity"
  | "timePeriod"
  | "seasons"
  | "status"
  | "dailyEnergyKwh"
  | "dailyCost"
  | "monthlyEnergyKwh"
  | "monthlyCost"
  | "savingRecommendation"
  | "monthlySavings"
  | "newReducedBill"
  | "annualCost"
  | "co2KgMonthly";

export interface PerspectiveItem {
  id: string;
  name: string;
  category: string;
  wattage: number;
  dailyHours: number;
  quantity: number;
  timePeriod: string;
  activeSeasons: Season[];
  isActiveManual: boolean; // user active/deactive status
  isSeasonallyActive: boolean;
  status: ApplianceStatus;
  isUserAdded?: boolean;
  savingRecommendation: string;
  savingPotentialPct: number;
  dailyEnergyKwh: number;
  dailyCost: number;
  monthlyEnergyKwh: number;
  monthlyCost: number;
  monthlySavings: number;
  newReducedBill: number;
  annualCost: number;
  co2KgMonthly: number;
  isIncludedInCsv: boolean;
}

export interface PerspectiveConfig {
  name: string;
  month: MonthName;
  electricityRate: number;
  currencySymbol: string;
  billingDays: number;
  carbonFactorKgPerKwh: number;
  auditorNotes: string;
  includeMetadataHeader: boolean;
  includeSummaryTotalRow: boolean;
  useSeasonalOff?: boolean;
  columns: Record<CsvColumnKey, boolean>;
}

