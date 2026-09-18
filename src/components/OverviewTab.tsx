import React from "react";
import {
  Zap,
  TrendingDown,
  Calendar,
  AlertCircle,
  Leaf,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowDownRight,
  Power,
  PowerOff,
} from "lucide-react";
import { Appliance, ApplianceCalculation, MonthName, Season } from "../types";
import { MONTH_TO_SEASON_MAP } from "../data/applianceData";

interface OverviewTabProps {
  selectedMonth: MonthName;
  calculations: ApplianceCalculation[];
  electricityRate: number;
  onNavigateToTab: (tab: string) => void;
  appliances?: Appliance[];
  onUpdateAppliance?: (appliance: Appliance) => void;
  onBulkToggleActive?: (activate: boolean) => void;
  useSeasonalOff?: boolean;
  onToggleSeasonalOff?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  selectedMonth,
  calculations,
  electricityRate,
  onNavigateToTab,
  appliances,
  onUpdateAppliance,
  onBulkToggleActive,
  useSeasonalOff = false,
  onToggleSeasonalOff,
}) => {
  const currentSeason: Season = MONTH_TO_SEASON_MAP[selectedMonth];

  // Totals
  const activeCalcs = calculations.filter((c) => c.status === "active");
  const userDeactivatedCalcs = calculations.filter((c) => c.status === "user_deactivated");
  const seasonalOffCalcs = calculations.filter((c) => c.status === "seasonal_off");

  const totalDailyKwh = calculations.reduce((acc, c) => acc + c.dailyEnergyKwh, 0);
  const totalMonthlyKwh = totalDailyKwh * 30;
  const totalMonthlyCost = calculations.reduce((acc, c) => acc + c.monthlyCost, 0);
  const totalPotentialSaving = calculations.reduce((acc, c) => acc + c.monthlySavings, 0);
  const reducedEstimatedCost = Math.max(0, totalMonthlyCost - totalPotentialSaving);
  const percentSaved = totalMonthlyCost > 0 ? Math.round((totalPotentialSaving / totalMonthlyCost) * 100) : 0;

  // Environmental impact (approx. 0.82 kg CO2 per kWh on coal-heavy grid)
  const co2MonthlyKg = Math.round(totalMonthlyKwh * 0.82);
  const co2SavedKg = Math.round((totalPotentialSaving / electricityRate) * 0.82);

  // Highest consuming appliance
  const sortedByCost = [...calculations].sort((a, b) => b.monthlyCost - a.monthlyCost);
  const topConsumer = sortedByCost[0];

  // Seasonal context explanation
  const getSeasonalInsight = (season: Season) => {
    switch (season) {
      case "Summer":
        return "Peak cooling season. AC and ceiling fans account for up to 65% of your bill. Thermostat optimization and fan timer rules yield maximal savings.";
      case "Monsoon":
        return "High relative humidity raises cooling compressor workloads and condensation loads. Using AC dry/dehumidification mode can cut power draw.";
      case "Winter":
        return "Water geysers and space heaters dominate consumption. AC is seasonally inactive, shifting peak load to morning hours.";
      case "Autumn":
      case "Spring":
        return "Moderate ambient climate allows natural cross-ventilation. AC is largely turned off, keeping total daily power under 12 kWh.";
    }
  };

  return (
    <div className="space-y-6">
      {/* Seasonal Energy Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Household Intelligence
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {selectedMonth} ({currentSeason})
              </span>
              {onToggleSeasonalOff && (
                <button
                  type="button"
                  onClick={onToggleSeasonalOff}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                  title="Toggle Seasonal Off Restrictions"
                >
                  Seasonal Off: <strong className={useSeasonalOff ? "text-amber-300" : "text-emerald-400"}>{useSeasonalOff ? "Enabled" : "Disabled (All Year Active)"}</strong>
                </button>
              )}
            </div>

            {/* Dynamic Energy Profile Heading - Changes instantly on Active / Deactive */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {currentSeason} Energy Profile:
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-sm sm:text-base font-extrabold flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {activeCalcs.length} Active
                </span>
                <span className={`px-3 py-1 rounded-xl text-sm sm:text-base font-extrabold flex items-center gap-1.5 border transition-all ${
                  userDeactivatedCalcs.length > 0
                    ? "bg-rose-500/25 text-rose-200 border-rose-500/50 shadow-xs"
                    : "bg-slate-800/60 text-slate-400 border-slate-700/60"
                }`}>
                  <PowerOff className="w-3.5 h-3.5" />
                  {userDeactivatedCalcs.length} Deactivated
                </span>
                {seasonalOffCalcs.length > 0 && (
                  <span className="px-3 py-1 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700 text-sm font-semibold">
                    {seasonalOffCalcs.length} Seasonal Off
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {getSeasonalInsight(currentSeason)}
            </p>

            {/* Quick Bulk Actions directly on the Overview Banner */}
            {onBulkToggleActive && (
              <div className="pt-1 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 font-medium">Quick Household Control:</span>
                <button
                  type="button"
                  onClick={() => onBulkToggleActive(true)}
                  className="px-3 py-1 text-xs font-bold text-emerald-200 hover:text-white bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-500/40 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  title="Activate all appliances in household"
                >
                  <Power className="w-3.5 h-3.5 text-emerald-400" />
                  Activate All ({calculations.length})
                </button>
                <button
                  type="button"
                  onClick={() => onBulkToggleActive(false)}
                  className="px-3 py-1 text-xs font-bold text-rose-200 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  title="Deactivate all appliances (excludes all from CSV export)"
                >
                  <PowerOff className="w-3.5 h-3.5 text-rose-400" />
                  Deactivate All
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateToTab("agent")}
            className="self-start md:self-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all hover:shadow-emerald-500/30 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            Run Agentic Audit
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Energy */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Daily Energy</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{totalDailyKwh.toFixed(1)} <span className="text-sm font-medium text-slate-500">kWh/day</span></div>
            <p className="text-xs text-slate-500 mt-1">~{totalMonthlyKwh.toFixed(0)} kWh for {selectedMonth}</p>
          </div>
        </div>

        {/* Monthly Estimated Bill */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Current Monthly Bill</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="text-sm font-bold">₹</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">₹{totalMonthlyCost.toLocaleString("en-IN")}</div>
            <p className="text-xs text-slate-500 mt-1">At ₹{electricityRate}/kWh utility tariff</p>
          </div>
        </div>

        {/* Potential Savings */}
        <div className="bg-emerald-50/70 rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Potential Monthly Saving</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-200/60 text-emerald-800 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-900">₹{totalPotentialSaving.toLocaleString("en-IN")}</div>
            <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {percentSaved}% potential bill reduction
            </p>
          </div>
        </div>

        {/* Reduced Estimated Cost */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Reduced Target Bill</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-teal-800">₹{reducedEstimatedCost.toLocaleString("en-IN")}</div>
            <p className="text-xs text-slate-500 mt-1">Annual saving: ₹{(totalPotentialSaving * 12).toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Cost Breakdown vs Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Appliance Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Appliance Consumption Contribution</h3>
              <p className="text-xs text-slate-500">Monthly breakdown for {selectedMonth}</p>
            </div>
            <button
              onClick={() => onNavigateToTab("appliances")}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Configure Appliances <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {calculations.map((item) => {
              const share = totalMonthlyCost > 0 ? (item.monthlyCost / totalMonthlyCost) * 100 : 0;
              return (
                <div key={item.appliance.id} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-semibold ${item.status === "user_deactivated" ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {item.appliance.name}
                      </span>
                      {item.status === "user_deactivated" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 font-semibold border border-rose-200">
                          Deactivated
                        </span>
                      )}
                      {item.status === "seasonal_off" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-medium">
                          Seasonal Off
                        </span>
                      )}
                      {item.appliance.isUserAdded && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-medium">
                          User Added
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-slate-500 hidden sm:inline">{item.dailyEnergyKwh.toFixed(2)} kWh/d</span>
                      <span className="font-bold text-slate-900 w-14 sm:w-16 text-right">
                        ₹{item.monthlyCost.toFixed(0)}
                      </span>
                      <span className="text-slate-400 w-8 sm:w-10 text-right text-[11px]">
                        {share.toFixed(0)}%
                      </span>
                      {onUpdateAppliance && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateAppliance({
                              ...item.appliance,
                              isActiveManual: item.appliance.isActiveManual === false ? true : false,
                            })
                          }
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs ${
                            item.appliance.isActiveManual !== false
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                          }`}
                          title={
                            item.appliance.isActiveManual !== false
                              ? "Click to Deactivate device (decrements active count)"
                              : "Click to Activate device (increments active count)"
                          }
                        >
                          {item.appliance.isActiveManual !== false ? (
                            <>
                              <Power className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <PowerOff className="w-2.5 h-2.5 text-rose-600" />
                              <span>Deactive</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.status === "user_deactivated"
                          ? "bg-rose-200"
                          : item.status === "seasonal_off"
                          ? "bg-slate-300"
                          : share > 30
                          ? "bg-amber-500"
                          : share > 15
                          ? "bg-emerald-500"
                          : "bg-teal-400"
                      }`}
                      style={{ width: `${Math.max(share, 1.5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Environmental Carbon Metric */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>Carbon footprint: <strong>{co2MonthlyKg} kg CO₂</strong> / month</span>
            </div>
            <div className="text-emerald-700 font-medium">
              Potential reduction: ~{co2SavedKg} kg CO₂/mo
            </div>
          </div>
        </div>

        {/* Right Column: Key Opportunities */}
        <div className="space-y-4">
          {/* Top Consumer Focus */}
          {topConsumer && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Highest Bill Contributor</h4>
                  <p className="text-xs text-amber-800 mt-1 font-semibold">
                    {topConsumer.appliance.name}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Consuming ₹{topConsumer.monthlyCost.toFixed(0)}/mo ({topConsumer.dailyEnergyKwh.toFixed(1)} kWh/day)
                  </p>
                  <p className="text-xs text-amber-900 mt-2 bg-amber-100/60 p-2 rounded-lg leading-relaxed">
                    💡 <strong>Opportunity:</strong> {topConsumer.savingRecommendation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Advanced Workflows
            </h4>

            <button
              onClick={() => onNavigateToTab("ml")}
              className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                  Kaggle Ridge Regression ML
                </div>
                <div className="text-[11px] text-slate-500">
                  Inspect model weights, alpha tuning & predict kWh
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </button>

            <button
              onClick={() => onNavigateToTab("rag")}
              className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                  RAG Energy Knowledge Vault
                </div>
                <div className="text-[11px] text-slate-500">
                  BEE star ratings, ToU tariffs & citation-grounded AI
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </button>

            <button
              onClick={() => onNavigateToTab("reports")}
              className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                  Export Appliance CSV Report
                </div>
                <div className="text-[11px] text-slate-500">
                  Compatible with Microsoft Excel & Google Sheets
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
