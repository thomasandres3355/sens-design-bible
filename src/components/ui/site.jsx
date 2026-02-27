import { useMemo } from "react";
import { T } from "../../data/theme";
import { SITES, activeSites, constructionSites } from "../../data/sites";
import { StatusPill, Progress, MetricGrid } from "./indicators";

export const SiteSelector = ({ selected, onChange, showAll = true, filter }) => {
  const sites = filter ? SITES.filter(filter) : SITES;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
      {showAll && <button onClick={() => onChange("all")} style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: selected === "all" ? T.accent : "transparent", color: selected === "all" ? "#1A1A1A" : T.textMid }}>All Sites</button>}
      {sites.map(s => (
        <button key={s.id} onClick={() => onChange(s.id)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${selected === s.id ? (s.status === "construction" ? T.accent : T.green) : T.border}`, cursor: "pointer", fontSize: 11, fontWeight: selected === s.id ? 600 : 400, background: selected === s.id ? (s.status === "construction" ? T.accentDim : T.greenDim) : "transparent", color: selected === s.id ? T.text : T.textDim, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.status === "operational" ? T.green : T.accent }} />{s.short}
        </button>
      ))}
    </div>
  );
};

export const PortfolioMap = ({ onSiteClick, selectedSite }) => {
  const pos = { "noble-ok": { x: 48, y: 38 }, "richmond-va": { x: 45, y: 36 }, "tucson-az": { x: 40, y: 52 }, "baton-la": { x: 52, y: 56 }, "columbus-oh": { x: 60, y: 50 }, "noble-b": { x: 51, y: 40 }, "portland-or": { x: 58, y: 58 } };
  return (
    <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: T.accent, fontWeight: 600, letterSpacing: .5 }}>Portfolio — Site Map</div>
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: T.textDim }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green }} />Operational ({activeSites.length})</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent }} />Construction ({constructionSites.length})</span>
        </div>
      </div>
      <svg viewBox="0 0 100 70" style={{ width: "100%", height: 220 }}>
        <defs><pattern id="gmap" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M 5 0 L 0 0 0 5" fill="none" stroke={T.border} strokeWidth="0.08" /></pattern></defs>
        <rect width="100" height="70" fill="url(#gmap)" rx="2" />
        <path d="M10,20 Q15,15 25,14 L35,12 Q40,12 45,14 L55,13 Q60,12 68,14 L75,16 Q80,18 82,22 L84,28 Q85,32 82,36 L78,40 Q75,44 72,46 L68,50 Q65,54 62,56 L58,58 Q55,60 50,60 L45,58 Q40,58 38,56 L35,54 Q32,56 28,58 L24,56 Q20,54 18,50 L14,44 Q12,40 10,35 L8,28 Q8,24 10,20 Z" fill={T.bg3 + "60"} stroke={T.border} strokeWidth="0.3" />
        <text x="47" y="34" textAnchor="middle" fill={T.textDim} fontSize="2.5">OK</text>
        <text x="38" y="50" textAnchor="middle" fill={T.textDim} fontSize="2.5">TX</text>
        <text x="53" y="54" textAnchor="middle" fill={T.textDim} fontSize="2.5">LA</text>
        <text x="62" y="47" textAnchor="middle" fill={T.textDim} fontSize="2.5">AL</text>
        <text x="65" y="56" textAnchor="middle" fill={T.textDim} fontSize="2.5">FL</text>
        {SITES.map(s => { const p = pos[s.id]; if (!p) return null; const isOp = s.status === "operational"; const isSel = selectedSite === s.id; return (
          <g key={s.id} onClick={() => onSiteClick?.(s.id)} style={{ cursor: "pointer" }}>
            {isSel && <circle cx={p.x} cy={p.y} r="4.5" fill="none" stroke={isOp ? T.green : T.accent} strokeWidth=".3" opacity=".6"><animate attributeName="r" values="3.5;5;3.5" dur="2s" repeatCount="indefinite" /></circle>}
            <circle cx={p.x} cy={p.y} r={isSel ? 2.5 : 2} fill={isOp ? T.green : T.accent} stroke={isSel ? T.text : "none"} strokeWidth=".4" />
            {!isOp && <circle cx={p.x} cy={p.y} r=".9" fill="none" stroke={T.bg0} strokeWidth=".4" />}
            <text x={p.x} y={p.y - 4} textAnchor="middle" fill={isSel ? T.text : T.textMid} fontSize="1.8" fontWeight={isSel ? 700 : 500}>{s.short}</text>
            {isOp && <text x={p.x} y={p.y + 5} textAnchor="middle" fill={T.textDim} fontSize="1.4">{s.throughput} TPH</text>}
          </g>
        ); })}
      </svg>
    </div>
  );
};

export const FacilityView = ({ site, onZoneClick }) => {
  const zones = [
    { id: "tips", label: `TiPs ×${site.processors}`, x: 6, y: 10, w: 24, h: 30, color: T.accent, status: site.uptime >= 85 ? "green" : site.uptime >= 75 ? "yellow" : "red", sub: `${site.processors > 1 ? site.processors + "×" : ""}2 TPH · ${site.uptime}%` },
    { id: "feeder", label: "Crumb Feed", x: 6, y: 48, w: 24, h: 20, color: T.warn, status: "green", sub: site.feedSupplier },
    { id: "diluent", label: "Diluent Tanks", x: 36, y: 6, w: 26, h: 24, color: T.blue, status: "green", sub: `${Math.ceil(site.processors * 4)} tanks` },
    { id: "carbon", label: "Carbon Yard", x: 36, y: 36, w: 26, h: 22, color: T.textMid, status: "green", sub: "N330 packaged" },
    { id: "syngas", label: "Syn Gas / RNG", x: 36, y: 64, w: 26, h: 18, color: T.green, status: "blue", sub: "Captured" },
    { id: "loading", label: "Loading Bay", x: 68, y: 10, w: 18, h: 28, color: T.accent, status: "green", sub: `${Math.ceil(site.processors * 2)} bays` },
    { id: "office", label: "Control Room", x: 6, y: 74, w: 16, h: 12, color: T.textMid, status: "green", sub: "" },
    { id: "utilities", label: "Services", x: 26, y: 86, w: 22, h: 7, color: T.blue, status: "green", sub: "Gas·Power·Water" },
  ];
  const flows = [
    { from: "feeder", to: "tips", label: "Crumb", color: T.warn },
    { from: "tips", to: "diluent", label: "Diluent", color: T.blue },
    { from: "tips", to: "carbon", label: "Carbon", color: T.textMid },
    { from: "tips", to: "syngas", label: "Syngas", color: T.green },
    { from: "diluent", to: "loading", label: "Ship Oil", color: T.accent },
    { from: "carbon", to: "loading", label: "Ship Carbon", color: T.accent },
  ];
  return (
    <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: T.accent, fontWeight: 600 }}>{site.name} — Site Layout</div>
        <span style={{ fontSize: 11, color: T.textDim }}>Series {site.series} · {site.processors} Processor{site.processors > 1 ? "s" : ""}</span>
      </div>
      <svg viewBox="0 0 92 96" style={{ width: "100%", height: 280 }}>
        <defs><pattern id={`g-${site.id}`} width="4" height="4" patternUnits="userSpaceOnUse"><path d="M 4 0 L 0 0 0 4" fill="none" stroke={T.border} strokeWidth="0.1" /></pattern></defs>
        <rect width="92" height="96" fill={`url(#g-${site.id})`} rx="2" />
        {flows.map((f, i) => { const fr = zones.find(z => z.id === f.from), to = zones.find(z => z.id === f.to); if (!fr || !to) return null; const x1 = fr.x + fr.w / 2, y1 = fr.y + fr.h / 2, x2 = to.x + to.w / 2, y2 = to.y + to.h / 2; return <g key={i}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={f.color} strokeWidth=".35" strokeDasharray="1.2 .8" opacity=".4" /><circle r=".8" fill={f.color} opacity=".85"><animateMotion dur={`${2.5 + i * .6}s`} repeatCount="indefinite" path={`M${x1},${y1} L${x2},${y2}`} /></circle></g>; })}
        {zones.map(z => (<g key={z.id} onClick={() => onZoneClick?.(z)} style={{ cursor: "pointer" }}><rect x={z.x} y={z.y} width={z.w} height={z.h} rx="1.5" fill={z.color + "12"} stroke={z.color} strokeWidth=".4" /><text x={z.x + z.w / 2} y={z.y + z.h / 2 - 2} textAnchor="middle" fill={T.text} fontSize="2.4" fontWeight="600">{z.label}</text><text x={z.x + z.w / 2} y={z.y + z.h / 2 + 3} textAnchor="middle" fill={T.textMid} fontSize="1.8">{z.sub}</text><circle cx={z.x + z.w - 2} cy={z.y + 2.5} r="1" fill={z.status === "green" ? T.green : z.status === "yellow" ? T.warn : z.status === "red" ? T.danger : T.blue} /></g>))}
      </svg>
      <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>{flows.map((f, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.textMid }}><div style={{ width: 10, height: 2, background: f.color, borderRadius: 1 }} />{f.label}</div>)}</div>
    </div>
  );
};

export const ZoneDetail = ({ zone, onBack, site }) => {
  const tankCount = Math.ceil(site.processors * 4);
  const tanks = useMemo(() => {
    if (zone.id !== "diluent") return null;
    return Array.from({ length: tankCount }, (_, i) => ({
      id: `T-${String(i + 1).padStart(2, "0")}`,
      fill: ((i * 17 + 23) % 50) + 40,
      capacity: `${Math.round(site.diluentGal / tankCount / 100) * 100} gal`,
      status: i === 0 ? "filling" : i === tankCount - 1 ? "standby" : "nominal",
    }));
  }, [zone.id, site.id, site.processors, site.diluentGal, tankCount]);

  const dets = {
    tips: { title: `TiPs Processor${site.processors > 1 ? "s" : ""} — ${site.short}`, desc: "Thermal-static internal Pyrophinic system. Low temp selective depolymerization. Continuous feed, zero waste.",
      metrics: [{ label: "Nameplate", value: `${site.tph} TPH` }, { label: "Actual", value: `${site.throughput} TPH` }, { label: "Uptime", value: `${site.uptime}%` }, { label: "Processors", value: `${site.processors}` }, { label: "Feed", value: "Crumb Rubber" }, { label: "Waste", value: "Zero" }],
      outputs: [{ name: "Diluent (High-Aromatic)", pct: 35, color: T.blue }, { name: "Carbon Black (N330)", pct: 38, color: T.textMid }, { name: "Syn Gas / RNG", pct: 12, color: T.green }, { name: "Steel Recovery", pct: 10, color: T.accent }, { name: "Water", pct: 5, color: T.blue }] },
    diluent: { title: "Diluent Tank Farm", desc: "200+ constituents. d-Limonene 10-25%.",
      metrics: [{ label: "Price", value: "$8.0/gal", sub: "Mkt $6-14" }, { label: "d-Limonene", value: "10-25%" }, { label: "Aromatic", value: "85-95%" }, { label: "Stored", value: `${(site.diluentGal / 1000).toFixed(1)}K gal` }] },
    carbon: { title: "Carbon Black — N330", desc: "Sid Richardson (TOKAI CARBON) validated.",
      metrics: [{ label: "Grade", value: "N330" }, { label: "Price", value: "$0.5/lb" }, { label: "Tensile", value: "2,771 psi" }, { label: "Stored", value: `${site.carbonT} T` }] },
    feeder: { title: `Crumb Rubber — ${site.feedSupplier}`, desc: `Secured supply for ${site.processors} processor${site.processors > 1 ? "s" : ""}.`,
      metrics: [{ label: "Supplier", value: site.feedSupplier }, { label: "Cost", value: "$0.1/lb" }, { label: "Daily", value: `${site.processors * 24} T/day` }, { label: "Contract", value: "Long-term" }] },
    syngas: { title: "Syn Gas / RNG", desc: "Zero waste — all captured.", metrics: [{ label: "Price", value: "$1.5/mcf" }, { label: "Status", value: "Captured" }] },
    loading: { title: "Loading Bay", desc: `${Math.ceil(site.processors * 2)} active bays.`, metrics: [{ label: "Bays", value: `${Math.ceil(site.processors * 2)}` }, { label: "Daily", value: `~${site.processors * 10} loads` }] },
  };
  const d = dets[zone.id] || { title: zone.label, desc: "", metrics: [] };
  return (
    <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button onClick={onBack} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 12px", color: T.textMid, cursor: "pointer", fontSize: 12 }}>← Back</button>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: zone.color }} />
        <h3 style={{ margin: 0, color: T.text, fontSize: 18 }}>{d.title}</h3>
        <StatusPill status={zone.status} />
      </div>
      {d.desc && <p style={{ fontSize: 13, color: T.textMid, margin: "0 0 16px", lineHeight: 1.5 }}>{d.desc}</p>}
      <MetricGrid metrics={d.metrics} />
      {d.outputs && <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.accent, marginBottom: 8 }}>Output Composition (by mass)</div>
        {d.outputs.map((o, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "5px 0" }}>
            <span style={{ fontSize: 12, color: T.textMid, width: 180 }}>{o.name}</span>
            <div style={{ flex: 1 }}><Progress pct={o.pct * 2.5} color={o.color} /></div>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text, width: 36, textAlign: "right" }}>{o.pct}%</span>
          </div>
        ))}
      </div>}
      {tanks && <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.blue, marginBottom: 12 }}>Tank Levels — {tanks.length} Tanks</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {tanks.map((tank, i) => {
            const tankColor = tank.fill > 85 ? T.warn : tank.fill < 30 ? T.danger : T.blue;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 10px", background: T.bg0, borderRadius: 8, border: `1px solid ${T.border}`, minWidth: 72 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.textDim, marginBottom: 4, letterSpacing: 0.5 }}>{tank.id}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>{tank.fill}%</div>
                <div style={{ width: 32, height: 80, borderRadius: 5, background: T.bg1, border: `1px solid ${T.border}`, position: "relative", overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${tank.fill}%`, background: tankColor, borderRadius: "0 0 4px 4px", transition: "height 0.6s ease", opacity: 0.8 }} />
                  {[25, 50, 75].map(mark => (
                    <div key={mark} style={{ position: "absolute", bottom: `${mark}%`, left: 0, right: 0, height: 1, background: T.border, opacity: 0.4 }} />
                  ))}
                </div>
                <div style={{ fontSize: 9, color: tank.status === "filling" ? T.green : tank.status === "standby" ? T.textDim : T.blue, textTransform: "uppercase", letterSpacing: 0.5 }}>{tank.status}</div>
              </div>
            );
          })}
        </div>
      </div>}
    </div>
  );
};
