import { useState, useMemo } from "react";

// ─── Theme (matches existing T tokens from theme.js) ──────────────
const T = {
  bg0:"#1A1A1A",bg1:"#222222",bg2:"#2A2A2A",bg3:"#333333",bg4:"#3C3C3C",
  border:"#3A3A3A",borderLight:"#4A4A4A",
  text:"#F0EDE8",textMid:"#A89F94",textDim:"#6B635B",
  accent:"#C4753B",accentLight:"#D4945F",accentDim:"#C4753B20",accentBg:"#C4753B10",
  warn:"#D4945F",warnDim:"#D4945F20",
  danger:"#C44B3B",dangerDim:"#C44B3B20",
  blue:"#5B8FB9",blueDim:"#5B8FB920",
  green:"#6B9B6B",greenDim:"#6B9B6B20",
  purple:"#9B7EC8",purpleDim:"#9B7EC820",
  teal:"#5BA89F",tealDim:"#5BA89F20",
};

// ─── Helpers (same as DevelopmentView.jsx) ─────────────────────────
const fmt$ = (v) => v >= 1000 ? `$${(v/1000).toFixed(1)}B` : v >= 1 ? `$${v.toFixed(1)}M` : v > 0 ? `$${(v*1000).toFixed(0)}K` : "—";
const fmtN = (v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v.toFixed(0);

// ─── Coal Feedstock Presets (by coal rank) ─────────────────────────
const COAL_PRESETS = {
  "Bituminous (Default)": { fixedCarbon: 60, volatileMatter: 25, ash: 10, moisture: 5 },
  "Sub-Bituminous": { fixedCarbon: 42, volatileMatter: 35, ash: 8, moisture: 15 },
  "Lignite": { fixedCarbon: 30, volatileMatter: 28, ash: 12, moisture: 30 },
  "Anthracite": { fixedCarbon: 90, volatileMatter: 5, ash: 3, moisture: 2 },
  "Pet Coke": { fixedCarbon: 85, volatileMatter: 10, ash: 1, moisture: 4 },
};

// ─── Tire Feedstock Presets ────────────────────────────────────────
const TIRE_PRESETS = {
  "Passenger Car (Default)": { fixedCarbon: 28, volatileMatter: 62, ash: 6, moisture: 1, steel: 15 },
  "Truck Tires": { fixedCarbon: 30, volatileMatter: 58, ash: 5, moisture: 1, steel: 25 },
  "Mining Truck (Ultra-Heavy)": { fixedCarbon: 34, volatileMatter: 55, ash: 5, moisture: 1, steel: 18 },
  "Mixed TDF": { fixedCarbon: 29, volatileMatter: 60, ash: 6, moisture: 1, steel: 18 },
};

// ─── Carbon Power Reference Data ──────────────────────────────────
// NOTE: Moisture is driven off during pyrolysis — it affects YIELD but NOT
// combustion efficiency. The key efficiency driver is ash concentration in the
// resulting char (ash / (fixedCarbon + ash)). Higher char-ash → worse heat rate.
const CARBON_POWER = {
  charEnergyBTU: 12800,     // BTU per lb of carbon char
  baseHeatRate: 10347,       // BTU/kWh from Hartford model (at ~33% thermal eff)
  charAshThreshold: 15,      // % char ash below which no penalty
  ashHeatPenalty: 0.01,      // per % char ash above threshold, heat rate worsens 1%
};

// ─── Financial Defaults (from Hartford JV Assumptions) ────────────
const FINANCIAL_DEFAULTS = {
  ppaPrice: 60, gridPrice: 75,
  revenueEscalator: 2.0, omEscalator: 2.0, inflation: 3.0,
  federalTax: 21, stateTax: 4, localTax: 1,
  equity: 100, interestRate: 8, costOfEquity: 12,
  insurance: 1.0, salvageValue: 5,
  foundationShare: 27,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FEEDSTOCK COMPOSITION PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function FeedstockDials({ type, feedstock, onChange }) {
  const isCoal = type === "coal";
  const presets = isCoal ? COAL_PRESETS : TIRE_PRESETS;
  const total = feedstock.fixedCarbon + feedstock.volatileMatter + feedstock.ash + feedstock.moisture + (feedstock.steel || 0);
  const balanced = Math.abs(total - 100) < 0.5;

  const setField = (key, val) => onChange({ ...feedstock, [key]: Math.max(0, Math.min(100, val)) });

  const barStyle = (pct, color) => ({
    height: 6, borderRadius: 3, background: color,
    width: `${pct}%`, transition: "width 0.2s",
  });

  return (
    <div style={{ background: T.bg0, borderRadius: 8, border: `1px solid ${T.border}`, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
          {isCoal ? "Coal" : "Tire"} Proximate Analysis
        </div>
        <select
          onChange={e => { const p = presets[e.target.value]; if (p) onChange({ ...feedstock, ...p }); }}
          style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 4, padding: "3px 8px", color: T.text, fontSize: 10, fontFamily: "inherit" }}>
          <option value="">Load Preset...</option>
          {Object.keys(presets).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      {/* Stacked composition bar */}
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 10, background: T.bg3 }}>
        <div style={barStyle(feedstock.fixedCarbon, T.accent)} title={`Fixed Carbon ${feedstock.fixedCarbon}%`} />
        <div style={barStyle(feedstock.volatileMatter, T.blue)} title={`Volatile Matter ${feedstock.volatileMatter}%`} />
        <div style={barStyle(feedstock.ash, T.textMid)} title={`Ash ${feedstock.ash}%`} />
        <div style={barStyle(feedstock.moisture, T.teal)} title={`Moisture ${feedstock.moisture}%`} />
        {feedstock.steel > 0 && <div style={barStyle(feedstock.steel, T.purple)} title={`Steel ${feedstock.steel}%`} />}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <DialRow label="Fixed Carbon" unit="%" value={feedstock.fixedCarbon} color={T.accent} onChange={v => setField("fixedCarbon", v)} />
        <DialRow label="Volatile Matter" unit="%" value={feedstock.volatileMatter} color={T.blue} onChange={v => setField("volatileMatter", v)} />
        <DialRow label="Ash" unit="%" value={feedstock.ash} color={T.textMid} onChange={v => setField("ash", v)} />
        <DialRow label="Moisture" unit="%" value={feedstock.moisture} color={T.teal} onChange={v => setField("moisture", v)} />
        {!isCoal && <DialRow label="Steel" unit="%" value={feedstock.steel || 0} color={T.purple} onChange={v => setField("steel", v)} />}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10 }}>
        <span style={{ color: balanced ? T.green : T.danger, fontWeight: 600 }}>
          {balanced ? "✓ Balanced" : `✗ Total: ${total.toFixed(1)}% (must = 100%)`}
        </span>
      </div>
    </div>
  );
}

function DialRow({ label, unit, value, color, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: T.textMid, flex: 1 }}>{label}</span>
      <input type="number" step="0.5" value={value}
        onChange={e => onChange(+e.target.value)}
        style={{ width: 48, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 4, padding: "3px 6px", color: T.text, fontSize: 11, fontFamily: "inherit", textAlign: "right" }} />
      <span style={{ fontSize: 9, color: T.textDim, width: 12 }}>{unit}</span>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CARBON POWER CONVERSION ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function calcCarbonPowerConversion(coalFeedstock, coalMachines, coalCapacityTonYr) {
  const fc = coalFeedstock.fixedCarbon / 100;
  const ash = coalFeedstock.ash / 100;
  const moisture = coalFeedstock.moisture / 100;
  const vm = coalFeedstock.volatileMatter / 100;

  // Tons of feedstock processed per year
  const annualFeedstockTons = coalMachines * coalCapacityTonYr * 0.84;

  // Product yields from pyrolysis (tons/yr)
  const carbonCharYield = annualFeedstockTons * fc * 0.996; // small conversion loss
  const fuelOilYield = annualFeedstockTons * vm * 0.80;     // ~80% of VM → oil
  const processGasYield = annualFeedstockTons * vm * 0.20;  // ~20% of VM → gas
  const ashYield = annualFeedstockTons * ash;
  const waterYield = annualFeedstockTons * moisture;

  // Char composition: moisture & volatiles driven off during pyrolysis,
  // so char = fixed carbon + ash. Char ash content determines efficiency.
  const charAshContent = (fc + ash) > 0 ? ash / (fc + ash) : 0;
  const charAshPct = charAshContent * 100;

  // Heat rate penalty from ash in char (above threshold)
  const excessCharAsh = Math.max(0, charAshPct - CARBON_POWER.charAshThreshold);
  const heatRateMultiplier = 1 + excessCharAsh * CARBON_POWER.ashHeatPenalty;
  const effectiveHeatRate = CARBON_POWER.baseHeatRate * heatRateMultiplier;

  // Thermal efficiency from heat rate
  const thermalEfficiency = 3412 / effectiveHeatRate;

  // Energy content of carbon char → MWh
  const charEnergyMBTU = carbonCharYield * 2000 * CARBON_POWER.charEnergyBTU / 1e6;
  const carbonMWhPotential = charEnergyMBTU * 1000 / effectiveHeatRate;

  // Tons of carbon per MWh
  const tonsPerMWh = carbonCharYield > 0 && carbonMWhPotential > 0
    ? carbonCharYield / carbonMWhPotential
    : 0;

  // MW capacity at 93.7% capacity factor
  const mwCapacity = carbonMWhPotential / (8760 * 0.937);

  // How much char a 100MW plant would need (for fuel coverage calc)
  // 100 MW × 0.937 CF × 8760 hrs × 1000 kWh/MWh × HR BTU/kWh ÷ (12800 BTU/lb × 2000 lb/ton)
  const tonsNeededFor100MW = 100 * 0.937 * 8760 * 1000 * effectiveHeatRate / (CARBON_POWER.charEnergyBTU * 2000);
  const fuelCoverage = tonsNeededFor100MW > 0 ? carbonCharYield / tonsNeededFor100MW : 0;

  return {
    annualFeedstockTons,
    carbonCharYield,
    fuelOilYield,
    processGasYield,
    ashYield,
    waterYield,
    charAshPct,
    thermalEfficiency,
    effectiveHeatRate,
    carbonMWhPotential,
    tonsPerMWh,
    mwCapacity,
    fuelCoverage,
  };
}

function calcTireConversion(tireFeedstock, tireMachines, tireCapacityTonYr) {
  const fc = tireFeedstock.fixedCarbon / 100;
  const vm = tireFeedstock.volatileMatter / 100;
  const ash = tireFeedstock.ash / 100;
  const steel = (tireFeedstock.steel || 0) / 100;

  const annualFeedstockTons = tireMachines * tireCapacityTonYr * 0.84;

  // Product yields
  const carbonBlackYield = annualFeedstockTons * (fc + ash); // rCB includes ash
  const oilYield = annualFeedstockTons * vm * 0.65;     // ~65% of VM → oil
  const processGasYield = annualFeedstockTons * vm * 0.20;
  const steelYield = annualFeedstockTons * steel;

  // Oil yield in gallons (pyro oil density ~7.1 lb/gal)
  const oilGalPerTon = vm * 2000 * 0.65 / 7.1;
  const totalOilGalYr = oilGalPerTon * annualFeedstockTons;

  return {
    annualFeedstockTons,
    carbonBlackYield,
    oilYield,
    processGasYield,
    steelYield,
    oilGalPerTon,
    totalOilGalYr,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POWER CONVERSION DETAIL PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PowerConversionPanel({ conv }) {
  const rows = [
    { label: "Carbon Char Yield", value: `${fmtN(conv.carbonCharYield)} tons/yr`, color: T.accent },
    { label: "Fuel Oil Yield", value: `${fmtN(conv.fuelOilYield)} tons/yr`, color: T.blue },
    { label: "Process Gas Yield", value: `${fmtN(conv.processGasYield)} tons/yr`, color: T.teal },
    { label: "Ash Residue", value: `${fmtN(conv.ashYield)} tons/yr`, color: T.textMid },
    { sep: true },
    { label: "Char Ash Content", value: `${conv.charAshPct.toFixed(1)}%`, color: conv.charAshPct <= 15 ? T.green : conv.charAshPct <= 25 ? T.warn : T.danger },
    { label: "Thermal Efficiency", value: `${(conv.thermalEfficiency * 100).toFixed(1)}%`, color: conv.thermalEfficiency >= 0.30 ? T.green : conv.thermalEfficiency >= 0.25 ? T.warn : T.danger },
    { label: "Effective Heat Rate", value: `${conv.effectiveHeatRate.toFixed(0)} BTU/kWh`, color: T.text },
    { sep: true },
    { label: "Carbon → Power", value: `${fmtN(conv.carbonMWhPotential)} MWh/yr`, color: T.green },
    { label: "Tons Carbon / MWh", value: conv.tonsPerMWh.toFixed(3), color: T.accent },
    { label: "Equivalent MW Capacity", value: `${conv.mwCapacity.toFixed(1)} MW`, color: T.green },
    { label: "100 MW Fuel Coverage", value: `${(conv.fuelCoverage * 100).toFixed(0)}%`, color: conv.fuelCoverage >= 0.9 ? T.green : conv.fuelCoverage >= 0.7 ? T.warn : T.danger },
  ];

  return (
    <div style={{ background: T.bg0, borderRadius: 8, border: `1px solid ${T.border}`, padding: 14 }}>
      <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 10 }}>
        Carbon → Power Conversion
      </div>
      {rows.map((r, i) => r.sep ? (
        <div key={i} style={{ borderTop: `1px solid ${T.border}`, margin: "6px 0" }} />
      ) : (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 11 }}>
          <span style={{ color: T.textMid }}>{r.label}</span>
          <span style={{ fontWeight: 600, color: r.color, fontFamily: "'SF Mono', monospace" }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function TireConversionPanel({ conv }) {
  const rows = [
    { label: "Carbon Black (rCB)", value: `${fmtN(conv.carbonBlackYield)} tons/yr`, color: T.accent },
    { label: "Pyro-Oil", value: `${fmtN(conv.oilYield)} tons/yr`, color: T.blue },
    { label: "Process Gas", value: `${fmtN(conv.processGasYield)} tons/yr`, color: T.teal },
    { label: "Steel Recovery", value: `${fmtN(conv.steelYield)} tons/yr`, color: T.purple },
    { sep: true },
    { label: "Oil Yield", value: `${conv.oilGalPerTon.toFixed(0)} gal/ton`, color: T.blue },
    { label: "Total Oil", value: `${fmtN(conv.totalOilGalYr)} gal/yr`, color: T.blue },
  ];

  return (
    <div style={{ background: T.bg0, borderRadius: 8, border: `1px solid ${T.border}`, padding: 14 }}>
      <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 10 }}>
        Tire → Product Conversion
      </div>
      {rows.map((r, i) => r.sep ? (
        <div key={i} style={{ borderTop: `1px solid ${T.border}`, margin: "6px 0" }} />
      ) : (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 11 }}>
          <span style={{ color: T.textMid }}>{r.label}</span>
          <span style={{ fontWeight: 600, color: r.color, fontFamily: "'SF Mono', monospace" }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROJECT DIALS PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ProjectDialsPanel({ config, setConfig }) {
  const inputStyle = { width: "100%", background: T.bg0, border: `1px solid ${T.border}`, borderRadius: 4, padding: "5px 8px", color: T.blue, fontSize: 12, fontFamily: "'SF Mono', monospace", textAlign: "right", outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontSize: 10, color: T.textDim, marginBottom: 2 };

  const Field = ({ label, field, step = 1, suffix = "" }) => (
    <div>
      <div style={labelStyle}>{label}{suffix && <span style={{ color: T.textDim }}> ({suffix})</span>}</div>
      <input type="number" step={step} value={config[field]} onChange={e => setConfig(p => ({ ...p, [field]: +e.target.value }))} style={inputStyle} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* SENS Coal */}
      <div style={{ background: T.bg1, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>⛏️</span>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>SENS Coal</div>
          <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: T.warn + "20", color: T.warn }}>Processing</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          <Field label="Machines" field="coalMachines" />
          <Field label="Capacity" field="coalCapacity" suffix="ton/yr" />
          <Field label="Efficiency" field="coalEfficiency" step={0.01} suffix="%" />
          <Field label="CapEx/Machine" field="coalCapex" step={0.1} suffix="$M" />
          <Field label="Feedstock Cost" field="coalFeedCost" suffix="$/ton" />
          <Field label="MW/Machine" field="coalMW" step={0.1} suffix="MW" />
        </div>
        <FeedstockDials type="coal" feedstock={config.coalFeedstock} onChange={f => setConfig(p => ({ ...p, coalFeedstock: f }))} />
      </div>

      {/* SENS Tires */}
      <div style={{ background: T.bg1, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>🔄</span>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>SENS Tires</div>
          <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: T.accent + "20", color: T.accent }}>Processing</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          <Field label="Machines" field="tireMachines" />
          <Field label="Capacity" field="tireCapacity" suffix="ton/yr" />
          <Field label="Efficiency" field="tireEfficiency" step={0.01} suffix="%" />
          <Field label="CapEx/Machine" field="tireCapex" step={0.1} suffix="$M" />
          <Field label="Feedstock Cost" field="tireFeedCost" suffix="$/ton" />
          <Field label="MW/Machine" field="tireMW" step={0.01} suffix="MW" />
        </div>
        <FeedstockDials type="tire" feedstock={config.tireFeedstock} onChange={f => setConfig(p => ({ ...p, tireFeedstock: f }))} />
      </div>

      {/* Power Generation */}
      <div style={{ background: T.bg1, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>⏻</span>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Power Generation</div>
          <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: T.green + "20", color: T.green }}>Power Make</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Field label="Solar (MW)" field="solarMW" />
          <Field label="BESS (MW)" field="bessMW" />
          <Field label="Nat Gas (MW)" field="natGasMW" />
          <Field label="Carbon Power (MW)" field="carbonPowerMW" />
          <Field label="PPA Price" field="ppaPrice" suffix="$/MWh" />
          <Field label="Grid Price" field="gridPrice" suffix="$/MWh" />
        </div>
      </div>

      {/* Financial */}
      <div style={{ background: T.bg1, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>$</span>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Financial Assumptions</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          <Field label="Federal Tax %" field="federalTax" step={0.5} />
          <Field label="State Tax %" field="stateTax" step={0.5} />
          <Field label="Inflation %" field="inflation" step={0.5} />
          <Field label="Rev Escalator %" field="revenueEscalator" step={0.5} />
          <Field label="O&M Escalator %" field="omEscalator" step={0.5} />
          <Field label="Insurance %" field="insurance" step={0.1} />
          <Field label="Foundation %" field="foundationShare" />
          <Field label="Equity %" field="equity" />
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRO FORMA CALCULATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function calcProForma(config, coalConv, tireConv) {
  const years = 6;
  const taxRate = (config.federalTax + config.stateTax + config.localTax) / 100;

  // CapEx
  const coalCapexTotal = config.coalMachines * config.coalCapex;
  const tireCapexTotal = config.tireMachines * config.tireCapex;
  const solarCapex = config.solarMW * 1.2;
  const bessCapex = config.bessMW * 1.15;
  const natGasCapex = config.natGasMW * 1.1;
  const carbonPowerCapex = config.carbonPowerMW * 3.6;
  const totalCapex = coalCapexTotal + tireCapexTotal + solarCapex + bessCapex + natGasCapex + carbonPowerCapex;

  // Annual revenue (steady state)
  // Coal: fuel oil (~$155/ton) + process gas (~$7/ton) from product cuts
  const coalProductRevPerTon = (config.coalFeedstock.volatileMatter / 100) * 0.80 * 2000 / 7.5 * 2.0  // fuel oil: VM% → oil → gal × price
    + (config.coalFeedstock.volatileMatter / 100) * 0.20 * 2000 * 17 * 1020 / 1e6 * 3.0;             // process gas: VM% → gas → MMBtu × price
  const coalAnnualRev = coalConv.annualFeedstockTons * coalProductRevPerTon / 1e6;
  // Tire: model-calibrated $7.5M offtake per machine (from Hartford JV model)
  const tireAnnualRev = config.tireMachines * 7.5;
  const solarRev = config.solarMW * 0.20 * 8760 * config.ppaPrice / 1e6;
  const bessRev = config.bessMW * 0.55 * 4 * 350 * config.ppaPrice / 1e6; // 4hr duration, 350 days
  const natGasRev = config.natGasMW * 0.873 * 8760 * config.ppaPrice / 1e6;
  const carbonPowerRev = Math.min(coalConv.mwCapacity, config.carbonPowerMW) * 0.937 * 8760 * config.ppaPrice / 1e6;

  // Annual opex (steady state)
  const coalOpex = coalConv.annualFeedstockTons * config.coalFeedCost / 1e6 + config.coalMachines * 5.4;
  const tireOpex = tireConv.annualFeedstockTons * config.tireFeedCost / 1e6 + config.tireMachines * 5.4;
  const solarOpex = config.solarMW * 12500 / 1e6;
  const bessOpex = config.bessMW * 1300 / 1e6;
  const natGasOpex = config.natGasMW * 17500 / 1e6 + config.natGasMW * 0.873 * 8760 * 3.5 / 1e6;
  const carbonPowerOpex = config.carbonPowerMW * 60000 / 1e6 + config.carbonPowerMW * 0.937 * 8760 * 7 / 1e6;
  const insuranceOpex = totalCapex * config.insurance / 100;

  const totalRev = coalAnnualRev + tireAnnualRev + solarRev + bessRev + natGasRev + carbonPowerRev;
  const totalOpex = coalOpex + tireOpex + solarOpex + bessOpex + natGasOpex + carbonPowerOpex + insuranceOpex;

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

  // Power balance
  const totalGenMW = config.solarMW * 0.20 + config.bessMW * 0.55 + config.natGasMW * 0.873 + Math.min(coalConv.mwCapacity, config.carbonPowerMW) * 0.937;
  const totalLoadMW = config.coalMachines * config.coalMW + config.tireMachines * config.tireMW;
  const powerSurplus = totalGenMW - totalLoadMW;

  return {
    rows, totalCapex, totalRev, totalOpex,
    totalGenMW, totalLoadMW, powerSurplus,
    coalCapexTotal, tireCapexTotal,
    solarCapex, bessCapex, natGasCapex, carbonPowerCapex,
    foundationDiv: rows.fcf[4] * config.foundationShare / 100,
    sensDiv: rows.fcf[4] * (100 - config.foundationShare) / 100,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN DEVELOPMENT PANEL PREVIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function SENSDevelopmentPanel() {
  const [tab, setTab] = useState("dials");

  const [config, setConfig] = useState({
    // Coal
    coalMachines: 9, coalCapacity: 147168, coalEfficiency: 0.84,
    coalCapex: 20, coalFeedCost: 20, coalMW: 0.4,
    coalFeedstock: { fixedCarbon: 24.6, volatileMatter: 29, ash: 10, moisture: 29 },
    // Tires
    tireMachines: 6, tireCapacity: 14717, tireEfficiency: 0.84,
    tireCapex: 18.75, tireFeedCost: 200, tireMW: 0.218,
    tireFeedstock: { fixedCarbon: 28, volatileMatter: 62, ash: 6, moisture: 1, steel: 15 },
    // Power
    solarMW: 70, bessMW: 50, natGasMW: 100, carbonPowerMW: 100,
    ppaPrice: 60, gridPrice: 75,
    // Financial
    ...FINANCIAL_DEFAULTS,
    localTax: 1,
  });

  const coalConv = useMemo(() => calcCarbonPowerConversion(config.coalFeedstock, config.coalMachines, config.coalCapacity), [config.coalFeedstock, config.coalMachines, config.coalCapacity]);
  const tireConv = useMemo(() => calcTireConversion(config.tireFeedstock, config.tireMachines, config.tireCapacity), [config.tireFeedstock, config.tireMachines, config.tireCapacity]);
  const proForma = useMemo(() => calcProForma(config, coalConv, tireConv), [config, coalConv, tireConv]);

  const tabs = [
    { key: "dials", label: "Dials" },
    { key: "conversion", label: "Conversion" },
    { key: "proforma", label: "Pro Forma" },
  ];

  return (
    <div style={{ background: T.bg0, minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif", color: T.text }}>
      {/* Header */}
      <div style={{ background: T.bg1, borderBottom: `1px solid ${T.border}`, padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Hartford Energy Campus</div>
          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 12, background: T.accent + "20", color: T.accent, fontWeight: 600 }}>DEVELOPMENT</span>
          <span style={{ fontSize: 11, color: T.textMid }}>CT · Jan 2026</span>
        </div>
      </div>

      {/* Tab Bar (matches existing TabBar component) */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: T.bg1, padding: "0 20px" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              background: "none", border: "none", borderBottom: `2px solid ${tab === t.key ? T.accent : "transparent"}`,
              padding: "10px 20px", fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? T.text : T.textMid, cursor: "pointer", fontFamily: "inherit",
              transition: "all .15s",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* KPI Cards (matches existing KpiCard style) */}
      <div style={{ padding: "16px 20px 0 20px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {[
          { label: "Total CapEx", value: fmt$(proForma.totalCapex), color: T.accent },
          { label: "Generation", value: `${proForma.totalGenMW.toFixed(0)} MW`, color: T.green },
          { label: "Load Demand", value: `${proForma.totalLoadMW.toFixed(1)} MW`, color: T.blue },
          { label: "Power Balance", value: `${proForma.powerSurplus >= 0 ? "+" : ""}${proForma.powerSurplus.toFixed(1)} MW`, color: proForma.powerSurplus >= 0 ? T.green : T.danger },
          { label: "Coal → MW", value: `${coalConv.mwCapacity.toFixed(1)} MW`, color: T.warn, sub: `${(coalConv.fuelCoverage*100).toFixed(0)}% fuel coverage @ ${(coalConv.thermalEfficiency*100).toFixed(0)}% eff` },
        ].map((k, i) => (
          <div key={i} style={{ background: T.bg1, borderRadius: 10, border: `1px solid ${T.border}`, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: 10, color: T.textMid, marginTop: 2 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 20px" }}>
        {tab === "dials" && (
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1, maxHeight: "calc(100vh - 240px)", overflowY: "auto" }}>
              <ProjectDialsPanel config={config} setConfig={setConfig} />
            </div>
            {/* Right: Live Budget Summary (matches existing budget panel style) */}
            <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: T.bg1, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
                <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 10 }}>Budget Summary</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[
                    { label: "Total CapEx", value: fmt$(proForma.totalCapex), color: T.accent },
                    { label: "Annual Rev", value: fmt$(proForma.totalRev), color: T.green },
                    { label: "Annual OpEx", value: fmt$(proForma.totalOpex), color: T.blue },
                    { label: "EBITDA", value: fmt$(proForma.totalRev - proForma.totalOpex), color: proForma.totalRev - proForma.totalOpex >= 0 ? T.green : T.danger },
                  ].map((m, i) => (
                    <div key={i} style={{ background: T.bg0, borderRadius: 6, padding: "8px 10px", border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>{m.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: T.bg1, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
                <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>Capacity Checks</div>
                {[
                  { label: "Power Balance", value: `${proForma.powerSurplus >= 0 ? "+" : ""}${proForma.powerSurplus.toFixed(1)} MW`, ok: proForma.powerSurplus >= 0 },
                  { label: "Char Ash Content", value: `${coalConv.charAshPct.toFixed(1)}%`, ok: coalConv.charAshPct <= 25 },
                  { label: "Thermal Eff", value: `${(coalConv.thermalEfficiency*100).toFixed(1)}%`, ok: coalConv.thermalEfficiency >= 0.28 },
                  { label: "Fuel Coverage", value: `${(coalConv.fuelCoverage*100).toFixed(0)}%`, ok: coalConv.fuelCoverage >= 0.7 },
                  { label: "Carbon MW", value: `${coalConv.mwCapacity.toFixed(0)} / ${config.carbonPowerMW} MW`, ok: coalConv.mwCapacity >= config.carbonPowerMW * 0.5 },
                ].map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, padding: "3px 0" }}>
                    <span style={{ color: T.textMid }}>{c.label}</span>
                    <span style={{ fontWeight: 600, color: c.ok ? T.green : T.danger }}>{c.value} {c.ok ? "✓" : "✗"}</span>
                  </div>
                ))}
                {coalConv.charAshPct > 25 && (
                  <div style={{ fontSize: 10, color: T.danger, padding: "4px 8px", background: T.danger + "15", borderRadius: 4, marginTop: 6, lineHeight: 1.3 }}>
                    ⚠ High char ash ({coalConv.charAshPct.toFixed(0)}%) — consider higher-rank coal or blending
                  </div>
                )}
                {proForma.powerSurplus < 0 && (
                  <div style={{ fontSize: 10, color: T.danger, padding: "4px 8px", background: T.danger + "15", borderRadius: 4, marginTop: 4, lineHeight: 1.3 }}>
                    ⚠ Power deficit: {Math.abs(proForma.powerSurplus).toFixed(1)} MW shortfall
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "conversion" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span>⛏️</span> Coal Conversion Chain
              </div>
              <FeedstockDials type="coal" feedstock={config.coalFeedstock} onChange={f => setConfig(p => ({ ...p, coalFeedstock: f }))} />
              <div style={{ marginTop: 12 }}><PowerConversionPanel conv={coalConv} /></div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🔄</span> Tire Conversion Chain
              </div>
              <FeedstockDials type="tire" feedstock={config.tireFeedstock} onChange={f => setConfig(p => ({ ...p, tireFeedstock: f }))} />
              <div style={{ marginTop: 12 }}><TireConversionPanel conv={tireConv} /></div>
            </div>
          </div>
        )}

        {tab === "proforma" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Pro Forma Table */}
            <div style={{ background: T.bg1, borderRadius: 10, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ textAlign: "left", padding: "10px 14px", color: T.textDim, fontWeight: 600, fontSize: 11 }}>Line Item ($M)</th>
                    {[0,1,2,3,4,5].map(y => <th key={y} style={{ textAlign: "right", padding: "10px 12px", color: T.textDim, fontWeight: 600, fontSize: 11 }}>Yr {y}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Capital Expenditure", data: proForma.rows.capex, color: T.danger, bold: true },
                    { label: "Revenue", data: proForma.rows.revenue, color: T.green, bold: true },
                    { label: "Operating Expenses", data: proForma.rows.opex, color: T.warn, bold: false },
                    { label: "EBITDA", data: proForma.rows.ebitda, color: T.accent, bold: true },
                    { label: "Net Income (after tax)", data: proForma.rows.netIncome, color: T.blue, bold: false },
                    { label: "Free Cash Flow", data: proForma.rows.fcf, color: T.text, bold: true },
                    { label: "Cumulative FCF", data: proForma.rows.cumFCF, color: T.purple, bold: false },
                  ].map(({ label, data, color, bold }) => (
                    <tr key={label} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "8px 14px", color, fontWeight: bold ? 600 : 400, fontSize: 12 }}>{label}</td>
                      {data.map((v, i) => (
                        <td key={i} style={{ textAlign: "right", padding: "8px 12px", fontFamily: "'SF Mono', monospace", fontSize: 11, color: v < 0 ? T.danger : color }}>
                          {Math.abs(v) < 0.05 ? "—" : v < 0 ? `(${Math.abs(v).toFixed(1)})` : v.toFixed(1)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* JV Split */}
            <div style={{ background: T.bg1, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
              <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 10 }}>
                Dividend Split — Year 4 Steady State
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1, background: T.purple + "10", border: `1px solid ${T.purple}40`, borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, color: T.textMid }}>Foundation ({config.foundationShare}%)</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.purple }}>{fmt$(proForma.foundationDiv)}</div>
                </div>
                <div style={{ flex: 1, background: T.green + "10", border: `1px solid ${T.green}40`, borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, color: T.textMid }}>SENS ({100 - config.foundationShare}%)</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.green }}>{fmt$(proForma.sensDiv)}</div>
                </div>
              </div>
            </div>

            {/* CapEx Breakdown */}
            <div style={{ background: T.bg1, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
              <div style={{ fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 10 }}>CapEx by Asset</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { label: "SENS Coal", value: proForma.coalCapexTotal, color: T.warn },
                  { label: "SENS Tires", value: proForma.tireCapexTotal, color: T.accent },
                  { label: "Solar", value: proForma.solarCapex, color: "#f5c842" },
                  { label: "BESS", value: proForma.bessCapex, color: T.blue },
                  { label: "Nat Gas", value: proForma.natGasCapex, color: T.danger },
                  { label: "Carbon Power", value: proForma.carbonPowerCapex, color: T.green },
                ].map((a, i) => (
                  <div key={i} style={{ flex: "1 1 140px", background: a.color + "10", border: `1px solid ${a.color}30`, borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 10, color: T.textMid }}>{a.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: a.color }}>{fmt$(a.value)}</div>
                    <div style={{ fontSize: 9, color: T.textDim }}>{(a.value / proForma.totalCapex * 100).toFixed(0)}% of total</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
