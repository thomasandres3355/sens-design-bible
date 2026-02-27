# SENS Master Project — Data Tables & Connection Map

## Quick Start
Open any `.csv` file in Excel, Numbers, or Google Sheets to view and edit.
All files are in `/data-tables/` and numbered by domain.

## Table Index

| # | File | Records | Domain |
|---|------|---------|--------|
| 00 | `00_DATA_MAP.csv` | 26 | Master map of all tables, keys, and relationships |
| 01 | `01_sites.csv` | 9 | Sites (5 operational, 2 construction, 2 development) |
| 02 | `02_plan_economics.csv` | 2 | Per-machine plan economics (Tire vs Coal) |
| 03 | `03_site_plan_computed.csv` | 9 | Plan vs actual variance per site |
| 04 | `04_alerts_agent_raised.csv` | 10 | Alerts raised by AI agents |
| 05 | `05_alerts_kpi_rules.csv` | 3 | Rules for computing KPI-driven alerts |
| 06 | `06_objectives.csv` | 3 | Company strategic objectives |
| 07 | `07_executive_tasks.csv` | 70 | Executive focus tasks (the main daily tracker) |
| 08 | `08_element_catalog.csv` | 16 | Asset types for project modeling |
| 09 | `09_development_projects.csv` | 5 | Development-stage projects |
| 10 | `10_project_elements.csv` | 11 | Elements placed on Hartford canvas |
| 11 | `11_project_connections.csv` | 7 | Flow connections between elements |
| 12 | `12_feedstock_presets.csv` | 10 | Coal & tire composition presets |
| 13 | `13_financial_config_defaults.csv` | 15 | Financial assumption defaults |
| 14 | `14_participants.csv` | 8 | Executive team members |
| 15 | `15_employees.csv` | 8 | Development team employees |
| 16 | `16_meetings.csv` | 8 | Meetings (upcoming + completed) |
| 17 | `17_journal_notes.csv` | 6 | Freeform journal entries |
| 18 | `18_action_items.csv` | 13 | Meeting action items |
| 19 | `19_financial_model.csv` | 10 | Annual financial projections (2026-2035) |
| 20 | `20_manufacturing_dependencies.csv` | 11 | Machine → site installation dependencies |
| 21 | `21_project_files.csv` | 9 | Files uploaded to projects |
| 22 | `22_project_teams.csv` | 16 | Team assignments per project |
| 23 | `23_activity_log.csv` | 10 | Project activity feed |
| 24 | `24_velocity_trend.csv` | 8 | Weekly task velocity by objective |
| 25 | `25_meeting_agents.csv` | 4 | AI agents for live meetings |
| 26 | `26_tags.csv` | 26 | Reusable tags for meetings & notes |

## Data Relationship Diagram

```
                    ┌──────────────────┐
                    │  06_objectives   │
                    │  (3 objectives)  │
                    └────────┬─────────┘
                             │ objectiveTag
                             ▼
┌──────────────┐    ┌──────────────────┐    ┌───────────────┐
│ 14_participants│◄──│ 07_executive_   │    │ 24_velocity_  │
│ (8 executives) │    │    tasks (70)   │───►│   trend (8w)  │
└───────┬────────┘    └────────────────┘    └───────────────┘
        │ participants
        ▼
┌──────────────────┐    ┌───────────────┐
│  16_meetings (8) │───►│ 18_action_    │
└──────────────────┘    │  items (13)   │
                        └───────────────┘

┌──────────────────┐    ┌───────────────┐    ┌───────────────┐
│  01_sites (9)    │───►│ 03_site_plan_ │    │ 05_alert_kpi_ │
│                  │    │ computed (9)  │◄───│  rules (3)    │
└───────┬──────────┘    └───────────────┘    └───────────────┘
        │ siteId                              ┌───────────────┐
        ▼                                     │ 04_alerts_    │
┌──────────────────┐                          │ agent (10)    │
│ 20_manufacturing │                          └───────────────┘
│ dependencies(11) │
└──────────────────┘

┌──────────────────┐    ┌───────────────┐    ┌───────────────┐
│ 02_plan_economics│    │ 12_feedstock_  │    │ 13_financial_ │
│ (2 types)        │    │ presets (10)   │    │  config (15)  │
└──────────────────┘    └───────┬───────┘    └───────┬───────┘
                                │                     │
                                ▼                     ▼
┌──────────────────┐    ┌───────────────────────────────────┐
│ 09_development_  │◄──►│          DEVELOPMENT VIEW          │
│ projects (5)     │    │  (Flowchart + Dials + Pro Forma)   │
└──┬───┬───┬───┬───┘    └───────────────────────────────────┘
   │   │   │   │                     ▲
   │   │   │   │         ┌───────────┴───────────┐
   │   │   │   └────────►│ 08_element_catalog(16)│
   │   │   │             └───────────────────────┘
   │   │   └──────►┌───────────────┐
   │   │           │ 10_project_   │───►┌─────────────────┐
   │   │           │ elements (11) │    │ 11_project_     │
   │   │           └───────────────┘    │ connections (7) │
   │   │                                └─────────────────┘
   │   └───────────►┌───────────────┐
   │                │ 22_project_   │───►┌───────────────┐
   │                │  teams (16)   │    │ 15_employees   │
   │                └───────────────┘    │ (8)            │
   │                                     └───────────────┘
   ├───────────────►┌───────────────┐
   │                │ 21_project_   │
   │                │  files (9)    │
   │                └───────────────┘
   └───────────────►┌───────────────┐
                    │ 23_activity_  │
                    │  log (10)     │
                    └───────────────┘
```

## How to Use: Adding a New Task Daily

1. Open `07_executive_tasks.csv` in Excel
2. Add a new row at the bottom:
   - `id`: Use next available (e.g., `ft-170`)
   - `task`: What needs to be done
   - `executive`: CEO, COO, VP Engineering, VP Operations, VP Finance, VP Strategy, VP People, or VP Risk
   - `objectiveTag`: `obj-series-c`, `obj-ops-excellence`, `obj-growth-pipeline`, or leave blank
   - `due`: YYYY-MM-DD format
   - `status`: `open` (or `overdue` if past due)
   - `priority`: `high`, `medium`, or `low`
   - `cycle`: `24h`, `3d`, or `1w`
   - `source`: Where this task came from
3. Save the file

## How to Use: Updating Site Data

1. Open `01_sites.csv` in Excel
2. Edit any operational metric (uptime, throughput, revMTD, etc.)
3. Recalculate `03_site_plan_computed.csv` using the formulas:
   - `planRevenue_M` = processors * (3590849 for tire / 7850000 for coal) / 1,000,000
   - `revVariance_M` = actualRevenue_M - planRevenue_M
   - `uptimeGap` = uptimeActual - uptimePlan (84 for tire, 82 for coal)

## How to Use: Adding a New Meeting

1. Open `16_meetings.csv` and add a new row
2. Use participant IDs from `14_participants.csv`
3. After the meeting, add action items to `18_action_items.csv`

## Computed Fields (for future data store migration)

These fields are currently calculated in the React components and should eventually
be computed by the data store:

| Computed Field | Formula | Source Tables |
|----------------|---------|---------------|
| Portfolio EBITDA | SUM(actualEBITDA) for operational sites | 01_sites |
| Avg Uptime | AVG(uptime) for operational sites | 01_sites |
| Revenue Attainment % | (actual / plan) * 100 per site | 01_sites + 02_plan |
| Task Focus % | (aligned tasks / total tasks) * 100 | 07_tasks + 06_objectives |
| Tasks Overdue | COUNT where status=open AND due < today | 07_tasks |
| Velocity per Week | COUNT completed per date range | 07_tasks |
| Pro Forma IRR/NPV | calcProForma() engine | 08_catalog + 10_elements + 12_feedstock + 13_config |
