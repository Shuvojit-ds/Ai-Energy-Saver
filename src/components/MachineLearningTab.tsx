import React, { useState, useMemo } from "react";
import {
  Database,
  BrainCircuit,
  Sliders,
  Sparkles,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Table,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { KaggleRecord } from "../types";
import { KAGGLE_RAW_DATASET, getKaggleDatasetStatistics } from "../data/kaggleEnergyData";
import { trainRidgeRegression, predictEnergyConsumption, RidgeTrainedModel } from "../utils/ridgeRegression";

interface MachineLearningTabProps {
  electricityRate: number;
}

export const MachineLearningTab: React.FC<MachineLearningTabProps> = ({ electricityRate }) => {
  const [dataset] = useState<KaggleRecord[]>(KAGGLE_RAW_DATASET);
  const [alpha, setAlpha] = useState<number>(1.0);
  const [filterSeason, setFilterSeason] = useState<string>("All");

  // What-if simulator inputs
  const [simHour, setSimHour] = useState<number>(20); // 8 PM evening peak
  const [simMonth, setSimMonth] = useState<number>(5); // May Summer
  const [simTemp, setSimTemp] = useState<number>(38.0); // Hot summer
  const [simHumidity, setSimHumidity] = useState<number>(48);
  const [simIsWeekend, setSimIsWeekend] = useState<boolean>(false);

  // Train Ridge Regression model dynamically when alpha changes
  const trainedModel: RidgeTrainedModel = useMemo(() => {
    return trainRidgeRegression(dataset, alpha, 0.8);
  }, [dataset, alpha]);

  // Dataset metrics
  const stats = useMemo(() => getKaggleDatasetStatistics(dataset), [dataset]);

  // Prediction calculation
  const isSimPeak = simHour >= 18 && simHour <= 22;
  const prediction = useMemo(() => {
    return predictEnergyConsumption(trainedModel, {
      hour: simHour,
      month: simMonth,
      temperatureC: simTemp,
      humidityPct: simHumidity,
      isWeekend: simIsWeekend,
      isPeakHour: isSimPeak,
    });
  }, [trainedModel, simHour, simMonth, simTemp, simHumidity, simIsWeekend, isSimPeak]);

  const estimatedDailyCost = prediction.predictedKwhDay * electricityRate;
  const estimatedMonthlyCost = estimatedDailyCost * 30;

  // Filtered dataset for table
  const displayedRecords = useMemo(() => {
    if (filterSeason === "All") return dataset;
    return dataset.filter((r) => r.season === filterSeason);
  }, [dataset, filterSeason]);

  return (
    <div className="space-y-6">
      {/* Header & ML Overview */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Ridge Regression Energy Machine Learning Model
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Trained on Kaggle Household Electric Power Consumption dataset with L2 Regularization
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <Sliders className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">L2 Alpha (λ):</span>
              <span className="text-xs font-mono font-bold text-indigo-600 w-8">{alpha}</span>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.5"
                value={alpha}
                onChange={(e) => setAlpha(Number(e.target.value))}
                className="w-24 accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Model Evaluation Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <div className="text-[11px] font-semibold text-slate-500">R² Score (Goodness of Fit)</div>
            <div className="text-xl font-black text-indigo-900 mt-0.5">
              {trainedModel.metrics.r2Score}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">80/20 Train-Test Split</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <div className="text-[11px] font-semibold text-slate-500">RMSE (Root Mean Sq. Error)</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">
              {trainedModel.metrics.rmse} <span className="text-xs font-normal text-slate-500">kW</span>
            </div>
            <div className="text-[10px] text-slate-500">Low variance on test split</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <div className="text-[11px] font-semibold text-slate-500">MAE (Mean Absolute Error)</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">
              {trainedModel.metrics.mae} <span className="text-xs font-normal text-slate-500">kW</span>
            </div>
            <div className="text-[10px] text-slate-500">Average error per observation</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <div className="text-[11px] font-semibold text-slate-500">Dataset Training Size</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">
              {stats.totalCount} <span className="text-xs font-normal text-slate-500">records</span>
            </div>
            <div className="text-[10px] text-indigo-600 font-medium">Multi-season Kaggle data</div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Feature Importance Weights vs Live Predictor Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feature Coefficients (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Ridge Feature Weights (β Coefficients)
              </h3>
              <p className="text-[11px] text-slate-500">Relative impact on active power kW</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Bias Intercept: {trainedModel.metrics.intercept} kW
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {trainedModel.metrics.coefficients.map((c) => {
              const isPositive = c.weight >= 0;
              const barWidth = Math.min(100, Math.abs(c.weight) * 60);

              return (
                <div key={c.feature} className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{c.feature}</span>
                    <span
                      className={`font-mono font-bold ${
                        isPositive ? "text-indigo-700" : "text-amber-700"
                      }`}
                    >
                      {isPositive ? `+${c.weight}` : c.weight}
                    </span>
                  </div>
                  {/* Visual weight bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full ${
                        isPositive ? "bg-indigo-600" : "bg-amber-500"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic">{c.description}</p>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1">
            <span className="font-bold flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" /> ML Ridge Regularization Insights:
            </span>
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              Ambient temperature and peak evening hours exhibit the highest positive coefficients,
              confirming that compressor air conditioning and cooking/lighting surges drive peak electricity demand.
            </p>
          </div>
        </div>

        {/* Live Predictor Simulator (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Interactive Energy Consumption Predictor
              </h3>
              <p className="text-[11px] text-slate-500">
                Simulate environmental conditions to forecast kW load and electricity costs
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
              Live Model
            </span>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Hour of Day: <span className="text-slate-900 font-bold">{simHour}:00</span>
              </label>
              <input
                type="range"
                min="0"
                max="23"
                value={simHour}
                onChange={(e) => setSimHour(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="text-[10px] text-slate-400">
                {isSimPeak ? "⚠️ Peak Window (6-10 PM)" : "Off-Peak / Daytime"}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Month: <span className="text-slate-900 font-bold">Month {simMonth}</span>
              </label>
              <input
                type="range"
                min="1"
                max="12"
                value={simMonth}
                onChange={(e) => setSimMonth(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="text-[10px] text-slate-400">
                {simMonth >= 4 && simMonth <= 6 ? "Summer Peak" : simMonth >= 7 && simMonth <= 9 ? "Monsoon" : "Winter/Autumn"}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Ambient Temp: <span className="text-slate-900 font-bold">{simTemp}°C</span>
              </label>
              <input
                type="range"
                min="8"
                max="45"
                step="0.5"
                value={simTemp}
                onChange={(e) => setSimTemp(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="text-[10px] text-slate-400">Higher temp = AC load</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Humidity: <span className="text-slate-900 font-bold">{simHumidity}%</span>
              </label>
              <input
                type="range"
                min="20"
                max="95"
                value={simHumidity}
                onChange={(e) => setSimHumidity(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="col-span-2 flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simIsWeekend}
                  onChange={(e) => setSimIsWeekend(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700">Weekend Occupancy</span>
              </label>
            </div>
          </div>

          {/* Forecasted Prediction Cards */}
          <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-300">Ridge Model Forecast Output</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                Confidence Band ±{trainedModel.metrics.rmse} kW
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-slate-300">Predicted Active Load</div>
                <div className="text-3xl font-black text-white mt-1">
                  {prediction.predictedKw}{" "}
                  <span className="text-sm font-normal text-indigo-300">kW</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Range: {prediction.confidenceMinKw} - {prediction.confidenceMaxKw} kW
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-300">Est. Daily Consumption</div>
                <div className="text-3xl font-black text-emerald-400 mt-1">
                  {prediction.predictedKwhDay}{" "}
                  <span className="text-sm font-normal text-slate-300">kWh/day</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Multi-hour weighted cycle
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-300">Est. Monthly Cost</div>
                <div className="text-3xl font-black text-amber-400 mt-1">
                  ₹{estimatedMonthlyCost.toFixed(0)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  At ₹{electricityRate}/kWh tariff
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Kaggle Dataset Records Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Kaggle Power Dataset Sample Observations ({displayedRecords.length} records)
            </h3>
          </div>

          {/* Season filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            {["All", "Summer", "Monsoon", "Autumn", "Winter", "Spring"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeason(s)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterSeason === s
                    ? "bg-white text-indigo-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date/Time</th>
                <th className="py-2.5 px-3">Season</th>
                <th className="py-2.5 px-3">Temp (°C)</th>
                <th className="py-2.5 px-3">Humidity</th>
                <th className="py-2.5 px-3">Voltage (V)</th>
                <th className="py-2.5 px-3 font-semibold text-indigo-900">Active Power (kW)</th>
                <th className="py-2.5 px-3">Kitchen Sub1 (Wh)</th>
                <th className="py-2.5 px-3">Laundry Sub2 (Wh)</th>
                <th className="py-2.5 px-3">Climate Sub3 (Wh)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {displayedRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-sans">
                    <span className="font-semibold text-slate-900">{r.date}</span>{" "}
                    <span className="text-slate-400 text-[11px]">{r.time}</span>
                  </td>
                  <td className="py-2 px-3 font-sans">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-medium">
                      {r.season}
                    </span>
                  </td>
                  <td className="py-2 px-3">{r.temperatureC}°C</td>
                  <td className="py-2 px-3">{r.humidityPct}%</td>
                  <td className="py-2 px-3">{r.voltage}V</td>
                  <td className="py-2 px-3 font-bold text-indigo-700">{r.globalActivePowerKw} kW</td>
                  <td className="py-2 px-3 text-slate-600">{r.subMetering1KitchenWh}</td>
                  <td className="py-2 px-3 text-slate-600">{r.subMetering2LaundryWh}</td>
                  <td className="py-2 px-3 font-semibold text-amber-700">{r.subMetering3ClimateWh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
