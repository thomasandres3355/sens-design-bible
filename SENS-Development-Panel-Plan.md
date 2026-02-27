# SENS Development Panel — Plan & Architecture

## Purpose

A collaborative, in-room development tool that lets you spin up a new project, adjust all financial and technical assumptions ("dials"), and instantly see a high-level pro forma — without touching the complex JV model directly. Each project is independent, so you can dial assumptions per-project based on region (currency, labor costs, construction timelines, etc.).

This tool is **tied to the dynamic flowchart builder** — when you add/configure assets in the flowchart (BESS, Solar, CCGT, Carbon, Hydrogen, SENS-Tires, SENS-Coal, Load Customer), the dials panel and pro forma update in real time to reflect that configuration.

---

## How It Connects to the Flowchart

The flowchart is your **site layout canvas**. When you drag an asset onto the flowchart (e.g., drop a "SENS-Tires" block and connect it to power), three things happen:

1. **The asset appears in the Dials Panel** with all its default assumptions pre-populated from the JV model
2. **The Pro Forma recalculates** to include that asset's capex, revenue, opex, and cash flow
3. **The flowchart visuals update** — power flows, volume connections, and land use reflect the configured asset

Removing an asset from the flowchart removes it from the dials and pro forma. Changing a dial (e.g., increasing SENS-Coal machines from 9 to 15) updates the flowchart annotations (MW, volume, acreage) and the pro forma simultaneously.

---

## Dials Architecture — Full Catalog from JV Model

### SECTION 1: Universal Project Inputs (applies to all assets on site)

These are project-wide settings that affect every asset module.

| Dial | Unit | Default | Notes |
|------|------|---------|-------|
| Project Name | text | — | User-defined |
| Project State | dropdown | — | US state list (affects tax rates) |
| Start Date | date | Jan 2026 | Construction start |
| Project Analysis Period | years | 25 | Drives projection horizon |
| CapEx Contribution (JV vs ISCM) | % | 100% ISCM | Per asset toggle |
| Revenue Sharing | % | 100% | JV split |
| Equity / Debt Split | % | 100% / 0% | Capital structure |
| Tenor of Loan | years | 20 | Debt term |
| Interest Rate | % | 8.0% | Cost of debt |
| Cost of Equity | % | 12.0% | Required return |
| Federal Tax | % | 21.0% | |
| State Tax | % | 4.0% | **Region dial** — changes by state |
| Local Tax | % | 1.0% | **Region dial** |
| WACC | % | 12.0% | Calculated from equity/debt/rates |
| Currency Escalator (Inflation) | % | 3.0% | Annual |
| Revenue Escalator | % | 2.0% | Annual price growth |
| O&M Escalator | % | 2.0% | Annual cost growth |
| Insurance | % of Capex | 1.0% | Annual |
| Salvage Value | % | 5.0% | End-of-life residual |

### SECTION 2: Per-Asset Technology Dials

Each asset placed on the flowchart gets its own dial panel. Below are the dials per asset type.

#### Construction & Timeline (all assets)
| Dial | Unit | BESS | Nat Gas | Solar | Carbon | Hydrogen | SENS-Tires | SENS-Coal |
|------|------|------|---------|-------|--------|----------|------------|-----------|
| Construction Time | months | 12 | 36 | 18 | 48 | 15 | 12 | 12 |
| Commissioning Time | months | 2 | 4 | 2 | 2 | 1 | 3 | 3 |
| Refresh Cost | % of initial | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| Refresh Frequency | years | 25 | 25 | 25 | 25 | 25 | 25 | 25 |

#### CapEx Breakdown (all assets)
| Dial | Unit | Default |
|------|------|---------|
| Total Initial Capex | $M | Per asset type |
| Design | % | 5% (2% for SENS) |
| Fee | % | 15% (5% for SENS) |
| Permit | % | 1% |
| General Conditions | % | 8% (3% for SENS) |
| Sitework | % | 10% (3% for SENS) |
| Foundations/Structure | % | 15% (6% for SENS) |
| Building Shell | % | 20% (8% for SENS) |
| Equipment | % | 20% (70% for SENS) |
| Interior Build-out | % | 6% (2% for SENS) |
| CM EPC Margin | % | 5% |

#### Land & Real Estate (all assets)
| Dial | Unit | Default (varies by asset) |
|------|------|---------|
| Building as % of Land | % | 2%–100% |
| Land Needed per Unit | sqft or acres | Asset-specific |
| White Space (Critical Infra) | % | 0%–75% |
| Gray Space (Support Infra) | % | 25%–100% |
| Constructed Building Lease | $/sqft/yr | 0 |
| Land Lease | $/sqft/yr | 0 |

#### Power Generation Dials (BESS, Nat Gas, Solar, Carbon)
| Dial | Unit | BESS | Nat Gas | Solar | Carbon |
|------|------|------|---------|-------|--------|
| Installed Power | MW | 100 | 100 | 100 | 100 |
| Capex per Unit | $/MW | 1.15M | 1.10M | 1.20M | 3.60M |
| Fixed O&M | $/MW-yr | 1,300 | 17,500 | 12,500 | 60,000 |
| Variable O&M | $/MWh | 0 | 3.50 | 0 | 7.00 |
| Heat Rate | Btu/kWh | N/A | 6,750 | N/A | 10,347 |
| Fuel Price | $/MMBtu | N/A | 3.45 | N/A | 0.35 |
| On-Site PPA Price | $/MWh | 60 | 60 | 60 | 60 |
| PPA Length | years | 15 | 15 | 15 | 15 |
| Annual Degradation | % | 0.5% | 0.25% | 0.5% | 0.25% |
| Capacity Factor | % | N/A | 87.3% | 20% | 93.7% |
| Station Service Load | % | 0% | 2.5% | 0% | 3% |
| Days Operating | days/yr | 350 | 362 | 365 | 360 |
| CE ITC | % | 30% | N/A | 30% | N/A |
| CE PTC | $/MWh | 27.50 | N/A | 27.50 | N/A |

**BESS-Specific:**
| Battery Duration | hours | 4 |
| Total Capability | MWh | 400 |
| Output Efficiency | % | 95% |
| Depth of Discharge | % | 80% |
| Cycles/Day | # | 1 |

#### Power Take / Offtake Dials (Load, Hydrogen, SENS-Tires, SENS-Coal)
| Dial | Unit | Load | Hydrogen | SENS-Tires | SENS-Coal |
|------|------|------|----------|------------|-----------|
| Machines | # | ~85 | 2 | 6 | 9 |
| Electric Consumption/Machine | MW | 1 | 50 | 0.218 | 0.4 |
| Capex per Machine | $M | 30 | 2.265 | 18.75 | 20 |
| Offtake Revenue/Machine | $M | 27 | 7.5 | See below | See below |
| Fixed O&M | % of Capex | 1% | 1.5% | 3.2% | 3% |
| Variable O&M | $M/unit | 0 | 5e-9 | 5.4 | 5.4 |
| On-site PPA Price | $/MWh | 60 | 60 | 60 | 60 |
| Grid Price | $/MWh | 75 | 75 | 75 | 75 |
| Capacity Factor | % | N/A | 55% | 84% | 84% |
| Days Operating | days/yr | 365 | 365 | 365 | 365 |

#### Hydrogen-Specific Dials
| Dial | Unit | Default |
|------|------|---------|
| Electrolyzer Size | MW | 100 |
| HHV of Hydrogen | kWh/kg | 33.33 |
| LHV of Hydrogen | kWh/kg | 29.7 |
| Levelized Efficiency Penalty | kWh/kg | 4.4 |
| Electric Consumption of H2 | kWh/kg | 55.6 |
| Hydrogen Price | $/kg | 7.50 |
| 45V Hydrogen PTC | $/kg-H2 | 1.00 |

#### SENS Tires — Product Cut & Pricing
| Dial | Unit | Default |
|------|------|---------|
| Machine Efficiency | % | 84% |
| Machine Capacity | ton/yr | 14,717 |
| Feedstock Cost | $/ton | 200 |
| Solvent Mass Ratio | % | 45% |
| Solvent Volume | gal/ton | 120 |
| Carbon Black Mass Ratio | % | 45% |
| Process Gas Mass Ratio | % | 10% |
| Solvent Price | $/gal | 10 |
| Carbon Black Price | $/ton | 1,000 |
| Process Gas Price | $/MMBtu | 3 |

#### SENS Coal — Product Cut & Pricing
| Dial | Unit | Default |
|------|------|---------|
| Machine Efficiency | % | 84% |
| Machine Capacity | ton/yr | 147,168 |
| Feedstock Cost | $/ton | 20 |
| Carbon (Coal-Char-Fuel) Mass Ratio | % | 24.6% |
| Coal-Fuel-Oil Mass Ratio | % | 29% |
| Mineral Ash | % | 10% |
| Water Mass Ratio | % | 29% |
| Process Gas Mass Ratio | % | 7% |
| Processed Coal Price | $/ton | 3.75 |
| Commercial Carbon Price | $/ton | 9.82 |
| Coal-Fuel-Oil Price | $/gal | 2.00 |
| Process Gas Price | $/MMBtu | 3.00 |
| Coal Fines Price | $/ton | 0.20 |

---

## Pro Forma Output — What You See

Once assets are placed and dials configured, the panel shows a **high-level pro forma** with these sections:

### Summary KPIs (top cards)
- **Total CapEx** ($M)
- **Total Acreage**
- **Installed Generation** (MW)
- **Peak Load** (MW)
- **Levered IRR** (%)
- **Payback Period** (years)
- **ROIC at Year 5**
- **Unlevered NPV** ($M)

### Pro Forma Table (25-year projection, showing Years 0–5 + Year 10, 15, 20, 25)

| Line Item | Yr 0 | Yr 1 | Yr 2 | Yr 3 | Yr 4 | Yr 5 | ... |
|-----------|------|------|------|------|------|------|-----|
| **Capital Expenditure** | | | | | | | |
| Land Development | | | | | | | |
| Power Make (by asset) | | | | | | | |
| Power Take (by asset) | | | | | | | |
| **Total CapEx** | | | | | | | |
| | | | | | | | |
| **Revenue** | | | | | | | |
| Offtake Revenue (by asset) | | | | | | | |
| Electricity Generation Revenue | | | | | | | |
| Land Lease Revenue | | | | | | | |
| **Total Revenue** | | | | | | | |
| | | | | | | | |
| **Operating Expenses** | | | | | | | |
| Fixed O&M (by asset) | | | | | | | |
| Variable O&M (by asset) | | | | | | | |
| Fuel Costs | | | | | | | |
| Insurance | | | | | | | |
| **Total OpEx** | | | | | | | |
| | | | | | | | |
| **EBITDA** | | | | | | | |
| D&A | | | | | | | |
| **EBIT** | | | | | | | |
| Taxes | | | | | | | |
| **Net Income** | | | | | | | |
| | | | | | | | |
| **Free Cash Flow** | | | | | | | |
| Unlevered FCF | | | | | | | |
| Debt Service | | | | | | | |
| **Cash Available for Dividend** | | | | | | | |
| Foundation Share (27%) | | | | | | | |
| SENS Share (73%) | | | | | | | |

### Production Volume Table
| Metric | Yr 1 | Yr 2 | Yr 3 | ... |
|--------|------|------|------|-----|
| Electricity Generated (MWh) | | | | |
| Electricity from Grid (MWh) | | | | |
| Hydrogen Produced (kg) | | | | |
| Coal Processed (tons) | | | | |
| Tires Processed (tons) | | | | |
| Carbon Equivalent (tons CO2) | | | | |

### Carbon / Power Equivalence
- Total MW consumed → equivalent carbon if served by a power plant
- Grid dependency vs self-generation ratio
- Carbon offset from BTMG generation

---

## UI Layout Concept

```
+-------------------------------------------------------------------+
|  PROJECT: [Hartford]  STATE: [CT ▼]  START: [Jan 2026]            |
+-------------------------------------------------------------------+
|                                                                     |
|  [FLOWCHART TAB]  [DIALS TAB]  [PRO FORMA TAB]                    |
|                                                                     |
+-------------------------------------------------------------------+

FLOWCHART TAB:
  Interactive node-based canvas showing assets, power flows,
  volume connections. Click an asset → opens its dials.

DIALS TAB:
  Left sidebar: Asset selector (Universal | BESS | Solar | ...)
  Main area: Accordion panels with grouped dials
    - Financial (rates, splits, escalators)
    - Construction (timeline, capex breakdown)
    - Technical (capacity, efficiency, pricing)
    - Land (acreage, lease rates)

PRO FORMA TAB:
  KPI cards across the top
  Scrollable financial table below
  Toggle: [Summary] [Detailed] [By Asset]
  Charts: Cumulative cash flow, revenue waterfall, capex deployment
```

---

## Implementation Notes

- **Per-unit / Per-MW basis**: The model's generation tabs (BESS, CCGT, Solar, Carbon) are all structured on a per-MW installed basis. SENS-Tires and SENS-Coal are per-machine. The tool should maintain this — when you change "Installed Power: 70 MW" for Solar, it scales all the per-MW calculations.

- **Combined vs Single module tabs**: The JV model has "Project" tabs (GREV, OPEX, NET, CAPEX, etc.) that aggregate across all assets, and individual asset tabs (GEN-BESS, GEN-CCGT, etc.) that model each asset standalone. The development panel pro forma should show both: a combined view and click-to-drill into individual assets.

- **Start Date offsets**: Each asset can start in a different year relative to the project. The Project Master Sheet tracks this with a "START DATE >>" column (0 = year 0, 1 = year 1, 2 = year 2). This is how construction phasing works and must be configurable per asset.

- **Data Center / Load Customer**: This is the anchor tenant. The model treats it as a power consumer with ~85 machines at 1 MW each. The development tool should handle this as the demand driver that sizes everything else.

- **JV Split**: Foundation (27%) vs SENS (73%) dividend split is a universal dial. The Dashboard and JV Summary reference this.
