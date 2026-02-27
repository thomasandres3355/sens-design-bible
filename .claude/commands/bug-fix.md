---
name: bug-fix
description: Investigate a bug in the SENS Master dashboard, perform root cause analysis, create a fix plan, and output a polished copy-friendly prompt for Claude.ai
argument-hint: <bug description - what is broken, where, and how to reproduce>
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(ls *), Bash(mkdir *), Bash(wc *), Bash(git log *), Bash(git diff *), Bash(git status), Bash(npx vite build *), Bash(npm run build *)
disable-model-invocation: true
---

# Bug Fix Investigation & Prompt Generator

You are a senior software engineer investigating a bug in **SENS Master v4.0** — a React/Vite executive intelligence dashboard.

## Bug Report

**Description:** $ARGUMENTS

## Process

Follow these steps in order. Be thorough. Do not skip steps.

### Step 1: Setup Tracking

Create the directory `tasks/bug-reports/` if it does not exist:
```
mkdir -p tasks/bug-reports
```

### Step 2: Investigate the Codebase

Investigate the bug systematically:

1. **Identify the affected area** from the bug description. The project structure:
   - `src/views/` — Page-level view components (DashboardView, OperationsView, FinanceView, etc.)
   - `src/components/ui/` — Shared UI components (charts, indicators, layout, modals, etc.)
   - `src/contexts/` — React contexts (Auth, Badge, Permission, SimDate, Theme, AgentConfig)
   - `src/data/` — Data stores and business logic (sites, alerts, VP data, risk, pulse, model, etc.)
   - `src/services/` — External services (claudeService, factCheckService, usageTracker)
   - `data-tables/` — CSV reference data (sites, economics, alerts, meetings, etc.)
   - `tests/` — Playwright E2E tests

2. **Read the relevant source files.** Use Read, Grep, and Glob to find the code paths involved. Trace data flow from data stores through contexts to components.

3. **Check for related patterns.** Look at `SENS-QA-Report.md` for previously found issues of similar nature (legacy IDs, hardcoded values, data mismatches).

4. **Identify the root cause.** Determine the exact root cause — specific file(s), line number(s), and the logic error. Do not speculate; confirm by reading the actual code.

5. **Assess blast radius.** What other parts of the application are affected? Check downstream consumers of any data or component you plan to change.

### Step 3: Design the Fix

Design the fix following these principles:
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what is necessary.
- **Demand Elegance**: For non-trivial changes, pause and ask "is there a more elegant way?"

For each file that needs modification, specify:
- The exact file path
- What needs to change and why
- The before/after logic (clear enough to implement)

### Step 4: Define Verification Plan

Specify how to verify the fix:
- What to check visually in the browser
- What to validate in the code (data consistency, import chains)
- Whether `npx vite build` should still succeed
- Edge cases to test

### Step 5: Save the Bug Report

Save a structured report to `tasks/bug-reports/` with filename: `BUG-YYYY-MM-DD-<short-slug>.md`

Use this format:

```
# Bug Report: <title>

**Date:** <today>
**Status:** Fix Proposed
**Severity:** <Critical | High | Medium | Low>
**Reporter:** User via /bug-fix command

## Description
<original bug description>

## Root Cause
<what is actually wrong and why>

## Affected Files
- `path/to/file.ext` — <what is wrong in this file>

## Proposed Fix
<step-by-step fix instructions>

## Verification Plan
<how to confirm the fix works>

## Blast Radius
<what else could be affected by this change>
```

### Step 6: Output the Copy-Friendly Prompt

This is the critical output step. Present the complete fix prompt **inside a single fenced code block** (triple backticks) so the user can select it and copy it directly into Claude.ai.

The prompt inside the code block must be **self-contained** — it should make sense to someone reading it in Claude.ai with no prior context. Follow this structure exactly:

```
# Bug Fix Request: <concise title>

## Context
Project: SENS Master v4.0 — React/Vite executive intelligence dashboard
Location: /Users/thomasandres/Claude Testing/sens-master-project
Key tech: React 18, Vite 6, Recharts, Playwright for testing

## Bug Summary
<2-3 sentence description of the bug and its user-visible impact>

## Root Cause Analysis
<precise technical explanation referencing specific files and line numbers>

## Files to Modify
<numbered list of files with what needs to change in each>

## Proposed Fix Steps
<numbered implementation steps, specific enough to execute without ambiguity>

## Verification Plan
<numbered checklist to confirm the fix is correct>

## Constraints
- Follow existing code patterns and conventions (inline styles, functional components, DM Sans font)
- Do not introduce new dependencies
- Ensure `npx vite build` succeeds after changes
- Test that no other views or data consumers are broken
- Keep changes minimal — touch only what is necessary
```

### Step 7: Present Summary

After the code block, provide a brief summary:
- One sentence: what the bug is
- One sentence: the root cause
- List of files that need changes
- Severity assessment
- Note that the full report has been saved to `tasks/bug-reports/`

Tell the user: **"Copy the prompt above and paste it into Claude.ai to execute the fix."**

## Important Reminders

- **Be specific**: Include file paths, line numbers, and exact variable/function names
- **Be honest**: If you cannot determine the root cause with certainty, say so and explain what additional investigation is needed
- **Be minimal**: The fix should touch the fewest files possible
- **Think about data flow**: This app uses data stores -> contexts -> views. Bugs often live in the data layer but manifest in the view layer
- **Check the QA report**: `SENS-QA-Report.md` documents previously found issues — the new bug may follow a similar pattern
