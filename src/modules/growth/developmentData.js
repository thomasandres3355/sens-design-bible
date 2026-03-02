import { T } from "@core/theme/theme";
import { PROJECT_STAGES } from "@core/data/sites";

// ─── Element Catalog ───────────────────────────────────────────────
// Costs derived from Foundation.SENS.JV.HartfordProjectModel.xlsx
// and SENS 1 PROCESSOR.xlsx

export const ELEMENT_CATEGORIES = [
  { key: "processing", label: "Processing", color: T.accent },
  { key: "power", label: "Power Generation", color: T.green },
  { key: "storage", label: "Storage", color: T.blue },
  { key: "infrastructure", label: "Infrastructure", color: T.teal },
  { key: "land", label: "Land", color: T.purple },
];

export const ELEMENT_CATALOG = {
  // ── Processing ──
  tips_2: {
    label: "SENS TiPs 2 TPH", category: "processing", icon: "⚙", color: T.accent,
    w: 3, h: 2,
    capex: 18.75,           // $M per unit — from Hartford: $112.5M / 6 units
    opexFixed: 0.534,       // $M/yr per unit — from OK model
    tph: 2, capacityTonYr: 14717, efficiency: 0.84,
    revPerTon: 1663.20,     // $/feedstock ton — from Hartford SENS Tires sheet
    feedCostPerTon: 200,
    powerMW: 1,             // MW consumption per unit
    carbonOutputTonPerTon: 0.45,
    diluentGalPerTon: 120,
    description: "Tire pyrolysis processor. Produces diluent, carbon black, syn gas, and steel.",
  },
  tips_20: {
    label: "SENS TiPs 20 TPH", category: "processing", icon: "⚙", color: T.accent,
    w: 4, h: 3,
    capex: 20, opexFixed: 1.24, tph: 20, capacityTonYr: 147168, efficiency: 0.84,
    revPerTon: 1663.20, feedCostPerTon: 200, powerMW: 6,
    carbonOutputTonPerTon: 0.45, diluentGalPerTon: 120,
    description: "Large-scale tire pyrolysis processor. 10x throughput of 2 TPH unit.",
  },
  coal_20: {
    label: "SENS Coal 20 TPH", category: "processing", icon: "⚙", color: T.warn || "#e6a23c",
    w: 4, h: 3,
    capex: 20, opexFixed: 1.24, tph: 20, capacityTonYr: 147168, efficiency: 0.84,
    revPerTon: 192.28, feedCostPerTon: 20, powerMW: 9,
    carbonOutputTonPerTon: 0.32, diluentGalPerTon: 0,
    coalFuelOilGalPerTon: 89.86,
    description: "Coal gasification processor. Produces processed coal, coal-fuel-oil, and process gas.",
  },
  // ── Power Generation ──
  carbon_power: {
    label: "Carbon Power Plant", category: "power", icon: "⏻", color: T.green,
    w: 4, h: 3,
    capex: 3.6,             // $M per MW — from Hartford GEN-CARBON
    opexFixed: 0.06,        // $M/MW-yr
    capacityFactor: 0.937, heatRate: 10347, mw: 100,
    carbonConsumptionTonPerMWh: 0.367,
    description: "Burns carbon byproduct to generate power. 93.7% capacity factor.",
  },
  bess: {
    label: "BESS (Battery)", category: "power", icon: "⚡", color: T.blue,
    w: 3, h: 2,
    capex: 1.15,            // $M per MW
    opexFixed: 0.0013,      // $M/MW-yr ($1,300/MW-yr)
    mw: 100, durationHrs: 4, mwh: 400, efficiency: 0.95, dod: 0.80,
    itcEligible: true, itcPct: 0.30,
    description: "Battery energy storage. 4-hour duration, 95% round-trip efficiency.",
  },
  ccgt: {
    label: "CCGT (Natural Gas)", category: "power", icon: "🔥", color: T.accent,
    w: 4, h: 3,
    capex: 1.1, opexFixed: 0.0175, opexVar: 3.5, // $/MWh variable
    mw: 100, capacityFactor: 0.873, heatRate: 6750, fuelPrice: 3.45,
    description: "Combined cycle gas turbine. 87.3% capacity factor.",
  },
  solar: {
    label: "Solar Array", category: "power", icon: "☀", color: "#f5c842",
    w: 4, h: 2,
    capex: 1.2, opexFixed: 0.0125,
    mw: 100, capacityFactor: 0.20, degradation: 0.005,
    itcEligible: true, itcPct: 0.30,
    description: "Utility-scale solar. 20% capacity factor, 0.5%/yr degradation.",
  },
  hydrogen: {
    label: "Hydrogen Electrolyzer", category: "power", icon: "H₂", color: T.teal,
    w: 3, h: 2,
    capex: 0.3, // $M per MW
    mw: 100, kwhPerKg: 55.61, pricePerKg: 7.50, ptcPerKg: 1.00,
    description: "PEM electrolyzer for green hydrogen production. $7.50/kg + $1.00 PTC.",
  },
  // ── Storage ──
  diluent_tank: {
    label: "Diluent Tank", category: "storage", icon: "▣", color: T.blue,
    w: 1, h: 2,
    capex: 0.15, opexFixed: 0.005,
    capacityGal: 50000, type: "diluent",
    description: "50,000 gallon diluent storage tank.",
  },
  carbon_silo: {
    label: "Carbon Silo", category: "storage", icon: "⬡", color: T.textMid,
    w: 1, h: 2,
    capex: 0.12, opexFixed: 0.004,
    capacityTon: 500, type: "carbon",
    description: "500-ton carbon black storage silo.",
  },
  tank_farm: {
    label: "Tank Farm", category: "storage", icon: "▣▣", color: T.blue,
    w: 3, h: 2,
    capex: 2.0, opexFixed: 0.08,
    capacityGal: 500000, type: "diluent",
    description: "Multi-tank diluent storage farm. 500,000 gallon default capacity.",
  },
  carbon_storage: {
    label: "Carbon Storage Facility", category: "storage", icon: "⬡⬡", color: T.textMid,
    w: 3, h: 2,
    capex: 5.0, opexFixed: 0.15,
    capacityTon: 10000, type: "carbon",
    description: "Large-scale carbon storage. 10,000-ton default capacity.",
  },
  // ── Infrastructure ──
  loading_bay: {
    label: "Loading Bay", category: "infrastructure", icon: "▤", color: T.accentLight || T.accent,
    w: 2, h: 2,
    capex: 0.8, opexFixed: 0.03,
    description: "Truck/rail loading and unloading facility.",
  },
  control_room: {
    label: "Control Room", category: "infrastructure", icon: "⌂", color: T.teal,
    w: 2, h: 2,
    capex: 1.5, opexFixed: 0.05,
    description: "Site operations control center.",
  },
  substation: {
    label: "Substation", category: "infrastructure", icon: "⏚", color: T.warn || "#e6a23c",
    w: 2, h: 1,
    capex: 2.0, opexFixed: 0.04,
    mw: 50, // distribution capacity
    description: "Electrical substation for power distribution.",
  },
  // ── Land ──
  site_land: {
    label: "Site Land (per acre)", category: "land", icon: "▭", color: T.purple,
    w: 4, h: 1,
    capex: 0.017,           // $M/acre ($7K acquisition + $10K site prep)
    opexFixed: 0.00145,     // $M/acre/yr ($1,450/acre)
    acres: 1,
    description: "Land acquisition and site prep. $7,000/acre + $10,000 site prep.",
  },
};

// ─── Feedstock Presets & Defaults ──────────────────────────────────

export const COAL_PRESETS = {
  "Bituminous (Default)": { fixedCarbon: 60, volatileMatter: 25, ash: 10, moisture: 5 },
  "Sub-Bituminous": { fixedCarbon: 42, volatileMatter: 35, ash: 8, moisture: 15 },
  "Lignite": { fixedCarbon: 30, volatileMatter: 28, ash: 12, moisture: 30 },
  "Anthracite": { fixedCarbon: 90, volatileMatter: 5, ash: 3, moisture: 2 },
  "Pet Coke": { fixedCarbon: 85, volatileMatter: 10, ash: 1, moisture: 4 },
  "Hartford JV Default": { fixedCarbon: 24.6, volatileMatter: 29, ash: 10, moisture: 29 },
};

export const TIRE_PRESETS = {
  "Passenger Car (Default)": { fixedCarbon: 28, volatileMatter: 62, ash: 6, moisture: 1, steel: 15 },
  "Truck Tires": { fixedCarbon: 30, volatileMatter: 58, ash: 5, moisture: 1, steel: 25 },
  "Mining Truck (Ultra-Heavy)": { fixedCarbon: 34, volatileMatter: 55, ash: 5, moisture: 1, steel: 18 },
  "Mixed TDF": { fixedCarbon: 29, volatileMatter: 60, ash: 6, moisture: 1, steel: 18 },
};

export const CARBON_POWER_CONSTANTS = {
  charEnergyBTU: 12800,     // BTU per lb of carbon char
  baseHeatRate: 10347,       // BTU/kWh from Hartford model (~33% thermal eff)
  charAshThreshold: 15,      // % char ash below which no penalty
  ashHeatPenalty: 0.01,      // per % char ash above threshold, heat rate worsens 1%
};

export const DEFAULT_FEEDSTOCK_CONFIG = {
  coalFeedstock: { fixedCarbon: 24.6, volatileMatter: 29, ash: 10, moisture: 29 },
  tireFeedstock: { fixedCarbon: 28, volatileMatter: 62, ash: 6, moisture: 1, steel: 15 },
};

export const DEFAULT_FINANCIAL_CONFIG = {
  ppaPrice: 60, gridPrice: 75,
  revenueEscalator: 2.0, omEscalator: 2.0, inflation: 3.0,
  federalTax: 21, stateTax: 4, localTax: 1,
  equity: 100, interestRate: 8, costOfEquity: 12,
  insurance: 1.0, salvageValue: 5, foundationShare: 27,
  tireOfftakePerMachine: 7.5, // $M per machine from Hartford JV model
};

// ─── Conversion Engines ───────────────────────────────────────────
// Moisture is driven off during pyrolysis — it affects YIELD but NOT
// combustion efficiency. Ash concentration in resulting char is the driver.

export function calcCarbonPowerConversion(coalFeedstock, coalMachines, coalCapacityTonYr) {
  if (!coalMachines || coalMachines === 0) {
    return {
      annualFeedstockTons: 0, carbonCharYield: 0, fuelOilYield: 0,
      processGasYield: 0, ashYield: 0, waterYield: 0, charAshPct: 0,
      thermalEfficiency: 0.33, effectiveHeatRate: CARBON_POWER_CONSTANTS.baseHeatRate,
      carbonMWhPotential: 0, tonsPerMWh: 0, mwCapacity: 0, fuelCoverage: 0,
    };
  }

  const fc = coalFeedstock.fixedCarbon / 100;
  const ash = coalFeedstock.ash / 100;
  const moisture = coalFeedstock.moisture / 100;
  const vm = coalFeedstock.volatileMatter / 100;

  const annualFeedstockTons = coalMachines * coalCapacityTonYr * 0.84;

  // Product yields from pyrolysis
  const carbonCharYield = annualFeedstockTons * fc * 0.996;
  const fuelOilYield = annualFeedstockTons * vm * 0.80;
  const processGasYield = annualFeedstockTons * vm * 0.20;
  const ashYield = annualFeedstockTons * ash;
  const waterYield = annualFeedstockTons * moisture;

  // Char composition after pyrolysis (moisture & volatiles removed)
  const charAshContent = (fc + ash) > 0 ? ash / (fc + ash) : 0;
  const charAshPct = charAshContent * 100;

  // Heat rate penalty from ash concentration in char
  const excessCharAsh = Math.max(0, charAshPct - CARBON_POWER_CONSTANTS.charAshThreshold);
  const heatRateMultiplier = 1 + excessCharAsh * CARBON_POWER_CONSTANTS.ashHeatPenalty;
  const effectiveHeatRate = CARBON_POWER_CONSTANTS.baseHeatRate * heatRateMultiplier;
  const thermalEfficiency = 3412 / effectiveHeatRate;

  // Energy content of carbon char → MWh
  const charEnergyMBTU = carbonCharYield * 2000 * CARBON_POWER_CONSTANTS.charEnergyBTU / 1e6;
  const carbonMWhPotential = charEnergyMBTU * 1000 / effectiveHeatRate;

  const tonsPerMWh = carbonCharYield > 0 && carbonMWhPotential > 0
    ? carbonCharYield / carbonMWhPotential : 0;

  const mwCapacity = carbonMWhPotential / (8760 * 0.937);

  // Fuel coverage: how much of a 100MW plant this feeds
  const tonsNeededFor100MW = 100 * 0.937 * 8760 * 1000 * effectiveHeatRate / (CARBON_POWER_CONSTANTS.charEnergyBTU * 2000);
  const fuelCoverage = tonsNeededFor100MW > 0 ? carbonCharYield / tonsNeededFor100MW : 0;

  return {
    annualFeedstockTons, carbonCharYield, fuelOilYield, processGasYield,
    ashYield, waterYield, charAshPct, thermalEfficiency, effectiveHeatRate,
    carbonMWhPotential, tonsPerMWh, mwCapacity, fuelCoverage,
  };
}

export function calcTireConversion(tireFeedstock, tireMachines, tireCapacityTonYr) {
  if (!tireMachines || tireMachines === 0) {
    return {
      annualFeedstockTons: 0, carbonBlackYield: 0, oilYield: 0,
      processGasYield: 0, steelYield: 0, oilGalPerTon: 0, totalOilGalYr: 0,
    };
  }

  const fc = tireFeedstock.fixedCarbon / 100;
  const vm = tireFeedstock.volatileMatter / 100;
  const ash = tireFeedstock.ash / 100;
  const steel = (tireFeedstock.steel || 0) / 100;

  const annualFeedstockTons = tireMachines * tireCapacityTonYr * 0.84;

  const carbonBlackYield = annualFeedstockTons * (fc + ash);
  const oilYield = annualFeedstockTons * vm * 0.65;
  const processGasYield = annualFeedstockTons * vm * 0.20;
  const steelYield = annualFeedstockTons * steel;

  const oilGalPerTon = vm * 2000 * 0.65 / 7.1;
  const totalOilGalYr = oilGalPerTon * annualFeedstockTons;

  return {
    annualFeedstockTons, carbonBlackYield, oilYield,
    processGasYield, steelYield, oilGalPerTon, totalOilGalYr,
  };
}

export function calcProForma(config, coalConv, tireConv, baseBudget) {
  const years = 6;
  const taxRate = (config.federalTax + config.stateTax + config.localTax) / 100;
  const totalCapex = baseBudget.totalCapex;

  // Annual revenue (steady state)
  const coalProductRevPerTon = (config.coalFeedstock?.volatileMatter || 29) / 100 * 0.80 * 2000 / 7.5 * 2.0
    + (config.coalFeedstock?.volatileMatter || 29) / 100 * 0.20 * 2000 * 17 * 1020 / 1e6 * 3.0;
  const coalAnnualRev = coalConv.annualFeedstockTons * coalProductRevPerTon / 1e6;
  const tireAnnualRev = (config.tireMachines || 0) * (config.tireOfftakePerMachine || 7.5);

  // Power revenue from canvas-placed generation
  const powerRevFromGen = baseBudget.totalPowerGenMW * 8760 * config.ppaPrice / 1e6;
  // Subtract power consumed by load (not sold)
  const powerCostFromLoad = baseBudget.totalPowerConsumeMW * 8760 * config.gridPrice / 1e6;

  const totalRev = coalAnnualRev + tireAnnualRev + powerRevFromGen;
  const totalOpex = baseBudget.totalOpex + powerCostFromLoad;

  // Build year-by-year
  const rows = { capex: [], revenue: [], opex: [], ebitda: [], netIncome: [], fcf: [], cumFCF: [] };
  let cumFCF = 0;

  for (let y = 0; y < years; y++) {
    const capex = y === 0 ? -totalCapex * 0.65 : y === 1 ? -totalCapex * 0.30 : y === 2 ? -totalCapex * 0.05 : 0;
    const rampup = y === 0 ? 0.3 : y === 1 ? 0.85 : 1.0;
    const esc = Math.pow(1 + config.revenueEscalator / 100, Math.max(0, y - 1));
    const rev = totalRev * rampup * esc;
    const opex = totalOpex * rampup * Math.pow(1 + config.omEscalator / 100, Math.max(0, y - 1));
    const ebitda = rev - opex;
    const taxes = ebitda > 0 ? ebitda * taxRate : 0;
    const ni = ebitda - taxes;
    const fcf = capex + ni;
    cumFCF += fcf;

    rows.capex.push(capex);
    rows.revenue.push(rev);
    rows.opex.push(-opex);
    rows.ebitda.push(ebitda);
    rows.netIncome.push(ni);
    rows.fcf.push(fcf);
    rows.cumFCF.push(cumFCF);
  }

  return {
    rows, totalCapex, totalRev, totalOpex,
    foundationDiv: rows.fcf[4] > 0 ? rows.fcf[4] * config.foundationShare / 100 : 0,
    sensDiv: rows.fcf[4] > 0 ? rows.fcf[4] * (100 - config.foundationShare) / 100 : 0,
  };
}

// ─── Extended Budget: Canvas + Conversion + Pro Forma ─────────────

export function calcProcessBudgetExtended(elements, feedstockConfig, financialConfig) {
  // Run the existing base budget calculation
  const base = calcProcessBudget(elements);

  const fc = feedstockConfig || DEFAULT_FEEDSTOCK_CONFIG;
  const fin = financialConfig || DEFAULT_FINANCIAL_CONFIG;

  // Extract machine counts from canvas elements
  const coalElements = elements.filter(e => e.type === "coal_20");
  const tire2Elements = elements.filter(e => e.type === "tips_2");
  const tire20Elements = elements.filter(e => e.type === "tips_20");
  const carbonPowerElements = elements.filter(e => e.type === "carbon_power");

  const coalMachines = coalElements.reduce((s, e) => s + (e.quantity || 1), 0);
  const tireMachines2 = tire2Elements.reduce((s, e) => s + (e.quantity || 1), 0);
  const tireMachines20 = tire20Elements.reduce((s, e) => s + (e.quantity || 1), 0);
  const installedCarbonMW = carbonPowerElements.reduce((s, e) => s + ((e.customParams?.mw || 100) * (e.quantity || 1)), 0);

  // Run conversion engines
  // Coal: all coal_20 machines use same capacity (147168 ton/yr per machine)
  const coalConv = calcCarbonPowerConversion(fc.coalFeedstock, coalMachines, 147168);

  // Tires: tips_2 = 14717 ton/yr, tips_20 = 147168 ton/yr
  // Combine as equivalent 2TPH machines for conversion calc
  const equivalentTireMachines2TPH = tireMachines2 + tireMachines20 * 10;
  const tireConv = calcTireConversion(fc.tireFeedstock, equivalentTireMachines2TPH, 14717);

  // Fuel coverage: how much carbon MW do we actually have vs installed
  const carbonFuelCoverage = installedCarbonMW > 0
    ? Math.min(coalConv.mwCapacity, installedCarbonMW) / installedCarbonMW
    : coalMachines > 0 ? Infinity : 0;

  // Pro forma using canvas-derived config
  const proFormaConfig = {
    ...fin,
    coalFeedstock: fc.coalFeedstock,
    tireMachines: equivalentTireMachines2TPH,
  };
  const proForma = calcProForma(proFormaConfig, coalConv, tireConv, base);

  // Extended warnings
  const extWarnings = [
    ...base.warnings,
    ...(installedCarbonMW > 0 && carbonFuelCoverage < 0.7 ? [{ type: "fuel", severity: "red", msg: `Carbon fuel coverage ${(carbonFuelCoverage * 100).toFixed(0)}% — need more coal machines or reduce carbon power MW` }] : []),
    ...(installedCarbonMW > 0 && carbonFuelCoverage >= 0.7 && carbonFuelCoverage < 0.9 ? [{ type: "fuel", severity: "yellow", msg: `Carbon fuel coverage ${(carbonFuelCoverage * 100).toFixed(0)}% — marginal supply` }] : []),
    ...(coalMachines > 0 && coalConv.charAshPct > 25 ? [{ type: "feedstock", severity: "yellow", msg: `High char ash (${coalConv.charAshPct.toFixed(0)}%) — consider higher-rank coal or blending` }] : []),
    ...(coalMachines > 0 && installedCarbonMW === 0 ? [{ type: "design", severity: "yellow", msg: `Coal machines placed but no carbon power plant — carbon char has no power offtake` }] : []),
    ...(installedCarbonMW > 0 && coalMachines === 0 ? [{ type: "design", severity: "red", msg: `Carbon power plant has no fuel source — add coal processing machines` }] : []),
  ];

  return {
    ...base,
    warnings: extWarnings,
    // Conversion data
    coalConv, tireConv, proForma,
    coalMachines, tireMachines2, tireMachines20,
    equivalentTireMachines2TPH,
    installedCarbonMW,
    carbonFuelCoverage,
    // Derived metrics
    coalCharMWCapacity: coalConv.mwCapacity,
    coalThermalEfficiency: coalConv.thermalEfficiency,
    coalCharAshPct: coalConv.charAshPct,
  };
}

// ─── Budget Calculation Helpers ────────────────────────────────────

export function calcElementCost(element) {
  const cat = ELEMENT_CATALOG[element.type];
  if (!cat) return { capex: 0, opexAnnual: 0, revAnnual: 0 };

  const qty = element.quantity || 1;
  const unitCost = element.customCost != null ? element.customCost : cat.capex;

  // For power assets priced per-MW, multiply by MW rating
  let capex = unitCost * qty;
  if (cat.mw && cat.category === "power") {
    const mw = element.customParams?.mw || cat.mw;
    capex = unitCost * mw * qty;
  }
  if (cat.acres && cat.category === "land") {
    const acres = element.customParams?.acres || 100;
    capex = unitCost * acres * qty;
  }

  let opexAnnual = 0;
  if (cat.opexFixed) {
    if (cat.mw && cat.category === "power") {
      const mw = element.customParams?.mw || cat.mw;
      opexAnnual = cat.opexFixed * mw * qty;
    } else if (cat.acres && cat.category === "land") {
      const acres = element.customParams?.acres || 100;
      opexAnnual = cat.opexFixed * acres * qty;
    } else {
      opexAnnual = cat.opexFixed * qty;
    }
  }
  // Insurance: 1% of capex (Hartford model assumption)
  opexAnnual += capex * 0.01;

  let revAnnual = 0;
  if (cat.revPerTon && cat.capacityTonYr) {
    revAnnual = ((cat.revPerTon - cat.feedCostPerTon) * cat.capacityTonYr * cat.efficiency * qty) / 1e6;
  }
  if (cat.pricePerKg && cat.kwhPerKg && cat.mw) {
    const mw = element.customParams?.mw || cat.mw;
    const kgPerHr = (mw * 1000) / cat.kwhPerKg;
    const hoursPerYr = 8760 * 0.90;
    revAnnual = (kgPerHr * hoursPerYr * (cat.pricePerKg + (cat.ptcPerKg || 0)) * qty) / 1e6;
  }

  return { capex, opexAnnual, revAnnual };
}

export function calcProcessBudget(elements) {
  let totalCapex = 0, totalOpex = 0, totalRev = 0;
  let totalDiluentStorageGal = 0, totalCarbonStorageTon = 0;
  let dailyDiluentOutputGal = 0, dailyCarbonOutputTon = 0;
  let totalPowerGenMW = 0, totalPowerConsumeMW = 0;

  for (const el of elements) {
    const costs = calcElementCost(el);
    totalCapex += costs.capex;
    totalOpex += costs.opexAnnual;
    totalRev += costs.revAnnual;

    const cat = ELEMENT_CATALOG[el.type];
    if (!cat) continue;
    const qty = el.quantity || 1;

    // Storage capacity
    if (cat.type === "diluent") totalDiluentStorageGal += (el.customParams?.capacityGal || cat.capacityGal || 0) * qty;
    if (cat.type === "carbon") totalCarbonStorageTon += (el.customParams?.capacityTon || cat.capacityTon || 0) * qty;

    // Daily output (processing elements)
    if (cat.diluentGalPerTon && cat.capacityTonYr) {
      dailyDiluentOutputGal += (cat.diluentGalPerTon * cat.capacityTonYr * cat.efficiency / 365) * qty;
    }
    if (cat.carbonOutputTonPerTon && cat.capacityTonYr) {
      dailyCarbonOutputTon += (cat.carbonOutputTonPerTon * cat.capacityTonYr * cat.efficiency / 365) * qty;
    }
    // Carbon power consumption
    if (cat.carbonConsumptionTonPerMWh && cat.mw) {
      const mw = el.customParams?.mw || cat.mw;
      dailyCarbonOutputTon -= (cat.carbonConsumptionTonPerMWh * mw * (cat.capacityFactor || 0.9) * 24) * qty;
    }

    // Power balance
    if (cat.mw && cat.category === "power") {
      const mw = el.customParams?.mw || cat.mw;
      totalPowerGenMW += mw * (cat.capacityFactor || 0.5) * qty;
    }
    if (cat.powerMW) totalPowerConsumeMW += cat.powerMW * qty;
  }

  const diluentBufferDays = dailyDiluentOutputGal > 0 ? totalDiluentStorageGal / dailyDiluentOutputGal : Infinity;
  const carbonBufferDays = dailyCarbonOutputTon > 0 ? totalCarbonStorageTon / dailyCarbonOutputTon : Infinity;
  const powerSurplusMW = totalPowerGenMW - totalPowerConsumeMW;

  return {
    totalCapex, totalOpex, totalRev,
    ebitda: totalRev - totalOpex,
    totalDiluentStorageGal, totalCarbonStorageTon,
    dailyDiluentOutputGal, dailyCarbonOutputTon,
    diluentBufferDays, carbonBufferDays,
    totalPowerGenMW, totalPowerConsumeMW, powerSurplusMW,
    warnings: [
      ...(diluentBufferDays < 7 ? [{ type: "storage", severity: "red", msg: `Diluent storage only ${diluentBufferDays.toFixed(1)} days buffer (recommend 7+)` }] : []),
      ...(carbonBufferDays < 7 && carbonBufferDays > 0 ? [{ type: "storage", severity: "red", msg: `Carbon storage only ${carbonBufferDays.toFixed(1)} days buffer (recommend 7+)` }] : []),
      ...(powerSurplusMW < 0 ? [{ type: "power", severity: "red", msg: `Power deficit: ${Math.abs(powerSurplusMW).toFixed(1)} MW shortfall` }] : []),
      ...(diluentBufferDays >= 7 && diluentBufferDays < 14 ? [{ type: "storage", severity: "yellow", msg: `Diluent buffer ${diluentBufferDays.toFixed(1)} days — consider adding storage` }] : []),
      ...(carbonBufferDays >= 7 && carbonBufferDays < 14 && carbonBufferDays !== Infinity ? [{ type: "storage", severity: "yellow", msg: `Carbon buffer ${carbonBufferDays.toFixed(1)} days — consider adding storage` }] : []),
    ],
  };
}

// ─── Employee Roster ───────────────────────────────────────────────
export const employeeRoster = [
  { id: "emp-001", name: "Sarah Chen", title: "Senior Development Engineer", department: "Engineering", email: "s.chen@systemicenvs.com" },
  { id: "emp-002", name: "Marcus Wright", title: "Land Acquisition Manager", department: "Real Estate", email: "m.wright@systemicenvs.com" },
  { id: "emp-003", name: "Dr. Amara Osei", title: "Process Engineering Lead", department: "Engineering", email: "a.osei@systemicenvs.com" },
  { id: "emp-004", name: "Jake Thornton", title: "Environmental Compliance Mgr", department: "Environmental", email: "j.thornton@systemicenvs.com" },
  { id: "emp-005", name: "Lisa Patel", title: "Financial Analyst — Development", department: "Finance", email: "l.patel@systemicenvs.com" },
  { id: "emp-006", name: "Ben Kowalski", title: "EPC Contracts Manager", department: "Procurement", email: "b.kowalski@systemicenvs.com" },
  { id: "emp-007", name: "Diana Reyes", title: "Permitting Specialist", department: "Legal", email: "d.reyes@systemicenvs.com" },
  { id: "emp-008", name: "Tom Hargrove", title: "Civil Engineering Lead", department: "Engineering", email: "t.hargrove@systemicenvs.com" },
];

// ─── File Categories ───────────────────────────────────────────────
export const FILE_CATEGORIES = [
  { key: "budget", label: "Budget & Finance", icon: "$", color: T.green },
  { key: "engineering", label: "Engineering", icon: "⚙", color: T.accent },
  { key: "permits", label: "Permits & Regulatory", icon: "✓", color: T.blue },
  { key: "legal", label: "Legal & Contracts", icon: "§", color: T.purple },
  { key: "environmental", label: "Environmental", icon: "♻", color: T.teal },
  { key: "land", label: "Land & Real Estate", icon: "▭", color: T.warn || "#e6a23c" },
  { key: "other", label: "Other", icon: "◻", color: T.textMid },
];

// ─── Sample Development Projects ───────────────────────────────────
export const INITIAL_DEV_PROJECTS = [
  {
    id: "dev-hartford",
    name: "Hartford Energy Campus",
    description: "Joint venture multi-technology facility combining SENS tire and coal processing with integrated power generation (carbon, BESS, CCGT, solar), hydrogen production, and large-scale land development. Based on Foundation.SENS.JV model.",
    status: "active", health: "green", stage: "pre-feed",
    stageProgress: { concept: 100, "pre-feed": 45, feed: 0, epc: 0, construction: 0, commissioning: 0 },
    feedstock: "Mixed", targetTPH: 40,
    location: { name: "Hartford, CT", state: "CT", lat: 41.76, lon: -72.68 },
    linkedSiteId: null,
    startDate: "2025-06-01", targetFeedDate: "2029-Q1",
    budget: { estimated: 340, spent: 12.4, committed: 28.0, categories: { engineering: 8.2, permits: 1.4, land: 2.8, equipment: 0, other: 0 } },
    teamLead: "emp-001",
    team: [
      { type: "employee", id: "emp-001", role: "Development Lead" },
      { type: "employee", id: "emp-003", role: "Process Engineering" },
      { type: "employee", id: "emp-005", role: "Financial Analysis" },
      { type: "employee", id: "emp-002", role: "Land Acquisition" },
      { type: "agent", id: "vp-engineering", role: "Engineering Oversight" },
    ],
    files: [
      { id: "f-001", name: "Foundation.SENS.JV.HartfordProjectModel.xlsx", category: "budget", uploadDate: "2026-01-15", size: "2.8 MB", uploadedBy: "Lisa Patel", notes: "Master financial model — 28 sheets" },
      { id: "f-002", name: "Hartford_PreFEED_Scope.pdf", category: "engineering", uploadDate: "2026-01-20", size: "4.1 MB", uploadedBy: "Dr. Amara Osei", notes: "Pre-FEED scope of work" },
      { id: "f-003", name: "CT_Environmental_Assessment_Draft.pdf", category: "environmental", uploadDate: "2026-02-01", size: "8.3 MB", uploadedBy: "Jake Thornton", notes: "Phase 1 environmental site assessment" },
      { id: "f-004", name: "Hartford_Land_Option_Agreement.docx", category: "land", uploadDate: "2025-11-10", size: "340 KB", uploadedBy: "Marcus Wright", notes: "5,600 acre option agreement — $7K/acre" },
      { id: "f-005", name: "JV_Term_Sheet_v3.pdf", category: "legal", uploadDate: "2026-02-10", size: "1.2 MB", uploadedBy: "Diana Reyes", notes: "Joint venture term sheet — latest revision" },
    ],
    processConfig: {
      elements: [
        { id: "el-h1", type: "tips_2", x: 40, y: 40, quantity: 6, label: "TiPs Battery A" },
        { id: "el-h2", type: "coal_20", x: 40, y: 200, quantity: 9, label: "Coal Processors" },
        { id: "el-h3", type: "carbon_power", x: 280, y: 40, quantity: 1, customParams: { mw: 100 }, label: "Carbon Power" },
        { id: "el-h4", type: "bess", x: 280, y: 160, quantity: 1, customParams: { mw: 50 }, label: "BESS Storage" },
        { id: "el-h5", type: "tank_farm", x: 480, y: 40, quantity: 2, label: "Diluent Tank Farm" },
        { id: "el-h6", type: "carbon_storage", x: 480, y: 160, quantity: 1, label: "Carbon Storage" },
        { id: "el-h7", type: "loading_bay", x: 640, y: 80, quantity: 2, label: "Loading Bays" },
        { id: "el-h8", type: "control_room", x: 640, y: 200, quantity: 1, label: "Control Room" },
        { id: "el-h9", type: "site_land", x: 40, y: 320, quantity: 1, customParams: { acres: 5600 }, label: "Hartford Land" },
        { id: "el-h10", type: "solar", x: 640, y: 320, quantity: 1, customParams: { mw: 70 }, label: "Solar Array" },
        { id: "el-h11", type: "ccgt", x: 440, y: 320, quantity: 1, customParams: { mw: 100 }, label: "CCGT Backup" },
      ],
      connections: [
        { id: "c-1", from: "el-h1", to: "el-h3", label: "Carbon Feed", color: T.textMid },
        { id: "c-2", from: "el-h1", to: "el-h5", label: "Diluent", color: T.blue },
        { id: "c-3", from: "el-h2", to: "el-h3", label: "Carbon Char", color: T.textMid },
        { id: "c-4", from: "el-h5", to: "el-h7", label: "Diluent Out", color: T.blue },
        { id: "c-5", from: "el-h6", to: "el-h7", label: "Carbon Out", color: T.textMid },
        { id: "c-6", from: "el-h3", to: "el-h4", label: "Power", color: T.green },
        { id: "c-7", from: "el-h2", to: "el-h6", label: "Carbon Storage", color: T.textMid },
      ],
      feedstockConfig: {
        coalFeedstock: { fixedCarbon: 24.6, volatileMatter: 29, ash: 10, moisture: 29 },
        tireFeedstock: { fixedCarbon: 28, volatileMatter: 62, ash: 6, moisture: 1, steel: 15 },
      },
      financialConfig: {
        ppaPrice: 60, gridPrice: 75,
        revenueEscalator: 2.0, omEscalator: 2.0, inflation: 3.0,
        federalTax: 21, stateTax: 4, localTax: 1,
        equity: 100, interestRate: 8, costOfEquity: 12,
        insurance: 1.0, salvageValue: 5, foundationShare: 27,
        tireOfftakePerMachine: 7.5,
      },
    },
    notes: "JV structure under negotiation. WSP Global engaged for Pre-FEED. ITC eligibility confirmed for BESS and solar components.",
    created: "2025-06-01", updated: "2026-02-20",
  },
  {
    id: "dev-savannah",
    name: "Savannah Tire Facility",
    description: "4-processor tire recycling facility targeting Southeast feedstock supply. Partnering with regional tire collectors.",
    status: "active", health: "green", stage: "concept",
    stageProgress: { concept: 60, "pre-feed": 0, feed: 0, epc: 0, construction: 0, commissioning: 0 },
    feedstock: "Tire Crumb", targetTPH: 8,
    location: { name: "Savannah, GA", state: "GA", lat: 32.08, lon: -81.09 },
    linkedSiteId: null,
    startDate: "2026-01-15", targetFeedDate: "2029-Q3",
    budget: { estimated: 75, spent: 0.8, committed: 2.0, categories: { engineering: 0.5, permits: 0.1, land: 0.2, equipment: 0, other: 0 } },
    teamLead: "emp-006",
    team: [
      { type: "employee", id: "emp-006", role: "Development Lead" },
      { type: "employee", id: "emp-007", role: "Permitting" },
      { type: "employee", id: "emp-008", role: "Civil Engineering" },
    ],
    files: [
      { id: "f-010", name: "Savannah_Feasibility_Study.pdf", category: "engineering", uploadDate: "2026-02-05", size: "3.2 MB", uploadedBy: "Ben Kowalski", notes: "Initial feasibility and site options" },
    ],
    processConfig: null,
    notes: "Early stage — evaluating 3 potential sites near port.",
    created: "2026-01-15", updated: "2026-02-18",
  },
  {
    id: "dev-alberta",
    name: "Alberta Tire Processing",
    description: "International expansion into Alberta, Canada. Partnership with Canadian Tire Stewardship for feedstock supply.",
    status: "active", health: "yellow", stage: "pre-feed",
    stageProgress: { concept: 100, "pre-feed": 30, feed: 0, epc: 0, construction: 0, commissioning: 0 },
    feedstock: "Tire Crumb", targetTPH: 4,
    location: { name: "Calgary, AB", state: "AB", lat: 51.05, lon: -114.07 },
    linkedSiteId: null,
    startDate: "2025-09-01", targetFeedDate: "2028-Q4",
    budget: { estimated: 68, spent: 3.2, committed: 8.5, categories: { engineering: 2.0, permits: 0.4, land: 0.8, equipment: 0, other: 0 } },
    teamLead: "emp-003",
    team: [
      { type: "employee", id: "emp-003", role: "Process Lead" },
      { type: "employee", id: "emp-004", role: "Environmental" },
      { type: "agent", id: "vp-strategy", role: "Strategy & Partnerships" },
    ],
    files: [
      { id: "f-020", name: "Alberta_CTS_Partnership_MOU.pdf", category: "legal", uploadDate: "2025-12-01", size: "890 KB", uploadedBy: "Diana Reyes", notes: "MOU with Canadian Tire Stewardship" },
      { id: "f-021", name: "Alberta_PreFEED_RFP.docx", category: "engineering", uploadDate: "2026-01-28", size: "1.5 MB", uploadedBy: "Dr. Amara Osei", notes: "RFP for Pre-FEED engineering services" },
    ],
    processConfig: null,
    notes: "Regulatory framework review in progress. Cross-border considerations for equipment import.",
    created: "2025-09-01", updated: "2026-02-12",
  },
  {
    id: "dev-india-gujarat",
    name: "Gujarat Coal Facility",
    description: "2 × 20 TPH coal gasification facility in Gujarat, India. Partnership with Tata Recycling for feedstock and distribution.",
    status: "active", health: "green", stage: "concept",
    stageProgress: { concept: 40, "pre-feed": 0, feed: 0, epc: 0, construction: 0, commissioning: 0 },
    feedstock: "Coal", targetTPH: 40,
    location: { name: "Ahmedabad, Gujarat", state: "GJ", lat: 23.02, lon: 72.57 },
    linkedSiteId: null,
    startDate: "2026-02-01", targetFeedDate: "2030-Q2",
    budget: { estimated: 450, spent: 1.2, committed: 4.0, categories: { engineering: 0.8, permits: 0.2, land: 0.2, equipment: 0, other: 0 } },
    teamLead: "emp-001",
    team: [
      { type: "employee", id: "emp-001", role: "Development Lead" },
      { type: "employee", id: "emp-005", role: "Financial Analysis" },
      { type: "agent", id: "vp-strategy", role: "International Strategy" },
    ],
    files: [
      { id: "f-030", name: "Gujarat_Tata_LOI.pdf", category: "legal", uploadDate: "2026-02-08", size: "520 KB", uploadedBy: "Diana Reyes", notes: "Letter of intent — Tata Recycling partnership" },
    ],
    processConfig: null,
    notes: "Tata Recycling LOI signed. Due diligence on feedstock supply chain in progress.",
    created: "2026-02-01", updated: "2026-02-20",
  },
  {
    id: "dev-uzbek",
    name: "Tashkent Coal Facility",
    description: "1 × 20 TPH coal gasification in Uzbekistan. Uzbekneftegaz LOI for feedstock and offtake.",
    status: "on-hold", health: "yellow", stage: "concept",
    stageProgress: { concept: 25, "pre-feed": 0, feed: 0, epc: 0, construction: 0, commissioning: 0 },
    feedstock: "Coal", targetTPH: 20,
    location: { name: "Tashkent, Uzbekistan", state: "UZ", lat: 41.30, lon: 69.28 },
    linkedSiteId: null,
    startDate: "2026-01-01", targetFeedDate: "2031-Q1",
    budget: { estimated: 340, spent: 0.4, committed: 1.0, categories: { engineering: 0.3, permits: 0, land: 0.1, equipment: 0, other: 0 } },
    teamLead: "emp-006",
    team: [
      { type: "employee", id: "emp-006", role: "Contracts Lead" },
      { type: "agent", id: "vp-legal", role: "International Legal" },
    ],
    files: [],
    processConfig: null,
    notes: "On hold pending geopolitical risk assessment and financing structure.",
    created: "2026-01-01", updated: "2026-02-05",
  },
];

// ─── Activity Log ──────────────────────────────────────────────────
export const INITIAL_ACTIVITY = [
  { id: "a-1", projectId: "dev-hartford", action: "File uploaded", detail: "JV_Term_Sheet_v3.pdf", person: "Diana Reyes", date: "2026-02-10" },
  { id: "a-2", projectId: "dev-hartford", action: "Stage advanced", detail: "Pre-FEED progress → 45%", person: "Sarah Chen", date: "2026-02-08" },
  { id: "a-3", projectId: "dev-alberta", action: "Team member added", detail: "VP Strategy assigned", person: "System", date: "2026-02-06" },
  { id: "a-4", projectId: "dev-savannah", action: "Project created", detail: "Savannah Tire Facility", person: "Ben Kowalski", date: "2026-01-15" },
  { id: "a-5", projectId: "dev-india-gujarat", action: "File uploaded", detail: "Gujarat_Tata_LOI.pdf", person: "Diana Reyes", date: "2026-02-08" },
  { id: "a-6", projectId: "dev-hartford", action: "Budget updated", detail: "Committed increased to $28M", person: "Lisa Patel", date: "2026-02-03" },
  { id: "a-7", projectId: "dev-hartford", action: "File uploaded", detail: "CT_Environmental_Assessment_Draft.pdf", person: "Jake Thornton", date: "2026-02-01" },
  { id: "a-8", projectId: "dev-alberta", action: "File uploaded", detail: "Alberta_PreFEED_RFP.docx", person: "Dr. Amara Osei", date: "2026-01-28" },
  { id: "a-9", projectId: "dev-uzbek", action: "Status changed", detail: "Set to On Hold — geopolitical review", person: "System", date: "2026-01-20" },
  { id: "a-10", projectId: "dev-hartford", action: "Process config saved", detail: "9 elements, 6 connections", person: "Sarah Chen", date: "2026-01-18" },
];

// ─── Downstream Module Connections ─────────────────────────────────
export const DOWNSTREAM_MODULES = [
  { key: "ops-projects", label: "Projects", trigger: "Stage = EPC Ready", icon: "⚙" },
  { key: "ops-plant", label: "Plant Operations", trigger: "Commissioned", icon: "▶" },
  { key: "finance", label: "Finance & Strategy", trigger: "Budget linked", icon: "$" },
  { key: "sitemap", label: "Site Map", trigger: "Location set", icon: "◉" },
  { key: "risk", label: "Risk & Workforce", trigger: "Team assigned", icon: "⛨" },
];

export { PROJECT_STAGES };
