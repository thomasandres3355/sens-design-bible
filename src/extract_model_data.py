#!/usr/bin/env python3
"""Extract data from SENS Excel models and generate modelData.js for the React dashboard."""

import pandas as pd
import json
import math
import numpy as np

BASE = "/sessions/vigilant-wizardly-thompson/mnt/Claude Testing/sens-master-project/src"
F1 = f"{BASE}/SENS OKLAHOMA 2025 ECONOMIC MODEL RNG V7.xlsx"
F2 = f"{BASE}/SENS 1 PROCESSOR.xlsx"

def clean(v):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return round(float(v), 2)
    if isinstance(v, str):
        return v.strip() if v.strip() else None
    return v

def extract_economics(f1):
    df = pd.read_excel(f1, sheet_name='Economics', header=None)
    years = []
    for c in range(3, df.shape[1]):
        yr = clean(df.iloc[4, c])
        if yr is not None:
            try:
                years.append(int(yr))
            except (ValueError, TypeError):
                break

    rows_map = {
        6: 'revenue', 7: 'costs', 8: 'jobProfit', 9: 'businessOverhead',
        10: 'ebitda', 14: 'afterTaxPL', 16: 'capitalCosts', 17: 'depreciation',
        18: 'changeWorkingCapital', 20: 'freeCashFlow', 22: 'discountRate',
        23: 'discountedCashFlow', 26: 'fixedAssets', 35: 'nopat', 36: 'roic'
    }

    annual = []
    for i, yr in enumerate(years):
        col = i + 3
        entry = {'year': yr}
        for row_idx, key in rows_map.items():
            entry[key] = clean(df.iloc[row_idx, col])
        annual.append(entry)

    npv = clean(df.iloc[28, 7])
    irr = clean(df.iloc[29, 7])
    investor_irr = clean(df.iloc[33, 7])

    prod_rows = {48: 'tiresProcessed', 49: 'solventGal', 50: 'carbonBlackLbs', 51: 'gasProductionMCF'}
    production = []
    for i, yr in enumerate(years):
        col = i + 3
        entry = {'year': yr}
        for row_idx, key in prod_rows.items():
            entry[key] = clean(df.iloc[row_idx, col])
        production.append(entry)

    sales_rows = {54: 'solventSales', 55: 'carbonBlackSales', 56: 'gasSales'}
    sales = []
    for i, yr in enumerate(years):
        col = i + 3
        entry = {'year': yr}
        for row_idx, key in sales_rows.items():
            entry[key] = clean(df.iloc[row_idx, col])
        sales.append(entry)

    return {
        'annual': annual, 'production': production, 'commoditySales': sales,
        'projectNPV': npv, 'projectIRR': irr, 'investorIRR': investor_irr,
        'investorEquity': clean(df.iloc[31, 3]),
        'multipleOnEarnings': clean(df.iloc[24, 2])
    }

def extract_monthly_cashflow(f1):
    df = pd.read_excel(f1, sheet_name='MthCashSum', header=None)
    months = []
    row_map = {8: 'revenue', 9: 'loan', 10: 'costs', 11: 'overhead',
               12: 'investmentCapital', 13: 'loanPayment', 14: 'depreciation',
               17: 'cashFlow', 18: 'cumulativeCashFlow'}

    for c in range(4, df.shape[1]):
        yr = clean(df.iloc[5, c])
        mo = clean(df.iloc[6, c])
        if yr is None or mo is None:
            continue
        entry = {'year': int(yr), 'month': str(mo), 'period': clean(df.iloc[4, c])}
        for row_idx, key in row_map.items():
            entry[key] = clean(df.iloc[row_idx, c])
        months.append(entry)

    return months

def extract_assumptions(f1):
    df = pd.read_excel(f1, sheet_name='Assumptions', header=None)
    assumptions = {
        'workingCapitalPct': clean(df.iloc[5, 3]),
        'taxRate': clean(df.iloc[6, 3]),
        'discountRate': clean(df.iloc[7, 3]),
        'depreciationPeriod': clean(df.iloc[8, 3]),
        'feedstockCost': clean(df.iloc[12, 3]),
        'solventPrice': clean(df.iloc[15, 3]),
        'carbonBlackPrice': clean(df.iloc[16, 3]),
        'gasPrice': clean(df.iloc[17, 3]),
        'steelPrice': clean(df.iloc[18, 3]),
        'capexSeriesA': clean(df.iloc[22, 3]),
        'seriesAEquity': clean(df.iloc[24, 3]),
        'capexSeriesB': clean(df.iloc[27, 3]),
        'seriesBEquity': clean(df.iloc[29, 3]),
        'machineOpsStart': clean(df.iloc[32, 3]),
        'operatingHours': clean(df.iloc[33, 3]),
        'operatingAvailability': clean(df.iloc[34, 3]),
        'tirecrumbFeedPerHour': clean(df.iloc[45, 3]),
        'tirecrumbFeedPerDay': clean(df.iloc[46, 3]),
        'solventRatio': clean(df.iloc[52, 3]),
        'carbonBlackRatio': clean(df.iloc[53, 3]),
        'gasRatio': clean(df.iloc[54, 3]),
        'contingency': clean(df.iloc[42, 3])
    }

    management = []
    for r in range(58, 66):
        role = clean(df.iloc[r, 1])
        base = clean(df.iloc[r, 3])
        annual = clean(df.iloc[r, 5])
        monthly = clean(df.iloc[r, 6])
        if role:
            management.append({'role': role, 'baseSalary': base, 'annualCost': annual, 'monthlyCost': monthly})

    machine_schedule = []
    for r in range(80, 88):
        machine_num = clean(df.iloc[r, 0])
        capex_start = clean(df.iloc[r, 1])
        if machine_num is not None and capex_start is not None:
            machine_schedule.append({'machine': int(machine_num), 'capexStartMonth': int(capex_start)})

    assumptions['management'] = management
    assumptions['machineSchedule'] = machine_schedule
    return assumptions

def extract_construction_budget(f1):
    df = pd.read_excel(f1, sheet_name='Site Construction Budget', header=None)
    divisions = []
    for r in range(16, 36):
        div_name = clean(df.iloc[r, 0])
        description = clean(df.iloc[r, 1])
        budget = clean(df.iloc[r, 2])
        if budget is None:
            continue
        monthly = []
        for c in range(4, min(df.shape[1], 26)):
            val = clean(df.iloc[r, c])
            if val is not None:
                monthly.append(val)
            else:
                monthly.append(0)
        divisions.append({'division': div_name or '', 'description': description or '', 'budget': budget, 'monthlySpend': monthly})

    total = clean(df.iloc[39, 2])
    return {'divisions': divisions, 'totalBudget': total}

def extract_machine_build(f1):
    df = pd.read_excel(f1, sheet_name='1 Machine Build', header=None)
    categories = []
    cat_rows = {
        11: {'name': 'Equipment & Materials', 'detailStart': 20, 'detailEnd': 57},
        12: {'name': 'Facilities & Aux Support', 'detailStart': 60, 'detailEnd': 80},
        13: {'name': 'Operating Costs', 'detailStart': 83, 'detailEnd': 111},
        14: {'name': 'Professional Services', 'detailStart': 114, 'detailEnd': 125},
        15: {'name': 'Workforce', 'detailStart': 128, 'detailEnd': 157}
    }

    for row_idx, info in cat_rows.items():
        total = clean(df.iloc[row_idx, 2])
        monthly = []
        for c in range(5, min(df.shape[1], 17)):
            val = clean(df.iloc[row_idx, c])
            monthly.append(val if val is not None else 0)
        categories.append({'name': info['name'], 'total': total, 'monthlySpend': monthly})

    grand_total = clean(df.iloc[17, 2])

    equipment_items = []
    for r in range(22, 56):
        item = clean(df.iloc[r, 1])
        cost = clean(df.iloc[r, 2])
        if item and cost:
            equipment_items.append({'item': item, 'cost': cost})

    return {'categories': categories, 'grandTotal': grand_total, 'equipmentItems': equipment_items}

def extract_processor_schedule(f2):
    df = pd.read_excel(f2, sheet_name='Processor Cost - Schedule', header=None)
    categories = []
    cat_rows = [2, 3, 4, 5, 6]
    for r in cat_rows:
        name = clean(df.iloc[r, 2])
        total = clean(df.iloc[r, 3])
        monthly = []
        for c in range(5, min(df.shape[1], 17)):
            val = clean(df.iloc[r, c])
            monthly.append(val if val is not None else 0)
        if name and total:
            categories.append({'name': name, 'total': total, 'monthlySpend': monthly})

    grand_total = clean(df.iloc[8, 3])
    return {'categories': categories, 'grandTotal': grand_total}

def extract_opcost(f1):
    df = pd.read_excel(f1, sheet_name='OpCost', header=None)
    items = []
    current_category = ''
    for r in range(11, 43):
        cat = clean(df.iloc[r, 0])
        if cat:
            current_category = cat
        item_name = clean(df.iloc[r, 1])
        actual = clean(df.iloc[r, 2])
        model = clean(df.iloc[r, 3])
        per_ton = clean(df.iloc[r, 4])
        if item_name and model is not None:
            items.append({
                'category': current_category, 'item': item_name,
                'actual': actual, 'model': model, 'perFeedTon': per_ton
            })
    return items

def extract_market_pricing(f1):
    df = pd.read_excel(f1, sheet_name='Market Pricing of Products', header=None)

    carbon_black = []
    for r in range(8, 31):
        period = clean(df.iloc[r, 0])
        if period:
            carbon_black.append({
                'period': period,
                'chinaPerLb': clean(df.iloc[r, 4]),
                'indiaPerLb': clean(df.iloc[r, 5]),
                'usPerLb': clean(df.iloc[r, 6]),
                'sensPrice': clean(df.iloc[r, 7])
            })

    cb_stats = {
        'current': clean(df.iloc[34, 6]),
        'high': clean(df.iloc[35, 6]),
        'low': clean(df.iloc[36, 6]),
        'average': clean(df.iloc[37, 6])
    }

    diluent = []
    for r in range(43, 63):
        period = clean(df.iloc[r, 0])
        if period:
            diluent.append({
                'period': period,
                'mixedXylene': clean(df.iloc[r, 1]),
                'aromatic150': clean(df.iloc[r, 2]),
                'aromatic200': clean(df.iloc[r, 3]),
                'sensPrice': clean(df.iloc[r, 4]),
                'terpeneLow': clean(df.iloc[r, 5]),
                'terpeneRange': clean(df.iloc[r, 6]),
                'terpeneHigh': clean(df.iloc[r, 7])
            })

    return {'carbonBlack': carbon_black, 'carbonBlackStats': cb_stats, 'diluent': diluent}

def extract_wacc(f1):
    df = pd.read_excel(f1, sheet_name='WACC', header=None)
    return {
        'riskFreeRate': clean(df.iloc[6, 2]),
        'beta': clean(df.iloc[7, 2]),
        'equityRiskPremium': clean(df.iloc[8, 2]),
        'debtRate': clean(df.iloc[11, 2]),
        'equityPercent': clean(df.iloc[14, 2]),
        'debtPercent': clean(df.iloc[15, 2]),
        'taxRate': clean(df.iloc[17, 2]),
        'costOfEquity': clean(df.iloc[21, 2]),
        'wacc': clean(df.iloc[22, 2])
    }

# Extract all data
print("Extracting economics...")
economics = extract_economics(F1)
print("Extracting monthly cash flow...")
monthly_cf = extract_monthly_cashflow(F1)
print("Extracting assumptions...")
assumptions = extract_assumptions(F1)
print("Extracting construction budget...")
construction = extract_construction_budget(F1)
print("Extracting machine build...")
machine_build = extract_machine_build(F1)
print("Extracting processor schedule...")
processor = extract_processor_schedule(F2)
print("Extracting operating costs...")
opcost = extract_opcost(F1)
print("Extracting market pricing...")
market = extract_market_pricing(F1)
print("Extracting WACC...")
wacc = extract_wacc(F1)

model_data = {
    'economics': economics,
    'monthlyCashFlow': monthly_cf,
    'assumptions': assumptions,
    'constructionBudget': construction,
    'machineBuild': machine_build,
    'processorSchedule': processor,
    'opCost': opcost,
    'marketPricing': market,
    'wacc': wacc
}

js_content = f"// Auto-generated from SENS Excel models\n// Generated by extract_model_data.py\n\nexport const modelData = {json.dumps(model_data, indent=2)};\n"

output_path = f"{BASE}/data/modelData.js"
with open(output_path, 'w') as f:
    f.write(js_content)

print(f"\nGenerated {output_path}")
print(f"Total size: {len(js_content)} bytes")
print(f"Economics: {len(economics['annual'])} years")
print(f"Monthly CF: {len(monthly_cf)} months")
print(f"Construction: {len(construction['divisions'])} divisions, total ${construction['totalBudget']:,.0f}")
print(f"Machine Build: {len(machine_build['categories'])} categories, total ${machine_build['grandTotal']:,.0f}")
print(f"OpCost: {len(opcost)} items")
print(f"Market: {len(market['carbonBlack'])} CB periods, {len(market['diluent'])} diluent periods")
