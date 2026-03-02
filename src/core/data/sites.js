// Per-machine plan figures derived from SENS OKLAHOMA 2025 ECONOMIC MODEL RNG V7
// Model: 6-machine Noble OK facility at full capacity (Year 2+)
// Annual Revenue: $21,545,097 / 6 machines = $3,590,849 per machine
// Annual Costs:   $7,670,260 / 6 = $1,278,377 per machine
// Annual EBITDA:  $12,610,134 / 6 = $2,101,689 per machine
// Feed rate: 2 TPH per machine, 84% availability, 24hr/day
const PLAN_PER_MACHINE = { revenue: 3590849, costs: 1278377, ebitda: 2101689, uptimePlan: 84, tphPerMachine: 2 };

// Coal 20 TPH machine economics — scaled from engineering estimates
// Higher absolute throughput (10×), improved unit economics at scale
const COAL_PLAN_PER_MACHINE = { revenue: 7850000, costs: 1240000, ebitda: 4380000, uptimePlan: 82, tphPerMachine: 20 };

// Project lifecycle stages
export const PROJECT_STAGES = [
  { key: "concept", label: "Concept", color: "#9f7aea" },
  { key: "pre-feed", label: "Pre-FEED", color: "#4da6ff" },
  { key: "feed", label: "FEED", color: "#f5a623" },
  { key: "epc", label: "EPC", color: "#f5a623" },
  { key: "construction", label: "Construction", color: "#e67e22" },
  { key: "commissioning", label: "Commissioning", color: "#27ae60" },
];

export const SITES = [
  {id:"noble-ok",name:"Noble, Oklahoma",short:"Noble OK",state:"OK",status:"operational",processors:1,tph:2,uptime:84,throughput:1.7,revMTD:1.4,diluentGal:14200,carbonT:128,feedSupplier:"RTR Environmental",feedstock:"Tire Crumb",startYear:2024,capex:"$15M",
    actualRevenue:8.2,actualEBITDA:3.3,actualCOGS:3.1,actualGrossMargin:62,actualOpEx:1.8,
    stageProgress:{concept:100,"pre-feed":100,feed:100,epc:100,construction:100,commissioning:100}},
  {id:"richmond-va",name:"Richmond, Virginia",short:"Richmond VA",state:"VA",status:"operational",processors:2,tph:4,uptime:88,throughput:3.5,revMTD:2.6,diluentGal:28800,carbonT:245,feedSupplier:"Mid-Atlantic Tire Recycling",feedstock:"Tire Crumb",startYear:2025,capex:"$28M",
    actualRevenue:5.4,actualEBITDA:2.2,actualCOGS:2.0,actualGrossMargin:63,actualOpEx:1.2,
    stageProgress:{concept:100,"pre-feed":100,feed:100,epc:100,construction:100,commissioning:100}},
  {id:"tucson-az",name:"Tucson, Arizona",short:"Tucson AZ",state:"AZ",status:"operational",processors:2,tph:4,uptime:91,throughput:3.6,revMTD:2.8,diluentGal:30100,carbonT:260,feedSupplier:"Southwest Tire Processors",feedstock:"Tire Crumb",startYear:2025,capex:"$30M",
    actualRevenue:4.1,actualEBITDA:1.7,actualCOGS:1.5,actualGrossMargin:63,actualOpEx:0.9,
    stageProgress:{concept:100,"pre-feed":100,feed:100,epc:100,construction:100,commissioning:100}},
  {id:"baton-la",name:"Baton Rouge, Louisiana",short:"Baton Rouge",state:"LA",status:"operational",processors:1,tph:2,uptime:79,throughput:1.5,revMTD:1.1,diluentGal:11800,carbonT:102,feedSupplier:"Gulf Coast Rubber",feedstock:"Tire Crumb",startYear:2025,capex:"$16M",
    actualRevenue:2.8,actualEBITDA:1.1,actualCOGS:1.1,actualGrossMargin:61,actualOpEx:0.6,
    stageProgress:{concept:100,"pre-feed":100,feed:100,epc:100,construction:100,commissioning:100}},
  {id:"columbus-oh",name:"Columbus, Ohio",short:"Columbus OH",state:"OH",status:"operational",processors:1,tph:2,uptime:82,throughput:1.6,revMTD:1.2,diluentGal:13100,carbonT:115,feedSupplier:"Midwest Tire Recyclers",feedstock:"Tire Crumb",startYear:2026,capex:"$16M",
    actualRevenue:0.6,actualEBITDA:0.1,actualCOGS:0.3,actualGrossMargin:50,actualOpEx:0.2,
    stageProgress:{concept:100,"pre-feed":100,feed:100,epc:100,construction:100,commissioning:100}},
  // ── Construction ──
  {id:"noble-b",name:"Noble OK — Expansion",short:"Noble B",state:"OK",status:"construction",processors:6,tph:12,throughput:0,revMTD:0,diluentGal:0,carbonT:0,feedSupplier:"RTR Environmental",feedstock:"Tire Crumb",startYear:2028,capex:"$110M",constructionPct:18,stage:"Construction",epc:"Cissell Mueller",
    description:"6-processor expansion of Noble OK facility. EPC contract signed with Cissell Mueller, permitting underway.",
    stageProgress:{concept:100,"pre-feed":100,feed:100,epc:100,construction:18,commissioning:0}},
  {id:"portland-or",name:"Portland, Oregon",short:"Portland OR",state:"OR",status:"construction",processors:3,tph:6,throughput:0,revMTD:0,diluentGal:0,carbonT:0,feedSupplier:"Pacific NW Tire Recyclers",feedstock:"Tire Crumb",startYear:2028,capex:"$52M",constructionPct:10,stage:"EPC",epc:"Brown & Root",
    description:"3-processor greenfield site in Portland. Engineering design complete, entering EPC phase.",
    stageProgress:{concept:100,"pre-feed":100,feed:100,epc:35,construction:0,commissioning:0}},
  // ── Development (Coal) ──
  {id:"coal-fl",name:"Coal Project — Georgia",short:"Coal GA",state:"GA",status:"development",processors:1,tph:20,throughput:0,revMTD:0,diluentGal:0,carbonT:0,feedSupplier:"TBD — Feedstock study in progress",feedstock:"Coal",startYear:2029,capex:"$280M",developmentPct:15,stage:"Pre-FEED",epc:"WSP Global (preliminary)",
    description:"20 TPH coal gasification facility targeting Georgia market. Currently in Pre-FEED stage validating economics and engineering approach with WSP Global.",
    stageProgress:{concept:100,"pre-feed":15,feed:0,epc:0,construction:0,commissioning:0}},
  {id:"coal-tx",name:"Coal Project — Montana",short:"Coal MT",state:"MT",status:"development",processors:1,tph:20,throughput:0,revMTD:0,diluentGal:0,carbonT:0,feedSupplier:"Northern Plains Energy (LOI)",feedstock:"Coal",startYear:2030,capex:"$320M",developmentPct:35,stage:"FEED",epc:"Brown & Root (selected)",
    description:"20 TPH coal gasification facility in Montana. FEED design study underway with detailed engineering and cost estimation to be completed Q3 2027.",
    stageProgress:{concept:100,"pre-feed":100,feed:35,epc:0,construction:0,commissioning:0}},
];

// Manufacturing-to-site dependency tracking
// Critical: Can't install a machine if the site isn't ready
export const manufacturingSiteDependencies = {
  // Noble B — 6 TiPs machines tied to site civil works
  "TiPs-011": { siteId: "noble-b", siteShort: "Noble B", criticalPath: ["site-permitting", "civil-foundation", "electrical-rough-in"], readinessTarget: "2027-Q3", status: "green" },
  "TiPs-012": { siteId: "noble-b", siteShort: "Noble B", criticalPath: ["site-permitting", "civil-foundation", "electrical-rough-in"], readinessTarget: "2027-Q4", status: "green" },
  "TiPs-013": { siteId: "noble-b", siteShort: "Noble B", criticalPath: ["civil-foundation", "electrical-rough-in", "utilities-connect"], readinessTarget: "2028-Q1", status: "green" },
  "TiPs-014": { siteId: "noble-b", siteShort: "Noble B", criticalPath: ["civil-foundation", "utilities-connect", "pad-complete"], readinessTarget: "2028-Q1", status: "yellow" },
  "TiPs-015": { siteId: "noble-b", siteShort: "Noble B", criticalPath: ["utilities-connect", "pad-complete", "fire-suppression"], readinessTarget: "2028-Q2", status: "yellow" },
  "TiPs-016": { siteId: "noble-b", siteShort: "Noble B", criticalPath: ["pad-complete", "fire-suppression", "final-inspection"], readinessTarget: "2028-Q2", status: "green" },
  // Portland OR — 3 TiPs machines
  "TiPs-017": { siteId: "portland-or", siteShort: "Portland OR", criticalPath: ["site-permitting", "geotech-complete", "civil-foundation"], readinessTarget: "2028-Q1", status: "green" },
  "TiPs-018": { siteId: "portland-or", siteShort: "Portland OR", criticalPath: ["civil-foundation", "electrical-rough-in", "utilities-connect"], readinessTarget: "2028-Q2", status: "yellow" },
  "TiPs-019": { siteId: "portland-or", siteShort: "Portland OR", criticalPath: ["utilities-connect", "pad-complete", "final-inspection"], readinessTarget: "2028-Q2", status: "green" },
  // Coal machines — long-lead, tied to site stage progression
  "Coal-001": { siteId: "coal-fl", siteShort: "Coal GA", criticalPath: ["pre-feed-complete", "feed-complete", "epc-award", "site-permitting", "foundation-complete"], readinessTarget: "2029-Q3", status: "green" },
  "Coal-002": { siteId: "coal-tx", siteShort: "Coal MT", criticalPath: ["feed-complete", "epc-award", "site-permitting", "civil-works", "utilities-connect"], readinessTarget: "2030-Q1", status: "yellow" },
};

// Per-site plan metrics (scaled by processor count, branched by feedstock)
export const sitePlan = (site) => {
  const plan = site.feedstock === "Coal" ? COAL_PLAN_PER_MACHINE : PLAN_PER_MACHINE;
  return {
    planRevenue: (site.processors * plan.revenue / 1e6),
    planCosts: (site.processors * plan.costs / 1e6),
    planEBITDA: (site.processors * plan.ebitda / 1e6),
    uptimePlan: plan.uptimePlan,
    tphPlan: site.processors * plan.tphPerMachine,
  };
};

export { PLAN_PER_MACHINE, COAL_PLAN_PER_MACHINE };
export const activeSites = SITES.filter(s => s.status === "operational");
export const constructionSites = SITES.filter(s => s.status === "construction");
export const developmentSites = SITES.filter(s => s.status === "development");
export const allProjectSites = [...activeSites, ...constructionSites, ...developmentSites];
export const totalProcessors = activeSites.reduce((a, s) => a + s.processors, 0);
export const totalTPH = activeSites.reduce((a, s) => a + s.throughput, 0);
export const totalRevMTD = activeSites.reduce((a, s) => a + s.revMTD, 0);
export const totalDiluent = activeSites.reduce((a, s) => a + s.diluentGal, 0);
export const totalCarbon = activeSites.reduce((a, s) => a + s.carbonT, 0);
