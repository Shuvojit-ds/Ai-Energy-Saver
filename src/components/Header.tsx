import React from "react";
import { Zap, Calendar, IndianRupee, Sparkles, Sliders, Database, BookOpen, Bot, FileSpreadsheet } from "lucide-react";
import { MonthName, Season } from "../types";
import { MONTH_LIST, MONTH_TO_SEASON_MAP } from "../data/applianceData";

interface HeaderProps {
  selectedMonth: MonthName;
  onMonthChange: (month: MonthName) => void;
  electricityRate: number;
  onRateChange: (rate: number) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedMonth,
  onMonthChange,
  electricityRate,
  onRateChange,
  activeTab,
  onTabChange,
}) => {
  const currentSeason: Season = MONTH_TO_SEASON_MAP[selectedMonth];

  const getSeasonColor = (season: Season) => {
    switch (season) {
      case "Summer":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Monsoon":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Autumn":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "Winter":
        return "bg-cyan-100 text-cyan-800 border-cyan-300";
      case "Spring":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
  };

  const navTabs = [
    { id: "overview", label: "Overview & Monthly", icon: Sliders },
    { id: "appliances", label: "Appliances", icon: Zap },
    { id: "ml", label: "Kaggle ML (Ridge)", icon: Database },
    { id: "rag", label: "RAG Energy Vault", icon: BookOpen },
    { id: "agent", label: "Agentic AI Auditor", icon: Bot },
    { id: "reports", label: "Reports & CSV", icon: FileSpreadsheet },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">AI Energy Saver</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3 h-3 mr-1 text-emerald-600" />
                  RAG + Agentic AI
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Kaggle ML Ridge Regression • Seasonal Intelligence • Automated Savings
              </p>
            </div>
          </div>

          {/* Controls: Month selector & Electricity Rate */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Seasonal Badge & Month Picker */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-500 ml-1.5" />
              <label htmlFor="month-select" className="sr-only">
                Select Month
              </label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value as MonthName)}
                className="bg-transparent text-sm font-medium text-slate-800 focus:outline-none cursor-pointer pr-2"
              >
                {MONTH_LIST.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <span
                className={`text-xs px-2 py-0.5 rounded-md font-medium border ${getSeasonColor(currentSeason)}`}
              >
                {currentSeason}
              </span>
            </div>

            {/* Electricity Rate setting */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 px-3 rounded-xl border border-slate-200">
              <IndianRupee className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-600">Rate:</span>
              <input
                type="number"
                min="1"
                max="50"
                step="0.5"
                value={electricityRate}
                onChange={(e) => onRateChange(Math.max(1, Number(e.target.value) || 1))}
                className="w-12 text-sm font-bold text-slate-800 bg-transparent text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1"
              />
              <span className="text-xs text-slate-500">/kWh</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto border-t border-slate-100 py-1.5 scrollbar-none" aria-label="Tabs">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-700" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
