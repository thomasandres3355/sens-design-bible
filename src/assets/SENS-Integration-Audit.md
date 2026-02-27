# Executive Intelligence Platform — Integration & Connection Audit

**Generated:** February 25, 2026
**Scope:** Full platform audit — every tab evaluated for API endpoints, third-party tools, data sources, IoT connections, and external dependencies.

---

## Executive Summary

The Executive Intelligence Platform platform references **27 external systems**, **48 IoT sensors**, **20+ API endpoints**, and **14+ supply chain / partner relationships** across its 8 navigation tabs. Of the 27 systems, 24 show as connected, 1 degraded (Oracle P6 latency), and 3 pending deployment (SAP Ariba, Bloomberg Terminal, S&P Capital IQ).

| Metric | Count |
|--------|-------|
| Total Integrations | 27 |
| Connected | 24 |
| Degraded | 1 |
| Pending/Planned | 3 |
| IoT Sensors | 48 |
| API Endpoints | 20+ |
| Data Throughput | 2.1 TB/day |
| Partner/Supplier Systems (manual) | 14+ |

---

## Tab-by-Tab Breakdown

### 1. Dashboard

**Purpose:** Executive strategic overview (CEO/COO lenses)

| Connection | Type | Status | Notes |
|-----------|------|--------|-------|
| Oracle Financials | ERP API | Connected | P&L, EBITDA, cash position, margin analysis |
| SCADA Gateway | Industrial API | Connected | Live site KPIs (uptime, throughput) |
| Salesforce | CRM API | Connected | Pipeline data, Series C tracking |
| All site data feeds | Aggregated | Connected | Computed from Operations + Finance data |

**Data points consumed:** Site uptime %, throughput, revenue, EBITDA, construction progress %, fundraising %, feedstock pricing.

---

### 2. Site Map (Portfolio Map)

**Purpose:** Visual site layout and process flow diagrams

| Connection | Type | Status | Notes |
|-----------|------|--------|-------|
| GIS / Mapping | Geospatial | Implicit | Site coordinates for 7 locations (5 states) — no live API |
| Site operational data | Internal | Connected | Status, phase, machine count per site |

**Data points consumed:** Site lat/long, operational status, process flow parameters.

**Gap identified:** No live mapping API (e.g., Mapbox, Google Maps) currently integrated.

---

### 3. Engineering & Projects (Delivering)

**Purpose:** Manufacturing build schedules, milestones, coal program oversight

| Connection | Type | Status | Notes |
|-----------|------|--------|-------|
| Oracle P6 | Project Mgmt API | Degraded (45s latency) | Construction schedules, milestone tracking |
| Procore | Construction API | Connected | Daily reports, photos, RFIs, punch lists |
| WakeCap | Safety IoT API | Connected | Worker coordination during construction |
| Texas Vessel | Fabrication Partner | Manual | 2 TPH reactor fabrication — no API |
| Brown & Root (B&R) | EPC Contractor | Manual/P6 | Portland OR, Coal MT projects |
| Cissell Mueller | EPC Contractor | Manual/P6 | Noble B expansion |
| WSP Global | Engineering Partner | Manual | Coal GA Pre-FEED study |

**Data points consumed:** 18-unit manufacturing pipeline, per-machine fab progress (design → fab → QA), milestone stage gates, site readiness dependencies, economic models per machine ($3.59M rev/tire, $7.85M rev/coal).

**Gap identified:** Fabrication partner tracking is manual — no direct API to Texas Vessel or EPC contractors for real-time fab progress.

---

### 4. Plant Operations

**Purpose:** Real-time performance, maintenance, HSE, and logistics

**Sub-tab: Plant Ops**

| Connection | Type | Status | Notes |
|-----------|------|--------|-------|
| SCADA Gateway | Industrial Control | Connected | 48 streams, 1-sec sync |
| Oracle MES | Manufacturing Execution | Connected | Production reports, batch tracking |
| Feedstock suppliers (5) | Supply Chain | Manual | RTR Environmental, Mid-Atlantic, Southwest, Gulf Coast, Midwest |
| Offtake contracts (12) | Customer data | Manual | Diluent, Carbon Black, Syn Gas contracts |

**Sub-tab: Maintenance**

| Connection | Type | Status | Notes |
|-----------|------|--------|-------|
| OSIsoft PI | Data Historian API | Connected | Time-series for predictive maintenance |
| AWS IoT Core | IoT Platform | Connected | 48 sensors managed |
| Oracle EAM | Asset Mgmt API | Connected | Work orders, equipment registry |
| IoT Sensors (48) | MQTT / Modbus | Connected | TEMP, VIB, AMP, PRES, FLOW, QUAL sensors |

**Sub-tab: Risk (HSE)**

| Connection | Type | Status | Notes |
|-----------|------|--------|-------|
| WakeCap | Worker Safety API | Connected | Worker location, zone density |
| GOARC | Permit Mgmt API | Connected | Hot work permits, spatial overlap |
| Veriforce | Compliance API | Connected | Contractor prequalification, certs, insurance |

**Sub-tab: Logistics**

| Connection | Type | Status | Notes |
|-----------|------|--------|-------|
| Inbound suppliers (3) | Supply Chain | Manual | TireRecycle Inc, RegionalPlastics, EcoMaterials |
| Outbound carriers (3) | Logistics | Manual | TransLogix, FreightSys, Pipeline |
| Distribution (4) | Customer | Manual | Gulf Coast Refinery, TireMfg Partners, Chemical Co, Lubricant Blender |

**Data points consumed:** 2.4M data points/day, IoT thresholds (reactor <425°F, conveyor <4.0 mm/s, auger <22A), 34 open work orders, product output (diluent K gal/day, carbon tons/day, syn gas MMSCF), 142 certs + 158 insurance policies + 24 permits tracked.

**Gaps identified:** Feedstock suppliers and logistics carriers have no direct API — all tracked manually. Fleet tracking (GPS) not integrated.

---

### 5. Finance & Strategy

**Purpose:** P&L, performance vs plan, market pricing, customer contracts

**Sub-tab: P&L**

| Connection | Type | Status | Notes |
|-----------|------|--------|-------|
| Oracle Financials | ERP API | Connected | 847 API calls/day, monthly actuals vs budget |

**Sub-tab: Performance vs Plan**

| Connection | Type | Status | Notes |
|-----------|------|--------|-------|
| Oracle Financials | ERP API | Connected | Site-by-site variance |
| Internal economic models | Static data | Embedded | Sensitivity analysis, development project IRR |

**Sub-tab: Marketing**

| Connection | Type | Status | Notes |
|-----------|------|--------|-------|
| Salesforce | CRM API | Connected | Customer contracts, pipeline, concentration risk |
| Bloomberg Terminal | Market Data | Pending | Commodity pricing feeds (diluent, carbon) |
| S&P Capital IQ | Market Intel | Pending | Peer valuation, market sizing |

**Data points consumed:** Monthly revenue Jan–Jun 2026, per-ton economics (tire $85.40 rev / $50 cost; coal $52.50 rev / $26.50 cost), cash position ($12.4M operating, 9.7 mo runway), customer contracts (6 active, top 3 = 65% revenue), 4 pipeline prospects ($8M+ opportunity).

**Gaps identified:** Bloomberg and S&P Capital IQ are pending — currently no live commodity pricing or market intelligence feed.

---

### 6. Platform & Admin

**Purpose:** IT systems, AI agents, process, people, legal

**Sub-tab: IT**

| Connection | Type | Status | Notes |
|-----------|------|--------|-------|
| Executive Intelligence Platform (self) | Platform | Connected | 99.8% uptime, 64 active users |
| Oracle P6 | Project Mgmt | Degraded | 45 sec sync latency |
| IoT Network | MQTT/Modbus | Connected | 48 sensors, 5 sites |
| Oracle Financials | ERP | Connected | 99.9% uptime |
| SCADA Gateway | Industrial | Connected | 99.8% uptime |
| Veriforce | Compliance | Connected | 99.6% uptime |
| AWS S3 | Data Lake | Connected | 2.1 TB/day export |
| Splunk | Log Analytics | Connected | 18.4M events/day |

**Sub-tab: AI**

| Connection | Type | Status | Notes |
|-----------|------|--------|-------|
| SCADA data feeds | AI input | Connected | Sensor data for agent processing |
| Oracle P6/EAM/MES | AI input | Connected | Project, asset, production data |
| Internal Agent API | Platform | Connected | 40+ agents, 1800+ tasks/day each |

**Sub-tab: Legal**

| Connection | Type | Status | Notes |
|-----------|------|--------|-------|
| DocuSign | Contract API | Connected | Signature tracking, term sheets |
| Patent systems | IP tracking | Connected | PatSnap + Google Patents |

---

### 7. Risk & Workforce

**Purpose:** Safety intelligence, workforce tracking, contractor risk scoring

| Connection | Type | Status | Notes |
|-----------|------|--------|-------|
| WakeCap | Worker Safety API | Connected | Real-time location, 6 zones, 113 workers tracked |
| GOARC | Permit Mgmt API | Connected | 24 active permits, spatial overlap, cumulative risk |
| Veriforce | Compliance API | Connected | 6 contractor scorecards, TRIR, certs, insurance |
| Predictive Risk Model | Internal AI | Connected | 88% accuracy incident prediction, 7-day trend |

**Data points consumed:** Days since LTI (142), TRIR (0.8), zone risk scores (28–81), contractor TRIR range (0.5–3.4), 142 certs + 18 expiring + 5 lapsed, 158 insurance policies.

---

### 8. Org Chart

**Purpose:** Organizational hierarchy, VP navigation

| Connection | Type | Status | Notes |
|-----------|------|--------|-------|
| Internal VP registry | Static data | Embedded | 13 VPs + executive structure |
| Agent directory | Static data | Embedded | 40+ agents linked to VPs |
| Google Workspace | Collaboration | Connected | Calendar sync for CEO/COO |

---

## Organized Connection Registry

### Tier 1 — Enterprise Core (Always On)

| System | Protocol | Auth | Owner | Criticality |
|--------|----------|------|-------|------------|
| Oracle Financials | REST API | OAuth 2.0 | VP Finance | Critical |
| Oracle P6 | REST API | Service Account | VP Engineering | Critical |
| Oracle EAM | REST API | Service Account | VP Maintenance | Critical |
| Oracle MES | REST API | Service Account | VP Plant Ops | Critical |
| SCADA Gateway | OPC-UA / Modbus | Certificate | VP Plant Ops | Critical |

### Tier 2 — Operations & IoT (Real-Time)

| System | Protocol | Auth | Owner | Criticality |
|--------|----------|------|-------|------------|
| AWS IoT Core | MQTT / HTTPS | X.509 Certs | VP IT | Critical |
| OSIsoft PI | PI Web API | Kerberos | VP Maintenance | High |
| AWS S3 | S3 API | IAM Role | VP IT | High |
| Splunk | REST API | Token | VP IT | High |

### Tier 3 — Safety & Compliance

| System | Protocol | Auth | Owner | Criticality |
|--------|----------|------|-------|------------|
| WakeCap | REST API | API Key | VP Risk & HSE | High |
| GOARC | REST API | API Key | VP Risk & HSE | High |
| Veriforce | REST API | API Key | VP Risk & HSE | High |

### Tier 4 — Construction & Design

| System | Protocol | Auth | Owner | Criticality |
|--------|----------|------|-------|------------|
| Procore | REST API | OAuth 2.0 | VP Engineering | Medium |
| Autodesk Vault | REST API | OAuth 2.0 | VP R&D | Medium |
| SolidWorks PDM | API | LDAP | VP R&D | Medium |

### Tier 5 — Business Systems

| System | Protocol | Auth | Owner | Criticality |
|--------|----------|------|-------|------------|
| Salesforce | REST API | OAuth 2.0 | VP Business Dev | Medium |
| DocuSign | REST API | OAuth 2.0 | VP Legal | Medium |
| LabWare LIMS | REST API | API Key | VP Quality | Medium |
| PatSnap | REST API | API Key | VP R&D | Low |
| Google Patents | Public API | API Key | VP R&D | Low |

### Tier 6 — Collaboration & Alerting

| System | Protocol | Auth | Owner | Criticality |
|--------|----------|------|-------|------------|
| Google Workspace | Google API | OAuth 2.0 | VP IT | High |
| Slack | REST API | Bot Token | VP IT | High |
| Notion | REST API | API Key | COO | Medium |
| PagerDuty | REST API | API Key | VP IT | High |
| Google Calendar | Google API | OAuth 2.0 | VP IT | Medium |

### Tier 7 — Pending / Planned

| System | Protocol | Auth | Owner | Target |
|--------|----------|------|-------|--------|
| SAP Ariba | REST API | OAuth 2.0 | VP Supply Chain | Q3 2026 |
| Bloomberg Terminal | B-PIPE | Enterprise License | VP Finance | TBD |
| S&P Capital IQ | REST API | API Key | VP Finance | TBD |

### Manual / No-API Partners

| Partner | Relationship | Data Tracked | Integration Opportunity |
|---------|-------------|--------------|------------------------|
| Texas Vessel | Reactor fabrication | Unit build progress | Custom webhook or ERP bridge |
| Brown & Root | EPC contractor | Project schedules | Via Procore / P6 |
| Cissell Mueller | EPC contractor | Project schedules | Via Procore / P6 |
| WSP Global | Engineering partner | Pre-FEED studies | Email / document share |
| RTR Environmental | Feedstock supplier | Tire crumb volumes | Supplier portal API |
| Gulf Coast Rubber | Feedstock supplier | Shipments & quality | Supplier portal API |
| Southwest Tire Processors | Feedstock supplier | Delivery schedules | Supplier portal API |
| Mid-Atlantic Tire Recycling | Feedstock supplier | Feed availability | Supplier portal API |
| Midwest Tire Recyclers | Feedstock supplier | Feed availability | Supplier portal API |
| TireRecycle Inc | Inbound logistics | Daily deliveries | Fleet tracking API |
| RegionalPlastics Co | Inbound logistics | Plastic sourcing | Supplier portal API |
| EcoMaterials LLC | Inbound logistics | Polymer supply | Supplier portal API |
| TransLogix | Outbound carrier | Product shipments | Carrier tracking API |
| FreightSys | Outbound carrier | Carbon transport | Carrier tracking API |

---

## IoT Sensor Summary

| Type | Count | Protocol | Sites | Platform |
|------|-------|----------|-------|----------|
| Temperature | ~12 | MQTT | All 5 | AWS IoT Core → PI |
| Vibration | ~10 | MQTT | All 5 | AWS IoT Core → PI |
| Pressure | ~8 | MQTT | All 5 | AWS IoT Core → PI |
| Flow | ~8 | MQTT / Modbus | All 5 | AWS IoT Core → PI |
| Electrical | ~6 | Modbus | All 5 | AWS IoT Core → PI |
| Quality | ~4 | REST | Select sites | LabWare LIMS |
| **Total** | **48** | — | **5 sites** | — |

**Data path:** Edge Sensor → SCADA OPC-UA/Modbus → AWS IoT Core (MQTT/TLS) → OSIsoft PI (historian) → AWS S3 (data lake) → Executive Intelligence Platform (dashboards & AI agents)

---

## Key Gaps & Recommendations

1. **Oracle P6 latency (45 sec)** — investigate connection pooling or caching layer
2. **No live mapping API** — consider Mapbox or Google Maps for Site Map
3. **Feedstock/logistics partners have no API** — prioritize supplier portal or SAP Ariba rollout
4. **Bloomberg + S&P Capital IQ still pending** — no real-time commodity pricing
5. **Fleet/carrier tracking** — TransLogix and FreightSys need GPS tracking API
6. **Fabrication partner visibility** — Texas Vessel build progress is manual; consider webhook integration
7. **MFA not enforced for Operators** — security gap in site-level access
