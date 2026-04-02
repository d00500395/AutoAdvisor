# VS-1-02: Alternate Dropdown Ordering

**Epic:** Vehicle Selector Widget
**Priority:** P2 — Nice to Have
**Requirement Refs:** FR-02

## User Story

> As a **shopper**, I want to optionally start my vehicle selection by Make instead of Year, so that I can find my vehicle in a way that feels natural to me.

## Description

Provide a toggle or tab control that switches the cascading dropdown order between:
- **Default:** Year → Make → Model → Trim
- **Alternate:** Make → Year → Model → Trim

The state of the toggle persists across the session (e.g., via localStorage).

## Acceptance Criteria

- [ ] A toggle/tab control is visible near the dropdown selector
- [ ] Default order is Year → Make → Model → Trim
- [ ] Alternate order is Make → Year → Model → Trim
- [ ] Switching ordering resets all current selections
- [ ] User's ordering preference persists across the session via localStorage
- [ ] API calls adapt to the selected ordering (e.g., `GET /api/vehicles/years?make={m}`)

## Tasks

- [ ] **Task 1: Add toggle UI component**
  - Render a tab/toggle with "By Year" (default) and "By Make" options
  - Store current mode in component state

- [ ] **Task 2: Implement Make-first cascading logic**
  - Make dropdown → fetches all makes (unfiltered)
  - Year dropdown → fetches years for selected make
  - Model and Trim follow as before, scoped to year + make

- [ ] **Task 3: Add backend support for alternate ordering**
  - `GET /api/vehicles/makes` (no year filter) — return all makes
  - `GET /api/vehicles/years?make={m}` — return years for a given make

- [ ] **Task 4: Persist toggle preference**
  - Save ordering preference to `localStorage`
  - Read and apply preference on component mount
