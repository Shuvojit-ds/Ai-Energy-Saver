import { ApplianceCalculation, ApplianceStatus, MonthName, PerspectiveConfig, PerspectiveItem, CsvColumnKey, Season } from "../types";
import { MONTH_TO_SEASON_MAP } from "../data/applianceData";

/**
 * Standard default columns dictionary with human-readable headers
 */
export const CSV_COLUMN_DEFINITIONS: { key: CsvColumnKey; label: string; defaultIncluded: boolean }[] = [
  { key: "device", label: "Device / Appliance", defaultIncluded: true },
  { key: "category", label: "Category", defaultIncluded: true },
  { key: "powerWatts", label: "Rated Power (Watts)", defaultIncluded: true },
  { key: "dailyHours", label: "Daily Hours (hrs/day)", defaultIncluded: true },
  { key: "quantity", label: "Quantity", defaultIncluded: true },
  { key: "timePeriod", label: "Operating Time Period", defaultIncluded: false },
  { key: "seasons", label: "Active Seasons", defaultIncluded: false },
  { key: "status", label: "Operational Status", defaultIncluded: true },
  { key: "dailyEnergyKwh", label: "Daily Energy (kWh)", defaultIncluded: true },
  { key: "dailyCost", label: "Daily Cost", defaultIncluded: true },
  { key: "monthlyEnergyKwh", label: "Monthly Energy (kWh)", defaultIncluded: true },
  { key: "monthlyCost", label: "Monthly Cost", defaultIncluded: true },
  { key: "savingRecommendation", label: "Saving Action Recommendation", defaultIncluded: true },
  { key: "monthlySavings", label: "Potential Monthly Savings", defaultIncluded: true },
  { key: "newReducedBill", label: "Target Reduced Bill", defaultIncluded: true },
  { key: "annualCost", label: "Projected Annual Cost", defaultIncluded: true },
  { key: "co2KgMonthly", label: "CO2 Emissions (kg/mo)", defaultIncluded: true },
];

/**
 * Recalculate metrics for a single perspective item based on current perspective configuration
 */
export function recalculatePerspectiveItem(
  item: PerspectiveItem,
  config: PerspectiveConfig
): PerspectiveItem {
  const useSeasonalOff = config.useSeasonalOff === true;
  const currentSeason: Season = MONTH_TO_SEASON_MAP[config.month] || "Monsoon";
  const isSeasonMatch = useSeasonalOff ? item.activeSeasons.includes(currentSeason) : true;
  const isActiveManual = item.isActiveManual !== false;
  const isSeasonallyActive = isActiveManual && isSeasonMatch;
  const status: ApplianceStatus = !isActiveManual
    ? "user_deactivated"
    : isSeasonMatch
    ? "active"
    : "seasonal_off";

  const qty = Math.max(1, item.quantity || 1);
  const effectiveDailyHours = isSeasonallyActive ? Math.max(0, item.dailyHours) : 0;
  
  const dailyEnergyKwh = (Math.max(0, item.wattage) * effectiveDailyHours * qty) / 1000;
  const dailyCost = dailyEnergyKwh * config.electricityRate;
  const billingDays = Math.max(1, config.billingDays || 30);
  const monthlyEnergyKwh = dailyEnergyKwh * billingDays;
  const monthlyCost = dailyCost * billingDays;
  
  const savingsPct = Math.max(0, Math.min(100, item.savingPotentialPct || 15));
  const monthlySavings = isSeasonallyActive ? monthlyCost * (savingsPct / 100) : 0;
  const newReducedBill = Math.max(0, monthlyCost - monthlySavings);
  
  const activeSeasonCount = Math.max(1, item.activeSeasons.length);
  const annualActiveDays = useSeasonalOff ? (activeSeasonCount / 5) * 365 : 365;
  const annualCost = isActiveManual ? dailyCost * annualActiveDays : 0;
  
  const carbonFactor = config.carbonFactorKgPerKwh || 0.82;
  const co2KgMonthly = monthlyEnergyKwh * carbonFactor;

  // Deactivated devices are strictly excluded from CSV database export
  const isIncludedInCsv = isActiveManual && status === "active" && item.isIncludedInCsv !== false;

  return {
    ...item,
    isActiveManual,
    isSeasonallyActive,
    status,
    isIncludedInCsv,
    dailyEnergyKwh,
    dailyCost,
    monthlyEnergyKwh,
    monthlyCost,
    monthlySavings,
    newReducedBill,
    annualCost,
    co2KgMonthly,
  };
}

/**
 * Generates a customized, comprehensive CSV string from user's perspective inputs and parameters
 */
export function generatePerspectiveCsv(
  config: PerspectiveConfig,
  items: PerspectiveItem[]
): string {
  const currency = config.currencySymbol || "₹";
  // User mandate: Deactive items must NOT be taken in the database / CSV file, and not using seasonal off!
  // Only genuinely active, running appliances are taken into the exported CSV file.
  const includedItems = items.filter(
    (i) => i.isIncludedInCsv && i.isActiveManual && i.status === "active"
  );

  // Active columns filtered by user config
  const activeColumns = CSV_COLUMN_DEFINITIONS.filter(
    (col) => config.columns[col.key] !== false
  );

  const lines: string[] = [];

  // Optional Metadata Header lines for context/auditing
  if (config.includeMetadataHeader) {
    const currentSeason = MONTH_TO_SEASON_MAP[config.month] || "Monsoon";
    lines.push(`# =========================================================================`);
    lines.push(`# AI Energy Saver - Perspective Energy Audit Report`);
    lines.push(`# Perspective Title: "${config.name.replace(/"/g, '""')}"`);
    lines.push(`# Target Month: ${config.month} (${currentSeason}) | Billing Days: ${config.billingDays}`);
    lines.push(`# Electricity Rate: ${currency}${config.electricityRate.toFixed(2)}/kWh | CO2 Factor: ${config.carbonFactorKgPerKwh} kg/kWh`);
    if (config.auditorNotes && config.auditorNotes.trim().length > 0) {
      lines.push(`# Perspective Notes: "${config.auditorNotes.replace(/"/g, '""')}"`);
    }
    lines.push(`# Generated At: ${new Date().toISOString()}`);
    lines.push(`# =========================================================================`);
  }

  // Header Row
  const headerRow = activeColumns.map((col) => {
    let label = col.label;
    if (label.includes("Cost") || label.includes("Bill") || label.includes("Savings")) {
      label = `${label} (${currency})`;
    }
    return `"${label.replace(/"/g, '""')}"`;
  }).join(",");
  lines.push(headerRow);

  // Data Rows
  includedItems.forEach((item) => {
    const rowValues = activeColumns.map((col) => {
      switch (col.key) {
        case "device":
          return `"${item.name.replace(/"/g, '""')}"`;
        case "category":
          return `"${item.category.replace(/"/g, '""')}"`;
        case "powerWatts":
          return item.wattage.toString();
        case "dailyHours":
          return item.dailyHours.toFixed(1);
        case "quantity":
          return item.quantity.toString();
        case "timePeriod":
          return `"${item.timePeriod.replace(/"/g, '""')}"`;
        case "seasons":
          return `"${item.activeSeasons.join(", ")}"`;
        case "status":
          if (item.status === "user_deactivated") return '"Deactivated"';
          if (item.status === "seasonal_off") return '"Seasonal Off"';
          return '"Active"';
        case "dailyEnergyKwh":
          return item.dailyEnergyKwh.toFixed(2);
        case "dailyCost":
          return item.dailyCost.toFixed(2);
        case "monthlyEnergyKwh":
          return item.monthlyEnergyKwh.toFixed(2);
        case "monthlyCost":
          return item.monthlyCost.toFixed(2);
        case "savingRecommendation":
          return `"${(item.savingRecommendation || "").replace(/"/g, '""')}"`;
        case "monthlySavings":
          return item.monthlySavings.toFixed(2);
        case "newReducedBill":
          return item.newReducedBill.toFixed(2);
        case "annualCost":
          return item.annualCost.toFixed(2);
        case "co2KgMonthly":
          return item.co2KgMonthly.toFixed(2);
        default:
          return '""';
      }
    });
    lines.push(rowValues.join(","));
  });

  // Optional Summary Total Row
  if (config.includeSummaryTotalRow && includedItems.length > 0) {
    const totalDailyKwh = includedItems.reduce((acc, i) => acc + i.dailyEnergyKwh, 0);
    const totalDailyCost = includedItems.reduce((acc, i) => acc + i.dailyCost, 0);
    const totalMonthlyKwh = includedItems.reduce((acc, i) => acc + i.monthlyEnergyKwh, 0);
    const totalMonthlyCost = includedItems.reduce((acc, i) => acc + i.monthlyCost, 0);
    const totalMonthlySavings = includedItems.reduce((acc, i) => acc + i.monthlySavings, 0);
    const totalReducedBill = includedItems.reduce((acc, i) => acc + i.newReducedBill, 0);
    const totalAnnualCost = includedItems.reduce((acc, i) => acc + i.annualCost, 0);
    const totalCo2Kg = includedItems.reduce((acc, i) => acc + i.co2KgMonthly, 0);
    const activeCount = includedItems.filter((i) => i.isSeasonallyActive).length;

    const totalRowValues = activeColumns.map((col) => {
      switch (col.key) {
        case "device":
          return `"TOTAL (${config.name || "Perspective Summary"})"`;
        case "category":
          return `"${includedItems.length} Devices"`;
        case "powerWatts":
          return `"${includedItems.reduce((acc, i) => acc + i.wattage * i.quantity, 0)}W Total Load"`;
        case "dailyHours":
          return '""';
        case "quantity":
          return `"${includedItems.reduce((acc, i) => acc + i.quantity, 0)}"`;
        case "timePeriod":
          return '""';
        case "seasons":
          return '""';
        case "status":
          return `"${activeCount} Active Devices"`;
        case "dailyEnergyKwh":
          return totalDailyKwh.toFixed(2);
        case "dailyCost":
          return totalDailyCost.toFixed(2);
        case "monthlyEnergyKwh":
          return totalMonthlyKwh.toFixed(2);
        case "monthlyCost":
          return totalMonthlyCost.toFixed(2);
        case "savingRecommendation":
          return `"Total potential monthly savings of ${currency}${totalMonthlySavings.toFixed(0)}"`;
        case "monthlySavings":
          return totalMonthlySavings.toFixed(2);
        case "newReducedBill":
          return totalReducedBill.toFixed(2);
        case "annualCost":
          return totalAnnualCost.toFixed(2);
        case "co2KgMonthly":
          return totalCo2Kg.toFixed(2);
        default:
          return '""';
      }
    });
    lines.push(totalRowValues.join(","));
  }

  return lines.join("\r\n");
}

/**
 * Downloads a string content as a CSV file in the browser with UTF-8 BOM
 */
export function downloadCsvFile(csvContent: string, fileName = "energy_report.csv") {
  // \uFEFF Byte Order Mark ensures Microsoft Excel & Google Sheets parse UTF-8 symbols (like ₹ and °C) properly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName.endsWith(".csv") ? fileName : `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Simple CSV parser for user-uploaded CSV or pasted text
 */
export function parseUserUploadedCsv(
  csvText: string,
  currentMonth: MonthName,
  currentRate: number
): { success: boolean; items: PerspectiveItem[]; message?: string } {
  try {
    const rawLines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0 && !l.trim().startsWith("#"));
    if (rawLines.length < 2) {
      return { success: false, items: [], message: "CSV file requires at least a header row and 1 data row." };
    }

    // Split headers respecting quotes
    const splitCsvRow = (rowStr: string): string[] => {
      const result: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(cur.trim().replace(/^["']|["']$/g, ""));
          cur = "";
        } else {
          cur += char;
        }
      }
      result.push(cur.trim().replace(/^["']|["']$/g, ""));
      return result;
    };

    const header = splitCsvRow(rawLines[0]).map((h) => h.toLowerCase());

    const findIndex = (keywords: string[]): number => {
      return header.findIndex((h) => keywords.some((k) => h.includes(k)));
    };

    const nameIdx = findIndex(["device", "appliance", "name", "item"]);
    const wattIdx = findIndex(["watt", "power", "rated", "load"]);
    const hoursIdx = findIndex(["hour", "time", "usage", "duration"]);
    const catIdx = findIndex(["category", "type", "room"]);
    const qtyIdx = findIndex(["quantity", "qty", "count"]);
    const savingIdx = findIndex(["saving", "recommendation", "tip", "note"]);
    const pctIdx = findIndex(["saving%", "potential%", "pct", "reduction"]);
    const statusIdx = findIndex(["status", "state", "active", "operational", "power"]);

    if (nameIdx === -1 && wattIdx === -1) {
      return {
        success: false,
        items: [],
        message: "Could not locate Device Name or Wattage columns in uploaded CSV header.",
      };
    }

    const currentSeason = MONTH_TO_SEASON_MAP[currentMonth] || "Monsoon";
    const dummyConfig: PerspectiveConfig = {
      name: "Imported Perspective",
      month: currentMonth,
      electricityRate: currentRate,
      currencySymbol: "₹",
      billingDays: 30,
      carbonFactorKgPerKwh: 0.82,
      auditorNotes: "",
      includeMetadataHeader: true,
      includeSummaryTotalRow: true,
      columns: {
        device: true,
        category: true,
        powerWatts: true,
        dailyHours: true,
        quantity: true,
        timePeriod: true,
        seasons: false,
        status: true,
        dailyEnergyKwh: true,
        dailyCost: true,
        monthlyEnergyKwh: true,
        monthlyCost: true,
        savingRecommendation: true,
        monthlySavings: true,
        newReducedBill: true,
        annualCost: true,
        co2KgMonthly: true,
      },
    };

    const parsedItems: PerspectiveItem[] = [];

    for (let r = 1; r < rawLines.length; r++) {
      const cells = splitCsvRow(rawLines[r]);
      if (cells.length === 0 || !cells[0]) continue;

      const name = nameIdx !== -1 && cells[nameIdx] ? cells[nameIdx] : `Device #${r}`;
      // Skip summary / total lines
      if (name.toLowerCase().includes("total")) continue;

      const wattage = wattIdx !== -1 ? Math.max(1, parseFloat(cells[wattIdx]) || 100) : 100;
      const dailyHours = hoursIdx !== -1 ? Math.max(0, parseFloat(cells[hoursIdx]) || 4) : 4;
      const category = catIdx !== -1 && cells[catIdx] ? cells[catIdx] : "Other";
      const quantity = qtyIdx !== -1 ? Math.max(1, parseInt(cells[qtyIdx], 10) || 1) : 1;
      const savingRecommendation = savingIdx !== -1 && cells[savingIdx] ? cells[savingIdx] : "Use optimal energy rating and timer controls.";
      const savingPotentialPct = pctIdx !== -1 ? Math.max(0, Math.min(100, parseFloat(cells[pctIdx]) || 15)) : 15;

      let isActiveManual = true;
      if (statusIdx !== -1 && cells[statusIdx]) {
        const val = cells[statusIdx].toLowerCase().trim();
        if (val.includes("deact") || val.includes("inact") || val.includes("off") || val.includes("disabled") || val === "0" || val === "false" || val === "no") {
          isActiveManual = false;
        }
      }

      const baseItem: PerspectiveItem = {
        id: `imported-${Date.now()}-${r}`,
        name,
        category,
        wattage,
        dailyHours,
        quantity,
        timePeriod: "Flexible",
        activeSeasons: ["Summer", "Monsoon", "Autumn", "Winter", "Spring"],
        isActiveManual,
        isSeasonallyActive: isActiveManual,
        status: isActiveManual ? "active" : "user_deactivated",
        isUserAdded: true,
        savingRecommendation,
        savingPotentialPct,
        dailyEnergyKwh: 0,
        dailyCost: 0,
        monthlyEnergyKwh: 0,
        monthlyCost: 0,
        monthlySavings: 0,
        newReducedBill: 0,
        annualCost: 0,
        co2KgMonthly: 0,
        isIncludedInCsv: true,
      };

      parsedItems.push(recalculatePerspectiveItem(baseItem, dummyConfig));
    }

    if (parsedItems.length === 0) {
      return { success: false, items: [], message: "No valid appliance rows could be extracted from the file." };
    }

    return { success: true, items: parsedItems };
  } catch (err) {
    return {
      success: false,
      items: [],
      message: `Failed to parse CSV: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Retained for legacy compatibility
 */
export function generateApplianceReportCsv(
  calculations: ApplianceCalculation[],
  month: MonthName,
  currencySymbol = "₹"
): string {
  const dummyItems: PerspectiveItem[] = calculations.map((c) => ({
    id: c.appliance.id,
    name: c.appliance.name,
    category: c.appliance.category,
    wattage: c.appliance.wattage,
    dailyHours: c.appliance.usageHoursDaily,
    quantity: 1,
    timePeriod: c.appliance.timePeriod,
    activeSeasons: c.appliance.activeSeasons,
    isActiveManual: c.appliance.isActiveManual !== false,
    isSeasonallyActive: c.isSeasonallyActive,
    status: c.status || (c.appliance.isActiveManual === false ? "user_deactivated" : c.isSeasonallyActive ? "active" : "seasonal_off"),
    isUserAdded: c.appliance.isUserAdded,
    savingRecommendation: c.savingRecommendation,
    savingPotentialPct: c.appliance.savingPotentialPct || 15,
    dailyEnergyKwh: c.dailyEnergyKwh,
    dailyCost: c.dailyCost,
    monthlyEnergyKwh: c.dailyEnergyKwh * 30,
    monthlyCost: c.monthlyCost,
    monthlySavings: c.monthlySavings,
    newReducedBill: c.newReducedBill,
    annualCost: c.annualCost,
    co2KgMonthly: c.dailyEnergyKwh * 30 * 0.82,
    isIncludedInCsv: c.appliance.isActiveManual !== false && c.status === "active",
  }));

  const dummyConfig: PerspectiveConfig = {
    name: `Appliance Report - ${month}`,
    month,
    electricityRate: 8.0,
    currencySymbol,
    billingDays: 30,
    carbonFactorKgPerKwh: 0.82,
    auditorNotes: "",
    includeMetadataHeader: false,
    includeSummaryTotalRow: true,
    columns: {
      device: true,
      category: false,
      powerWatts: false,
      dailyHours: false,
      quantity: false,
      timePeriod: true,
      seasons: true,
      status: true,
      dailyEnergyKwh: true,
      dailyCost: true,
      monthlyEnergyKwh: false,
      monthlyCost: true,
      savingRecommendation: true,
      monthlySavings: true,
      newReducedBill: true,
      annualCost: true,
      co2KgMonthly: false,
    },
  };

  return generatePerspectiveCsv(dummyConfig, dummyItems);
}
