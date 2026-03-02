import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Globe from "react-globe.gl";
import { T } from "@core/theme/theme";
import { SITES } from "@core/data/sites";

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";

// ─── 3D GLOBE CAMERA POSITIONS ─────────────────────────────────
const GLOBE_VIEWS = {
  global:          { lat: 20, lng: -30, altitude: 2.5, label: "Global" },
  "north-america": { lat: 38, lng: -97, altitude: 1.2, label: "North America" },
  europe:          { lat: 50, lng: 15,  altitude: 1.0, label: "Europe" },
  asia:            { lat: 30, lng: 80,  altitude: 1.5, label: "Asia" },
};

// ─── Extended site data with global locations + lat/lon ────────
// Merges SITES from data/sites.js with map-specific fields
const MAP_SITES = [
  ...SITES.filter(s => s.status === "operational").map(s => ({
    ...s, tphPerMachine: 2, series: "A", region: "US",
    lat: { "noble-ok": 35.14, "richmond-va": 37.54, "tucson-az": 32.22, "baton-la": 30.45, "columbus-oh": 39.96 }[s.id] || 33,
    lon: { "noble-ok": -97.39, "richmond-va": -77.44, "tucson-az": -110.97, "baton-la": -91.19, "columbus-oh": -82.99 }[s.id] || -90,
  })),
  ...SITES.filter(s => s.status === "construction").map(s => ({
    ...s, tphPerMachine: 2, series: "A", region: "US",
    lat: { "noble-b": 35.16, "portland-or": 45.52 }[s.id] || 33,
    lon: { "noble-b": -97.35, "portland-or": -122.68 }[s.id] || -90,
  })),
  ...SITES.filter(s => s.status === "development").map(s => ({
    ...s, tphPerMachine: 20, series: "C", region: "US",
    lat: { "coal-fl": 33.75, "coal-tx": 45.79 }[s.id] || 30,
    lon: { "coal-fl": -84.39, "coal-tx": -108.50 }[s.id] || -90,
  })),
  // ── International sites ──
  { id: "india-guj", name: "Gujarat, India", short: "Gujarat", region: "India", status: "development", processors: 2, tphPerMachine: 20, tph: 40, throughput: 0, revMTD: 0, diluentGal: 0, carbonT: 0, feedSupplier: "Tata Recycling (MoU)", feedstock: "Coal", startYear: 2030, capex: "$450M", developmentPct: 8, stage: "Concept", lat: 22.31, lon: 72.63, series: "C",
    stageProgress: { concept: 60, "pre-feed": 0, feed: 0, epc: 0, construction: 0, commissioning: 0 } },
  { id: "uzb-tashkent", name: "Tashkent, Uzbekistan", short: "Tashkent", region: "Uzbekistan", status: "development", processors: 1, tphPerMachine: 20, tph: 20, throughput: 0, revMTD: 0, diluentGal: 0, carbonT: 0, feedSupplier: "Uzbekneftegaz (LOI)", feedstock: "Coal", startYear: 2031, capex: "$340M", developmentPct: 5, stage: "Concept", lat: 41.30, lon: 69.28, series: "C",
    stageProgress: { concept: 35, "pre-feed": 0, feed: 0, epc: 0, construction: 0, commissioning: 0 } },
  { id: "canada-ab", name: "Alberta, Canada", short: "Alberta", region: "Canada", status: "construction", processors: 2, tphPerMachine: 2, tph: 4, throughput: 0, revMTD: 0, diluentGal: 0, carbonT: 0, feedSupplier: "Canadian Tire Stewardship", feedstock: "Tire Crumb", startYear: 2028, capex: "$68M", constructionPct: 22, stage: "Construction", lat: 53.55, lon: -113.49, series: "A",
    stageProgress: { concept: 100, "pre-feed": 100, feed: 100, epc: 100, construction: 22, commissioning: 0 } },
];

const STATUS_COLORS = { operational: T.green, construction: T.accent, development: T.purple };


// ─── ASSET TYPES ───────────────────────────────────────────────
const ASSET_DEFS = {
  tips_2:    { label: "TiPs 2 TPH",   tph: 2,  color: T.accent,     icon: "⚙", cat: "processor", w: 2, h: 2, series: "A" },
  tips_20:   { label: "TiPs 20 TPH",  tph: 20, color: T.accent,     icon: "⚙", cat: "processor", w: 4, h: 3, series: "C" },
  feeder:    { label: "Crumb Feeder",  tph: 0,  color: T.warn,       icon: "⟳", cat: "input",     w: 2, h: 2 },
  tank:      { label: "Diluent Tank",  tph: 0,  color: T.blue,       icon: "▣", cat: "storage",   w: 1, h: 2 },
  silo:      { label: "Carbon Silo",   tph: 0,  color: T.textMid,    icon: "⬡", cat: "storage",   w: 1, h: 2 },
  syngas:    { label: "Syn Gas Unit",  tph: 0,  color: T.green,      icon: "◈", cat: "output",    w: 2, h: 1 },
  loading:   { label: "Loading Bay",   tph: 0,  color: T.accentLight,icon: "▤", cat: "logistics", w: 2, h: 2 },
  control:   { label: "Control Room",  tph: 0,  color: T.teal,       icon: "⌂", cat: "building",  w: 2, h: 2 },
  substation:{ label: "Substation",    tph: 0,  color: T.warn,       icon: "⏚", cat: "utility",   w: 1, h: 1 },
};

function tipsTypeForTPH(tph) { return tph >= 20 ? "tips_20" : "tips_2"; }

// ─── IoT SENSOR GENERATOR ──────────────────────────────────────
function generateIoTSensors(asset, site) {
  const ri = asset.id.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const rng = (i) => { const x = Math.sin(ri * 9301 + i * 4973 + 7) * 49297; return x - Math.floor(x); };
  const def = ASSET_DEFS[asset.type]; if (!def) return [];
  const sensors = []; let si = 0;
  if (def.cat === "processor") {
    sensors.push(
      { id: `${asset.id}-tc`, name: "Core Temperature", unit: "°F", value: Math.round(340+rng(si++)*100), max: 500, alarm: 480, status: "online", lastReading: "2s ago" },
      { id: `${asset.id}-to`, name: "Outlet Temperature", unit: "°F", value: Math.round(180+rng(si++)*60), max: 280, alarm: 260, status: "online", lastReading: "2s ago" },
      { id: `${asset.id}-pr`, name: "Chamber Pressure", unit: "PSI", value: Math.round(12+rng(si++)*8), max: 25, alarm: 22, status: "online", lastReading: "1s ago" },
      { id: `${asset.id}-vb`, name: "Vibration", unit: "mm/s", value: (rng(si++)*4).toFixed(1), max: 8, alarm: 6, status: rng(si++)>0.9?"warning":"online", lastReading: "500ms ago" },
      { id: `${asset.id}-rpm`, name: "Auger RPM", unit: "RPM", value: Math.round(40+rng(si++)*20), max: 80, alarm: 75, status: "online", lastReading: "1s ago" },
      { id: `${asset.id}-fi`, name: "Feed Flow Rate", unit: "TPH", value: ((site.tphPerMachine||2)*(0.7+rng(si++)*0.3)).toFixed(1), max: (site.tphPerMachine||2)*1.1, alarm: (site.tphPerMachine||2)*1.05, status: "online", lastReading: "2s ago" },
      { id: `${asset.id}-co`, name: "CO Monitor", unit: "ppm", value: Math.round(rng(si++)*30), max: 100, alarm: 50, status: "online", lastReading: "5s ago" },
      { id: `${asset.id}-pw`, name: "Power Draw", unit: "kW", value: Math.round(80+rng(si++)*120), max: 300, alarm: 280, status: "online", lastReading: "1s ago" },
    );
  } else if (def.cat === "storage") {
    sensors.push(
      { id: `${asset.id}-lv`, name: "Level Sensor", unit: "%", value: asset.level||Math.round(30+rng(si++)*60), max: 100, alarm: 95, status: "online", lastReading: "10s ago" },
      { id: `${asset.id}-tm`, name: "Temperature", unit: "°F", value: Math.round(60+rng(si++)*30), max: 120, alarm: 100, status: "online", lastReading: "30s ago" },
      { id: `${asset.id}-ph`, name: "Headspace Pressure", unit: "PSI", value: (rng(si++)*3).toFixed(1), max: 5, alarm: 4, status: "online", lastReading: "10s ago" },
    );
    if (asset.type === "tank") sensors.push(
      { id: `${asset.id}-fo`, name: "Outflow Rate", unit: "GPM", value: Math.round(rng(si++)*40), max: 60, alarm: 55, status: "online", lastReading: "5s ago" },
      { id: `${asset.id}-dn`, name: "Density", unit: "g/mL", value: (0.82+rng(si++)*0.06).toFixed(1), max: 0.92, alarm: 0.90, status: "online", lastReading: "60s ago" },
    );
  } else if (def.cat === "input") {
    sensors.push(
      { id: `${asset.id}-bs`, name: "Belt Scale", unit: "TPH", value: ((site.tphPerMachine||2)*(0.8+rng(si++)*0.2)).toFixed(1), max: (site.tphPerMachine||2)*1.2, alarm: (site.tphPerMachine||2)*1.1, status: "online", lastReading: "1s ago" },
      { id: `${asset.id}-mc`, name: "Motor Current", unit: "A", value: Math.round(15+rng(si++)*20), max: 50, alarm: 45, status: "online", lastReading: "2s ago" },
      { id: `${asset.id}-ms`, name: "Moisture", unit: "%", value: (rng(si++)*8).toFixed(1), max: 15, alarm: 12, status: "online", lastReading: "30s ago" },
    );
  } else if (def.cat === "output") {
    sensors.push(
      { id: `${asset.id}-gf`, name: "Gas Flow", unit: "SCFM", value: Math.round(200+rng(si++)*300), max: 800, alarm: 700, status: "online", lastReading: "2s ago" },
      { id: `${asset.id}-ch`, name: "CH4 Content", unit: "%", value: Math.round(30+rng(si++)*30), max: 100, alarm: 0, status: "online", lastReading: "60s ago" },
    );
  } else if (def.cat === "logistics") {
    sensors.push(
      { id: `${asset.id}-sc`, name: "Truck Scale", unit: "lbs", value: Math.round(rng(si++)*80000), max: 80000, alarm: 0, status: rng(si++)>0.3?"online":"idle", lastReading: "5m ago" },
    );
  }
  return sensors;
}

function generateOfftake(asset, site) {
  const ri = asset.id.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const rng = (i) => { const x = Math.sin(ri*3301+i*2973+11)*49297; return x-Math.floor(x); };
  const def = ASSET_DEFS[asset.type]; if (!def) return null;
  const tpm = site.tphPerMachine || 2;
  if (def.cat === "processor") return {
    currentRate: (tpm*(0.75+rng(0)*0.25)).toFixed(1)+" TPH",
    dailyVolume: (tpm*24*(0.75+rng(1)*0.2)).toFixed(1)+" T",
    mtdVolume: (tpm*24*22*(0.7+rng(2)*0.2)).toFixed(0)+" T",
    products: [
      { name: "Diluent", pct: 35, vol: (tpm*0.35*24).toFixed(1)+" T/d", color: T.blue },
      { name: "Carbon Black", pct: 38, vol: (tpm*0.38*24).toFixed(1)+" T/d", color: T.textMid },
      { name: "Syn Gas", pct: 12, vol: (tpm*0.12*24).toFixed(1)+" T/d", color: T.green },
      { name: "Steel", pct: 10, vol: (tpm*0.10*24).toFixed(1)+" T/d", color: T.accent },
      { name: "Water", pct: 5, vol: (tpm*0.05*24).toFixed(1)+" T/d", color: T.teal },
    ],
  };
  if (def.cat === "storage") {
    const cap = asset.capacity||5000, lvl = asset.level||50;
    return {
      currentLevel: lvl+"%",
      currentVolume: asset.type==="tank"?`${Math.round(cap*lvl/100)} gal`:`${Math.round(cap*lvl/100)} T`,
      totalCapacity: asset.type==="tank"?`${cap} gal`:`${cap} T`,
      inflow: (rng(0)*20).toFixed(1)+(asset.type==="tank"?" GPM":" T/hr"),
      outflow: (rng(1)*15).toFixed(1)+(asset.type==="tank"?" GPM":" T/hr"),
    };
  }
  return null;
}

// ─── GENERATE SITE LAYOUT ──────────────────────────────────────
function generateSiteLayout(site) {
  const GRID = 22; const assets = []; let uid = 0;
  const mkId = () => `${site.id}-${uid++}`;
  const seed = site.id.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const rng = (i) => { const x = Math.sin(seed*9301+i*4973)*49297; return x-Math.floor(x); };
  let ri = 0;
  const tipsType = tipsTypeForTPH(site.tphPerMachine || 2);
  const tipsDef = ASSET_DEFS[tipsType];
  const feederW = ASSET_DEFS.feeder.w;

  assets.push({ id: mkId(), type: "control", x: 0, y: 0, name: "Control Room", status: "running", health: 95 });
  assets.push({ id: mkId(), type: "substation", x: 3, y: 0, name: "Substation", status: "running", health: 98 });
  for (let i = 0; i < site.processors; i++) {
    const yOff = 3 + i * (tipsDef.h + 2);
    assets.push({ id: mkId(), type: "feeder", x: 0, y: yOff, name: `Crumb Feeder ${i+1}`, status: "running", health: Math.round(80+rng(ri++)*20), throughput: site.tphPerMachine||2 });
  }
  for (let i = 0; i < site.processors; i++) {
    const yOff = 3 + i * (tipsDef.h + 2);
    assets.push({ id: mkId(), type: tipsType, x: feederW+1, y: yOff, name: `TiPs ${i+1} (${site.tphPerMachine||2} TPH)`,
      status: (site.uptime||80)>80?"running":"warning", health: Math.round(70+rng(ri++)*30),
      uptime: (site.uptime||80)+Math.round((rng(ri++)-0.5)*6), throughput: site.tphPerMachine||2,
      temp: Math.round(350+rng(ri++)*80), tph: site.tphPerMachine||2, series: tipsDef.series,
      runtimeHours: Math.round(2000+rng(ri++)*15000), lastMaintenance: `${Math.round(5+rng(ri++)*60)}d ago`,
    });
  }
  const tankStartX = feederW + tipsDef.w + 2;
  const tpm = site.tphPerMachine || 2;
  const tankCount = Math.max(2, Math.ceil(site.processors * (tpm >= 10 ? 6 : 4)));
  for (let i = 0; i < tankCount; i++) {
    assets.push({ id: mkId(), type: "tank", x: tankStartX+(i%6), y: 1+Math.floor(i/6)*3,
      name: `Tank T-${String(i+1).padStart(2,"0")}`, status: "running", health: Math.round(85+rng(ri++)*15),
      level: Math.round(30+rng(ri++)*60), capacity: Math.round((site.diluentGal||site.processors*tpm*5000)/tankCount),
    });
  }
  const siloCount = Math.max(1, Math.ceil(site.processors * (tpm >= 10 ? 3 : 2)));
  for (let i = 0; i < siloCount; i++) {
    assets.push({ id: mkId(), type: "silo", x: tankStartX+(i%4), y: 8+Math.floor(i/4)*3,
      name: `Silo C-${String(i+1).padStart(2,"0")}`, status: "running", health: Math.round(88+rng(ri++)*12),
      level: Math.round(20+rng(ri++)*70), capacity: Math.round((site.carbonT||site.processors*tpm*50)/siloCount),
    });
  }
  for (let i = 0; i < site.processors; i++) {
    const yOff = 3 + i * (tipsDef.h + 2) + tipsDef.h;
    assets.push({ id: mkId(), type: "syngas", x: feederW+1, y: yOff, name: `Syn Gas ${i+1}`, status: "running", health: Math.round(85+rng(ri++)*15) });
  }
  const loadX = tankStartX + 7;
  const bayCount = Math.max(2, Math.ceil(site.processors * (tpm >= 10 ? 3 : 2)));
  for (let i = 0; i < Math.min(bayCount, 4); i++) {
    assets.push({ id: mkId(), type: "loading", x: loadX, y: 1+i*3, name: `Bay ${i+1}`, status: "running", health: Math.round(90+rng(ri++)*10) });
  }
  const defaultFlows = [];
  const feeders = assets.filter(a => a.type === "feeder");
  const procs = assets.filter(a => a.type.startsWith("tips_"));
  const tanks = assets.filter(a => a.type === "tank");
  const silos = assets.filter(a => a.type === "silo");
  const synU = assets.filter(a => a.type === "syngas");
  const bays = assets.filter(a => a.type === "loading");
  feeders.forEach((f,i) => { if (procs[i]) defaultFlows.push({ from: f.id, to: procs[i].id, label: "Crumb", color: T.warn }); });
  procs.forEach((p,i) => {
    if (tanks[0]) defaultFlows.push({ from: p.id, to: tanks[0].id, label: "Diluent", color: T.blue });
    if (silos[0]) defaultFlows.push({ from: p.id, to: silos[0].id, label: "Carbon", color: T.textMid });
    if (synU[i]) defaultFlows.push({ from: p.id, to: synU[i].id, label: "Syngas", color: T.green });
  });
  if (tanks[0]&&bays[0]) defaultFlows.push({ from: tanks[0].id, to: bays[0].id, label: "Ship Oil", color: T.accent });
  if (silos[0]&&bays[0]) defaultFlows.push({ from: silos[0].id, to: bays[0].id, label: "Ship Carbon", color: T.accentLight });
  return { assets, flows: defaultFlows, gridSize: GRID };
}

// ─── DEEP ASSET DETAIL PANEL ───────────────────────────────────
function AssetDeepDrill({ asset, site, flows, assetMap, onClose }) {
  const def = ASSET_DEFS[asset.type]; if (!def) return null;
  const isOp = site.status === "operational";
  const statusClr = asset.status==="running"?T.green:asset.status==="warning"?T.warn:T.textDim;
  const sensors = useMemo(() => generateIoTSensors(asset, site), [asset.id]);
  const offtake = useMemo(() => generateOfftake(asset, site), [asset.id]);
  const assetFlows = flows.filter(f => f.from===asset.id||f.to===asset.id);
  const [sensorsOpen, setSensorsOpen] = useState(true);

  const SH = ({ label, count, open, toggle }) => (
    <div onClick={toggle} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",cursor:toggle?"pointer":"default",borderBottom:`1px solid ${T.border}`,marginBottom:8 }}>
      <span style={{ fontSize:10,fontWeight:700,color:T.textDim,letterSpacing:1,textTransform:"uppercase" }}>{label} {count!=null&&`(${count})`}</span>
      {toggle && <span style={{ fontSize:10,color:T.textDim }}>{open?"▾":"▸"}</span>}
    </div>
  );

  return (
    <div style={{ width:300,background:T.bg1,borderLeft:`1px solid ${T.border}`,overflow:"auto",flexShrink:0 }}>
      <div style={{ padding:"12px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontSize:11,color:T.textDim,fontWeight:600,letterSpacing:1,textTransform:"uppercase" }}>Asset Detail</span>
        <span onClick={onClose} style={{ cursor:"pointer",color:T.textDim,fontSize:14 }}>✕</span>
      </div>
      <div style={{ padding:14 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
          <div style={{ width:44,height:44,borderRadius:8,background:def.color+"15",border:`2px solid ${def.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:def.color,flexShrink:0 }}>{def.icon}</div>
          <div><div style={{ fontSize:13,color:T.text,fontWeight:700 }}>{asset.name}</div><div style={{ fontSize:10,color:T.textDim }}>{def.label} · {def.cat.toUpperCase()}</div></div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:statusClr+"15",border:`1px solid ${statusClr}40`,borderRadius:6,marginBottom:14 }}>
          <div style={{ width:7,height:7,borderRadius:"50%",background:statusClr,boxShadow:`0 0 5px ${statusClr}` }} />
          <span style={{ fontSize:11,color:statusClr,fontWeight:700 }}>{asset.status?.toUpperCase()}</span>
          {asset.runtimeHours&&<span style={{ fontSize:9,color:T.textDim,marginLeft:"auto" }}>{asset.runtimeHours.toLocaleString()}h</span>}
        </div>
        {/* Quick stats */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14 }}>
          {asset.health!=null&&<div style={{ padding:8,background:T.bg0,borderRadius:6,border:`1px solid ${T.border}` }}><div style={{ fontSize:8,color:T.textDim,fontWeight:600,letterSpacing:.5,marginBottom:2 }}>HEALTH</div><div style={{ fontSize:16,fontWeight:700,color:asset.health>80?T.green:asset.health>50?T.warn:T.danger }}>{asset.health}%</div><div style={{ height:3,background:T.bg3,borderRadius:2,marginTop:4 }}><div style={{ height:"100%",width:`${asset.health}%`,borderRadius:2,background:asset.health>80?T.green:asset.health>50?T.warn:T.danger }} /></div></div>}
          {asset.uptime!=null&&<div style={{ padding:8,background:T.bg0,borderRadius:6,border:`1px solid ${T.border}` }}><div style={{ fontSize:8,color:T.textDim,fontWeight:600,letterSpacing:.5,marginBottom:2 }}>UPTIME</div><div style={{ fontSize:16,fontWeight:700,color:asset.uptime>=85?T.green:asset.uptime>=75?T.warn:T.danger }}>{asset.uptime}%</div></div>}
          {asset.tph!=null&&<div style={{ padding:8,background:T.bg0,borderRadius:6,border:`1px solid ${T.border}` }}><div style={{ fontSize:8,color:T.textDim,fontWeight:600,letterSpacing:.5,marginBottom:2 }}>NAMEPLATE</div><div style={{ fontSize:16,fontWeight:700,color:T.accent }}>{asset.tph} TPH</div></div>}
          {asset.temp!=null&&<div style={{ padding:8,background:T.bg0,borderRadius:6,border:`1px solid ${T.border}` }}><div style={{ fontSize:8,color:T.textDim,fontWeight:600,letterSpacing:.5,marginBottom:2 }}>TEMP</div><div style={{ fontSize:16,fontWeight:700,color:T.text }}>{asset.temp}°F</div></div>}
          {asset.level!=null&&<div style={{ padding:8,background:T.bg0,borderRadius:6,border:`1px solid ${T.border}` }}><div style={{ fontSize:8,color:T.textDim,fontWeight:600,letterSpacing:.5,marginBottom:2 }}>FILL LEVEL</div><div style={{ fontSize:16,fontWeight:700,color:asset.level>85?T.warn:asset.level<20?T.danger:T.blue }}>{asset.level}%</div><div style={{ height:3,background:T.bg3,borderRadius:2,marginTop:4 }}><div style={{ height:"100%",width:`${asset.level}%`,borderRadius:2,background:def.color }} /></div></div>}
          {asset.capacity!=null&&<div style={{ padding:8,background:T.bg0,borderRadius:6,border:`1px solid ${T.border}` }}><div style={{ fontSize:8,color:T.textDim,fontWeight:600,letterSpacing:.5,marginBottom:2 }}>CAPACITY</div><div style={{ fontSize:14,fontWeight:700,color:T.text }}>{asset.capacity>1000?`${(asset.capacity/1000).toFixed(1)}K`:asset.capacity} {asset.type==="tank"?"gal":"T"}</div></div>}
        </div>
        {/* Offtake */}
        {isOp && offtake && <>
          <SH label="Offtake & Volume" />
          {[["Current Rate",offtake.currentRate],["Daily",offtake.dailyVolume],["MTD",offtake.mtdVolume],["Inflow",offtake.inflow],["Outflow",offtake.outflow]].filter(([,v])=>v).map(([k,v])=>(
            <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11 }}><span style={{ color:T.textDim }}>{k}</span><span style={{ color:T.text,fontWeight:600 }}>{v}</span></div>
          ))}
          {offtake.products&&<div style={{ marginTop:6,marginBottom:12 }}>{offtake.products.map((p,i)=>(<div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"3px 0" }}><div style={{ width:6,height:6,borderRadius:2,background:p.color,flexShrink:0 }} /><span style={{ fontSize:10,color:T.textMid,flex:1 }}>{p.name}</span><span style={{ fontSize:10,color:T.text,fontWeight:600,width:55,textAlign:"right" }}>{p.vol}</span><span style={{ fontSize:9,color:T.textDim,width:28,textAlign:"right" }}>{p.pct}%</span></div>))}</div>}
        </>}
        {/* Sensors */}
        {isOp && sensors.length>0 && <>
          <SH label="IoT Sensors" count={sensors.length} open={sensorsOpen} toggle={()=>setSensorsOpen(p=>!p)} />
          {sensorsOpen && <div style={{ marginBottom:12 }}>
            <div style={{ display:"flex",gap:8,marginBottom:8 }}>
              {[{l:"Online",c:sensors.filter(s=>s.status==="online").length,clr:T.green},{l:"Warning",c:sensors.filter(s=>s.status==="warning").length,clr:T.warn},{l:"Idle",c:sensors.filter(s=>s.status==="idle").length,clr:T.textDim}].filter(x=>x.c>0).map(x=>(<span key={x.l} style={{ fontSize:9,color:x.clr,display:"flex",alignItems:"center",gap:3 }}><div style={{ width:5,height:5,borderRadius:"50%",background:x.clr }} />{x.c} {x.l}</span>))}
            </div>
            {sensors.map(s => {
              const pct = s.max>0?Math.min(100,(Number(s.value)/s.max)*100):0;
              const isA = s.alarm>0&&Number(s.value)>=s.alarm;
              const sc = s.status==="warning"||isA?T.warn:s.status==="online"?T.green:T.textDim;
              return (<div key={s.id} style={{ padding:"5px 0",borderBottom:`1px solid ${T.bg0}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:5 }}><div style={{ width:5,height:5,borderRadius:"50%",background:sc,boxShadow:`0 0 3px ${sc}` }} /><span style={{ fontSize:10,color:T.textMid }}>{s.name}</span></div>
                  <span style={{ fontSize:11,fontWeight:700,color:isA?T.danger:T.text,fontVariantNumeric:"tabular-nums" }}>{s.value} {s.unit}</span>
                </div>
                {s.max>0&&<div style={{ height:3,background:T.bg0,borderRadius:2,overflow:"hidden" }}><div style={{ height:"100%",width:`${pct}%`,borderRadius:2,background:isA?T.danger:pct>70?T.warn:T.green,opacity:.7 }} /></div>}
                <div style={{ display:"flex",justifyContent:"space-between",marginTop:2 }}><span style={{ fontSize:8,color:T.textDim }}>{s.lastReading}</span>{s.alarm>0&&<span style={{ fontSize:8,color:T.textDim }}>Alarm: {s.alarm}{s.unit}</span>}</div>
              </div>);
            })}
          </div>}
        </>}
        {/* Connections */}
        {assetFlows.length>0 && <>
          <SH label="Connections" count={assetFlows.length} />
          {assetFlows.map((f,i) => { const isSrc = f.from===asset.id; const other = assetMap[isSrc?f.to:f.from]; return (
            <div key={i} style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 0",fontSize:10 }}>
              <div style={{ width:10,height:2,background:f.color,borderRadius:1 }} /><span style={{ color:f.color }}>{isSrc?"→":"←"}</span><span style={{ color:T.textMid }}>{f.label||"Flow"}</span><span style={{ color:T.textDim,marginLeft:"auto",fontSize:9 }}>{other?.name||""}</span>
            </div>
          ); })}
        </>}
        {/* Maintenance */}
        {asset.lastMaintenance && <>
          <SH label="Maintenance" />
          <div style={{ fontSize:11,color:T.textMid,padding:"4px 0" }}>Last service: <span style={{ color:T.text }}>{asset.lastMaintenance}</span></div>
          {asset.runtimeHours&&<div style={{ fontSize:11,color:T.textMid,padding:"4px 0" }}>Runtime: <span style={{ color:T.text }}>{asset.runtimeHours.toLocaleString()}h</span></div>}
          <div style={{ fontSize:11,color:T.textMid,padding:"4px 0" }}>Next PM: <span style={{ color:T.warn }}>~{Math.round(90-parseInt(asset.lastMaintenance))}d</span></div>
        </>}
      </div>
    </div>
  );
}

// ─── 3D GLOBE MAP ─────────────────────────────────────────────
function GlobeMap({ onSelectSite }) {
  const globeRef = useRef();
  const containerRef = useRef();
  const [hovered, setHovered] = useState(null);
  const [activeRegion, setActiveRegion] = useState("global");
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const opSites = MAP_SITES.filter(s => s.status === "operational");
  const conSites = MAP_SITES.filter(s => s.status === "construction");
  const devSites = MAP_SITES.filter(s => s.status === "development");
  const totalNameplate = MAP_SITES.reduce((a, s) => a + (s.tph || 0), 0);
  const totalActual = opSites.reduce((a, s) => a + (s.throughput || 0), 0);

  // Responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Globe initialization
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 120;
    controls.maxDistance = 600;
    globe.pointOfView({ lat: 30, lng: -40, altitude: 2.2 });
  }, []);

  // Region navigation
  useEffect(() => {
    const view = GLOBE_VIEWS[activeRegion];
    if (globeRef.current && view) {
      globeRef.current.pointOfView(
        { lat: view.lat, lng: view.lng, altitude: view.altitude },
        1000
      );
      const controls = globeRef.current.controls();
      if (controls) controls.autoRotate = activeRegion === "global";
    }
  }, [activeRegion]);

  // Points data
  const pointsData = useMemo(() => MAP_SITES.map(s => ({
    ...s,
    lng: s.lon,
    color: STATUS_COLORS[s.status] || T.textDim,
    size: s.status === "operational" ? 0.5 : 0.35,
  })), []);

  // Rings data for pulse animations
  const ringsData = useMemo(() => MAP_SITES.map(s => ({
    lat: s.lat,
    lng: s.lon,
    maxR: s.status === "operational" ? 4 : 2.5,
    propagationSpeed: 2,
    repeatPeriod: 1500,
    color: STATUS_COLORS[s.status] || T.textDim,
    id: s.id,
  })), []);

  // HTML labels
  const labelsData = useMemo(() => MAP_SITES.map(s => ({
    lat: s.lat,
    lng: s.lon,
    site: s,
    color: STATUS_COLORS[s.status] || T.textDim,
  })), []);

  const handlePointHover = useCallback((point) => {
    setHovered(point ? point.id : null);
    if (globeRef.current) {
      document.body.style.cursor = point ? "pointer" : "default";
    }
  }, []);

  const handlePointClick = useCallback((point) => {
    if (point && onSelectSite) onSelectSite(point);
  }, [onSelectSite]);

  const handleSidebarSiteClick = useCallback((site) => {
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: site.lat, lng: site.lon, altitude: 1.0 },
        800
      );
      const controls = globeRef.current.controls();
      if (controls) controls.autoRotate = false;
    }
    onSelectSite(site);
  }, [onSelectSite]);

  const htmlElementFn = useCallback((d) => {
    const el = document.createElement("div");
    const isH = hovered === d.site.id;
    el.style.cssText = `
      color: ${isH ? T.text : T.textMid};
      font-size: ${isH ? "12px" : "10px"};
      font-weight: ${isH ? "700" : "500"};
      font-family: ${FONT};
      text-shadow: 0 0 8px #000, 0 0 4px #000, 0 0 2px #000;
      pointer-events: none;
      transform: translate(10px, -8px);
      white-space: nowrap;
      transition: all 0.15s;
    `;
    el.textContent = d.site.short;
    return el;
  }, [hovered]);

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>
      {/* Globe container */}
      <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden", background: T.bg0 }}>
        {/* Region selector buttons */}
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, display: "flex", gap: 4, flexWrap: "wrap" }}>
          {Object.entries(GLOBE_VIEWS).map(([key, region]) => (
            <button key={key} onClick={() => setActiveRegion(key)}
              style={{
                padding: "5px 14px", fontSize: 10, fontWeight: 700, borderRadius: 3, cursor: "pointer",
                letterSpacing: ".5px", textTransform: "uppercase",
                background: activeRegion === key ? T.accent + "20" : "#161616",
                color: activeRegion === key ? T.accent : "#666",
                border: `1px solid ${activeRegion === key ? T.accent + "60" : "#2a2a2a"}`,
                transition: "all .2s", fontFamily: FONT,
              }}>{region.label}</button>
          ))}
        </div>

        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere={true}
          atmosphereColor={T.accent}
          atmosphereAltitude={0.18}

          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.01}
          pointRadius={d => hovered === d.id ? 0.7 : d.size}
          onPointClick={handlePointClick}
          onPointHover={handlePointHover}

          ringsData={ringsData}
          ringLat="lat"
          ringLng="lng"
          ringColor={d => (t) => {
            const c = d.color;
            const a = Math.max(0, 1 - t);
            return `${c}${Math.round(a * 80).toString(16).padStart(2, "0")}`;
          }}
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"

          htmlElementsData={labelsData}
          htmlLat="lat"
          htmlLng="lng"
          htmlAltitude={0.03}
          htmlElement={htmlElementFn}
        />
      </div>

      {/* Sidebar registry panel */}
      <div style={{ width: 280, borderLeft: `1px solid ${T.border}`, background: T.bg1, overflow: "auto" }}>
        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.textDim, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Site Registry</div>
        <div style={{ display: "flex", gap: 8, padding: "8px 14px", fontSize: 9, color: T.textDim, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green }} />{opSites.length} Operational</span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent }} />{conSites.length} Construction</span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: T.purple }} />{devSites.length} Development</span>
        </div>
        <div style={{ padding: "6px 14px", borderBottom: `1px solid ${T.border}`, fontSize: 10, color: T.textDim }}>
          Nameplate: <span style={{ color: T.accent, fontWeight: 600 }}>{totalNameplate} TPH</span> · Actual: <span style={{ color: T.green, fontWeight: 600 }}>{totalActual.toFixed(1)} TPH</span>
        </div>
        {MAP_SITES.map(s => {
          const clr = STATUS_COLORS[s.status] || T.textDim;
          return (
            <div key={s.id} onClick={() => handleSidebarSiteClick(s)} onMouseEnter={() => setHovered(s.id)} onMouseLeave={() => setHovered(null)}
              style={{ padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${T.border}`, background: hovered === s.id ? T.bg2 : "transparent", transition: "background .15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: clr, boxShadow: `0 0 4px ${clr}` }} />
                <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{s.name}</span>
                <span style={{ fontSize: 8, color: clr, background: clr + "20", padding: "1px 5px", borderRadius: 3, marginLeft: "auto" }}>{s.series} · {s.region}</span>
              </div>
              <div style={{ fontSize: 10, color: T.textDim, paddingLeft: 15 }}>
                {s.status === "operational" ? `${s.processors}× ${s.tphPerMachine || 2} TPH · ${s.throughput} actual · ${s.uptime}%` :
                 s.status === "construction" ? `${s.stage} · ${s.processors}× ${s.tphPerMachine || 2} TPH · ${s.constructionPct}%` :
                 `${s.stage} · ${s.tph} TPH · ${s.feedstock}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── FLOW TOOLBAR ──────────────────────────────────────────────
function FlowToolbar({ mode, onModeChange, flowCount, onClearFlows }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
      {[{id:"move",label:"Move",icon:"✥"},{id:"connect",label:"Connect",icon:"⤳"},{id:"delete_flow",label:"Disconnect",icon:"✂"}].map(m=>(
        <button key={m.id} onClick={()=>onModeChange(m.id)} style={{ display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${mode===m.id?T.accent:T.border}`,background:mode===m.id?T.accentDim:"transparent",color:mode===m.id?T.accent:T.textDim }}>
          <span style={{ fontSize:13 }}>{m.icon}</span> {m.label}
        </button>
      ))}
      <span style={{ fontSize:10,color:T.textDim,marginLeft:8 }}>Flows: {flowCount}</span>
      <button onClick={onClearFlows} style={{ padding:"3px 8px",borderRadius:4,fontSize:10,cursor:"pointer",border:`1px solid ${T.danger}40`,background:T.dangerDim,color:T.danger }}>Clear All</button>
    </div>
  );
}

// ─── FLOW LABEL EDITOR ─────────────────────────────────────────
function FlowLabelEditor({ flow, position, onSave, onCancel }) {
  const [label,setLabel]=useState(flow.label);
  const [color,setColor]=useState(flow.color);
  const colors=[T.warn,T.blue,T.green,T.accent,T.accentLight,T.textMid,T.teal,T.purple,T.danger];
  return (
    <div style={{ position:"absolute",left:position.x,top:position.y,background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,padding:12,zIndex:100,minWidth:180,boxShadow:`0 4px 20px ${T.bg0}80` }}>
      <div style={{ fontSize:11,color:T.textDim,fontWeight:600,marginBottom:8,letterSpacing:.5 }}>FLOW LABEL</div>
      <input value={label} onChange={e=>setLabel(e.target.value)} autoFocus style={{ width:"100%",padding:"6px 8px",borderRadius:4,fontSize:12,background:T.bg0,border:`1px solid ${T.border}`,color:T.text,outline:"none",marginBottom:8,boxSizing:"border-box" }} />
      <div style={{ fontSize:10,color:T.textDim,fontWeight:600,marginBottom:6 }}>COLOR</div>
      <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginBottom:10 }}>{colors.map(c=><div key={c} onClick={()=>setColor(c)} style={{ width:20,height:20,borderRadius:4,background:c,cursor:"pointer",border:color===c?`2px solid ${T.text}`:`1px solid ${T.border}` }} />)}</div>
      <div style={{ display:"flex",gap:6 }}>
        <button onClick={()=>onSave(label,color)} style={{ flex:1,padding:"5px 0",borderRadius:4,fontSize:11,cursor:"pointer",border:"none",background:T.accent,color:T.bg0,fontWeight:600 }}>Save</button>
        <button onClick={onCancel} style={{ flex:1,padding:"5px 0",borderRadius:4,fontSize:11,cursor:"pointer",border:`1px solid ${T.border}`,background:"transparent",color:T.textDim }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── SITE GRID VIEW ────────────────────────────────────────────
export function SiteGridView({ site, onBack, embedded }) {
  const layout = useMemo(()=>generateSiteLayout(site),[site.id]);
  const [positions,setPositions]=useState({});
  const [flows,setFlows]=useState([]);
  const [selectedAsset,setSelectedAsset]=useState(null);
  const [dragging,setDragging]=useState(null);
  const [dragOffset,setDragOffset]=useState({x:0,y:0});
  const [mode,setMode]=useState("move");
  const [connectFrom,setConnectFrom]=useState(null);
  const [mousePos,setMousePos]=useState({x:0,y:0});
  const [editingFlow,setEditingFlow]=useState(null);
  const [editFlowPos,setEditFlowPos]=useState({x:0,y:0});
  const svgRef=useRef(null);
  const containerRef=useRef(null);
  const [containerW,setContainerW]=useState(0);
  const CELL=38,GRID=layout.gridSize,svgW=GRID*CELL,svgH=GRID*CELL;

  // Compute tight bounding box around actual assets (stable — based on initial layout, not drag state)
  const contentBox = useMemo(() => {
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    layout.assets.forEach(a => {
      const def=ASSET_DEFS[a.type]; const w=def?.w||1,h=def?.h||1;
      if(a.x<minX) minX=a.x; if(a.y<minY) minY=a.y;
      if(a.x+w>maxX) maxX=a.x+w; if(a.y+h>maxY) maxY=a.y+h;
    });
    const pad=2;
    return {
      x: Math.max(0,minX-pad)*CELL,
      y: Math.max(0,minY-pad)*CELL,
      w: (maxX-minX+pad*2)*CELL,
      h: (maxY-minY+pad*2)*CELL,
    };
  },[layout]);

  // Observe container width to scale SVG responsively
  useEffect(()=>{
    const el=containerRef.current; if(!el) return;
    const ro=new ResizeObserver(entries=>{for(const e of entries) setContainerW(e.contentRect.width);});
    ro.observe(el); return ()=>ro.disconnect();
  },[]);

  useEffect(()=>{
    const pos={}; layout.assets.forEach(a=>{pos[a.id]={x:a.x,y:a.y};}); setPositions(pos); setFlows(layout.flows); setSelectedAsset(null); setConnectFrom(null); setEditingFlow(null);
  },[site.id]);

  const assetMap=useMemo(()=>{const m={};layout.assets.forEach(a=>{m[a.id]=a;});return m;},[layout]);
  const getSVGPoint=useCallback((e)=>{const svg=svgRef.current;if(!svg)return{x:0,y:0};const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const r=pt.matrixTransform(svg.getScreenCTM().inverse());return{x:r.x,y:r.y};},[]);

  const flowLines=useMemo(()=>flows.map((f,i)=>{
    const fp=positions[f.from],tp=positions[f.to],fa=assetMap[f.from],ta=assetMap[f.to];if(!fp||!tp||!fa||!ta)return null;
    const fd=ASSET_DEFS[fa.type],td=ASSET_DEFS[ta.type];
    return{...f,x1:(fp.x+(fd?.w||1)/2)*CELL,y1:(fp.y+(fd?.h||1)/2)*CELL,x2:(tp.x+(td?.w||1)/2)*CELL,y2:(tp.y+(td?.h||1)/2)*CELL,idx:i};
  }).filter(Boolean),[flows,positions,assetMap]);

  const catCounts=useMemo(()=>{const c={};layout.assets.forEach(a=>{const d=ASSET_DEFS[a.type];if(d)c[d.cat]=(c[d.cat]||0)+1;});return c;},[layout]);
  const isOp=site.status==="operational";
  const clr=STATUS_COLORS[site.status]||T.textDim;

  return (
    <div style={{ display:"flex",flexDirection:"column",height:embedded?"auto":"100%",margin:embedded?0:"-28px",fontFamily:FONT }}>
      {/* Site header bar */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 20px",borderBottom:`1px solid ${T.border}`,background:T.bg1 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          {onBack && <button onClick={onBack} style={{ background:T.bg3,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 12px",color:T.accent,cursor:"pointer",fontSize:12,fontWeight:600 }}>← Map</button>}
          <div style={{ width:8,height:8,borderRadius:"50%",background:clr,boxShadow:`0 0 4px ${clr}` }} />
          <span style={{ color:T.text,fontWeight:700,fontSize:14 }}>{site.name}</span>
          <span style={{ fontSize:10,color:clr,padding:"2px 8px",background:clr+"20",borderRadius:4 }}>{isOp?"Operational":site.stage}</span>
          <span style={{ fontSize:10,color:T.accent,padding:"2px 8px",background:T.accentDim,borderRadius:4 }}>Series {site.series||"A"} · {site.region||"US"}</span>
        </div>
        <div style={{ display:"flex",gap:16,fontSize:11,color:T.textDim }}>
          <span>{site.processors}× <span style={{ color:T.accent,fontWeight:600 }}>{site.tphPerMachine||2} TPH</span></span>
          {isOp&&<span>Actual: <span style={{ color:T.green,fontWeight:600 }}>{site.throughput} TPH</span></span>}
          {isOp&&<span>Uptime: <span style={{ color:(site.uptime||80)>=85?T.green:T.warn,fontWeight:600 }}>{site.uptime}%</span></span>}
        </div>
      </div>
      {/* Toolbar */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 20px",borderBottom:`1px solid ${T.border}`,background:T.bg0 }}>
        <FlowToolbar mode={mode} onModeChange={setMode} flowCount={flows.length} onClearFlows={()=>setFlows([])} />
        <div style={{ display:"flex",gap:12,fontSize:10 }}>
          {Object.entries(catCounts).map(([cat,cnt])=>{
            const cc={processor:T.accent,input:T.warn,storage:T.blue,output:T.green,logistics:T.accentLight,building:T.teal,utility:T.warn};
            return <span key={cat} style={{ color:cc[cat]||T.textMid,display:"flex",alignItems:"center",gap:4 }}><div style={{ width:8,height:4,background:cc[cat]||T.textMid,borderRadius:1 }} />{cat}: {cnt}</span>;
          })}
        </div>
      </div>
      {mode!=="move"&&<div style={{ padding:"6px 20px",fontSize:11,fontWeight:600,background:mode==="connect"?T.greenDim:T.dangerDim,color:mode==="connect"?T.green:T.danger,borderBottom:`1px solid ${T.border}` }}>
        {mode==="connect"?(connectFrom?"✓ Source selected — click destination":"⤳ CONNECT — Click source, then destination"):"✂ DISCONNECT — Click a flow to remove it"}
      </div>}
      {/* Grid + detail */}
      <div style={{ flex:1,display:"flex",overflow:"hidden",position:"relative" }}>
        <div ref={containerRef} style={{ flex:1,overflow:"auto",padding:16,background:T.bg0 }}>
          <svg ref={svgRef} viewBox={`${contentBox.x} ${contentBox.y} ${contentBox.w} ${contentBox.h}`} preserveAspectRatio="xMidYMid meet"
            style={{ display:"block",width:"100%",height:containerW>0?containerW*(contentBox.h/contentBox.w):"auto",cursor:mode==="connect"?"crosshair":mode==="delete_flow"?"not-allowed":dragging?"grabbing":"default" }}
            onMouseMove={(e)=>{
              if(mode==="connect"&&connectFrom)setMousePos(getSVGPoint(e));
              if(!dragging||mode!=="move")return;const sp=getSVGPoint(e);
              setPositions(p=>({...p,[dragging]:{x:Math.max(0,Math.min(GRID-1,Math.round((sp.x-dragOffset.x)/CELL))),y:Math.max(0,Math.min(GRID-1,Math.round((sp.y-dragOffset.y)/CELL)))}}));
            }}
            onMouseUp={()=>setDragging(null)} onMouseLeave={()=>setDragging(null)}
            onClick={()=>{if(mode==="connect")setConnectFrom(null);setSelectedAsset(null);}}>
            <defs>
              <pattern id="sg" width={CELL} height={CELL} patternUnits="userSpaceOnUse"><path d={`M ${CELL} 0 L 0 0 0 ${CELL}`} fill="none" stroke={T.border} strokeWidth="0.5" /></pattern>
              <marker id="fa" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={T.textDim} opacity=".5" /></marker>
            </defs>
            <rect width={svgW} height={svgH} fill="url(#sg)" rx="4" />
            {/* Flows */}
            {flowLines.map((f,i)=>{const dx=f.x2-f.x1,dy=f.y2-f.y1,len=Math.sqrt(dx*dx+dy*dy)||1;const cx=(f.x1+f.x2)/2+(-dy/len)*18,cy=(f.y1+f.y2)/2+(dx/len)*18;const pd=`M${f.x1},${f.y1} Q${cx},${cy} ${f.x2},${f.y2}`;return(
              <g key={`fl${i}`}>
                <path d={pd} fill="none" stroke="transparent" strokeWidth="12" style={{cursor:"pointer"}} onClick={(e)=>{e.stopPropagation();if(mode==="delete_flow")setFlows(p=>p.filter((_,j)=>j!==f.idx));else{const r=svgRef.current?.getBoundingClientRect();setEditingFlow({...f,idx:f.idx,isNew:false});setEditFlowPos({x:e.clientX-(r?.left||0),y:e.clientY-(r?.top||0)});}}} />
                <path d={pd} fill="none" stroke={f.color} strokeWidth="1.5" strokeDasharray="6 4" opacity={mode==="delete_flow"?.6:.35} markerEnd="url(#fa)" />
                {[0,.33,.66].map((dl,pi)=>(<circle key={pi} r="2.5" fill={f.color} opacity=".8" style={{pointerEvents:"none"}}><animateMotion dur="3s" repeatCount="indefinite" begin={`${dl*3}s`} path={pd} /><animate attributeName="opacity" values=".15;.85;.15" dur="3s" repeatCount="indefinite" begin={`${dl*3}s`} /></circle>))}
                {f.label&&<text x={cx} y={cy-6} textAnchor="middle" fill={f.color} fontSize="9" fontWeight="600" opacity=".8" style={{pointerEvents:"none"}}>{f.label}</text>}
              </g>
            );})}
            {/* Connect preview */}
            {mode==="connect"&&connectFrom&&(()=>{const fp=positions[connectFrom],fa=assetMap[connectFrom];if(!fp||!fa)return null;const fd=ASSET_DEFS[fa.type];return<line x1={(fp.x+(fd?.w||1)/2)*CELL} y1={(fp.y+(fd?.h||1)/2)*CELL} x2={mousePos.x} y2={mousePos.y} stroke={T.accent} strokeWidth="2" strokeDasharray="4 4" opacity=".7" style={{pointerEvents:"none"}} />;})()}
            {/* Assets */}
            {layout.assets.map(asset=>{const def=ASSET_DEFS[asset.type];if(!def)return null;const pos=positions[asset.id];if(!pos)return null;
              const px=pos.x*CELL,py=pos.y*CELL,w=def.w*CELL,h=def.h*CELL,isSel=selectedAsset?.id===asset.id,isDrg=dragging===asset.id,isCS=connectFrom===asset.id;
              const sc=asset.status==="running"?T.green:asset.status==="warning"?T.warn:T.textDim;
              return(
                <g key={asset.id}
                  onMouseDown={(e)=>{e.stopPropagation();if(mode==="move"){const sp=getSVGPoint(e);setDragging(asset.id);setDragOffset({x:sp.x-pos.x*CELL,y:sp.y-pos.y*CELL});}}}
                  onClick={(e)=>{e.stopPropagation();if(mode==="connect"){if(!connectFrom)setConnectFrom(asset.id);else if(connectFrom!==asset.id){const r=svgRef.current?.getBoundingClientRect();setEditingFlow({from:connectFrom,to:asset.id,label:"",color:T.accent,isNew:true});setEditFlowPos({x:e.clientX-(r?.left||0),y:e.clientY-(r?.top||0)});setConnectFrom(null);}}else if(mode==="move")setSelectedAsset(asset);}}
                  style={{cursor:mode==="move"?(isDrg?"grabbing":"grab"):mode==="connect"?"crosshair":"default"}}>
                  {(isSel||isCS)&&<rect x={px-2} y={py-2} width={w+4} height={h+4} rx="6" fill="none" stroke={isCS?T.green:def.color} strokeWidth="2" opacity=".6"><animate attributeName="opacity" values=".3;.7;.3" dur="1.5s" repeatCount="indefinite" /></rect>}
                  <rect x={px+1} y={py+1} width={w-2} height={h-2} rx="4" fill={isSel?def.color+"25":isCS?T.green+"20":def.color+"10"} stroke={isSel?def.color:isCS?T.green:def.color+"50"} strokeWidth={isSel||isCS?2:1} />
                  {asset.level!=null&&def.cat==="storage"&&<rect x={px+3} y={py+h-3-(h-14)*asset.level/100} width={w-6} height={(h-14)*asset.level/100} rx="2" fill={def.color} opacity=".15" style={{pointerEvents:"none"}} />}
                  <text x={px+w/2} y={py+h/2-(h>CELL*1.2?5:0)} textAnchor="middle" dominantBaseline="middle" fill={def.color} fontSize={Math.min(w,h)*.32} style={{pointerEvents:"none"}}>{def.icon}</text>
                  {h>=CELL*1.5&&<text x={px+w/2} y={py+h/2+10} textAnchor="middle" fill={T.textMid} fontSize="8" style={{pointerEvents:"none"}}>{asset.name.length>16?asset.name.substring(0,14)+"…":asset.name}</text>}
                  {def.cat==="processor"&&asset.tph&&<g style={{pointerEvents:"none"}}><rect x={px+w-28} y={py+2} width="26" height="12" rx="3" fill={T.bg0} stroke={T.accent} strokeWidth=".5" /><text x={px+w-15} y={py+10} textAnchor="middle" fill={T.accent} fontSize="7" fontWeight="700">{asset.tph}T</text></g>}
                  <circle cx={px+8} cy={py+8} r="3" fill={sc} style={{pointerEvents:"none"}}>{asset.status==="warning"&&<animate attributeName="opacity" values=".4;1;.4" dur="1.5s" repeatCount="indefinite" />}</circle>
                  {h>=CELL*1.2&&asset.health!=null&&<g style={{pointerEvents:"none"}}><rect x={px+4} y={py+h-7} width={w-8} height="3" rx="1.5" fill={T.bg0} opacity=".6" /><rect x={px+4} y={py+h-7} width={(w-8)*asset.health/100} height="3" rx="1.5" fill={asset.health>80?T.green:asset.health>50?T.warn:T.danger} opacity=".7" /></g>}
                </g>
              );
            })}
          </svg>
        </div>
        {editingFlow&&<FlowLabelEditor flow={editingFlow} position={editFlowPos} onSave={(l,c)=>{if(editingFlow.isNew)setFlows(p=>[...p,{from:editingFlow.from,to:editingFlow.to,label:l,color:c}]);else setFlows(p=>p.map((f,i)=>i===editingFlow.idx?{...f,label:l,color:c}:f));setEditingFlow(null);}} onCancel={()=>{setEditingFlow(null);setConnectFrom(null);}} />}
        {selectedAsset&&mode==="move"&&<AssetDeepDrill asset={selectedAsset} site={site} flows={flows} assetMap={assetMap} onClose={()=>setSelectedAsset(null)} />}
      </div>
    </div>
  );
}

// ─── MAIN EXPORTED VIEW ────────────────────────────────────────
export const PortfolioMapView = ({ onNavigateToProject }) => {
  const [view,setView]=useState("world");
  const [selectedSite,setSelectedSite]=useState(null);

  if (view==="site"&&selectedSite) return <SiteGridView site={selectedSite} onBack={()=>{setView("world");setSelectedSite(null);}} />;
  return <div style={{ margin:"-28px",height:"calc(100% + 56px)" }}><GlobeMap onSelectSite={(s)=>{
    if (onNavigateToProject) { onNavigateToProject(s.id); }
    else { setSelectedSite(s); setView("site"); }
  }} /></div>;
};
