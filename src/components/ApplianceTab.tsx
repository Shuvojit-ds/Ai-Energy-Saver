import React, { useState } from "react";
import { Plus, Trash2, Edit3, Check, RotateCcw, Zap, Clock, Calendar, Power, PowerOff, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Appliance, ApplianceCalculation, MonthName, Season } from "../types";
import { MONTH_TO_SEASON_MAP } from "../data/applianceData";

interface ApplianceTabProps {
  appliances: Appliance[];
  calculations: ApplianceCalculation[];
  selectedMonth: MonthName;
  onUpdateAppliance: (updated: Appliance) => void;
  onBulkToggleActive?: (activate: boolean) => void;
  onAddAppliance: (newAppliance: Appliance) => void;
  onDeleteAppliance: (id: string) => void;
  onResetToDefaults: () => void;
  electricityRate: number;
  useSeasonalOff?: boolean;
  onToggleSeasonalOff?: () => void;
}

export const ApplianceTab: React.FC<ApplianceTabProps> = ({
  appliances,
  calculations,
  selectedMonth,
  onUpdateAppliance,
  onBulkToggleActive,
  onAddAppliance,
  onDeleteAppliance,
  onResetToDefaults,
  electricityRate,
  useSeasonalOff = false,
  onToggleSeasonalOff,
}) => {
  const currentSeason: Season = MONTH_TO_SEASON_MAP[selectedMonth];
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deactivated" | "seasonal_off" | "user_given">("all");

  // New appliance form state (User giving input)
  const [newName, setNewName] = useState("");
  const [newWattage, setNewWattage] = useState(100);
  const [newHours, setNewHours] = useState(4);
  const [newPeriod, setNewPeriod] = useState<Appliance["timePeriod"]>("Morning");
  const [newCategory, setNewCategory] = useState<Appliance["category"]>("Other");
  const [newIsActive, setNewIsActive] = useState<boolean>(true);
  const [newSeasons, setNewSeasons] = useState<Season[]>(["Summer", "Monsoon", "Autumn", "Winter", "Spring"]);

  const allSeasons: Season[] = ["Summer", "Monsoon", "Autumn", "Winter", "Spring"];

  // Counts
  const totalCount = calculations.length;
  const activeCount = calculations.filter((c) => c.status === "active").length;
  const deactivatedCount = calculations.filter((c) => c.status === "user_deactivated").length;
  const seasonalOffCount = calculations.filter((c) => c.status === "seasonal_off").length;
  const userGivenCount = appliances.filter((a) => a.isUserAdded || a.id.includes("custom")).length;

  const totalActiveWattage = calculations
    .filter((c) => c.status === "active")
    .reduce((acc, c) => acc + c.appliance.wattage, 0);

  const totalDailyKwh = calculations
    .filter((c) => c.status === "active")
    .reduce((acc, c) => acc + c.dailyEnergyKwh, 0);

  // Bulk active/deactive actions
  const handleActivateAll = () => {
    if (onBulkToggleActive) {
      onBulkToggleActive(true);
    } else {
      appliances.forEach((a) => {
        if (!a.isActiveManual) {
          onUpdateAppliance({ ...a, isActiveManual: true });
        }
      });
    }
  };

  const handleDeactivateAll = () => {
    if (onBulkToggleActive) {
      onBulkToggleActive(false);
    } else {
      appliances.forEach((a) => {
        if (a.isActiveManual) {
          onUpdateAppliance({ ...a, isActiveManual: false });
        }
      });
    }
  };

  const handleCreateAppliance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created: Appliance = {
      id: `app-custom-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      wattage: Math.max(5, newWattage),
      usageHoursDaily: Math.min(24, Math.max(0.25, newHours)),
      timePeriod: newPeriod,
      activeSeasons: newSeasons.length > 0 ? newSeasons : ["Summer", "Monsoon", "Autumn", "Winter", "Spring"],
      isActiveManual: newIsActive,
      isUserAdded: true,
      efficiencyTip: "Keep usage scheduled during non-peak utility tariff windows.",
      savingPotentialPct: 20,
    };

    onAddAppliance(created);
    setNewName("");
    setNewWattage(100);
    setNewHours(4);
    setNewIsActive(true);
    setIsAdding(false);
  };

  const toggleSeasonForNew = (season: Season) => {
    if (newSeasons.includes(season)) {
      if (newSeasons.length > 1) {
        setNewSeasons(newSeasons.filter((s) => s !== season));
      }
    } else {
      setNewSeasons([...newSeasons, season]);
    }
  };

  // Filtered list
  const filteredCalculations = calculations.filter((calc) => {
    if (statusFilter === "active") return calc.status === "active";
    if (statusFilter === "deactivated") return calc.status === "user_deactivated";
    if (statusFilter === "seasonal_off") return calc.status === "seasonal_off";
    if (statusFilter === "user_given") return calc.appliance.isUserAdded || calc.appliance.id.includes("custom");
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Appliance Inventory & Power Control
            <span className="text-xs font-normal text-slate-500">
              ({activeCount} Active • {deactivatedCount} Deactivated)
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Currently simulating for <span className="font-semibold text-emerald-700">{selectedMonth} ({currentSeason})</span> • Tariff ₹{electricityRate}/kWh • Active Load: <span className="font-semibold text-slate-800">{totalActiveWattage}W</span> ({totalDailyKwh.toFixed(1)} kWh/day)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seasonal Schedule Mode Toggle */}
          {onToggleSeasonalOff && (
            <button
              type="button"
              onClick={onToggleSeasonalOff}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                useSeasonalOff
                  ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                  : "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
              }`}
              title={
                useSeasonalOff
                  ? "Seasonal Off mode is ON (devices only run in their active seasons)"
                  : "Seasonal Off is OFF (all active devices run all year round)"
              }
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Seasonal Off: <strong>{useSeasonalOff ? "Enabled" : "Off (Run All Year)"}</strong>
              </span>
            </button>
          )}

          {/* Quick Bulk Active/Deactive Buttons */}
          <button
            onClick={handleActivateAll}
            className="px-3 py-2 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            title="Turn on all appliances"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Activate All
          </button>
          <button
            onClick={handleDeactivateAll}
            className="px-3 py-2 text-xs font-medium text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            title="Turn off / deactivate all appliances"
          >
            <PowerOff className="w-3.5 h-3.5" />
            Deactivate All
          </button>
          <button
            onClick={onResetToDefaults}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Appliance
          </button>
        </div>
      </div>

      {/* Database & CSV Export Policy Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 px-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>
            <strong className="text-emerald-300">CSV Database Rule:</strong> Only active appliances are recorded in the database & CSV report. Deactivated appliances are automatically excluded.
          </span>
        </div>
        <div className="text-[11px] text-slate-300">
          Seasonal mode: <strong className="text-white">{useSeasonalOff ? "Season-filtered" : "Not using seasonal off (active year-round)"}</strong>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
            statusFilter === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Appliances ({totalCount})
        </button>
        <button
          onClick={() => setStatusFilter("active")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
            statusFilter === "active"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Active ({activeCount})
        </button>
        <button
          onClick={() => setStatusFilter("deactivated")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
            statusFilter === "deactivated"
              ? "bg-rose-600 text-white border-rose-600 shadow-xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          Deactivated by User ({deactivatedCount})
        </button>
        <button
          onClick={() => setStatusFilter("seasonal_off")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
            statusFilter === "seasonal_off"
              ? "bg-slate-700 text-white border-slate-700 shadow-xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
          }`}
        >
          Seasonal Off ({seasonalOffCount})
        </button>
        {userGivenCount > 0 && (
          <button
            onClick={() => setStatusFilter("user_given")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
              statusFilter === "user_given"
                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700"
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            User Given ({userGivenCount})
          </button>
        )}
      </div>

      {/* Add Appliance Drawer / Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateAppliance}
          className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              Add User-Given Electrical Appliance
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Appliance Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Induction Cooktop, EV Charger"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as Appliance["category"])}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Climate Control">Climate Control</option>
                <option value="Cooling/Ventilation">Cooling/Ventilation</option>
                <option value="Refrigeration">Refrigeration</option>
                <option value="Computing & Media">Computing & Media</option>
                <option value="Lighting">Lighting</option>
                <option value="Water Heating">Water Heating</option>
                <option value="Kitchen & Laundry">Kitchen & Laundry</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Power Rating (Watts)</label>
              <input
                type="number"
                min="5"
                max="10000"
                value={newWattage}
                onChange={(e) => setNewWattage(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Usage (Hours)</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={newHours}
                onChange={(e) => setNewHours(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
              <div className="flex rounded-lg border border-slate-300 p-0.5 bg-white">
                <button
                  type="button"
                  onClick={() => setNewIsActive(true)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition ${
                    newIsActive
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Power className="w-3 h-3" />
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setNewIsActive(false)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition ${
                    !newIsActive
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <PowerOff className="w-3 h-3" />
                  Deactive
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Active Seasons (Appliance will be marked &quot;Seasonal Off&quot; outside these seasons):
            </label>
            <div className="flex flex-wrap gap-2">
              {allSeasons.map((season) => {
                const isSelected = newSeasons.includes(season);
                return (
                  <button
                    key={season}
                    type="button"
                    onClick={() => toggleSeasonForNew(season)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {season}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 shadow-xs"
            >
              Save Appliance
            </button>
          </div>
        </form>
      )}

      {/* Appliance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCalculations.map((calc) => {
          const app = calc.appliance;
          const isEditing = editingId === app.id;
          const isUserGiven = app.isUserAdded || app.id.includes("custom");

          return (
            <div
              key={app.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all relative ${
                calc.status === "user_deactivated"
                  ? "border-rose-200/80 bg-rose-50/20"
                  : calc.status === "seasonal_off"
                  ? "border-slate-200 bg-slate-50/60 opacity-85"
                  : "border-slate-200/90 hover:border-emerald-300"
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{app.name}</h3>
                    {isUserGiven && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        User Given
                      </span>
                    )}
                  </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {calc.status === "active" && (
                        <>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-900 border border-emerald-300">
                            Included in CSV
                          </span>
                        </>
                      )}
                      {calc.status === "user_deactivated" && (
                        <>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <PowerOff className="w-2.5 h-2.5" />
                            Deactivated
                          </span>
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-rose-100/80 text-rose-800 border border-rose-300">
                            Not in CSV
                          </span>
                        </>
                      )}
                      {calc.status === "seasonal_off" && (
                        <>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            Seasonal Off
                          </span>
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-300">
                            Not in CSV
                          </span>
                        </>
                      )}

                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {app.timePeriod}
                      </span>
                    </div>
                </div>

                {/* Prominent Active / Deactive Toggle Button */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateAppliance({ ...app, isActiveManual: !app.isActiveManual })
                  }
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    app.isActiveManual
                      ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
                      : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300"
                  }`}
                  title={app.isActiveManual ? "Click to Deactivate device" : "Click to Activate device"}
                >
                  {app.isActiveManual ? (
                    <>
                      <Power className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <PowerOff className="w-3.5 h-3.5 text-rose-600" />
                      <span>Deactive</span>
                    </>
                  )}
                </button>
              </div>

              {/* Edit vs Static Parameters */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                {isEditing ? (
                  <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500">Power (Watts)</label>
                        <input
                          type="number"
                          value={app.wattage}
                          onChange={(e) =>
                            onUpdateAppliance({ ...app, wattage: Number(e.target.value) || 10 })
                          }
                          className="w-full bg-white p-1 border rounded"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500">Daily Hours</label>
                        <input
                          type="number"
                          step="0.5"
                          value={app.usageHoursDaily}
                          onChange={(e) =>
                            onUpdateAppliance({
                              ...app,
                              usageHoursDaily: Math.min(24, Math.max(0.1, Number(e.target.value) || 1)),
                            })
                          }
                          className="w-full bg-white p-1 border rounded"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingId(null)}
                      className="w-full py-1 bg-emerald-600 text-white rounded font-medium flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Done
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <div className="text-[11px] text-slate-500">Power Rating</div>
                      <div className="font-bold text-slate-800">{app.wattage} Watts</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <div className="text-[11px] text-slate-500">Daily Run</div>
                      <div className="font-bold text-slate-800">
                        {app.isActiveManual ? `${app.usageHoursDaily} hrs/day` : "0 hrs (Off)"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Calculated Stats */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs py-1.5 bg-slate-50/70 rounded-xl border border-slate-100">
                  <div className="p-1">
                    <div className="text-[10px] text-slate-400">Daily kWh</div>
                    <div className="font-bold text-slate-800">{calc.dailyEnergyKwh.toFixed(2)}</div>
                  </div>
                  <div className="p-1 border-x border-slate-200">
                    <div className="text-[10px] text-slate-400">Monthly Cost</div>
                    <div className="font-bold text-slate-900">₹{calc.monthlyCost.toFixed(0)}</div>
                  </div>
                  <div className="p-1">
                    <div className="text-[10px] text-emerald-600">Savings</div>
                    <div className="font-bold text-emerald-700">₹{calc.monthlySavings.toFixed(0)}</div>
                  </div>
                </div>

                {/* Efficiency Tip */}
                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                  💡 {app.efficiencyTip}
                </p>
              </div>

              {/* Bottom Card Controls */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {app.activeSeasons.join(", ")}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingId(isEditing ? null : app.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    title="Edit appliance"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {appliances.length > 1 && (
                    <button
                      onClick={() => onDeleteAppliance(app.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete appliance"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCalculations.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-semibold text-sm text-slate-700">No appliances match the &quot;{statusFilter}&quot; filter</p>
          <button
            onClick={() => setStatusFilter("all")}
            className="text-xs text-emerald-600 font-semibold hover:underline"
          >
            Show All Appliances
          </button>
        </div>
      )}
    </div>
  );
};
