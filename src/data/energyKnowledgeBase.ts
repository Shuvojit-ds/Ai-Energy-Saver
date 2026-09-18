import { RagDocument } from "../types";

export const RAG_KNOWLEDGE_VAULT: RagDocument[] = [
  {
    id: "kb-01-ac-efficiency",
    title: "Air Conditioner Thermostat Setpoints & Efficiency Physics",
    category: "Appliance Standards",
    source: "Bureau of Energy Efficiency (BEE) & ASHRAE Guideline 55",
    summary: "Energy impact of temperature setpoints on inverter split air conditioners.",
    fullText: `According to the Bureau of Energy Efficiency (BEE) standards and ASHRAE Thermal Comfort Guidelines:
1. Setting an Inverter AC thermostat at 24°C rather than 18°C or 20°C reduces compressor electrical work by approximately 6% for every 1°C increase. Shifting from 18°C to 24°C yields a cumulative 24% to 36% drop in cooling kWh consumption.
2. Inverter compressors adjust rotational frequency via DC brushless motors; continuous steady operation at 24°C prevents frequent on/off thermal cycling.
3. Combining an AC running at 24°C with a gentle ceiling fan creates an evaporative wind-chill cooling effect equivalent to 21°C, maintaining optimal comfort with drastically reduced wattage.
4. Dirty air filters cause a 5% to 15% drop in heat exchanger efficiency and force the blower motor to draw up to 20% more current.`,
    keywords: ["ac", "air conditioner", "temperature", "thermostat", "24 degrees", "cooling", "inverter", "compressor", "filter"],
  },
  {
    id: "kb-02-bldc-fans",
    title: "BLDC Motor Ceiling Fans vs. Traditional Induction Motors",
    category: "Appliance Standards",
    source: "National Energy Conservation Authority Technical Report",
    summary: "Direct comparison of energy consumption, power factor, and ROI of BLDC motors.",
    fullText: `Ceiling fans represent 30% to 40% of non-AC residential electricity usage in warm climates.
1. Traditional induction motor ceiling fans consume 70W to 80W on top speed with a low power factor (0.85-0.90) and suffer from rotor heat losses (iron and copper eddy currents).
2. Brushless DC (BLDC) ceiling fans use permanent neodymium magnets and electronic commutation, reducing top-speed power consumption down to 28W - 32W with near-unity power factor (0.98+).
3. Energy Savings Calculation: Running 12 hours/day:
   - Induction Fan: 75W × 12h = 0.90 kWh/day = 27 kWh/month = ₹216/month (at ₹8/kWh).
   - BLDC Fan: 28W × 12h = 0.336 kWh/day = 10.08 kWh/month = ₹80.64/month.
   - Monthly Savings: ₹135.36 per fan.
4. Payback Period: A premium BLDC fan costs ~₹2,800. Net annual savings is ~₹1,624, delivering full capital payback in 18-20 months, with a 10-year lifespan.`,
    keywords: ["fan", "bldc", "ceiling fan", "induction", "wattage", "motor", "payback", "savings"],
  },
  {
    id: "kb-03-time-of-use-tariffs",
    title: "Time-of-Use (ToU/ToD) Peak Tariff Management",
    category: "Tariff & Load",
    source: "State Electricity Regulatory Commission (SERC) Tariff Schedules",
    summary: "Strategies for avoiding peak evening electricity surcharges and load shifting.",
    fullText: `Smart meters and digital utilities impose Time-of-Day (ToD) or Time-of-Use (ToU) differential tariffs:
1. Peak Hours (typically 18:00 to 22:00 / 6 PM to 10 PM): Electricity rates are levied with a 15% to 25% surcharge per kWh due to grid transmission congestion and high marginal generation cost.
2. Off-Peak Hours (22:00 to 06:00 / 10 PM to 6 AM): Electricity rates receive a 10% to 15% rebate.
3. Solar Hours (10:00 to 16:00 / 10 AM to 4 PM): Standard baseline rate with high renewable grid injection.
4. Actionable Load Shifting: Heavy deferrable inductive loads like washing machines (500W-2000W with heater), water pumps, dishwashers, and EV chargers should be scheduled before 5 PM or after 10 PM to circumvent peak price multipliers.`,
    keywords: ["tariff", "peak", "time of use", "tou", "tod", "load shifting", "washing machine", "rate", "evening"],
  },
  {
    id: "kb-04-refrigeration-efficiency",
    title: "Residential Refrigeration Temperature Tuning & Heat Exchange",
    category: "Appliance Standards",
    source: "Appliance Energy Efficiency Lab Guidelines",
    summary: "Optimal thermostat settings, door seal integrity, and condenser clearance.",
    fullText: `Refrigerators run 24 hours a day, 365 days a year, making efficiency adjustments compound continuously:
1. Optimal Temperature Settings: Fresh food compartment should be maintained between 3°C and 4°C (37°F - 40°F); freezer compartment between -18°C and -15°C (0°F). Setting temperatures lower than this increases energy consumption by up to 25% without providing food safety benefit.
2. Condenser Coil Clearance: Allow at least 2 inches (5 cm) of rear clearance and 1 inch of side clearance for ambient air convection. Dust accumulation on condenser coils increases compressor run time by 15% to 20%.
3. Gasket Seal Test: Place a paper currency bill between the door seal and cabinet. If it slides out with zero resistance, the magnetic gasket is leaking cool air, inflating compressor duty cycle from 30% to over 60%.`,
    keywords: ["refrigerator", "fridge", "freezer", "condenser", "door seal", "temperature", "duty cycle"],
  },
  {
    id: "kb-05-phantom-standby-power",
    title: "Vampire Power & Standby Energy Elimination",
    category: "Maintenance",
    source: "International Energy Agency (IEA) Standby Power Initiative",
    summary: "Quantifying phantom loads across home entertainment, computers, and microwaves.",
    fullText: `Phantom load (also termed vampire draw or standby loss) is the electric power consumed by electronic appliances while switched off or in standby mode:
1. An average modern household constantly draws 30W to 70W in unperceived phantom power from smart TVs, set-top boxes, Wi-Fi routers, soundbars, microwave clocks, laptop adapters, and game consoles.
2. Annual Consumption: A 50W continuous phantom draw equals 1.2 kWh/day = 438 kWh/year = approximately ₹3,500/year of wasted expenditure.
3. Mitigation Protocol: Utilize smart surge protector strips or master cutoff switches for workstation clusters and entertainment setups when retiring for sleep or vacating during holidays.`,
    keywords: ["phantom", "vampire", "standby", "tv", "laptop", "power strip", "idle", "entertainment"],
  },
  {
    id: "kb-06-water-heating-geyser",
    title: "Domestic Water Heating: Storage Geysers vs. Heat Pump Systems",
    category: "Appliance Standards",
    source: "Water Heating Energy Conservation Code",
    summary: "Geyser wattage optimization, thermal loss, and temperature control.",
    fullText: `Water heating accounts for over 40% of winter electricity bills in temperate climates:
1. Standard storage water geysers use 2000W resistance heating elements. Leaving a 25L geyser switched on for 3 hours a day consumes 6 kWh = ₹48/day.
2. Standing Heat Losses: Thinly insulated tanks lose heat through jacket conduction, triggering reheating cycles every 45-60 minutes even if zero water is tapped.
3. Solution: Turn geyser on for 25 minutes prior to bathing and shut off before showering. Set thermostat limit to 50°C (122°F) instead of default factory 65°C to eliminate scalding risk and reduce radiant standby loss by 18%.
4. For high-volume households, heat pump water heaters provide a Coefficient of Performance (COP) of 3.5, using only 500W to deliver the same hot water as an 1800W electric geyser.`,
    keywords: ["geyser", "water heater", "winter", "heating", "thermostat", "hot water", "standby loss"],
  },
  {
    id: "kb-07-kaggle-baseline-benchmarks",
    title: "Kaggle Household Electric Power Dataset Benchmarks",
    category: "Tariff & Load",
    source: "Kaggle Individual Household Electric Power Consumption Dataset Analysis",
    summary: "Empirical baselines for daily active power, voltage stability, and submetering.",
    fullText: `Analysis of the Kaggle 2,075,259 multi-year minute-resolution electricity dataset reveals key empirical patterns:
1. Baseline Household Active Power: The median active power during overnight base hours (01:00 - 05:00) is 0.35 kW to 0.55 kW (refrigeration, router, standby loads).
2. Daytime Average: 1.1 kW to 1.8 kW.
3. Evening Peak (18:30 - 22:00): Spikes to 2.8 kW to 4.8 kW driven by Submetering 3 (air conditioning / heating elements) and Submetering 1 (kitchen cooking induction/microwave).
4. Daily Aggregate: Typical non-AC baseline is 8 - 12 kWh/day; summer high-climate load elevates household daily consumption to 22 - 38 kWh/day.
5. Voltage Correlation: When grid voltage drops below 230V during high network demand, inductive motors (compressors, pumps) draw increased current (Amperes) to sustain torque, causing marginal heat losses.`,
    keywords: ["kaggle", "dataset", "baseline", "submetering", "active power", "peak", "benchmark", "kwh"],
  },
  {
    id: "kb-08-rooftop-solar-net-metering",
    title: "Rooftop Solar PV Sizing & Net-Metering ROI Economics",
    category: "Renewable Solar",
    source: "Solar Energy Corporation & Ministry of New and Renewable Energy (MNRE)",
    summary: "Solar generation math, rooftop area requirements, and grid offset modeling.",
    fullText: `Grid-connected rooftop solar photovoltaic (PV) systems generate clean distributed energy:
1. Daily Generation Formula: A 1 kW monocrystalline solar array generates an average of 4.0 to 4.5 kWh of electricity per sunny day (accounting for inverter losses and dust derating factor of 0.82).
2. Monthly Generation: A 3 kW rooftop system generates ~360 - 400 kWh/month, sufficient to offset 70% to 90% of an average 3BHK residential electricity bill.
3. Financial ROI: At ₹8/kWh utility tariff, a 3 kW system saves approximately ₹3,000/month = ₹36,000/year. With capital cost post-subsidy around ₹1,40,000, simple payback is achieved in 3.8 to 4.2 years, followed by 20+ years of free electricity.
4. Carbon Offset: Each 1 kWh of solar replaces 0.82 kg of coal-fired grid CO2 emissions. A 3 kW system abates ~3.8 tonnes of CO2 annually.`,
    keywords: ["solar", "pv", "rooftop", "net metering", "roi", "renewable", "generation", "payback", "co2"],
  },
];
