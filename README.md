# SENS Master v4.0 — Multi-Site Dashboard

## Quick Start

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Project Structure

```
src/
  data/
    theme.js          ← Color tokens (T object)
    sites.js          ← Site data model + computed totals
  components/ui/
    indicators.jsx    ← Spark, StatusPill, EngineLight, KpiCard, Progress
    layout.jsx        ← Card, TabBar, DataTable, BarChart, MetricGrid, SectionHeader
    site.jsx          ← SiteSelector, PortfolioMap, SiteCard, FacilityView, ZoneDetail
    index.js          ← Barrel export
  views/
    DashboardView.jsx ← Portfolio dashboard with engine lights, map, KPIs
    DeliveringView.jsx← Projects, manufacturing pipeline, engineering
    OperationsView.jsx← Plant ops, maintenance, HSE, logistics (per-site)
    FinanceView.jsx   ← Revenue, strategy, sales, investment structure
    AdminView.jsx     ← IT/AI, process, people, legal
    RiskView.jsx      ← Risk register + sensitivity analysis
    OrgChartView.jsx  ← Org chart visualization
    index.js          ← Barrel export
  App.jsx             ← Shell: nav, header, role selector, view router
  main.jsx            ← React entry point
```

## Sites (5 Active + 2 Construction)

| Site | State | Series | Processors | Status |
|------|-------|--------|------------|--------|
| Noble OK | OK | A | 1 | Operational |
| Tulsa OK | OK | A-2 | 2 | Operational |
| Jax TX | TX | B | 2 | Operational |
| Baton Rouge | LA | B | 1 | Operational |
| Dothan AL | AL | B | 1 | Operational |
| Noble B (Expansion) | OK | C | 6 | Construction |
| Pensacola | FL | C | 3 | Construction |

## Working with Claude Code

To add a new site, edit `src/data/sites.js`. All views pull from this data model automatically.

To modify a specific view, edit the corresponding file in `src/views/`.

UI components are reusable — edit once in `src/components/ui/` and changes propagate everywhere.
