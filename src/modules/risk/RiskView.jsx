import { useState, useMemo } from "react";
import { T } from "@core/theme/theme";
import { activeSites, allProjectSites } from "@core/data/sites";
import { EngineLight, KpiCard, StatusPill, Progress, Card, DataTable, TabBar, StyledSelect, DraggableGrid, DraggableCardRow } from "@core/ui";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine } from "recharts";
/* ─── Data Source Colors (mapped to theme) ─── */
const SRC = { wakecap: T.teal, goarc: T.warn, veriforce: T.purple };

/* ─── Sample Risk Intelligence Data (adapted for SENS pyrolysis context) ─── */
const siteRiskTrend = [
  { date: "Mar", overall: 42, wakecap: 36, goarc: 50, veriforce: 39 },
  { date: "Apr", overall: 45, wakecap: 39, goarc: 52, veriforce: 42 },
  { date: "May", overall: 40, wakecap: 34, goarc: 48, veriforce: 38 },
  { date: "Jun", overall: 38, wakecap: 32, goarc: 46, veriforce: 36 },
  { date: "Jul", overall: 44, wakecap: 38, goarc: 51, veriforce: 41 },
  { date: "Aug", overall: 48, wakecap: 42, goarc: 55, veriforce: 45 },
  { date: "Sep", overall: 52, wakecap: 48, goarc: 58, veriforce: 49 },
  { date: "Oct", overall: 46, wakecap: 40, goarc: 53, veriforce: 43 },
  { date: "Nov", overall: 39, wakecap: 33, goarc: 47, veriforce: 37 },
  { date: "Dec", overall: 35, wakecap: 29, goarc: 43, veriforce: 33 },
  { date: "Jan", overall: 34, wakecap: 28, goarc: 42, veriforce: 31 },
  { date: "Feb", overall: 37, wakecap: 31, goarc: 44, veriforce: 35 },
];

const zoneData = [
  { zone: "Zone A — Pyrolysis Reactor", workers: 24, permits: 3, risk: 72, density: 89, status: "critical", alerts: 2, wakecapWorkers: 24, goarcPermits: 3, veriforceHighRisk: 4 },
  { zone: "Zone B — Feed Prep", workers: 18, permits: 2, risk: 45, density: 62, status: "elevated", alerts: 1, wakecapWorkers: 18, goarcPermits: 2, veriforceHighRisk: 1 },
  { zone: "Zone C — Distillation", workers: 31, permits: 5, risk: 58, density: 74, status: "elevated", alerts: 3, wakecapWorkers: 31, goarcPermits: 5, veriforceHighRisk: 3 },
  { zone: "Zone D — Carbon Processing", workers: 12, permits: 1, risk: 28, density: 35, status: "normal", alerts: 0, wakecapWorkers: 12, goarcPermits: 1, veriforceHighRisk: 0 },
  { zone: "Zone E — Loading Bay", workers: 22, permits: 4, risk: 38, density: 51, status: "normal", alerts: 0, wakecapWorkers: 22, goarcPermits: 4, veriforceHighRisk: 1 },
  { zone: "Zone F — Confined Space", workers: 6, permits: 2, risk: 81, density: 95, status: "critical", alerts: 4, wakecapWorkers: 6, goarcPermits: 2, veriforceHighRisk: 2 },
];

const contractorScorecard = [
  { name: "Texas Vessel", trir: 1.2, riskScore: 34, certCompliance: 98, permitAdherence: 95, behaviorScore: 88, workers: 45, trend: "improving" },
  { name: "Cissell Mueller", trir: 2.8, riskScore: 67, certCompliance: 82, permitAdherence: 71, behaviorScore: 62, workers: 32, trend: "declining" },
  { name: "Brown & Root", trir: 0.8, riskScore: 22, certCompliance: 100, permitAdherence: 98, behaviorScore: 94, workers: 28, trend: "stable" },
  { name: "Phoenix Steel", trir: 1.9, riskScore: 48, certCompliance: 91, permitAdherence: 88, behaviorScore: 79, workers: 19, trend: "improving" },
  { name: "National Concrete", trir: 3.4, riskScore: 78, certCompliance: 74, permitAdherence: 65, behaviorScore: 55, workers: 38, trend: "declining" },
  { name: "Advanced Fab", trir: 0.5, riskScore: 18, certCompliance: 100, permitAdherence: 99, behaviorScore: 96, workers: 14, trend: "stable" },
];

const complianceData = [
  { category: "Certifications", compliant: 142, expiring: 18, lapsed: 5 },
  { category: "Insurance", compliant: 158, expiring: 8, lapsed: 2 },
  { category: "Permits", compliant: 17, expiring: 3, lapsed: 1 },
  { category: "Training", compliant: 134, expiring: 22, lapsed: 11 },
  { category: "OQ Records", compliant: 89, expiring: 7, lapsed: 3 },
];

const alertsFeed = [
  { id: 1, time: "2 min ago", type: "critical", source: "WakeCap + GOARC", message: "3 unauthorized workers entered confined space Zone F — no active permit for personnel" },
  { id: 2, time: "8 min ago", type: "critical", source: "Veriforce + WakeCap", message: "National Concrete crew (risk score: 78) assigned to reactor zone without updated hot work cert" },
  { id: 3, time: "15 min ago", type: "warning", source: "GOARC", message: "Hot work permit PTW-2847 overlaps spatially with Zone C distillation work — cumulative risk exceeded" },
  { id: 4, time: "22 min ago", type: "warning", source: "WakeCap", message: "Zone A worker density at 89% of permitted capacity — approaching overcrowding threshold" },
  { id: 5, time: "34 min ago", type: "info", source: "Veriforce", message: "Cissell Mueller insurance policy expires in 12 days — auto-notification sent to contractor" },
  { id: 6, time: "41 min ago", type: "warning", source: "WakeCap + Veriforce", message: "Unregistered sub-tier worker detected in Zone B — no Veriforce prequalification record found" },
];

const radarData = [
  { metric: "Worker Location (T:95)", value: 92, target: 95, fullMark: 100 },
  { metric: "Permit Compliance (T:90)", value: 78, target: 90, fullMark: 100 },
  { metric: "Contractor Qual. (T:90)", value: 85, target: 90, fullMark: 100 },
  { metric: "Density Mgmt (T:85)", value: 71, target: 85, fullMark: 100 },
  { metric: "Incident Predict. (T:90)", value: 88, target: 90, fullMark: 100 },
  { metric: "Cert Currency (T:90)", value: 82, target: 90, fullMark: 100 },
];

const predictiveData = [
  { month: "Mar", predicted: 42, actual: 40 },
  { month: "Apr", predicted: 46, actual: 48 },
  { month: "May", predicted: 50, actual: 53 },
  { month: "Jun", predicted: 48, actual: 45 },
  { month: "Jul", predicted: 55, actual: 58 },
  { month: "Aug", predicted: 60, actual: 62 },
  { month: "Sep", predicted: 64, actual: 67 },
  { month: "Oct", predicted: 58, actual: 55 },
  { month: "Nov", predicted: 52, actual: 50 },
  { month: "Dec", predicted: 45, actual: 43 },
  { month: "Jan", predicted: 48, actual: null },
  { month: "Feb", predicted: 44, actual: null },
];

/* ─── Per-Site Data Variants ─── */
const siteRiskTrendData = {
  all: siteRiskTrend,
  "Noble OK": [
    { date: "Mar", overall: 40, wakecap: 34, goarc: 48, veriforce: 37 },
    { date: "Apr", overall: 43, wakecap: 37, goarc: 50, veriforce: 40 },
    { date: "May", overall: 38, wakecap: 32, goarc: 46, veriforce: 36 },
    { date: "Jun", overall: 36, wakecap: 30, goarc: 43, veriforce: 34 },
    { date: "Jul", overall: 42, wakecap: 38, goarc: 50, veriforce: 40 },
    { date: "Aug", overall: 46, wakecap: 40, goarc: 53, veriforce: 43 },
    { date: "Sep", overall: 50, wakecap: 46, goarc: 56, veriforce: 47 },
    { date: "Oct", overall: 44, wakecap: 38, goarc: 51, veriforce: 41 },
    { date: "Nov", overall: 37, wakecap: 31, goarc: 45, veriforce: 35 },
    { date: "Dec", overall: 33, wakecap: 27, goarc: 41, veriforce: 31 },
    { date: "Jan", overall: 32, wakecap: 26, goarc: 40, veriforce: 29 },
    { date: "Feb", overall: 35, wakecap: 29, goarc: 42, veriforce: 33 },
  ],
  "Richmond VA": [
    { date: "Mar", overall: 44, wakecap: 38, goarc: 52, veriforce: 41 },
    { date: "Apr", overall: 47, wakecap: 41, goarc: 54, veriforce: 44 },
    { date: "May", overall: 42, wakecap: 36, goarc: 50, veriforce: 40 },
    { date: "Jun", overall: 40, wakecap: 34, goarc: 48, veriforce: 38 },
    { date: "Jul", overall: 46, wakecap: 40, goarc: 53, veriforce: 43 },
    { date: "Aug", overall: 50, wakecap: 44, goarc: 57, veriforce: 47 },
    { date: "Sep", overall: 55, wakecap: 51, goarc: 62, veriforce: 52 },
    { date: "Oct", overall: 48, wakecap: 42, goarc: 55, veriforce: 45 },
    { date: "Nov", overall: 41, wakecap: 35, goarc: 49, veriforce: 39 },
    { date: "Dec", overall: 37, wakecap: 31, goarc: 45, veriforce: 35 },
    { date: "Jan", overall: 36, wakecap: 30, goarc: 44, veriforce: 33 },
    { date: "Feb", overall: 39, wakecap: 33, goarc: 46, veriforce: 37 },
  ],
  "Tucson AZ": [
    { date: "Mar", overall: 43, wakecap: 37, goarc: 51, veriforce: 40 },
    { date: "Apr", overall: 46, wakecap: 40, goarc: 53, veriforce: 43 },
    { date: "May", overall: 41, wakecap: 35, goarc: 49, veriforce: 39 },
    { date: "Jun", overall: 39, wakecap: 33, goarc: 47, veriforce: 37 },
    { date: "Jul", overall: 45, wakecap: 39, goarc: 52, veriforce: 42 },
    { date: "Aug", overall: 49, wakecap: 43, goarc: 56, veriforce: 46 },
    { date: "Sep", overall: 54, wakecap: 50, goarc: 61, veriforce: 51 },
    { date: "Oct", overall: 47, wakecap: 41, goarc: 54, veriforce: 44 },
    { date: "Nov", overall: 40, wakecap: 34, goarc: 48, veriforce: 38 },
    { date: "Dec", overall: 36, wakecap: 30, goarc: 44, veriforce: 34 },
    { date: "Jan", overall: 35, wakecap: 29, goarc: 41, veriforce: 32 },
    { date: "Feb", overall: 38, wakecap: 32, goarc: 45, veriforce: 36 },
  ],
  "Baton Rouge": [
    { date: "Mar", overall: 38, wakecap: 32, goarc: 46, veriforce: 35 },
    { date: "Apr", overall: 41, wakecap: 35, goarc: 49, veriforce: 38 },
    { date: "May", overall: 36, wakecap: 30, goarc: 44, veriforce: 34 },
    { date: "Jun", overall: 34, wakecap: 28, goarc: 42, veriforce: 32 },
    { date: "Jul", overall: 40, wakecap: 34, goarc: 48, veriforce: 38 },
    { date: "Aug", overall: 44, wakecap: 38, goarc: 52, veriforce: 42 },
    { date: "Sep", overall: 48, wakecap: 44, goarc: 55, veriforce: 46 },
    { date: "Oct", overall: 42, wakecap: 39, goarc: 50, veriforce: 40 },
    { date: "Nov", overall: 35, wakecap: 29, goarc: 43, veriforce: 33 },
    { date: "Dec", overall: 31, wakecap: 25, goarc: 39, veriforce: 29 },
    { date: "Jan", overall: 30, wakecap: 24, goarc: 38, veriforce: 27 },
    { date: "Feb", overall: 33, wakecap: 27, goarc: 40, veriforce: 31 },
  ],
  "Columbus OH": [
    { date: "Mar", overall: 41, wakecap: 35, goarc: 49, veriforce: 38 },
    { date: "Apr", overall: 44, wakecap: 38, goarc: 51, veriforce: 41 },
    { date: "May", overall: 39, wakecap: 33, goarc: 47, veriforce: 37 },
    { date: "Jun", overall: 37, wakecap: 31, goarc: 45, veriforce: 35 },
    { date: "Jul", overall: 43, wakecap: 37, goarc: 50, veriforce: 40 },
    { date: "Aug", overall: 47, wakecap: 41, goarc: 54, veriforce: 44 },
    { date: "Sep", overall: 51, wakecap: 47, goarc: 59, veriforce: 48 },
    { date: "Oct", overall: 45, wakecap: 41, goarc: 52, veriforce: 42 },
    { date: "Nov", overall: 38, wakecap: 32, goarc: 46, veriforce: 36 },
    { date: "Dec", overall: 34, wakecap: 28, goarc: 42, veriforce: 32 },
    { date: "Jan", overall: 33, wakecap: 27, goarc: 41, veriforce: 30 },
    { date: "Feb", overall: 36, wakecap: 30, goarc: 43, veriforce: 34 },
  ],
};

const zoneDataByIm = {
  "Noble OK": [
    { zone: "Zone A — Pyrolysis Reactor", workers: 12, permits: 2, risk: 68, density: 85, status: "critical", alerts: 1, wakecapWorkers: 12, goarcPermits: 2, veriforceHighRisk: 2 },
    { zone: "Zone B — Feed Prep", workers: 8, permits: 1, risk: 42, density: 58, status: "elevated", alerts: 0, wakecapWorkers: 8, goarcPermits: 1, veriforceHighRisk: 1 },
    { zone: "Zone C — Distillation", workers: 15, permits: 2, risk: 55, density: 70, status: "elevated", alerts: 2, wakecapWorkers: 15, goarcPermits: 2, veriforceHighRisk: 2 },
    { zone: "Zone D — Carbon Processing", workers: 6, permits: 1, risk: 26, density: 32, status: "normal", alerts: 0, wakecapWorkers: 6, goarcPermits: 1, veriforceHighRisk: 0 },
  ],
  "Richmond VA": [
    { zone: "Zone A — Pyrolysis Reactor", workers: 28, permits: 3, risk: 74, density: 91, status: "critical", alerts: 2, wakecapWorkers: 28, goarcPermits: 3, veriforceHighRisk: 5 },
    { zone: "Zone B — Feed Prep", workers: 20, permits: 2, risk: 46, density: 64, status: "elevated", alerts: 1, wakecapWorkers: 20, goarcPermits: 2, veriforceHighRisk: 1 },
    { zone: "Zone C — Distillation", workers: 36, permits: 5, risk: 60, density: 76, status: "elevated", alerts: 3, wakecapWorkers: 36, goarcPermits: 5, veriforceHighRisk: 3 },
    { zone: "Zone D — Carbon Processing", workers: 14, permits: 1, risk: 30, density: 37, status: "normal", alerts: 0, wakecapWorkers: 14, goarcPermits: 1, veriforceHighRisk: 0 },
    { zone: "Zone E — Loading Bay", workers: 26, permits: 4, risk: 40, density: 53, status: "normal", alerts: 0, wakecapWorkers: 26, goarcPermits: 4, veriforceHighRisk: 1 },
  ],
  "Tucson AZ": [
    { zone: "Zone A — Pyrolysis Reactor", workers: 26, permits: 3, risk: 70, density: 88, status: "critical", alerts: 2, wakecapWorkers: 26, goarcPermits: 3, veriforceHighRisk: 4 },
    { zone: "Zone B — Feed Prep", workers: 19, permits: 2, risk: 44, density: 61, status: "elevated", alerts: 1, wakecapWorkers: 19, goarcPermits: 2, veriforceHighRisk: 1 },
    { zone: "Zone C — Distillation", workers: 34, permits: 5, risk: 57, density: 73, status: "elevated", alerts: 3, wakecapWorkers: 34, goarcPermits: 5, veriforceHighRisk: 3 },
    { zone: "Zone D — Carbon Processing", workers: 13, permits: 1, risk: 27, density: 34, status: "normal", alerts: 0, wakecapWorkers: 13, goarcPermits: 1, veriforceHighRisk: 0 },
    { zone: "Zone E — Loading Bay", workers: 24, permits: 4, risk: 37, density: 50, status: "normal", alerts: 0, wakecapWorkers: 24, goarcPermits: 4, veriforceHighRisk: 1 },
  ],
  "Baton Rouge": [
    { zone: "Zone A — Pyrolysis Reactor", workers: 11, permits: 1, risk: 65, density: 83, status: "critical", alerts: 1, wakecapWorkers: 11, goarcPermits: 1, veriforceHighRisk: 2 },
    { zone: "Zone B — Feed Prep", workers: 7, permits: 1, risk: 40, density: 56, status: "elevated", alerts: 0, wakecapWorkers: 7, goarcPermits: 1, veriforceHighRisk: 0 },
    { zone: "Zone C — Distillation", workers: 14, permits: 2, risk: 52, density: 68, status: "elevated", alerts: 2, wakecapWorkers: 14, goarcPermits: 2, veriforceHighRisk: 2 },
  ],
  "Columbus OH": [
    { zone: "Zone A — Pyrolysis Reactor", workers: 13, permits: 2, risk: 70, density: 86, status: "critical", alerts: 1, wakecapWorkers: 13, goarcPermits: 2, veriforceHighRisk: 2 },
    { zone: "Zone B — Feed Prep", workers: 9, permits: 1, risk: 43, density: 59, status: "elevated", alerts: 0, wakecapWorkers: 9, goarcPermits: 1, veriforceHighRisk: 1 },
    { zone: "Zone C — Distillation", workers: 17, permits: 2, risk: 56, density: 71, status: "elevated", alerts: 2, wakecapWorkers: 17, goarcPermits: 2, veriforceHighRisk: 2 },
    { zone: "Zone D — Carbon Processing", workers: 7, permits: 1, risk: 28, density: 33, status: "normal", alerts: 0, wakecapWorkers: 7, goarcPermits: 1, veriforceHighRisk: 0 },
  ],
};

const contractorScoreboardById = {
  all: [
    { name: "Texas Vessel", trir: 1.2, riskScore: 34, certCompliance: 98, permitAdherence: 95, behaviorScore: 88, workers: 45, trend: "improving" },
    { name: "Cissell Mueller", trir: 2.8, riskScore: 67, certCompliance: 82, permitAdherence: 71, behaviorScore: 62, workers: 32, trend: "declining" },
    { name: "Brown & Root", trir: 0.8, riskScore: 22, certCompliance: 100, permitAdherence: 98, behaviorScore: 94, workers: 28, trend: "stable" },
    { name: "Phoenix Steel", trir: 1.9, riskScore: 48, certCompliance: 91, permitAdherence: 88, behaviorScore: 79, workers: 19, trend: "improving" },
    { name: "National Concrete", trir: 3.4, riskScore: 78, certCompliance: 74, permitAdherence: 65, behaviorScore: 55, workers: 38, trend: "declining" },
    { name: "Advanced Fab", trir: 0.5, riskScore: 18, certCompliance: 100, permitAdherence: 99, behaviorScore: 96, workers: 14, trend: "stable" },
  ],
  "Noble OK": [
    { name: "Texas Vessel", trir: 1.1, riskScore: 32, certCompliance: 99, permitAdherence: 96, behaviorScore: 90, workers: 8, trend: "improving" },
    { name: "Advanced Fab", trir: 0.4, riskScore: 15, certCompliance: 100, permitAdherence: 100, behaviorScore: 98, workers: 6, trend: "stable" },
    { name: "Brown & Root", trir: 0.7, riskScore: 20, certCompliance: 100, permitAdherence: 99, behaviorScore: 96, workers: 8, trend: "stable" },
  ],
  "Richmond VA": [
    { name: "Texas Vessel", trir: 1.3, riskScore: 36, certCompliance: 97, permitAdherence: 94, behaviorScore: 86, workers: 15, trend: "improving" },
    { name: "Cissell Mueller", trir: 2.9, riskScore: 68, certCompliance: 81, permitAdherence: 70, behaviorScore: 61, workers: 12, trend: "declining" },
    { name: "Phoenix Steel", trir: 1.8, riskScore: 46, certCompliance: 92, permitAdherence: 89, behaviorScore: 80, workers: 12, trend: "improving" },
  ],
  "Tucson AZ": [
    { name: "Texas Vessel", trir: 1.2, riskScore: 35, certCompliance: 98, permitAdherence: 95, behaviorScore: 88, workers: 14, trend: "improving" },
    { name: "National Concrete", trir: 3.5, riskScore: 79, certCompliance: 73, permitAdherence: 64, behaviorScore: 54, workers: 12, trend: "declining" },
    { name: "Brown & Root", trir: 0.9, riskScore: 24, certCompliance: 100, permitAdherence: 97, behaviorScore: 92, workers: 12, trend: "stable" },
  ],
  "Baton Rouge": [
    { name: "Phoenix Steel", trir: 2.0, riskScore: 50, certCompliance: 90, permitAdherence: 87, behaviorScore: 78, workers: 7, trend: "improving" },
    { name: "Advanced Fab", trir: 0.6, riskScore: 21, certCompliance: 100, permitAdherence: 98, behaviorScore: 94, workers: 5, trend: "stable" },
  ],
  "Columbus OH": [
    { name: "Texas Vessel", trir: 1.1, riskScore: 33, certCompliance: 99, permitAdherence: 96, behaviorScore: 89, workers: 11, trend: "improving" },
    { name: "Cissell Mueller", trir: 2.7, riskScore: 65, certCompliance: 83, permitAdherence: 72, behaviorScore: 63, workers: 8, trend: "declining" },
  ],
};

const radarDataBySite = {
  all: radarData,
  "Noble OK": [
    { metric: "Worker Location (T:95)", value: 94, target: 95, fullMark: 100 },
    { metric: "Permit Compliance (T:90)", value: 80, target: 90, fullMark: 100 },
    { metric: "Contractor Qual. (T:90)", value: 87, target: 90, fullMark: 100 },
    { metric: "Density Mgmt (T:85)", value: 75, target: 85, fullMark: 100 },
    { metric: "Incident Predict. (T:90)", value: 90, target: 90, fullMark: 100 },
    { metric: "Cert Currency (T:90)", value: 85, target: 90, fullMark: 100 },
  ],
  "Richmond VA": [
    { metric: "Worker Location (T:95)", value: 90, target: 95, fullMark: 100 },
    { metric: "Permit Compliance (T:90)", value: 76, target: 90, fullMark: 100 },
    { metric: "Contractor Qual. (T:90)", value: 83, target: 90, fullMark: 100 },
    { metric: "Density Mgmt (T:85)", value: 68, target: 85, fullMark: 100 },
    { metric: "Incident Predict. (T:90)", value: 86, target: 90, fullMark: 100 },
    { metric: "Cert Currency (T:90)", value: 80, target: 90, fullMark: 100 },
  ],
  "Tucson AZ": [
    { metric: "Worker Location (T:95)", value: 92, target: 95, fullMark: 100 },
    { metric: "Permit Compliance (T:90)", value: 79, target: 90, fullMark: 100 },
    { metric: "Contractor Qual. (T:90)", value: 84, target: 90, fullMark: 100 },
    { metric: "Density Mgmt (T:85)", value: 72, target: 85, fullMark: 100 },
    { metric: "Incident Predict. (T:90)", value: 89, target: 90, fullMark: 100 },
    { metric: "Cert Currency (T:90)", value: 83, target: 90, fullMark: 100 },
  ],
  "Baton Rouge": [
    { metric: "Worker Location (T:95)", value: 93, target: 95, fullMark: 100 },
    { metric: "Permit Compliance (T:90)", value: 81, target: 90, fullMark: 100 },
    { metric: "Contractor Qual. (T:90)", value: 86, target: 90, fullMark: 100 },
    { metric: "Density Mgmt (T:85)", value: 76, target: 85, fullMark: 100 },
    { metric: "Incident Predict. (T:90)", value: 91, target: 90, fullMark: 100 },
    { metric: "Cert Currency (T:90)", value: 86, target: 90, fullMark: 100 },
  ],
  "Columbus OH": [
    { metric: "Worker Location (T:95)", value: 91, target: 95, fullMark: 100 },
    { metric: "Permit Compliance (T:90)", value: 77, target: 90, fullMark: 100 },
    { metric: "Contractor Qual. (T:90)", value: 82, target: 90, fullMark: 100 },
    { metric: "Density Mgmt (T:85)", value: 70, target: 85, fullMark: 100 },
    { metric: "Incident Predict. (T:90)", value: 87, target: 90, fullMark: 100 },
    { metric: "Cert Currency (T:90)", value: 81, target: 90, fullMark: 100 },
  ],
};

const complianceDataBySite = {
  all: complianceData,
  "Noble OK": [
    { category: "Certifications", compliant: 28, expiring: 3, lapsed: 1 },
    { category: "Insurance", compliant: 31, expiring: 1, lapsed: 0 },
    { category: "Permits", compliant: 3, expiring: 1, lapsed: 0 },
    { category: "Training", compliant: 26, expiring: 4, lapsed: 2 },
    { category: "OQ Records", compliant: 17, expiring: 1, lapsed: 0 },
  ],
  "Richmond VA": [
    { category: "Certifications", compliant: 38, expiring: 5, lapsed: 1 },
    { category: "Insurance", compliant: 42, expiring: 2, lapsed: 1 },
    { category: "Permits", compliant: 4, expiring: 1, lapsed: 0 },
    { category: "Training", compliant: 36, expiring: 6, lapsed: 3 },
    { category: "OQ Records", compliant: 24, expiring: 2, lapsed: 1 },
  ],
  "Tucson AZ": [
    { category: "Certifications", compliant: 36, expiring: 5, lapsed: 2 },
    { category: "Insurance", compliant: 40, expiring: 2, lapsed: 1 },
    { category: "Permits", compliant: 4, expiring: 1, lapsed: 1 },
    { category: "Training", compliant: 34, expiring: 6, lapsed: 3 },
    { category: "OQ Records", compliant: 23, expiring: 2, lapsed: 1 },
  ],
  "Baton Rouge": [
    { category: "Certifications", compliant: 18, expiring: 2, lapsed: 0 },
    { category: "Insurance", compliant: 20, expiring: 1, lapsed: 0 },
    { category: "Permits", compliant: 2, expiring: 0, lapsed: 0 },
    { category: "Training", compliant: 17, expiring: 3, lapsed: 1 },
    { category: "OQ Records", compliant: 12, expiring: 1, lapsed: 1 },
  ],
  "Columbus OH": [
    { category: "Certifications", compliant: 22, expiring: 3, lapsed: 1 },
    { category: "Insurance", compliant: 25, expiring: 2, lapsed: 0 },
    { category: "Permits", compliant: 3, expiring: 0, lapsed: 0 },
    { category: "Training", compliant: 21, expiring: 3, lapsed: 2 },
    { category: "OQ Records", compliant: 13, expiring: 1, lapsed: 0 },
  ],
};

const alertsFeedBySite = {
  all: alertsFeed,
  "Noble OK": [
    { id: 1, time: "3 min ago", type: "critical", source: "WakeCap + GOARC", message: "2 unauthorized workers entered confined space — no active permit" },
    { id: 2, time: "12 min ago", type: "warning", source: "GOARC", message: "Hot work permit overlap detected — risk exceeded" },
    { id: 3, time: "28 min ago", type: "warning", source: "WakeCap", message: "Zone A worker density at 85% of permitted capacity" },
  ],
  "Richmond VA": [
    { id: 1, time: "2 min ago", type: "critical", source: "WakeCap + GOARC", message: "4 unauthorized workers in confined space — no permits" },
    { id: 2, time: "7 min ago", type: "critical", source: "Veriforce + WakeCap", message: "Cissell Mueller crew (risk: 68) in reactor zone without updated cert" },
    { id: 3, time: "16 min ago", type: "warning", source: "GOARC", message: "Zone C distillation permit overlaps — cumulative risk exceeded" },
    { id: 4, time: "25 min ago", type: "warning", source: "WakeCap", message: "Zone A worker density at 91% capacity — approaching threshold" },
  ],
  "Tucson AZ": [
    { id: 1, time: "2 min ago", type: "critical", source: "WakeCap + GOARC", message: "3 unauthorized workers in confined space — no permits" },
    { id: 2, time: "8 min ago", type: "critical", source: "Veriforce + WakeCap", message: "National Concrete crew (risk: 79) in reactor zone without cert" },
    { id: 3, time: "18 min ago", type: "warning", source: "WakeCap", message: "Zone A worker density at 88% capacity" },
  ],
  "Baton Rouge": [
    { id: 1, time: "5 min ago", type: "warning", source: "WakeCap", message: "Zone A worker density at 83% of permitted capacity" },
    { id: 2, time: "14 min ago", type: "info", source: "Veriforce", message: "Insurance policy renewal pending — documentation received" },
  ],
  "Columbus OH": [
    { id: 1, time: "2 min ago", type: "critical", source: "WakeCap + GOARC", message: "2 unauthorized workers in confined space — no permits" },
    { id: 2, time: "10 min ago", type: "warning", source: "GOARC", message: "Zone permit overlap detected" },
    { id: 3, time: "22 min ago", type: "warning", source: "WakeCap", message: "Zone A density at 86% capacity" },
  ],
};

const predictiveDataBySite = {
  all: predictiveData,
  "Noble OK": [
    { month: "Mar", predicted: 40, actual: 38 },
    { month: "Apr", predicted: 44, actual: 46 },
    { month: "May", predicted: 48, actual: 51 },
    { month: "Jun", predicted: 46, actual: 43 },
    { month: "Jul", predicted: 53, actual: 56 },
    { month: "Aug", predicted: 58, actual: 60 },
    { month: "Sep", predicted: 62, actual: 65 },
    { month: "Oct", predicted: 56, actual: 53 },
    { month: "Nov", predicted: 50, actual: 48 },
    { month: "Dec", predicted: 43, actual: 41 },
    { month: "Jan", predicted: 46, actual: null },
    { month: "Feb", predicted: 42, actual: null },
  ],
  "Richmond VA": [
    { month: "Mar", predicted: 44, actual: 42 },
    { month: "Apr", predicted: 48, actual: 50 },
    { month: "May", predicted: 52, actual: 55 },
    { month: "Jun", predicted: 50, actual: 47 },
    { month: "Jul", predicted: 57, actual: 60 },
    { month: "Aug", predicted: 62, actual: 65 },
    { month: "Sep", predicted: 68, actual: 71 },
    { month: "Oct", predicted: 60, actual: 57 },
    { month: "Nov", predicted: 54, actual: 52 },
    { month: "Dec", predicted: 47, actual: 45 },
    { month: "Jan", predicted: 50, actual: null },
    { month: "Feb", predicted: 46, actual: null },
  ],
  "Tucson AZ": [
    { month: "Mar", predicted: 43, actual: 41 },
    { month: "Apr", predicted: 47, actual: 49 },
    { month: "May", predicted: 51, actual: 54 },
    { month: "Jun", predicted: 49, actual: 46 },
    { month: "Jul", predicted: 56, actual: 59 },
    { month: "Aug", predicted: 61, actual: 63 },
    { month: "Sep", predicted: 66, actual: 69 },
    { month: "Oct", predicted: 59, actual: 56 },
    { month: "Nov", predicted: 53, actual: 51 },
    { month: "Dec", predicted: 46, actual: 44 },
    { month: "Jan", predicted: 49, actual: null },
    { month: "Feb", predicted: 45, actual: null },
  ],
  "Baton Rouge": [
    { month: "Mar", predicted: 38, actual: 36 },
    { month: "Apr", predicted: 42, actual: 44 },
    { month: "May", predicted: 46, actual: 49 },
    { month: "Jun", predicted: 44, actual: 41 },
    { month: "Jul", predicted: 51, actual: 54 },
    { month: "Aug", predicted: 56, actual: 58 },
    { month: "Sep", predicted: 60, actual: 63 },
    { month: "Oct", predicted: 54, actual: 51 },
    { month: "Nov", predicted: 48, actual: 46 },
    { month: "Dec", predicted: 41, actual: 39 },
    { month: "Jan", predicted: 44, actual: null },
    { month: "Feb", predicted: 40, actual: null },
  ],
  "Columbus OH": [
    { month: "Mar", predicted: 41, actual: 39 },
    { month: "Apr", predicted: 45, actual: 47 },
    { month: "May", predicted: 49, actual: 52 },
    { month: "Jun", predicted: 47, actual: 44 },
    { month: "Jul", predicted: 54, actual: 57 },
    { month: "Aug", predicted: 59, actual: 61 },
    { month: "Sep", predicted: 63, actual: 66 },
    { month: "Oct", predicted: 57, actual: 54 },
    { month: "Nov", predicted: 51, actual: 49 },
    { month: "Dec", predicted: 44, actual: 42 },
    { month: "Jan", predicted: 47, actual: null },
    { month: "Feb", predicted: 43, actual: null },
  ],
};

/* ─── Existing Risk Data ─── */
const riskDomains = [
  { domain: "Workforce", score: 68, severity: "MEDIUM", color: T.warn, owner: "VP HR", freq: "Monthly", trend: "↑",
    subMetrics: [
      { label: "Turnover Rate", value: "18%", status: "warn", detail: "Above 15% target — operations roles driving attrition" },
      { label: "Open Positions", value: "12", status: "warn", detail: "3 critical ops roles unfilled > 60 days" },
      { label: "Training Compliance", value: "91%", status: "ok", detail: "Slight improvement from 88% last month" },
      { label: "Overtime Hours", value: "2,140", status: "warn", detail: "Baton Rouge & Richmond above sustainable threshold" },
    ],
    agentInsights: [
      { agent: "Workforce AI", time: "2h ago", text: "Turnover pattern at Baton Rouge correlates with shift schedule changes implemented in January. Recommend reverting to 4x10 schedule — similar reversion at Noble reduced attrition 22%.", severity: "high" },
      { agent: "Risk Analyst", time: "6h ago", text: "Open headcount in operations is creating cascading overtime risk. If unfilled by March 15, projected 30% increase in fatigue-related incidents based on historical data.", severity: "medium" },
    ],
  },
  { domain: "Process & Mfg", score: 55, severity: "HIGH", color: T.danger, owner: "VP Ops", freq: "Weekly", trend: "→",
    subMetrics: [
      { label: "Unplanned Downtime", value: "6.2%", status: "danger", detail: "Baton Rouge reactor contributing 68% of total downtime" },
      { label: "Throughput Efficiency", value: "82%", status: "warn", detail: "Target is 90% — feed quality issues at 2 sites" },
      { label: "Quality Incidents", value: "3", status: "warn", detail: "2 off-spec distillate batches, 1 carbon grade deviation" },
      { label: "Equipment Health", value: "74%", status: "warn", detail: "Predictive maintenance flagging 4 items across fleet" },
    ],
    agentInsights: [
      { agent: "Process AI", time: "1h ago", text: "Baton Rouge reactor temperature variance exceeding ±8°C threshold 3x this week. Root cause likely worn thermal couple in Zone 2 — maintenance window recommended within 48h.", severity: "high" },
      { agent: "Ops Analyst", time: "4h ago", text: "Feed quality from Gulf Coast Rubber trending 2.1% below spec on moisture content. This correlates with the off-spec distillate batches. Suggest supplier quality hold.", severity: "medium" },
    ],
  },
  { domain: "Project Dev", score: 58, severity: "HIGH", color: T.danger, owner: "VP Project", freq: "Weekly", trend: "↑",
    subMetrics: [
      { label: "Schedule Variance", value: "-4.2%", status: "warn", detail: "Noble B 2 weeks behind on structural steel" },
      { label: "Cost Variance", value: "+3.8%", status: "warn", detail: "Portland OR EPC estimate revised upward" },
      { label: "Permit Status", value: "2 pending", status: "warn", detail: "Portland OR air quality + Noble B water discharge" },
      { label: "Contractor Performance", value: "78%", status: "warn", detail: "National Concrete underperforming on Noble B" },
    ],
    agentInsights: [
      { agent: "Project AI", time: "3h ago", text: "Noble B structural steel delay likely to cascade to mechanical installation if not recovered by Week 12. Fast-tracking fabrication with alternate vendor could recover 8 of 14 lost days.", severity: "high" },
    ],
  },
  { domain: "Offtake & Mktg", score: 70, severity: "MEDIUM", color: T.warn, owner: "VP Mktg", freq: "Monthly", trend: "↓",
    subMetrics: [
      { label: "Contracted Volume", value: "78%", status: "ok", detail: "Diluent offtake well-contracted through Q3" },
      { label: "Spot Pricing", value: "$2.1/gal", status: "ok", detail: "Favorable vs. $2.0 budget assumption" },
      { label: "Carbon Credit Pipeline", value: "$1.2M", status: "ok", detail: "Q1 credits verified, pending sale" },
      { label: "Customer Concentration", value: "42%", status: "warn", detail: "Top 2 customers = 42% of revenue" },
    ],
    agentInsights: [
      { agent: "Market AI", time: "8h ago", text: "Diluent spot price trending favorably but WTI correlation suggests potential 8-12% correction in Q2. Recommend accelerating forward contracts for uncommitted volume.", severity: "low" },
    ],
  },
  { domain: "Site Security", score: 82, severity: "LOW", color: T.green, owner: "VP Security", freq: "Quarterly", trend: "↑",
    subMetrics: [
      { label: "Access Violations", value: "2", status: "ok", detail: "Both minor — unauthorized vehicle entry at Noble" },
      { label: "Camera Uptime", value: "98.5%", status: "ok", detail: "All sites above 97% threshold" },
      { label: "Incident Response Time", value: "4.2 min", status: "ok", detail: "Well within 10-minute SLA" },
      { label: "Perimeter Integrity", value: "96%", status: "ok", detail: "Tucson fence repair scheduled this week" },
    ],
    agentInsights: [
      { agent: "Security AI", time: "12h ago", text: "No significant security concerns. Recommend extending quarterly review cycle to semi-annual given consistent 80+ scores for 6 consecutive months.", severity: "low" },
    ],
  },
  { domain: "IT & Data", score: 74, severity: "MEDIUM", color: T.warn, owner: "CIO", freq: "Monthly", trend: "→",
    subMetrics: [
      { label: "System Uptime", value: "99.2%", status: "ok", detail: "Minor SCADA latency at Richmond resolved" },
      { label: "Cyber Threat Level", value: "ELEVATED", status: "warn", detail: "3 phishing attempts blocked this week" },
      { label: "Patch Compliance", value: "87%", status: "warn", detail: "13% of endpoints awaiting critical patches" },
      { label: "Data Backup Status", value: "Current", status: "ok", detail: "All sites backed up within 24h RPO" },
    ],
    agentInsights: [
      { agent: "Cyber AI", time: "5h ago", text: "Phishing campaign targeting energy sector detected by threat intel feeds. All 3 blocked attempts match this campaign signature. Recommend mandatory security awareness refresher for all staff within 7 days.", severity: "medium" },
    ],
  },
  { domain: "Regulatory", score: 75, severity: "MEDIUM", color: T.warn, owner: "VP Risk", freq: "Monthly", trend: "→",
    subMetrics: [
      { label: "Permit Compliance", value: "94%", status: "ok", detail: "Noble B water permit renewal in progress" },
      { label: "Audit Findings Open", value: "5", status: "warn", detail: "2 high-priority from last EPA inspection" },
      { label: "Reporting Timeliness", value: "100%", status: "ok", detail: "All regulatory reports filed on time" },
      { label: "Upcoming Deadlines", value: "3", status: "warn", detail: "March: EPA Noble, TCEQ Tucson, OSHA annual" },
    ],
    agentInsights: [
      { agent: "Regulatory AI", time: "1h ago", text: "EPA proposed rule change on pyrolysis emissions monitoring (Federal Register 2026-02-20) could impact Noble and Richmond permits. 60-day comment period — recommend legal review and industry coalition response.", severity: "high" },
    ],
  },
  { domain: "Supply Chain", score: 67, severity: "MEDIUM", color: T.warn, owner: "VP Sourcing", freq: "Bi-weekly", trend: "↑",
    subMetrics: [
      { label: "Feed Inventory (days)", value: "8.2", status: "warn", detail: "Below 10-day target at Baton Rouge & Columbus" },
      { label: "Supplier On-Time", value: "88%", status: "warn", detail: "Gulf Coast Rubber 3 late deliveries this month" },
      { label: "Price Variance", value: "+2.4%", status: "warn", detail: "Tire crumb cost trending above budget" },
      { label: "Alternate Sources", value: "2 active", status: "ok", detail: "Backup suppliers qualified for 3 of 5 sites" },
    ],
    agentInsights: [
      { agent: "Supply Chain AI", time: "3h ago", text: "Gulf Coast Rubber delivery reliability dropped from 95% to 82% over 6 weeks. Correlates with their reported equipment issues. Recommend activating secondary supplier for Baton Rouge to maintain 10-day buffer.", severity: "medium" },
    ],
  },
];

const riskRegisterData = [
  ["Series C Financing", "Financial", "Portfolio", "Critical", 4, 4, 16, "VP Strategy", "Investor roadshow", "2026-04-30", 85, "yellow"],
  ["Diluent Price Vol.", "Financial", "All sites", "High", 3, 4, 12, "VP Finance", "Hedging program", "2026-05-31", 60, "yellow"],
  ["Multi-site Complexity", "Execution", "4 sites", "High", 3, 4, 12, "COO", "Integration mgmt", "2026-06-30", 75, "yellow"],
  ["Baton Rouge Uptime", "Operational", "Baton Rouge", "Medium", 3, 3, 9, "VP Ops", "Equipment overhaul", "2026-07-31", 45, "yellow"],
  ["Noble B Permitting", "Regulatory", "Noble B", "Critical", 2, 5, 10, "VP Risk", "Regulatory filing", "2026-03-31", 90, "green"],
  ["EPC Cost Overrun", "Execution", "Construction", "Medium", 3, 3, 9, "VP Project", "Budget review", "2026-08-31", 50, "yellow"],
  ["Processor Delay", "Execution", "TX Vessel", "High", 2, 4, 8, "VP Eng", "Vendor management", "2026-04-30", 70, "green"],
  ["Portland OR Permit", "Regulatory", "Portland OR", "High", 2, 4, 8, "VP Risk", "Agency negotiations", "2026-05-31", 80, "green"],
  ["Carbon Price", "Market", "All", "Medium", 2, 3, 6, "VP Mktg", "Compliance strategy", "2026-09-30", 40, "green"],
  ["Feed Quality", "Operations", "Multi-supplier", "Medium", 1, 4, 4, "VP Ops", "Supplier audit", "2026-06-30", 55, "green"],
  ["Cyber Security", "IT/Data", "Corporate", "High", 2, 4, 8, "CIO", "Security upgrade", "2026-05-31", 65, "yellow"],
  ["Supply Disruption", "Supply Chain", "Vendors", "Medium", 2, 3, 6, "VP Sourcing", "Dual sourcing", "2026-07-31", 48, "yellow"],
];

/* ─── Helper Components ─── */

function SourceBadge({ source }) {
  const colorMap = { WakeCap: SRC.wakecap, GOARC: SRC.goarc, Veriforce: SRC.veriforce };
  const sources = source.split(" + ");
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {sources.map((s, i) => (
        <span key={i} style={{
          background: `${colorMap[s.trim()] || T.blue}22`,
          color: colorMap[s.trim()] || T.blue,
          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
          border: `1px solid ${colorMap[s.trim()] || T.blue}44`,
        }}>{s.trim()}</span>
      ))}
    </div>
  );
}

function RiskMetricCard({ label, value, subtext, color, pulse, target, threshold, invert }) {
  let targetIndicator = null;
  if (target != null && value != null) {
    const numVal = typeof value === "string" ? parseFloat(value.replace(/[^0-9.\-]/g, "")) : value;
    const numTarget = typeof target === "number" ? target : parseFloat(target);
    if (!isNaN(numVal) && !isNaN(numTarget)) {
      const isGood = invert ? numVal <= numTarget : numVal >= numTarget;
      const isFail = threshold != null && (invert ? numVal > threshold : numVal < threshold);
      const dotColor = isFail ? T.danger : isGood ? T.green : T.warn;
      targetIndicator = (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, boxShadow: `0 0 6px ${dotColor}40`, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: T.textDim }}>
            Target: <span style={{ color: T.textMid, fontWeight: 600 }}>{target}</span>
          </span>
          {threshold != null && (
            <span style={{ fontSize: 10, color: T.danger, marginLeft: 4 }}>
              Fail: {threshold}
            </span>
          )}
        </div>
      );
    }
  }
  return (
    <div style={{
      background: T.bg2, borderRadius: 10, padding: "16px 20px",
      borderLeft: `4px solid ${color || T.blue}`,
      position: "relative",
    }}>
      <div style={{ color: T.textDim, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
      <div style={{ color: T.text, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      {subtext && <div style={{ color: T.textMid, fontSize: 11, marginTop: 6 }}>{subtext}</div>}
      {targetIndicator}
      {pulse && <div style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: T.danger, animation: "pulse 2s infinite" }} />}
    </div>
  );
}

const chartTooltipStyle = { background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, color: T.text };

/* ─── Main Component ─── */
export const RiskView = ({ defaultTab = "overview" }) => {
  const [tab, setTab] = useState(defaultTab);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedSite, setSelectedSite] = useState("all");
  const [expandedDomain, setExpandedDomain] = useState(null);
  const [domainTab, setDomainTab] = useState({});  // per-domain active tab: "metrics" | "insights"
  const [agentComments, setAgentComments] = useState({});  // per-domain user comments
  const [layoutLocked, setLayoutLocked] = useState(true);

  /* Compute filtered data based on selectedSite */
  const filteredZoneData = useMemo(() => {
    if (selectedSite === "all") return zoneData;
    return zoneDataByIm[selectedSite] || zoneData;
  }, [selectedSite]);

  const filteredSiteRiskTrend = useMemo(() => {
    return siteRiskTrendData[selectedSite] || siteRiskTrendData.all;
  }, [selectedSite]);

  const filteredRadarData = useMemo(() => {
    return radarDataBySite[selectedSite] || radarDataBySite.all;
  }, [selectedSite]);

  const filteredComplianceData = useMemo(() => {
    return complianceDataBySite[selectedSite] || complianceDataBySite.all;
  }, [selectedSite]);

  const filteredAlertsFeed = useMemo(() => {
    return alertsFeedBySite[selectedSite] || alertsFeedBySite.all;
  }, [selectedSite]);

  const filteredContractorScorecard = useMemo(() => {
    return contractorScoreboardById[selectedSite] || contractorScoreboardById.all;
  }, [selectedSite]);

  const filteredPredictiveData = useMemo(() => {
    return predictiveDataBySite[selectedSite] || predictiveDataBySite.all;
  }, [selectedSite]);

  const filteredRiskRegisterData = useMemo(() => {
    if (selectedSite === "all") return riskRegisterData;
    return riskRegisterData.filter(r => r[2] === "All" || r[2].includes(selectedSite) || r[2] === "All sites");
  }, [selectedSite]);

  const totalWorkers = filteredZoneData.reduce((s, z) => s + z.workers, 0);
  const totalAlerts = filteredZoneData.reduce((s, z) => s + z.alerts, 0);
  const avgRisk = Math.round(filteredZoneData.reduce((s, z) => s + z.risk, 0) / filteredZoneData.length);
  const criticalZones = filteredZoneData.filter(z => z.status === "critical").length;

  /* Workforce data */
  const headcountBySite = useMemo(() => {
    const rows = activeSites.map(s => {
      const ops = Math.ceil(s.processors * 3);
      const maint = Math.ceil(s.processors * 1.5);
      const qual = 1;
      const mgmt = 2;
      return [s.short, ops, maint, qual, mgmt, ops + maint + qual + mgmt];
    });
    rows.push(["Corporate HQ", 6, 3, 2, 1, 12]);
    const total = rows.reduce((a, r) => a + r[5], 0);
    rows.push(["TOTAL", "", "", "", "", total]);
    return rows;
  }, []);

  const safetyBySite = [
    { site: "Noble OK", lti: 180, trir: 0.2, actions: 0, permits: 3, obs: 12 },
    { site: "Richmond VA", lti: 142, trir: 0.8, actions: 1, permits: 4, obs: 18 },
    { site: "Tucson AZ", lti: 95, trir: 1.2, actions: 2, permits: 4, obs: 22 },
    { site: "Baton Rouge", lti: 56, trir: 0.5, actions: 0, permits: 3, obs: 8 },
    { site: "Columbus OH", lti: 142, trir: 0.8, actions: 2, permits: 3, obs: 15 },
  ];

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "zones", label: "Site Zones" },
    { key: "contractors", label: "Contractor Intel" },
    { key: "safety", label: "Safety & Compliance" },
    { key: "register", label: "Register" },
    { key: "predictive", label: "Predictive" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

      {/* Data Source Status Badges & Site Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {[
            { label: "WakeCap LIVE", color: SRC.wakecap },
            { label: "GOARC LIVE", color: SRC.goarc },
            { label: "Veriforce LIVE", color: SRC.veriforce },
          ].map(s => (
            <span key={s.label} style={{
              background: `${s.color}22`, color: s.color, fontSize: 10, fontWeight: 600,
              padding: "3px 10px", borderRadius: 6, border: `1px solid ${s.color}44`,
            }}>{s.label}</span>
          ))}
        </div>

        {/* Site Selector */}
        <StyledSelect
          value={selectedSite}
          onChange={(v) => { setSelectedSite(v); setSelectedZone(null); }}
          options={[
            { value: "all", label: "All Sites (Global)" },
            ...activeSites.map(site => ({ value: site.short, label: site.short })),
          ]}
          style={{ marginLeft: "auto" }}
        />
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* ═══════════════════ OVERVIEW TAB ═══════════════════ */}
      {tab === "overview" && (
        <DraggableGrid
          widgets={[
            {
              id: "risk-overview-kpis",
              label: "KPI Cards",
              render: () => (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                  <RiskMetricCard label="Workers On Site" value={totalWorkers} subtext="WakeCap real-time tracking" color={SRC.wakecap} />
                  <RiskMetricCard label="Active Permits" value={17} subtext="5 hot work · 3 confined space · 9 general" color={SRC.goarc} />
                  <RiskMetricCard label="Site Risk Score" value={avgRisk} subtext={avgRisk > 50 ? "Above threshold — review needed" : "Within acceptable range"} color={avgRisk > 50 ? T.warn : T.green} target={35} threshold={55} invert />
                  <RiskMetricCard label="Active Alerts" value={totalAlerts} subtext={`${criticalZones} critical zones`} color={T.danger} pulse target={0} threshold={5} invert />
                </div>
              )
            },
            {
              id: "risk-overview-charts",
              label: "Charts",
              render: () => (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Risk Trend */}
            <div style={{ background: T.bg2, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2 }}>Correlated Risk Trend</div>
              <div style={{ fontSize: 11, color: T.textDim, marginBottom: 16 }}>12-month rolling · All sources</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={filteredSiteRiskTrend}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.blue} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={T.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="date" stroke={T.textDim} fontSize={10} />
                  <YAxis stroke={T.textDim} fontSize={10} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <ReferenceLine y={35} stroke={T.green} strokeDasharray="6 3" strokeWidth={1.5} label={{ value: "Target", position: "right", fill: T.green, fontSize: 10, fontWeight: 600 }} />
                  <ReferenceLine y={55} stroke={T.danger} strokeDasharray="6 3" strokeWidth={1.5} label={{ value: "Unacceptable", position: "right", fill: T.danger, fontSize: 10, fontWeight: 600 }} />
                  <Area type="monotone" dataKey="overall" stroke={T.blue} fill="url(#riskGrad)" strokeWidth={2} name="Overall" />
                  <Area type="monotone" dataKey="wakecap" stroke={SRC.wakecap} fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="WakeCap" />
                  <Area type="monotone" dataKey="goarc" stroke={SRC.goarc} fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="GOARC" />
                  <Area type="monotone" dataKey="veriforce" stroke={SRC.veriforce} fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="Veriforce" />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10 }}>
                {[{ l: "Overall", c: T.blue }, { l: "WakeCap", c: SRC.wakecap }, { l: "GOARC", c: SRC.goarc }, { l: "Veriforce", c: SRC.veriforce }].map(x => (
                  <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 10, height: 3, background: x.c, borderRadius: 2 }} />
                    <span style={{ fontSize: 10, color: T.textDim }}>{x.l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Radar */}
            <div style={{ background: T.bg2, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2 }}>Safety Posture Radar</div>
              <div style={{ fontSize: 11, color: T.textDim, marginBottom: 16 }}>Composite score across all integrations</div>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={filteredRadarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="metric" stroke={T.textDim} fontSize={9} />
                  <PolarRadiusAxis stroke={T.border} fontSize={9} domain={[0, 100]} />
                  <Radar name="Target" dataKey="target" stroke={T.green} fill={T.green} fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="6 3" />
                  <Radar name="Score" dataKey="value" stroke={T.blue} fill={T.blue} fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 6 }}>
                {[{ l: "Actual Score", c: T.blue }, { l: "Target", c: T.green }].map(x => (
                  <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 10, height: 3, background: x.c, borderRadius: 2 }} />
                    <span style={{ fontSize: 10, color: T.textDim }}>{x.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
              )
            },
            {
              id: "risk-overview-domains",
              label: "Risk Domains",
              render: () => (
                <Card title="Risk Domains">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
              {riskDomains.map((d, i) => {
                const isExpanded = expandedDomain === i;
                const activeTab = domainTab[i] || "metrics";
                return (
                  <div key={i} style={{
                    padding: 14, background: T.bg0,
                    border: `1px solid ${isExpanded ? d.color + "66" : T.border}`,
                    borderRadius: 8,
                    gridColumn: isExpanded ? "1 / -1" : undefined,
                    transition: "all 0.2s ease",
                  }}>
                    {/* Header — always visible */}
                    <div
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, cursor: "pointer" }}
                      onClick={() => setExpandedDomain(isExpanded ? null : i)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{d.domain}</div>
                          <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>Owner: {d.owner}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 16, fontWeight: 600, color: d.color }}>{d.score}</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: d.color, textTransform: "uppercase" }}>{d.severity}</div>
                        </div>
                        <div style={{
                          fontSize: 14, color: T.textDim,
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}>▾</div>
                      </div>
                    </div>
                    <Progress pct={d.score} color={d.color} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textDim, marginTop: 8 }}>
                      <span>Review: {d.freq}</span>
                      <span>Trend: {d.trend}</span>
                    </div>

                    {/* Expanded Drill-Down Panel */}
                    {isExpanded && (
                      <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                        {/* Sub-tabs */}
                        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: 16 }}>
                          {[
                            { key: "metrics", label: "Analysis & Metrics" },
                            { key: "insights", label: `Agent Insights (${(d.agentInsights || []).length})` },
                            { key: "comments", label: "Comments" },
                          ].map(t => (
                            <button key={t.key} onClick={(e) => { e.stopPropagation(); setDomainTab(prev => ({ ...prev, [i]: t.key })); }}
                              style={{
                                padding: "8px 16px", background: "transparent", border: "none",
                                borderBottom: `2px solid ${activeTab === t.key ? d.color : "transparent"}`,
                                color: activeTab === t.key ? T.text : T.textDim,
                                fontSize: 12, fontWeight: activeTab === t.key ? 600 : 400,
                                cursor: "pointer", fontFamily: "inherit",
                              }}
                            >{t.label}</button>
                          ))}
                        </div>

                        {/* Metrics Tab */}
                        {activeTab === "metrics" && d.subMetrics && (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                            {d.subMetrics.map((m, mi) => (
                              <div key={mi} style={{
                                background: T.bg2, borderRadius: 8, padding: 12,
                                borderLeft: `3px solid ${m.status === "danger" ? T.danger : m.status === "warn" ? T.warn : T.green}`,
                              }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                  <span style={{ fontSize: 11, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{m.label}</span>
                                  <span style={{
                                    fontSize: 14, fontWeight: 700,
                                    color: m.status === "danger" ? T.danger : m.status === "warn" ? T.warn : T.green,
                                  }}>{m.value}</span>
                                </div>
                                <div style={{ fontSize: 11, color: T.textMid, lineHeight: 1.5 }}>{m.detail}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Agent Insights Tab */}
                        {activeTab === "insights" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {(d.agentInsights || []).length === 0 ? (
                              <div style={{ padding: 20, textAlign: "center", color: T.textDim, fontSize: 12 }}>No agent insights available for this domain.</div>
                            ) : (
                              (d.agentInsights || []).map((ins, ii) => (
                                <div key={ii} style={{
                                  background: ins.severity === "high" ? `${T.danger}10` : ins.severity === "medium" ? `${T.warn}10` : `${T.blue}10`,
                                  border: `1px solid ${ins.severity === "high" ? T.danger + "33" : ins.severity === "medium" ? T.warn + "22" : T.blue + "22"}`,
                                  borderRadius: 8, padding: "12px 16px",
                                }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <span style={{
                                        background: `${ins.severity === "high" ? T.danger : ins.severity === "medium" ? T.warn : T.blue}22`,
                                        color: ins.severity === "high" ? T.danger : ins.severity === "medium" ? T.warn : T.blue,
                                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                                        border: `1px solid ${ins.severity === "high" ? T.danger : ins.severity === "medium" ? T.warn : T.blue}44`,
                                      }}>{ins.agent}</span>
                                      <span style={{
                                        fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 8,
                                        background: ins.severity === "high" ? `${T.danger}22` : ins.severity === "medium" ? `${T.warn}22` : `${T.green}22`,
                                        color: ins.severity === "high" ? T.danger : ins.severity === "medium" ? T.warn : T.green,
                                        textTransform: "uppercase",
                                      }}>{ins.severity}</span>
                                    </div>
                                    <span style={{ color: T.textDim, fontSize: 10 }}>{ins.time}</span>
                                  </div>
                                  <div style={{ color: T.text, fontSize: 12, lineHeight: 1.6 }}>{ins.text}</div>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Comments Tab */}
                        {activeTab === "comments" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4 }}>Add notes, agenda items, or discussion points for this risk domain.</div>
                            {/* Existing comments */}
                            {(agentComments[i] || []).map((c, ci) => (
                              <div key={ci} style={{
                                background: T.bg2, borderRadius: 8, padding: 12,
                                borderLeft: `3px solid ${T.accent}`,
                              }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: T.accent }}>{c.author}</span>
                                  <span style={{ fontSize: 10, color: T.textDim }}>{c.time}</span>
                                </div>
                                <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{c.text}</div>
                              </div>
                            ))}
                            {/* New comment input */}
                            <div style={{ display: "flex", gap: 8 }}>
                              <input
                                id={`comment-input-${i}`}
                                type="text"
                                placeholder="Add a comment or agenda item..."
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && e.target.value.trim()) {
                                    const newComment = { author: "You", time: "Just now", text: e.target.value.trim() };
                                    setAgentComments(prev => ({ ...prev, [i]: [...(prev[i] || []), newComment] }));
                                    e.target.value = "";
                                  }
                                }}
                                style={{
                                  flex: 1, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6,
                                  padding: "8px 12px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit",
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const input = document.getElementById(`comment-input-${i}`);
                                  if (input && input.value.trim()) {
                                    const newComment = { author: "You", time: "Just now", text: input.value.trim() };
                                    setAgentComments(prev => ({ ...prev, [i]: [...(prev[i] || []), newComment] }));
                                    input.value = "";
                                  }
                                }}
                                style={{
                                  background: T.accent, border: "none", borderRadius: 6, padding: "8px 14px",
                                  color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                                  whiteSpace: "nowrap",
                                }}
                              >Post</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
              )
            },
            {
              id: "risk-overview-alerts",
              label: "Live Alerts",
              render: () => (
                <Card title="Live Correlated Alerts">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textDim }}>Cross-platform intelligence — alerts no single tool could generate</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.danger, animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 11, color: T.textDim }}>Real-time</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredAlertsFeed.map(a => (
                <div key={a.id} style={{
                  background: a.type === "critical" ? T.dangerDim : a.type === "warning" ? T.warnDim : T.blueDim,
                  border: `1px solid ${a.type === "critical" ? T.danger + "33" : a.type === "warning" ? T.warn + "22" : T.border}`,
                  borderRadius: 8, padding: "12px 16px", display: "flex", gap: 12,
                }}>
                  <div style={{ fontSize: 14, marginTop: 1 }}>
                    {a.type === "critical" ? "\u{1F534}" : a.type === "warning" ? "\u{1F7E1}" : "\u{1F535}"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <SourceBadge source={a.source} />
                      <span style={{ color: T.textDim, fontSize: 10 }}>{a.time}</span>
                    </div>
                    <div style={{ color: T.text, fontSize: 12, lineHeight: 1.5 }}>{a.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
              )
            }
          ]}
          storageKey="sens-risk-overview-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* ═══════════════════ SITE ZONES TAB ═══════════════════ */}
      {tab === "zones" && (
        <DraggableGrid
          widgets={[
            {
              id: "risk-zones-content",
              label: "Zones",
              render: () => (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ fontSize: 11, color: T.textDim }}>WakeCap location data + GOARC permit zones + Veriforce risk scores — click a zone for details</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
            {/* Zone Heatmap */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {filteredZoneData.map((z, i) => {
                const bg = z.status === "critical" ? `${T.danger}20` : z.status === "elevated" ? `${T.warn}15` : `${T.green}10`;
                const borderColor = z.status === "critical" ? T.danger : z.status === "elevated" ? T.warn : T.green;
                const selected = selectedZone === i;
                return (
                  <div key={i} onClick={() => setSelectedZone(i)} style={{
                    background: selected ? `${borderColor}30` : bg,
                    border: `2px solid ${selected ? borderColor : borderColor + "44"}`,
                    borderRadius: 10, padding: 14, cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ color: T.text, fontSize: 12, fontWeight: 600 }}>{z.zone.split(" — ")[0]}</span>
                      {z.alerts > 0 && <span style={{ background: T.danger, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8 }}>{z.alerts}</span>}
                    </div>
                    <div style={{ color: T.textDim, fontSize: 11, marginBottom: 8 }}>{z.zone.split(" — ")[1]}</div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: SRC.wakecap, fontSize: 15, fontWeight: 700 }}>{z.workers}</div>
                        <div style={{ color: T.textDim, fontSize: 9 }}>workers</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: SRC.goarc, fontSize: 15, fontWeight: 700 }}>{z.permits}</div>
                        <div style={{ color: T.textDim, fontSize: 9 }}>permits</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: borderColor, fontSize: 15, fontWeight: 700 }}>{z.risk}</div>
                        <div style={{ color: T.textDim, fontSize: 9 }}>risk</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: T.textDim, fontSize: 9 }}>Density</span>
                        <span style={{ color: z.density > 80 ? T.danger : z.density > 60 ? T.warn : T.green, fontSize: 9, fontWeight: 600 }}>{z.density}%</span>
                      </div>
                      <div style={{ background: T.bg0, borderRadius: 4, height: 4, overflow: "hidden" }}>
                        <div style={{ width: `${z.density}%`, height: "100%", borderRadius: 4, background: z.density > 80 ? T.danger : z.density > 60 ? T.warn : T.green, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Zone Detail Panel */}
            <div style={{ background: T.bg2, borderRadius: 10, padding: 20 }}>
              {selectedZone !== null ? (() => {
                const z = filteredZoneData[selectedZone];
                const borderColor = z.status === "critical" ? T.danger : z.status === "elevated" ? T.warn : T.green;
                return (
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>{z.zone}</div>
                    <div style={{
                      display: "inline-block", background: `${borderColor}22`, color: borderColor,
                      fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 6, marginBottom: 16, textTransform: "uppercase",
                    }}>{z.status}</div>

                    <div style={{ fontSize: 11, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Data Sources</div>
                    {[
                      { label: "WakeCap — Workers Present", value: z.wakecapWorkers, color: SRC.wakecap },
                      { label: "GOARC — Active Permits", value: z.goarcPermits, color: SRC.goarc },
                      { label: "Veriforce — High-Risk Workers", value: z.veriforceHighRisk, color: SRC.veriforce },
                    ].map((item, j) => (
                      <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ color: item.color, fontSize: 12 }}>{item.label}</span>
                        <span style={{ color: T.text, fontSize: 16, fontWeight: 700 }}>{item.value}</span>
                      </div>
                    ))}

                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: T.textDim }}>Zone Density</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: z.density > 80 ? T.danger : T.text }}>{z.density}%</span>
                      </div>
                      <div style={{ background: T.bg0, borderRadius: 6, height: 8, overflow: "hidden" }}>
                        <div style={{ width: `${z.density}%`, height: "100%", borderRadius: 6, background: z.density > 80 ? `linear-gradient(90deg, ${T.warn}, ${T.danger})` : `linear-gradient(90deg, ${T.green}, ${T.warn})` }} />
                      </div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: T.textDim }}>Composite Risk</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: z.risk > 60 ? T.danger : T.text }}>{z.risk}/100</span>
                      </div>
                      <div style={{ background: T.bg0, borderRadius: 6, height: 8, overflow: "hidden" }}>
                        <div style={{ width: `${z.risk}%`, height: "100%", borderRadius: 6, background: z.risk > 60 ? `linear-gradient(90deg, ${T.warn}, ${T.danger})` : `linear-gradient(90deg, ${T.green}, ${T.warn})` }} />
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T.textDim, fontSize: 13 }}>
                  Click a zone to see correlated details
                </div>
              )}
            </div>
          </div>
                </div>
              )
            }
          ]}
          storageKey="sens-risk-zones-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* ═══════════════════ WORKFORCE TAB ═══════════════════ */}
      {tab === "workforce" && (
        <DraggableGrid
          widgets={[
            {
              id: "risk-workforce-lights",
              label: "Engine Lights",
              render: () => (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <EngineLight on label="8 Open Roles" color={T.warn} />
                  <EngineLight on color={T.warn} label="Turnover 14%" />
                  <EngineLight label="Training 93%" color={T.green} />
                  <EngineLight on color={T.warn} label="Engagement 78%" />
                  <EngineLight label="Avg Tenure 1.8 yrs" color={T.green} />
                </div>
              )
            },
            {
              id: "risk-workforce-kpis",
              label: "KPI Cards",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "kpi-employees", label: "Employees", value: "52", color: T.green },
                    { id: "kpi-contractors", label: "Contractors", value: "148", color: T.accent },
                    { id: "kpi-total", label: "Total Workforce", value: "200", color: T.blue },
                    { id: "kpi-roles", label: "Open Roles", value: "8", color: T.warn, target: 0, threshold: 10, invert: true },
                    { id: "kpi-tenure", label: "Avg Tenure", value: "1.8 yrs", color: T.green, target: 2.0, threshold: 1.0 },
                    { id: "kpi-cost", label: "Workforce Cost", value: "$8.4M", color: T.accent },
                  ]}
                  locked={layoutLocked}
                  storageKey="sens-risk-workforce-kpis"
                  renderItem={(item) => <KpiCard label={item.label} value={item.value} color={item.color} target={item.target} threshold={item.threshold} invert={item.invert} />}
                />
              )
            },
            {
              id: "risk-workforce-headcount",
              label: "Headcount by Site",
              render: () => (
                <Card title="Headcount by Site">
                  <DataTable
                    columns={["Site", "Operations", "Maintenance", "Quality", "Management", "Total"]}
                    rows={headcountBySite.map(r => [
                      r[0], r[1], r[2], r[3], r[4],
                      typeof r[5] === "number" ? r[5] : <span style={{ fontWeight: 600, color: T.accent }}>{r[5]}</span>
                    ])}
                  />
                </Card>
              )
            },
            {
              id: "risk-workforce-composition",
              label: "Workforce Composition",
              render: () => (
                <Card title="Workforce Composition">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
              {[
                { val: "52", label: "Direct Employees", color: T.green },
                { val: "148", label: "Contractors", color: T.accent },
                { val: "8", label: "Firms", color: T.blue },
                { val: "8", label: "Open Roles", color: T.warn },
              ].map((item, i) => (
                <div key={i} style={{ background: T.bg0, borderRadius: 8, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.val}</div>
                  <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>
                </Card>
              )
            },
            {
              id: "risk-workforce-turnover",
              label: "Turnover Trend",
              render: () => (
                <Card title="Turnover Trend (6 months)">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
              {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"].map((m, i) => {
                const vals = [15, 18, 12, 16, 14, 14];
                const colors = [T.green, T.warn, T.green, T.warn, T.green, T.green];
                return (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ height: 80, background: T.bg0, borderRadius: 6, marginBottom: 6, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "4px 0" }}>
                      <div style={{ width: "60%", height: `${vals[i]}px`, background: colors[i], borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 11, color: T.textDim }}>{m}</div>
                    <div style={{ fontSize: 10, color: T.textMid, marginTop: 2 }}>{vals[i]}%</div>
                  </div>
                );
              })}
            </div>
                </Card>
              )
            },
            {
              id: "risk-workforce-costs",
              label: "Workforce Cost Breakdown",
              render: () => (
                <Card title="Workforce Cost Breakdown">
            <DataTable
              columns={["Category", "Headcount", "Cost/Person", "Total Cost"]}
              rows={[
                ["Operations", "15", "$120K", "$1.8M"],
                ["Maintenance", "22", "$110K", "$2.4M"],
                ["Quality", "5", "$100K", "$0.5M"],
                ["Management", "10", "$150K", "$1.5M"],
                ["Contractors", "148", "$25K", "$3.7M"],
                ["TOTAL", "200", "\u2014", "$8.4M"],
              ]}
            />
                </Card>
              )
            }
          ]}
          storageKey="sens-risk-workforce-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* ═══════════════════ CONTRACTOR INTEL TAB ═══════════════════ */}
      {tab === "contractors" && (
        <DraggableGrid
          widgets={[
            {
              id: "risk-contractors-feed",
              label: "Contractor Cards",
              render: () => (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ fontSize: 11, color: T.textDim }}>Veriforce prequalification + WakeCap behavior analytics + GOARC permit adherence</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredContractorScorecard.map((c, i) => {
              const riskColor = c.riskScore > 60 ? T.danger : c.riskScore > 40 ? T.warn : T.green;
              return (
                <div key={i} style={{ background: T.bg2, borderRadius: 10, padding: 18, borderLeft: `4px solid ${riskColor}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{c.name}</span>
                      <span style={{ fontSize: 12, color: T.textDim, marginLeft: 12 }}>{c.workers} workers on site</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        color: c.trend === "improving" ? T.green : c.trend === "declining" ? T.danger : T.textDim,
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {c.trend === "improving" ? "\u2197 Improving" : c.trend === "declining" ? "\u2198 Declining" : "\u2192 Stable"}
                      </span>
                      <div style={{
                        background: `${riskColor}22`, color: riskColor,
                        padding: "4px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                      }}>Risk: {c.riskScore}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                    {[
                      { label: "TRIR", value: c.trir, source: "Veriforce", color: SRC.veriforce, bar: Math.min(c.trir / 4 * 100, 100), score: null, invert: true, trirVal: c.trir },
                      { label: "Cert Compliance", value: `${c.certCompliance}%`, source: "Veriforce", color: SRC.veriforce, bar: c.certCompliance, score: c.certCompliance },
                      { label: "Permit Adherence", value: `${c.permitAdherence}%`, source: "GOARC", color: SRC.goarc, bar: c.permitAdherence, score: c.permitAdherence },
                      { label: "Behavior Score", value: c.behaviorScore, source: "WakeCap", color: SRC.wakecap, bar: c.behaviorScore, score: c.behaviorScore },
                    ].map((m, j) => {
                      const scoreColor = m.invert
                        ? (m.trirVal <= 1.0 ? T.green : m.trirVal <= 2.0 ? T.warn : T.danger)
                        : (m.score >= 90 ? T.green : m.score >= 80 ? T.warn : T.danger);
                      return (
                      <div key={j}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: T.textDim }}>{m.label}</span>
                          <span style={{ fontSize: 9, color: m.color, fontWeight: 600 }}>{m.source}</span>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: scoreColor, marginBottom: 6 }}>{m.value}</div>
                        <div style={{ background: T.bg0, borderRadius: 3, height: 4, overflow: "hidden" }}>
                          <div style={{ width: `${m.bar}%`, height: "100%", borderRadius: 3, background: scoreColor }} />
                        </div>
                        <div style={{ fontSize: 9, color: T.textDim, marginTop: 3 }}>
                          {m.invert ? "Target: \u22641.0 · Fail: >2.0" : "Target: \u226590 · Fail: <80"}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
                  </div>
                </div>
              )
            }
          ]}
          storageKey="sens-risk-contractors-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* ═══════════════════ SAFETY & COMPLIANCE TAB ═══════════════════ */}
      {tab === "safety" && (
        <DraggableGrid
          widgets={[
            {
              id: "risk-safety-lights",
              label: "Engine Lights",
              render: () => (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <EngineLight label="Zero LTI 142 days" color={T.green} />
                  <EngineLight on color={T.warn} label="TRIR 0.8 target <0.5" />
                  <EngineLight label="Environmental 100%" color={T.green} />
                  <EngineLight label="Zero Waste" color={T.green} />
                  <EngineLight label="Leading Indicators up" color={T.green} />
                </div>
              )
            },
            {
              id: "risk-safety-kpis",
              label: "KPI Cards",
              render: () => (
                <DraggableCardRow
                  items={[
                    { id: "kpi-lti", label: "Days Since LTI", value: "142", color: T.green, target: 180, threshold: 30 },
                    { id: "kpi-trir", label: "TRIR", value: "0.8", color: T.warn, target: 0.5, threshold: 1.5, invert: true },
                    { id: "kpi-actions", label: "Open Actions", value: "5", color: T.accent, target: 0, threshold: 10, invert: true },
                    { id: "kpi-permits", label: "Active Permits", value: "24", color: T.blue },
                    { id: "kpi-compliance", label: "Compliance", value: "100%", color: T.green, target: 100, threshold: 90, unit: "%" },
                    { id: "kpi-obs", label: "Observations/mo", value: "100", color: T.accent, target: 80, threshold: 40 },
                  ]}
                  locked={layoutLocked}
                  storageKey="sens-risk-safety-kpis"
                  renderItem={(item) => <KpiCard label={item.label} value={item.value} color={item.color} target={item.target} threshold={item.threshold} invert={item.invert} unit={item.unit} />}
                />
              )
            },
            {
              id: "risk-safety-indicators",
              label: "Leading/Lagging Indicators",
              render: () => (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Card title="Leading Indicators">
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[
                        { label: "Safety Observations", value: 100, color: T.green },
                        { label: "Toolbox Talks", value: 24, color: T.green },
                        { label: "Training Hours", value: 48, color: T.accent },
                        { label: "Safety Audits", value: 12, color: T.green },
                      ].map((item, i) => (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: T.textMid }}>{item.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.value}</span>
                          </div>
                          <Progress pct={Math.min(100, (item.value / 100) * 100)} color={item.color} h={6} />
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card title="Lagging Indicators">
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[
                        { label: "Lost Time Injuries", value: 0, color: T.green },
                        { label: "Recordable Injuries", value: 1, color: T.accent },
                        { label: "Near Misses", value: 8, color: T.warn },
                        { label: "Safety Violations", value: 0, color: T.green },
                      ].map((item, i) => (
                        <div key={i} style={{ padding: "10px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: T.textMid }}>{item.label}</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )
            },
            {
              id: "risk-safety-bySite",
              label: "Safety Performance by Site",
              render: () => (
                <Card title="Safety Performance by Site">
                  <DataTable
                    compact
                    columns={["Site", "Days LTI", "TRIR", "Actions", "Permits", "Obs/mo"]}
                    rows={safetyBySite.map(s => [
                      s.site,
                      <span style={{ color: s.lti >= 100 ? T.green : T.warn, fontWeight: 600 }}>{s.lti}</span>,
                      <span style={{ color: s.trir < 0.5 ? T.green : s.trir < 1 ? T.warn : T.danger, fontWeight: 600 }}>{s.trir}</span>,
                      s.actions, s.permits, s.obs,
                    ])}
                  />
                </Card>
              )
            },
            {
              id: "risk-safety-compliance",
              label: "Compliance Readiness",
              render: () => (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: T.accent }}>Compliance Readiness</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                      <RiskMetricCard
                        label="Fully Compliant"
                        value={`${Math.round((complianceData.reduce((s, c) => s + c.compliant, 0) / complianceData.reduce((s, c) => s + c.compliant + c.expiring + c.lapsed, 0)) * 100)}%`}
                        subtext="Across all categories" color={T.green}
                        target={95} threshold={80}
                      />
                      <RiskMetricCard label="Expiring (30 days)" value={complianceData.reduce((s, c) => s + c.expiring, 0)} subtext="Auto-notifications sent" color={T.warn} target={0} threshold={20} invert />
                      <RiskMetricCard label="Lapsed / Non-Compliant" value={complianceData.reduce((s, c) => s + c.lapsed, 0)} subtext="Immediate action required" color={T.danger} pulse target={0} threshold={5} invert />
                    </div>

                    <div style={{ background: T.bg2, borderRadius: 10, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 14 }}>Compliance by Category</div>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={filteredComplianceData.map(d => {
                          const total = d.compliant + d.expiring + d.lapsed;
                          const pct = total > 0 ? Math.round((d.compliant / total) * 100) : 0;
                          return { ...d, compliancePct: pct, expiringPct: total > 0 ? Math.round((d.expiring / total) * 100) : 0, lapsedPct: total > 0 ? Math.round((d.lapsed / total) * 100) : 0 };
                        })} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                          <XAxis type="number" stroke={T.textDim} fontSize={10} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                          <YAxis dataKey="category" type="category" stroke={T.textDim} fontSize={11} width={90} />
                          <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => `${value}%`} />
                          <ReferenceLine x={95} stroke={T.green} strokeDasharray="6 3" strokeWidth={1.5} label={{ value: "95% Target", position: "top", fill: T.green, fontSize: 9, fontWeight: 600 }} />
                          <ReferenceLine x={80} stroke={T.danger} strokeDasharray="6 3" strokeWidth={1.5} label={{ value: "80% Minimum", position: "top", fill: T.danger, fontSize: 9, fontWeight: 600 }} />
                          <Bar dataKey="compliancePct" stackId="a" fill={T.green} name="Compliant %" />
                          <Bar dataKey="expiringPct" stackId="a" fill={T.warn} name="Expiring %" />
                          <Bar dataKey="lapsedPct" stackId="a" fill={T.danger} name="Lapsed %" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10 }}>
                        {[{ l: "Compliant", c: T.green }, { l: "Expiring (30d)", c: T.warn }, { l: "Lapsed", c: T.danger }].map(x => (
                          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 10, height: 10, background: x.c, borderRadius: 2 }} />
                            <span style={{ fontSize: 11, color: T.textDim }}>{x.l}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                </div>
              )
            },
            {
              id: "risk-safety-actions",
              label: "Open Safety Actions",
              render: () => (
                <Card title="Open Safety Actions">
                  <DataTable
                    compact
                    columns={["Action", "Site", "Due Date", "Owner", "Status"]}
                    rows={[
                      ["Guardrail installation", "Tucson AZ", "2026-03-15", "Operations", <StatusPill status="yellow" />],
                      ["Machine guarding retrofit", "Noble OK", "2026-03-31", "Maintenance", <StatusPill status="yellow" />],
                      ["Emergency eyewash station", "Baton Rouge", "2026-02-28", "Facilities", <StatusPill status="red" />],
                      ["Fall protection training", "Columbus OH", "2026-03-22", "Safety", <StatusPill status="yellow" />],
                      ["Electrical panel labeling", "Richmond VA", "2026-03-30", "Electrical", <StatusPill status="yellow" />],
                    ]}
                  />
                </Card>
              )
            }
          ]}
          storageKey="sens-risk-safety-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* ═══════════════════ REGISTER TAB ═══════════════════ */}
      {tab === "register" && (
        <DraggableGrid
          widgets={[
            {
              id: "risk-register-heatmap",
              label: "Risk Heat Map",
              render: () => (
                <Card title="Risk Heat Map (Likelihood x Impact)">
                  <div style={{ overflowX: "auto" }}>
                    <div style={{ minWidth: 500, display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", gap: 8, alignItems: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, textAlign: "center" }}>Impact &rarr;</div>
                        {["Negligible", "Minor", "Moderate", "Major", "Critical"].map((label, i) => (
                          <div key={i} style={{ fontSize: 10, fontWeight: 600, color: T.textDim, textAlign: "center" }}>{label}</div>
                        ))}
                      </div>
                      {["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"].map((likelihood, row) => (
                        <div key={row} style={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", gap: 8, alignItems: "center" }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: T.textDim, textAlign: "right" }}>{likelihood}</div>
                          {Array.from({ length: 5 }).map((_, col) => {
                            const score = (row + 1) * (col + 1);
                            let bgColor = T.green;
                            if (score >= 16) bgColor = T.danger;
                            else if (score >= 10) bgColor = T.warn;
                            else if (score >= 6) bgColor = T.blue;
                            return (
                              <div key={col} style={{
                                padding: 12, background: bgColor, borderRadius: 6,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 12, fontWeight: 600, color: "#fff", minHeight: 40,
                              }}>{score}</div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )
            },
            {
              id: "risk-register-table",
              label: "Full Risk Register",
              render: () => (
                <Card title="Full Risk Register">
                  <DataTable
                    columns={["Risk", "Category", "Scope", "Impact", "L", "I", "Score", "Owner", "Mitigation", "Due", "Progress", "Status"]}
                          rows={filteredRiskRegisterData.map(r => [
                      r[0], r[1], r[2], r[3], r[4], r[5],
                      <span style={{ color: T.warn, fontWeight: 600 }}>{r[6]}</span>,
                      r[7], r[8], r[9],
                      <Progress pct={r[10]} color={r[11] === "green" ? T.green : T.warn} />,
                      <StatusPill status={r[11]} />,
                    ])}
                  />
                </Card>
              )
            },
            {
              id: "risk-register-closed",
              label: "Recently Closed Risks",
              render: () => (
                <Card title="Recently Closed Risks">
                  <DataTable
                    columns={["Risk", "Category", "Closed Date", "Status", "Owner"]}
                    rows={[
                      ["Weather Risk Mitigation", "Operational", "2025-12-15", "Completed", "VP Ops"],
                      ["Drilling Permit - Noble A", "Regulatory", "2025-11-20", "Approved", "VP Risk"],
                      ["FX Exposure 2025", "Financial", "2025-10-31", "Hedged", "VP Finance"],
                    ]}
                  />
                </Card>
              )
            },
            {
              id: "risk-register-appetite",
              label: "Risk Appetite",
              render: () => (
                <Card title="Risk Appetite by Category">
                  <DataTable
                    columns={["Category", "Appetite Level", "Threshold"]}
                    rows={[
                      ["Financial", "Medium", "$50M exposure max"],
                      ["Operational", "Low", "99% uptime target"],
                      ["Regulatory", "Very Low", "Zero violations"],
                      ["Strategic", "Medium-High", "Portfolio expansion OK"],
                      ["Reputational", "Low", "Zero major incidents"],
                      ["Environmental", "Very Low", "Zero spills"],
                      ["Safety/HSE", "Very Low", "Zero lost-time injuries"],
                      ["Technology", "Medium", "Approved vendors only"],
                    ]}
                  />
                </Card>
              )
            }
          ]}
          storageKey="sens-risk-register-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}

      {/* ═══════════════════ PREDICTIVE TAB ═══════════════════ */}
      {tab === "predictive" && (
        <DraggableGrid
          widgets={[
            {
              id: "risk-predictive-charts",
              label: "Risk Forecast & Windows",
              render: () => (
                <div>
                  <div style={{ fontSize: 11, color: T.textDim, marginBottom: 16 }}>Veriforce predictive model + WakeCap environmental data + GOARC cumulative risk scoring</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ background: T.bg2, borderRadius: 10, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 14 }}>Risk Forecast — 12-Month Outlook</div>
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={filteredPredictiveData}>
                          <defs>
                            <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={SRC.veriforce} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={SRC.veriforce} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                          <XAxis dataKey="month" stroke={T.textDim} fontSize={10} />
                          <YAxis stroke={T.textDim} fontSize={10} />
                          <Tooltip contentStyle={chartTooltipStyle} />
                          <ReferenceLine y={40} stroke={T.green} strokeDasharray="6 3" strokeWidth={1.5} label={{ value: "Target", position: "right", fill: T.green, fontSize: 10, fontWeight: 600 }} />
                          <ReferenceLine y={65} stroke={T.danger} strokeDasharray="6 3" strokeWidth={1.5} label={{ value: "Critical", position: "right", fill: T.danger, fontSize: 10, fontWeight: 600 }} />
                          <Area type="monotone" dataKey="predicted" stroke={SRC.veriforce} fill="url(#predGrad)" strokeWidth={2} strokeDasharray="6 3" name="Predicted Risk" />
                          <Area type="monotone" dataKey="actual" stroke={T.blue} fill={`${T.blue}15`} strokeWidth={2} name="Actual Risk" />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
                        {[{ l: "Predicted", c: SRC.veriforce }, { l: "Actual", c: T.blue }].map(x => (
                          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 16, height: 2, background: x.c, borderRadius: 1 }} />
                            <span style={{ fontSize: 10, color: T.textDim }}>{x.l}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: T.bg2, borderRadius: 10, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 14 }}>High-Risk Windows — Next 24 Hours</div>
                      {[
                        { time: "1:00 PM \u2013 2:30 PM", risk: 73, reason: "Peak congestion in Zone A + hot work permit overlap + 3 high-risk contractors on shift" },
                        { time: "3:00 PM \u2013 4:00 PM", risk: 68, reason: "Shift changeover creates unmonitored gap + confined space work in Zone F" },
                        { time: "Tomorrow 7:00 AM", risk: 61, reason: "National Concrete crew (declining trend) scheduled for reactor work + expiring cert" },
                      ].map((w, i) => (
                        <div key={i} style={{
                          background: T.dangerDim, border: `1px solid ${T.danger}22`,
                          borderRadius: 8, padding: 14, marginBottom: 10,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ color: T.text, fontSize: 13, fontWeight: 700 }}>{w.time}</span>
                            <span style={{ background: `${T.danger}22`, color: T.danger, padding: "2px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                              Risk: {w.risk}
                            </span>
                          </div>
                          <div style={{ color: T.textMid, fontSize: 12, lineHeight: 1.5 }}>{w.reason}</div>
                        </div>
                      ))}

                      <div style={{ background: T.blueDim, border: `1px solid ${T.blue}22`, borderRadius: 8, padding: 14, marginTop: 16 }}>
                        <div style={{ color: T.blue, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Model Accuracy</div>
                        <div style={{ color: T.text, fontSize: 22, fontWeight: 700 }}>92.4%</div>
                        <div style={{ color: T.textDim, fontSize: 11 }}>Based on 150M+ labor hours from Veriforce + site-specific calibration from WakeCap & GOARC</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          ]}
          storageKey="sens-risk-predictive-layout"
          locked={layoutLocked}
          onLockedChange={setLayoutLocked}
        />
      )}
    </div>
  );
};
