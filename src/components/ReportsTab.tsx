import React, { useState, useMemo, useEffect } from "react";
import {
  Download,
  FileSpreadsheet,
  Printer,
  TrendingDown,
  CheckCircle,
  Copy,
  Check,
  Plus,
  Trash2,
  SlidersHorizontal,
  Upload,
  Sparkles,
  RefreshCw,
  Zap,
  Leaf,
  Code,
  Eye,
  ChevronDown,
  ChevronUp,
  Sliders,
  Calendar,
  IndianRupee,
  DollarSign,
  AlertCircle,
  Power,
  PowerOff
} from "lucide-react";
import {
  Appliance,
  ApplianceCalculation,
  ApplianceStatus,
  MonthName,
  PerspectiveConfig,
  PerspectiveItem,
  Season,
  CsvColumnKey
} from "../types";
import { MONTH_LIST, MONTH_TO_SEASON_MAP } from "../data/applianceData";
import {
  CSV_COLUMN_DEFINITIONS,
  generatePerspectiveCsv,
  downloadCsvFile,
  parseUserUploadedCsv,
  recalculatePerspectiveItem
} from "../utils/exportCsv";

interface ReportsTabProps {
  selectedMonth: MonthName;
  calculations: ApplianceCalculation[];
  electricityRate: number;
  appliances?: Appliance[];
  onUpdateAppliance?: (updated: Appliance) => void;
  onBulkToggleActive?: (activate: boolean) => void;
  useSeasonalOff?: boolean;
  onToggleSeasonalOff?: () => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  selectedMonth,
  calculations,
  electricityRate,
  appliances,
  onUpdateAppliance,
  onBulkToggleActive,
  useSeasonalOff = false,
  onToggleSeasonalOff,
}) => {
  // 1. Perspective Configuration State (User Inputs)
  const [config, setConfig] = useState<PerspectiveConfig>(() => ({
    name: "Home Energy Optimization Perspective",
    month: selectedMonth,
    electricityRate: electricityRate,
    currencySymbol: "₹",
    billingDays: 30,
    carbonFactorKgPerKwh: 0.82,
    useSeasonalOff: useSeasonalOff,
    auditorNotes: "Custom perspective simulating targeted appliance adjustments and peak load management.",
    includeMetadataHeader: true,
    includeSummaryTotalRow: true,
    columns: {
      device: true,
      category: true,
      powerWatts: true,
      dailyHours: true,
      quantity: true,
      timePeriod: false,
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
  }));

  // Helper to convert calculations to PerspectiveItems
  const initItemsFromCalculations = (
    calcs: ApplianceCalculation[],
    targetConfig: PerspectiveConfig
  ): PerspectiveItem[] => {
    return calcs.map((calc) => {
      const app = calc.appliance;
      const base: PerspectiveItem = {
        id: app.id,
        name: app.name,
        category: app.category,
        wattage: app.wattage,
        dailyHours: app.usageHoursDaily,
        quantity: 1,
        timePeriod: app.timePeriod,
        activeSeasons: [...app.activeSeasons],
        isActiveManual: app.isActiveManual !== false,
        isSeasonallyActive: calc.isSeasonallyActive,
        status: calc.status || (app.isActiveManual === false ? "user_deactivated" : calc.isSeasonallyActive ? "active" : "seasonal_off"),
        isUserAdded: app.isUserAdded,
        savingRecommendation: calc.savingRecommendation || app.efficiencyTip,
        savingPotentialPct: app.savingPotentialPct || 15,
        dailyEnergyKwh: calc.dailyEnergyKwh,
        dailyCost: calc.dailyCost,
        monthlyEnergyKwh: calc.dailyEnergyKwh * targetConfig.billingDays,
        monthlyCost: calc.monthlyCost,
        monthlySavings: calc.monthlySavings,
        newReducedBill: calc.newReducedBill,
        annualCost: calc.annualCost,
        co2KgMonthly: calc.dailyEnergyKwh * targetConfig.billingDays * targetConfig.carbonFactorKgPerKwh,
        // User mandate: deactive data is NOT taken in CSV database file, and not using seasonal off
        isIncludedInCsv: app.isActiveManual !== false && calc.status === "active",
      };
      return recalculatePerspectiveItem(base, targetConfig);
    });
  };

  // 2. Perspective Appliance Items State (Editable by user)
  const [items, setItems] = useState<PerspectiveItem[]>(() =>
    initItemsFromCalculations(calculations, config)
  );

  // Synchronize perspective items when household calculations or active/deactive status changes in parent
  useEffect(() => {
    setItems((prevItems) => {
      const customAdded = prevItems.filter((it) => it.isUserAdded && !calculations.some((c) => c.appliance.id === it.id));
      const synced = initItemsFromCalculations(calculations, config);
      return [...synced, ...customAdded];
    });
  }, [calculations]);

  // UI view state
  const [activeViewTab, setActiveViewTab] = useState<"table" | "csvPreview">("table");
  const [showColumnSettings, setShowColumnSettings] = useState<boolean>(false);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // New Custom Device Modal Form State (User giving device perspective)
  const [newDevice, setNewDevice] = useState<{
    name: string;
    category: Appliance["category"];
    wattage: number;
    dailyHours: number;
    quantity: number;
    timePeriod: Appliance["timePeriod"];
    savingPotentialPct: number;
    savingRecommendation: string;
    allSeasons: boolean;
    isActiveManual: boolean;
  }>({
    name: "",
    category: "Climate Control",
    wattage: 1200,
    dailyHours: 6,
    quantity: 1,
    timePeriod: "Peak Evening (6-10 PM)",
    savingPotentialPct: 20,
    savingRecommendation: "Set smart timer and run during non-peak hours.",
    allSeasons: true,
    isActiveManual: true,
  });

  // Import CSV text modal state
  const [csvImportText, setCsvImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Recalculate all items when config rates, month, or billing days change
  const handleConfigChange = <K extends keyof PerspectiveConfig>(
    key: K,
    value: PerspectiveConfig[K]
  ) => {
    setConfig((prev) => {
      const nextConfig = { ...prev, [key]: value };
      // update items
      setItems((prevItems) => prevItems.map((item) => recalculatePerspectiveItem(item, nextConfig)));
      return nextConfig;
    });
  };

  // Preset Perspectives
  const applyPreset = (presetKey: "baseline" | "summer" | "winter" | "eco" | "blank") => {
    if (presetKey === "baseline") {
      const nextConfig: PerspectiveConfig = {
        ...config,
        name: "Current Household Baseline Perspective",
        month: selectedMonth,
        electricityRate: electricityRate,
        billingDays: 30,
        auditorNotes: "Baseline energy audit reflecting current live appliance usage and utility tariff.",
      };
      setConfig(nextConfig);
      setItems(initItemsFromCalculations(calculations, nextConfig));
    } else if (presetKey === "summer") {
      const nextConfig: PerspectiveConfig = {
        ...config,
        name: "Peak Summer Cooling Perspective",
        month: "May",
        electricityRate: electricityRate,
        billingDays: 31,
        auditorNotes: "Simulation of intense summer cooling demand with elevated AC runtimes and thermal insulation opportunities.",
      };
      setConfig(nextConfig);
      const updated = initItemsFromCalculations(calculations, nextConfig).map((it) => {
        if (it.category === "Climate Control" || it.name.toLowerCase().includes("ac")) {
          return recalculatePerspectiveItem(
            { ...it, dailyHours: Math.min(16, it.dailyHours + 4), quantity: 1, isIncludedInCsv: true },
            nextConfig
          );
        }
        return it;
      });
      setItems(updated);
    } else if (presetKey === "winter") {
      const nextConfig: PerspectiveConfig = {
        ...config,
        name: "Winter Heating & Geyser Perspective",
        month: "January",
        electricityRate: electricityRate,
        billingDays: 31,
        auditorNotes: "Winter audit perspective focusing on water heaters, room heaters, and lighting loads with ACs off.",
      };
      setConfig(nextConfig);
      setItems(initItemsFromCalculations(calculations, nextConfig));
    } else if (presetKey === "eco") {
      const nextConfig: PerspectiveConfig = {
        ...config,
        name: "Eco-Saver 20% Reduction Perspective",
        month: selectedMonth,
        electricityRate: electricityRate,
        billingDays: 30,
        auditorNotes: "Aggressive energy saving scenario: 24°C AC thermostat, LED star ratings, and vampire load cutoffs.",
      };
      setConfig(nextConfig);
      const updated = initItemsFromCalculations(calculations, nextConfig).map((it) => {
        return recalculatePerspectiveItem(
          {
            ...it,
            dailyHours: Math.max(1, it.dailyHours * 0.8),
            savingPotentialPct: Math.min(40, it.savingPotentialPct + 10),
            savingRecommendation: "Adopt BEE 5-star inverter practices, smart plugs, and thermal curtains.",
          },
          nextConfig
        );
      });
      setItems(updated);
    } else if (presetKey === "blank") {
      const nextConfig: PerspectiveConfig = {
        ...config,
        name: "Custom User-Defined Perspective",
        auditorNotes: "Built from scratch with user-provided appliance inputs.",
      };
      setConfig(nextConfig);
      setItems([]);
    }
  };

  // Direct inline modifications of appliance items
  const handleItemFieldChange = (
    id: string,
    field: "wattage" | "dailyHours" | "quantity" | "savingPotentialPct" | "savingRecommendation" | "isIncludedInCsv" | "isActiveManual",
    val: number | string | boolean
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const updated = { ...it, [field]: val };
          return recalculatePerspectiveItem(updated, config);
        }
        return it;
      })
    );
  };

  // Toggle single item Active / Deactivate status
  const handleToggleItemActive = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const nextActive = !it.isActiveManual;
          const updated = {
            ...it,
            isActiveManual: nextActive,
            // When deactivated, device is NOT taken into the CSV database
            isIncludedInCsv: nextActive,
            status: (!nextActive ? "user_deactivated" : "active") as ApplianceStatus,
          };
          return recalculatePerspectiveItem(updated, config);
        }
        return it;
      })
    );

    const targetApp = appliances?.find((a) => a.id === id);
    if (targetApp && onUpdateAppliance) {
      onUpdateAppliance({
        ...targetApp,
        isActiveManual: !targetApp.isActiveManual,
      });
    }
  };

  // Bulk active/deactivate across perspective table
  const handleActivateAll = () => {
    setItems((prev) =>
      prev.map((it) =>
        recalculatePerspectiveItem(
          {
            ...it,
            isActiveManual: true,
            isIncludedInCsv: true,
            status: "active",
          },
          config
        )
      )
    );

    if (onBulkToggleActive) {
      onBulkToggleActive(true);
    }
  };

  const handleDeactivateAll = () => {
    setItems((prev) =>
      prev.map((it) =>
        recalculatePerspectiveItem(
          {
            ...it,
            isActiveManual: false,
            // Deactive devices are strictly excluded from CSV database
            isIncludedInCsv: false,
            status: "user_deactivated" as ApplianceStatus,
          },
          config
        )
      )
    );

    if (onBulkToggleActive) {
      onBulkToggleActive(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Add new device (User Giving input perspective)
  const handleAddDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevice.name.trim()) return;

    const seasons: Season[] = newDevice.allSeasons
      ? ["Summer", "Monsoon", "Autumn", "Winter", "Spring"]
      : [MONTH_TO_SEASON_MAP[config.month]];

    const newItem: PerspectiveItem = {
      id: `custom-device-${Date.now()}`,
      name: newDevice.name.trim(),
      category: newDevice.category,
      wattage: Math.max(1, Number(newDevice.wattage) || 100),
      dailyHours: Math.max(0, Number(newDevice.dailyHours) || 1),
      quantity: Math.max(1, Number(newDevice.quantity) || 1),
      timePeriod: newDevice.timePeriod,
      activeSeasons: seasons,
      isActiveManual: newDevice.isActiveManual,
      isSeasonallyActive: newDevice.isActiveManual,
      status: newDevice.isActiveManual ? "active" : "user_deactivated",
      isUserAdded: true,
      savingRecommendation: newDevice.savingRecommendation || "Optimize operating schedule and power settings.",
      savingPotentialPct: Math.max(0, Math.min(100, Number(newDevice.savingPotentialPct) || 15)),
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

    const recalculated = recalculatePerspectiveItem(newItem, config);
    setItems((prev) => [recalculated, ...prev]);
    setShowAddDeviceModal(false);
    setNewDevice({
      name: "",
      category: "Climate Control",
      wattage: 1200,
      dailyHours: 6,
      quantity: 1,
      timePeriod: "Peak Evening (6-10 PM)",
      savingPotentialPct: 20,
      savingRecommendation: "Set smart timer and run during non-peak hours.",
      allSeasons: true,
      isActiveManual: true,
    });
  };

  // Handle CSV file upload or paste
  const handleImportCsv = () => {
    setImportError(null);
    setImportSuccess(null);
    if (!csvImportText.trim()) {
      setImportError("Please paste valid CSV content or upload a file first.");
      return;
    }

    const res = parseUserUploadedCsv(csvImportText, config.month, config.electricityRate);
    if (!res.success) {
      setImportError(res.message || "Failed to parse CSV.");
      return;
    }

    setItems((prev) => [...res.items, ...prev]);
    setImportSuccess(`Successfully imported ${res.items.length} custom appliance records into this perspective!`);
    setTimeout(() => {
      setShowImportModal(false);
      setCsvImportText("");
      setImportSuccess(null);
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvImportText(content);
      }
    };
    reader.readAsText(file);
  };

  // Computed Perspective Totals
  const includedItems = useMemo(() => items.filter((i) => i.isIncludedInCsv), [items]);
  const totalDailyKwh = useMemo(() => includedItems.reduce((acc, i) => acc + i.dailyEnergyKwh, 0), [includedItems]);
  const totalMonthlyKwh = useMemo(() => includedItems.reduce((acc, i) => acc + i.monthlyEnergyKwh, 0), [includedItems]);
  const totalDailyCost = useMemo(() => includedItems.reduce((acc, i) => acc + i.dailyCost, 0), [includedItems]);
  const totalMonthlyCost = useMemo(() => includedItems.reduce((acc, i) => acc + i.monthlyCost, 0), [includedItems]);
  const totalMonthlySavings = useMemo(() => includedItems.reduce((acc, i) => acc + i.monthlySavings, 0), [includedItems]);
  const totalReducedBill = useMemo(() => Math.max(0, totalMonthlyCost - totalMonthlySavings), [totalMonthlyCost, totalMonthlySavings]);
  const totalAnnualCost = useMemo(() => includedItems.reduce((acc, i) => acc + i.annualCost, 0), [includedItems]);
  const totalCo2Kg = useMemo(() => includedItems.reduce((acc, i) => acc + i.co2KgMonthly, 0), [includedItems]);

  // Live CSV output generation
  const generatedCsvString = useMemo(() => {
    return generatePerspectiveCsv(config, items);
  }, [config, items]);

  const handleDownloadCsv = () => {
    const safeName = config.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "energy_perspective";
    const fileName = `${safeName}_${config.month.toLowerCase()}_report.csv`;
    downloadCsvFile(generatedCsvString, fileName);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCsvString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const activeSeason = MONTH_TO_SEASON_MAP[config.month];

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                User Perspective CSV Generator
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                  Custom Input Mode
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Input your custom scenario parameters, add devices, configure CSV columns, and generate exportable CSV reports.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Import or paste external CSV rows"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Import / Paste CSV
          </button>

          <button
            onClick={() => setShowAddDeviceModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Device
          </button>

          <button
            onClick={handleCopyToClipboard}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                Copy CSV
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print
          </button>

          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download CSV File
          </button>
        </div>
      </div>

      {/* Preset Perspectives Quick-Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900">Perspective Presets:</span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Quickly load a structured scenario perspective or build your own from scratch
            </span>
          </div>
          <button
            onClick={() => applyPreset("baseline")}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Sync from Dashboard
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3">
          <button
            onClick={() => applyPreset("baseline")}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-800 block">
              ⚡ Baseline Household
            </span>
            <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
              Current live devices ({calculations.length})
            </span>
          </button>

          <button
            onClick={() => applyPreset("summer")}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 text-left transition cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-slate-800 group-hover:text-amber-800 block">
              ☀️ Summer Peak Cooling
            </span>
            <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
              Elevated AC runtime (+4h)
            </span>
          </button>

          <button
            onClick={() => applyPreset("winter")}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 text-left transition cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-slate-800 group-hover:text-cyan-800 block">
              ❄️ Winter Heating
            </span>
            <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
              Geyser focus, zero AC load
            </span>
          </button>

          <button
            onClick={() => applyPreset("eco")}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 text-left transition cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-slate-800 group-hover:text-teal-800 block">
              🌿 Eco-Saver Plan
            </span>
            <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
              Aggressive 20-30% cutoffs
            </span>
          </button>

          <button
            onClick={() => applyPreset("blank")}
            className="p-2.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-left transition cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900 block">
              ✍️ Clean Slate Input
            </span>
            <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
              Type all custom devices
            </span>
          </button>
        </div>
      </div>

      {/* Perspective Input Parameters Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Perspective Parameters (User Inputs)
            </h3>
          </div>
          <button
            onClick={() => setShowColumnSettings(!showColumnSettings)}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            Configure CSV Columns ({Object.values(config.columns).filter(Boolean).length})
            {showColumnSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Perspective Title */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Perspective / Scenario Title
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => handleConfigChange("name", e.target.value)}
              placeholder="e.g. My 3BHK Summer Audit Plan"
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Perspective Target Month */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Simulated Month & Season
            </label>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={config.month}
                onChange={(e) => handleConfigChange("month", e.target.value as MonthName)}
                className="w-full text-xs font-medium bg-transparent focus:outline-none cursor-pointer text-slate-800"
              >
                {MONTH_LIST.map((m) => (
                  <option key={m} value={m}>
                    {m} ({MONTH_TO_SEASON_MAP[m]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Perspective Tariff */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Electricity Tariff Rate ({config.currencySymbol}/kWh)
            </label>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <select
                value={config.currencySymbol}
                onChange={(e) => handleConfigChange("currencySymbol", e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer pr-1"
              >
                <option value="₹">₹ (INR)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
              </select>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="100"
                value={config.electricityRate}
                onChange={(e) => handleConfigChange("electricityRate", Math.max(0.1, Number(e.target.value) || 1))}
                className="w-full text-xs font-bold text-slate-900 bg-transparent text-right focus:outline-none"
              />
            </div>
          </div>

          {/* Billing Days */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Billing Cycle Duration
            </label>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <input
                type="number"
                min="1"
                max="365"
                value={config.billingDays}
                onChange={(e) => handleConfigChange("billingDays", Math.max(1, parseInt(e.target.value, 10) || 30))}
                className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">days</span>
            </div>
          </div>

          {/* Grid Emission Factor */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              CO₂ Emission Factor
            </label>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <input
                type="number"
                step="0.01"
                min="0"
                max="2"
                value={config.carbonFactorKgPerKwh}
                onChange={(e) => handleConfigChange("carbonFactorKgPerKwh", Math.max(0, Number(e.target.value) || 0.82))}
                className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">kg/kWh</span>
            </div>
          </div>

          {/* Perspective Scope Notes */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Perspective Scope / Auditor Remarks
            </label>
            <input
              type="text"
              value={config.auditorNotes}
              onChange={(e) => handleConfigChange("auditorNotes", e.target.value)}
              placeholder="e.g. Auditing 1.5-ton AC night cooling, refrigerator temperature offset"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-800"
            />
          </div>
        </div>

        {/* CSV Options (Metadata comments and summary totals row) */}
        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.includeMetadataHeader}
              onChange={(e) => handleConfigChange("includeMetadataHeader", e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span>Include Perspective Audit Header (`#` Metadata comments in CSV)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.includeSummaryTotalRow}
              onChange={(e) => handleConfigChange("includeSummaryTotalRow", e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span>Include Bottom "TOTAL" Summary Row</span>
          </label>
        </div>

        {/* Collapsible Column Picker */}
        {showColumnSettings && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Choose CSV Export Columns:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allTrue = CSV_COLUMN_DEFINITIONS.reduce(
                      (acc, col) => ({ ...acc, [col.key]: true }),
                      {} as Record<CsvColumnKey, boolean>
                    );
                    handleConfigChange("columns", allTrue);
                  }}
                  className="text-[11px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    const defaultCols = CSV_COLUMN_DEFINITIONS.reduce(
                      (acc, col) => ({ ...acc, [col.key]: col.defaultIncluded }),
                      {} as Record<CsvColumnKey, boolean>
                    );
                    handleConfigChange("columns", defaultCols);
                  }}
                  className="text-[11px] text-slate-600 hover:underline cursor-pointer"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {CSV_COLUMN_DEFINITIONS.map((col) => {
                const isChecked = config.columns[col.key] !== false;
                return (
                  <label
                    key={col.key}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition ${
                      isChecked
                        ? "bg-white border-emerald-300 text-slate-900 font-medium shadow-2xs"
                        : "bg-slate-100/60 border-slate-200 text-slate-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        handleConfigChange("columns", {
                          ...config.columns,
                          [col.key]: e.target.checked,
                        });
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="truncate">{col.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Live Perspective Calculated Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Monthly Load</span>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {totalMonthlyKwh.toFixed(1)} <span className="text-xs font-normal text-slate-500">kWh</span>
          </div>
          <span className="text-[10px] text-slate-400">{totalDailyKwh.toFixed(1)} kWh/day</span>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current Monthly Bill</span>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {config.currencySymbol}{Math.round(totalMonthlyCost).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-slate-400">{config.currencySymbol}{totalDailyCost.toFixed(1)}/day</span>
        </div>

        <div className="bg-emerald-50/70 rounded-xl p-3.5 border border-emerald-200 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">Potential Savings</span>
          <div className="text-lg font-bold text-emerald-900 mt-1">
            {config.currencySymbol}{Math.round(totalMonthlySavings).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">
            {totalMonthlyCost > 0 ? Math.round((totalMonthlySavings / totalMonthlyCost) * 100) : 0}% bill reduction
          </span>
        </div>

        <div className="bg-teal-50/70 rounded-xl p-3.5 border border-teal-200 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-800">Target Reduced Bill</span>
          <div className="text-lg font-bold text-teal-900 mt-1">
            {config.currencySymbol}{Math.round(totalReducedBill).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-teal-700 font-medium">After optimizations</span>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Annual Forecast</span>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {config.currencySymbol}{Math.round(totalAnnualCost).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-slate-400">12-month projection</span>
        </div>

        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Leaf className="w-3 h-3 text-emerald-600" /> CO₂ Footprint
          </span>
          <div className="text-lg font-bold text-slate-800 mt-1">
            {Math.round(totalCo2Kg)} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <span className="text-[10px] text-slate-400">per month</span>
        </div>
      </div>

      {/* Main Interactive Workspace (Table vs Live CSV Preview) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Workspace Tab Header */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveViewTab("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeViewTab === "table"
                  ? "bg-white text-slate-900 border border-slate-200 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Interactive Table ({items.filter((i) => i.isIncludedInCsv && i.isActiveManual && i.status === "active").length} Active in CSV)
            </button>

            <button
              onClick={() => setActiveViewTab("csvPreview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeViewTab === "csvPreview"
                  ? "bg-white text-slate-900 border border-slate-200 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Raw CSV Code Preview
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 hidden md:inline">
              ({items.filter((i) => i.isActiveManual && i.status === "active").length} Active • {items.filter((i) => !i.isActiveManual).length} Deactivated)
            </span>
            <button
              type="button"
              onClick={handleActivateAll}
              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition shadow-2xs cursor-pointer"
              title="Activate all devices in this perspective and include them in CSV"
            >
              <Power className="w-3 h-3" />
              Activate All
            </button>
            <button
              type="button"
              onClick={handleDeactivateAll}
              className="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition shadow-2xs cursor-pointer"
              title="Deactivate all devices (excludes all from database and CSV export)"
            >
              <PowerOff className="w-3 h-3" />
              Deactivate All
            </button>
            <span className="text-xs text-slate-500 pl-2 border-l border-slate-200">
              Perspective: <span className="font-semibold text-slate-800">{config.name}</span>
            </span>
          </div>
        </div>

        {/* Database & CSV Rule Notice */}
        <div className="px-4 py-2 bg-slate-900 text-white text-xs border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>
              <strong className="text-emerald-300">CSV Export Mandate:</strong> Deactivated devices are <strong>not taken into the CSV database</strong>. Only active running devices are included.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleConfigChange("useSeasonalOff", !config.useSeasonalOff)}
              className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              Seasonal Restrictions: {config.useSeasonalOff ? "Enabled" : "Off (Run All Year)"}
            </button>
          </div>
        </div>

        {/* Tab 1: Interactive Table View */}
        {activeViewTab === "table" && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">Include</th>
                    <th className="py-3 px-3">Device Name & Category</th>
                    <th className="py-3 px-3 w-24">Power (Watts)</th>
                    <th className="py-3 px-3 w-20">Hours/Day</th>
                    <th className="py-3 px-3 w-16">Qty</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Daily (kWh)</th>
                    <th className="py-3 px-3 text-right">Monthly ({config.currencySymbol})</th>
                    <th className="py-3 px-3">Saving Recommendation</th>
                    <th className="py-3 px-3 w-20">Saving %</th>
                    <th className="py-3 px-3 text-right text-emerald-800 font-bold">Monthly Savings</th>
                    <th className="py-3 px-3 text-right text-teal-800 font-bold">Reduced Bill</th>
                    <th className="py-3 px-3 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-8 text-center text-slate-400">
                        <p className="text-sm">No appliances in this perspective.</p>
                        <p className="text-xs mt-1">
                          Click <strong>"Add Custom Device"</strong> above or select a preset to populate data.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const isTakenInCsv = item.isIncludedInCsv && item.isActiveManual && item.status === "active";
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !item.isActiveManual
                              ? "bg-rose-50/20 text-slate-500"
                              : item.status === "seasonal_off"
                              ? "bg-slate-50/60 text-slate-400"
                              : !item.isIncludedInCsv
                              ? "opacity-50"
                              : ""
                          }`}
                        >
                          {/* Include toggle */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isTakenInCsv}
                              disabled={!item.isActiveManual || item.status !== "active"}
                              onChange={(e) => handleItemFieldChange(item.id, "isIncludedInCsv", e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title={
                                !item.isActiveManual
                                  ? "Deactivated device cannot be included in CSV export"
                                  : item.status === "seasonal_off"
                                  ? "Seasonal-off device is excluded from CSV export"
                                  : "Toggle inclusion in CSV export"
                              }
                            />
                          </td>

                          {/* Name & Category */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-semibold ${!item.isActiveManual ? "line-through text-slate-500" : "text-slate-900"}`}>
                                {item.name}
                              </span>
                              {!item.isActiveManual ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                  Not in CSV (Deactive)
                                </span>
                              ) : item.status === "seasonal_off" ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  Not in CSV (Seasonal Off)
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  In CSV
                                </span>
                              )}
                              {item.isUserAdded && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                  Custom
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">{item.category}</span>
                          </td>

                          {/* Wattage editable */}
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min="1"
                              max="10000"
                              value={item.wattage}
                              onChange={(e) =>
                                handleItemFieldChange(item.id, "wattage", Math.max(1, Number(e.target.value) || 1))
                              }
                              className="w-20 px-2 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>

                          {/* Hours editable */}
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              value={item.dailyHours}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  item.id,
                                  "dailyHours",
                                  Math.max(0, Math.min(24, Number(e.target.value) || 0))
                                )
                              }
                              className="w-16 px-2 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>

                          {/* Quantity editable */}
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemFieldChange(item.id, "quantity", Math.max(1, parseInt(e.target.value, 10) || 1))
                              }
                              className="w-12 px-2 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>

                          {/* Season / Active Status Control */}
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => handleToggleItemActive(item.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs ${
                                item.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                  : item.status === "user_deactivated"
                                  ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                                  : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                              }`}
                              title={
                                item.isActiveManual
                                  ? "Device is Active • Click to Deactivate"
                                  : "Device is Deactivated • Click to Activate"
                              }
                            >
                              {item.status === "active" ? (
                                <>
                                  <Power className="w-3 h-3 text-emerald-600" />
                                  <span>Active</span>
                                </>
                              ) : item.status === "user_deactivated" ? (
                                <>
                                  <PowerOff className="w-3 h-3 text-rose-600" />
                                  <span>Deactive</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                  <span>Off Season</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Daily kWh */}
                          <td className="py-2.5 px-3 text-right font-mono">
                            {item.dailyEnergyKwh.toFixed(2)}
                          </td>

                          {/* Monthly Cost */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {config.currencySymbol}{Math.round(item.monthlyCost).toLocaleString("en-IN")}
                          </td>

                          {/* Saving Recommendation editable */}
                          <td className="py-2.5 px-3 max-w-xs">
                            <input
                              type="text"
                              value={item.savingRecommendation}
                              onChange={(e) => handleItemFieldChange(item.id, "savingRecommendation", e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>

                          {/* Saving % editable */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.savingPotentialPct}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    item.id,
                                    "savingPotentialPct",
                                    Math.max(0, Math.min(100, Number(e.target.value) || 0))
                                  )
                                }
                                className="w-12 px-1.5 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded text-xs font-mono text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                              <span className="text-[10px] text-slate-400">%</span>
                            </div>
                          </td>

                          {/* Monthly Savings */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            {config.currencySymbol}{Math.round(item.monthlySavings).toLocaleString("en-IN")}
                          </td>

                          {/* Reduced Bill */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-800">
                            {config.currencySymbol}{Math.round(item.newReducedBill).toLocaleString("en-IN")}
                          </td>

                          {/* Delete Item */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete from this perspective"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Footer Totals */}
                {includedItems.length > 0 && (
                  <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td className="py-3 px-3 text-center font-normal text-slate-400">✓</td>
                      <td className="py-3 px-3" colSpan={5}>
                        TOTAL FOR "{config.name.toUpperCase()}" ({includedItems.length} Devices Included • {config.billingDays} Days)
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {totalDailyKwh.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sm">
                        {config.currencySymbol}{Math.round(totalMonthlyCost).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px] font-normal" colSpan={2}>
                        {totalMonthlyCost > 0
                          ? `Total achievable ${Math.round((totalMonthlySavings / totalMonthlyCost) * 100)}% reduction`
                          : ""}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-800 text-sm">
                        {config.currencySymbol}{Math.round(totalMonthlySavings).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-teal-900 text-sm">
                        {config.currencySymbol}{Math.round(totalReducedBill).toLocaleString("en-IN")}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="p-3 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                All Wattage, Hours, Quantity, and Recommendation values in this table can be edited directly.
              </span>
              <span className="font-mono text-[11px] text-slate-600">
                <strong className="text-emerald-700">{items.filter((i) => i.isIncludedInCsv && i.isActiveManual && i.status === "active").length} active rows</strong> will be exported to CSV ({items.filter((i) => !i.isActiveManual || i.status !== "active").length} deactivated/seasonal-off excluded)
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Raw CSV Code Block Preview */}
        {activeViewTab === "csvPreview" && (
          <div className="p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto select-text">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>
                  {config.name.replace(/[^a-zA-Z0-9]+/g, "_")}_{config.month.toLowerCase()}.csv
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {generatedCsvString.split("\r\n").length} lines
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={handleDownloadCsv}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 mb-3 text-[11px] text-emerald-300 flex items-center justify-between">
              <span>
                ✓ <strong>Clean Database Export:</strong> Deactivated appliances are excluded ({items.filter((i) => i.isIncludedInCsv && i.isActiveManual && i.status === "active").length} active records exported). Seasonal off is excluded.
              </span>
            </div>

            <pre className="text-[11px] leading-relaxed whitespace-pre font-mono text-emerald-200">
              {generatedCsvString}
            </pre>
          </div>
        )}
      </div>

      {/* MODAL 1: Add Custom Device Modal */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Add Custom Device Input
              </h3>
              <button
                onClick={() => setShowAddDeviceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDeviceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Device / Appliance Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Induction Cooktop, Water Pump, EV Charger"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Operational Status (Active vs Deactive) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Power Status
                </label>
                <div className="flex rounded-xl border border-slate-300 p-1 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setNewDevice({ ...newDevice, isActiveManual: true })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      newDevice.isActiveManual
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    Active (Turned On)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDevice({ ...newDevice, isActiveManual: false })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      !newDevice.isActiveManual
                        ? "bg-rose-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <PowerOff className="w-3.5 h-3.5" />
                    Deactive (Turned Off)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newDevice.category}
                    onChange={(e) =>
                      setNewDevice({
                        ...newDevice,
                        category: e.target.value as Appliance["category"],
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Climate Control">Climate Control</option>
                    <option value="Cooling/Ventilation">Cooling/Ventilation</option>
                    <option value="Refrigeration">Refrigeration</option>
                    <option value="Water Heating">Water Heating</option>
                    <option value="Kitchen & Laundry">Kitchen & Laundry</option>
                    <option value="Computing & Media">Computing & Media</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rated Power (Watts) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newDevice.wattage}
                    onChange={(e) => setNewDevice({ ...newDevice, wattage: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Daily Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    max="24"
                    value={newDevice.dailyHours}
                    onChange={(e) => setNewDevice({ ...newDevice, dailyHours: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newDevice.quantity}
                    onChange={(e) => setNewDevice({ ...newDevice, quantity: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Saving Potential %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newDevice.savingPotentialPct}
                    onChange={(e) => setNewDevice({ ...newDevice, savingPotentialPct: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Saving Recommendation / Action
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule run-time for off-peak solar hours; avoid standby drain."
                  value={newDevice.savingRecommendation}
                  onChange={(e) => setNewDevice({ ...newDevice, savingRecommendation: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="all-seasons"
                  checked={newDevice.allSeasons}
                  onChange={(e) => setNewDevice({ ...newDevice, allSeasons: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="all-seasons" className="text-xs text-slate-700 cursor-pointer">
                  Active in all seasons (Year-round operation)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  Add to Perspective
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Import / Paste CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                Import External CSV or Paste Data
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Upload an existing CSV file or paste raw comma-separated rows. Columns like{" "}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-800">Device, Watts, Hours</code> will be auto-detected and added into this perspective.
            </p>

            {/* File drag / upload */}
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-xl p-4 text-center cursor-pointer bg-slate-50/60 hover:bg-slate-50 transition">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer block">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="text-xs font-semibold text-emerald-800">
                  Click to select .CSV file
                </span>{" "}
                <span className="text-xs text-slate-500">from your computer</span>
              </label>
            </div>

            {/* Paste Text Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Or Paste CSV Text Directly:
              </label>
              <textarea
                rows={6}
                value={csvImportText}
                onChange={(e) => setCsvImportText(e.target.value)}
                placeholder={`Device,Watts,Hours,Category\nSolar Inverter AC,1200,8,Climate Control\nBLDC Ceiling Fan,30,14,Cooling\nGeyser,2000,1.5,Water Heating`}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{importSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleImportCsv}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Parse & Import CSV Rows
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
