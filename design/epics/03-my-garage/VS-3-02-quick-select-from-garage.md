# VS-3-02: Quick-Select from Garage

**Epic:** My Garage
**Priority:** P0 — Must Have
**Requirement Refs:** FR-09, US-03

## User Story

> As a **shopper with multiple vehicles**, I want to quickly switch between my saved vehicles so I can shop for any car I own without re-entering details.

## Description

On returning visits, the vehicle selector displays saved vehicles as one-click options before showing the manual entry form. Clicking a saved vehicle skips the dropdown flow and immediately enters the confirmation step.

## Acceptance Criteria

- [ ] Saved vehicles appear as selectable cards/buttons at the top of the vehicle selector
- [ ] Clicking a saved vehicle populates all fields and shows the confirmation summary
- [ ] Manual entry dropdowns are still accessible below the saved vehicles
- [ ] Switching between saved vehicles updates the selection immediately
- [ ] If no saved vehicles exist, the selector shows only the manual entry dropdowns
- [ ] Quick-select works for both authenticated users and guest users (1 saved vehicle)

## Tasks

- [ ] **Task 1: Fetch saved vehicles on selector mount**
  - On component mount, call `GET /api/garage` (or read from localStorage for guests)
  - Store saved vehicles in local state

- [ ] **Task 2: Render saved vehicle quick-select cards**
  - Display saved vehicles as clickable cards/pills above the dropdown form
  - Show vehicle string + nickname (if set)
  - Highlight the currently active vehicle

- [ ] **Task 3: Implement one-click selection logic**
  - On card click, populate all vehicle state from the saved vehicle data
  - Skip to the confirmation summary card immediately
  - Emit confirmation event to apply fitment filtering

- [ ] **Task 4: Handle "Use Different Vehicle" flow**
  - Provide a "Use a different vehicle" link below saved vehicles
  - Clicking it reveals the manual dropdown entry form
  - Allow returning to the saved vehicle cards
