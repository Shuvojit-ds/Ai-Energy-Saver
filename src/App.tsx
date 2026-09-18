/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { Header } from "./components/Header";
import { OverviewTab } from "./components/OverviewTab";
import { ApplianceTab } from "./components/ApplianceTab";
import { MachineLearningTab } from "./components/MachineLearningTab";
import { RagWorkflowTab } from "./components/RagWorkflowTab";
import { AgenticAiTab } from "./components/AgenticAiTab";
import { ReportsTab } from "./components/ReportsTab";
import { Appliance, MonthName } from "./types";
import { INITIAL_APPLIANCES, calculateApplianceMetrics } from "./data/applianceData";
import { Zap, ShieldCheck, Github, Heart } from "lucide-react";

export default function App() {
  const [selectedMonth, setSelectedMonth] = useState<MonthName>("September");
  const [electricityRate, setElectricityRate] = useState<number>(8.0);
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Load stored appliances from localStorage or fall back to INITIAL_APPLIANCES
  const [appliances, setAppliances] = useState<Appliance[]>(() => {
    try {
      const saved = localStorage.getItem("ai_energy_appliances");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not read localStorage for appliances", e);
    }
    return INITIAL_APPLIANCES;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("ai_energy_appliances", JSON.stringify(appliances));
    } catch (e) {
      console.warn("Could not write to localStorage", e);
    }
  }, [appliances]);

  // Seasonal off mode toggle: default false ("not using seasonal off")
  const [useSeasonalOff, setUseSeasonalOff] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("ai_energy_use_seasonal_off");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("ai_energy_use_seasonal_off", JSON.stringify(useSeasonalOff));
    } catch (e) {
      console.warn("Could not write seasonal off setting", e);
    }
  }, [useSeasonalOff]);

  const handleToggleSeasonalOff = () => {
    setUseSeasonalOff((prev) => !prev);
  };

  // Dynamic calculations for all appliances based on selectedMonth, tariff, & seasonal mode
  const calculations = useMemo(() => {
    return appliances.map((app) =>
      calculateApplianceMetrics(app, selectedMonth, electricityRate, useSeasonalOff)
    );
  }, [appliances, selectedMonth, electricityRate, useSeasonalOff]);

  // Appliance state handlers
  const handleUpdateAppliance = (updated: Appliance) => {
    setAppliances((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleBulkToggleActive = (activate: boolean) => {
    setAppliances((prev) =>
      prev.map((a) => ({
        ...a,
        isActiveManual: activate,
      }))
    );
  };

  const handleAddAppliance = (newApp: Appliance) => {
    setAppliances((prev) => [newApp, ...prev]);
  };

  const handleDeleteAppliance = (id: string) => {
    setAppliances((prev) => prev.filter((a) => a.id !== id));
  };

  const handleResetToDefaults = () => {
    setAppliances(INITIAL_APPLIANCES);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation & Controls */}
      <Header
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        electricityRate={electricityRate}
        onRateChange={setElectricityRate}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === "overview" && (
          <OverviewTab
            selectedMonth={selectedMonth}
            calculations={calculations}
            electricityRate={electricityRate}
            onNavigateToTab={setActiveTab}
            appliances={appliances}
            onUpdateAppliance={handleUpdateAppliance}
            onBulkToggleActive={handleBulkToggleActive}
            useSeasonalOff={useSeasonalOff}
            onToggleSeasonalOff={handleToggleSeasonalOff}
          />
        )}

        {activeTab === "appliances" && (
          <ApplianceTab
            appliances={appliances}
            calculations={calculations}
            selectedMonth={selectedMonth}
            onUpdateAppliance={handleUpdateAppliance}
            onBulkToggleActive={handleBulkToggleActive}
            onAddAppliance={handleAddAppliance}
            onDeleteAppliance={handleDeleteAppliance}
            onResetToDefaults={handleResetToDefaults}
            electricityRate={electricityRate}
            useSeasonalOff={useSeasonalOff}
            onToggleSeasonalOff={handleToggleSeasonalOff}
          />
        )}

        {activeTab === "ml" && (
          <MachineLearningTab electricityRate={electricityRate} />
        )}

        {activeTab === "rag" && (
          <RagWorkflowTab
            selectedMonth={selectedMonth}
            calculations={calculations}
            electricityRate={electricityRate}
          />
        )}

        {activeTab === "agent" && (
          <AgenticAiTab
            selectedMonth={selectedMonth}
            calculations={calculations}
            electricityRate={electricityRate}
          />
        )}

        {activeTab === "reports" && (
          <ReportsTab
            selectedMonth={selectedMonth}
            calculations={calculations}
            electricityRate={electricityRate}
            appliances={appliances}
            onUpdateAppliance={handleUpdateAppliance}
            onBulkToggleActive={handleBulkToggleActive}
            useSeasonalOff={useSeasonalOff}
            onToggleSeasonalOff={handleToggleSeasonalOff}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
              <Zap className="w-3 h-3 fill-current" />
            </div>
            <span className="font-semibold text-slate-800">AI Energy Saver</span>
            <span>• Kaggle ML Ridge Regression • RAG Knowledge Vault • Agentic AI Auditor</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Grounded in BEE Energy Standards
            </span>
            <span>•</span>
            <span>Production Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
