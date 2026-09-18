import { Appliance, ApplianceCalculation, ApplianceStatus, MonthName, Season } from "../types";

export const MONTH_TO_SEASON_MAP: Record<MonthName, Season> = {
  January: "Winter",
  February: "Winter",
  March: "Spring",
  April: "Summer",
  May: "Summer",
  June: "Summer",
  July: "Monsoon",
  August: "Monsoon",
  September: "Monsoon",
  October: "Autumn",
  November: "Autumn",
  December: "Winter",
};

export const MONTH_LIST: MonthName[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const INITIAL_APPLIANCES: Appliance[] = [
  {
    id: "app-ac-1",
    name: "Inverter Split AC (1.5 Ton)",
    category: "Climate Control",
    wattage: 1450,
    usageHoursDaily: 7,
    timePeriod: "Night (10 PM-6 AM)",
    activeSeasons: ["Summer", "Monsoon"],
    isActiveManual: true,
    efficiencyTip: "Keep thermostat at 24°C rather than 18°C; use timer to turn off after 4 hours.",
    savingPotentialPct: 25,
    iconName: "Wind",
  },
  {
    id: "app-fan-bldc",
    name: "BLDC Ceiling Fan (Master Bed)",
    category: "Cooling/Ventilation",
    wattage: 28,
    usageHoursDaily: 12,
    timePeriod: "All Day (24h)",
    activeSeasons: ["Summer", "Monsoon", "Autumn", "Spring"],
    isActiveManual: true,
    efficiencyTip: "BLDC motors consume 62% less than induction motors with no heating loss.",
    savingPotentialPct: 10,
    iconName: "Fan",
  },
  {
    id: "app-fan-std",
    name: "Standard Ceiling Fan (Living Room)",
    category: "Cooling/Ventilation",
    wattage: 75,
    usageHoursDaily: 10,
    timePeriod: "All Day (24h)",
    activeSeasons: ["Summer", "Monsoon", "Autumn", "Spring"],
    isActiveManual: true,
    efficiencyTip: "Upgrade to 5-star BLDC fan to slash wattage from 75W down to 28W.",
    savingPotentialPct: 62,
    iconName: "Fan",
  },
  {
    id: "app-fridge",
    name: "Double-Door Refrigerator (260L)",
    category: "Refrigeration",
    wattage: 180, // Compressor cycling equivalent ~1.3 kWh/day
    usageHoursDaily: 24, // Evaluated with compressor duty cycle ~35%
    timePeriod: "All Day (24h)",
    activeSeasons: ["Summer", "Monsoon", "Autumn", "Winter", "Spring"],
    isActiveManual: true,
    efficiencyTip: "Clean condenser coils annually and maintain 3°C to 4°C fridge temp.",
    savingPotentialPct: 15,
    iconName: "Refrigerator",
  },
  {
    id: "app-geyser",
    name: "Storage Water Geyser (25L)",
    category: "Water Heating",
    wattage: 2000,
    usageHoursDaily: 1.5,
    timePeriod: "Morning",
    activeSeasons: ["Winter", "Autumn"],
    isActiveManual: true,
    efficiencyTip: "Switch off immediately after water heats (20-30 min) to prevent reheating cycles.",
    savingPotentialPct: 30,
    iconName: "Flame",
  },
  {
    id: "app-laptop",
    name: "Laptop & Workstation",
    category: "Computing & Media",
    wattage: 85,
    usageHoursDaily: 8,
    timePeriod: "Morning",
    activeSeasons: ["Summer", "Monsoon", "Autumn", "Winter", "Spring"],
    isActiveManual: true,
    efficiencyTip: "Activate power-saving sleep mode; avoid keeping plugged in at 100% full time.",
    savingPotentialPct: 18,
    iconName: "Laptop",
  },
  {
    id: "app-tv",
    name: "Smart 4K LED TV (55 inch)",
    category: "Computing & Media",
    wattage: 110,
    usageHoursDaily: 4,
    timePeriod: "Peak Evening (6-10 PM)",
    activeSeasons: ["Summer", "Monsoon", "Autumn", "Winter", "Spring"],
    isActiveManual: true,
    efficiencyTip: "Disable ambient standby sleep light when not in use to curb phantom power draw.",
    savingPotentialPct: 12,
    iconName: "Tv",
  },
  {
    id: "app-leds",
    name: "LED Lights (Entire House)",
    category: "Lighting",
    wattage: 60, // Combined wattage
    usageHoursDaily: 6,
    timePeriod: "Peak Evening (6-10 PM)",
    activeSeasons: ["Summer", "Monsoon", "Autumn", "Winter", "Spring"],
    isActiveManual: true,
    efficiencyTip: "Use daylight harvesting and motion sensors for bathrooms and corridors.",
    savingPotentialPct: 20,
    iconName: "Lightbulb",
  },
  {
    id: "app-washing",
    name: "Front-Load Washing Machine",
    category: "Kitchen & Laundry",
    wattage: 500,
    usageHoursDaily: 1,
    timePeriod: "Morning",
    activeSeasons: ["Summer", "Monsoon", "Autumn", "Winter", "Spring"],
    isActiveManual: true,
    efficiencyTip: "Wash full loads with cold water (30°C) instead of heating water (60°C).",
    savingPotentialPct: 35,
    iconName: "Shirt",
  },
  {
    id: "app-ro",
    name: "Water Purifier (RO+UV)",
    category: "Kitchen & Laundry",
    wattage: 45,
    usageHoursDaily: 2,
    timePeriod: "Flexible",
    activeSeasons: ["Summer", "Monsoon", "Autumn", "Winter", "Spring"],
    isActiveManual: true,
    efficiencyTip: "Replace filters timely to prevent motor strain and excessive booster pump run time.",
    savingPotentialPct: 15,
    iconName: "Droplets",
  },
];

export function calculateApplianceMetrics(
  appliance: Appliance,
  month: MonthName,
  electricityRate = 8.0,
  useSeasonalOff = false
): ApplianceCalculation {
  const currentSeason: Season = MONTH_TO_SEASON_MAP[month];
  // If not using seasonal off, all active devices are available all year
  const isSeasonMatch = useSeasonalOff ? appliance.activeSeasons.includes(currentSeason) : true;
  const isSeasonallyActive = appliance.isActiveManual && isSeasonMatch;
  const status: ApplianceStatus = !appliance.isActiveManual
    ? "user_deactivated"
    : isSeasonMatch
    ? "active"
    : "seasonal_off";

  const effectiveDailyHours = isSeasonallyActive ? appliance.usageHoursDaily : 0;
  const dailyEnergyKwh = (appliance.wattage * effectiveDailyHours) / 1000;
  const dailyCost = dailyEnergyKwh * electricityRate;
  const monthlyCost = dailyCost * 30;

  const monthlySavings = isSeasonallyActive
    ? monthlyCost * ((appliance.savingPotentialPct || 15) / 100)
    : 0;

  const newReducedBill = Math.max(0, monthlyCost - monthlySavings);

  // Annual calculation based on number of active seasons
  // Each active season is ~2.4 months (73 days)
  const activeSeasonCount = appliance.activeSeasons.length;
  const annualActiveDays = (activeSeasonCount / 5) * 365;
  const annualCost = appliance.isActiveManual ? dailyCost * annualActiveDays : 0;

  return {
    appliance,
    isSeasonallyActive,
    status,
    effectiveDailyHours,
    dailyEnergyKwh,
    dailyCost,
    monthlyCost,
    monthlySavings,
    newReducedBill,
    annualCost,
    savingRecommendation: appliance.efficiencyTip,
  };
}

