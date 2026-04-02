# VS-1-05: Change Vehicle Control

**Epic:** Vehicle Selector Widget
**Priority:** P0 — Must Have
**Requirement Refs:** FR-05

## User Story

> As a **shopper**, I want to see my confirmed vehicle in the site header and quickly change or clear it, so I always know which vehicle I'm shopping for and can switch easily.

## Description

Once a vehicle is confirmed, a persistent element in the global site header displays the selected vehicle (e.g., "Shopping for: 2019 Ford Mustang GT") with a one-click option to change or clear the selection. This element is visible on all pages.

## Acceptance Criteria

- [ ] After vehicle confirmation, the global header displays the selected vehicle
- [ ] The header element shows a condensed vehicle string (e.g., "2019 Ford Mustang GT")
- [ ] A "Change" button or link opens the vehicle selector (modal, drawer, or inline expand)
- [ ] A "Clear" / "×" button removes the confirmed vehicle and clears fitment filtering
- [ ] The header element persists across all page navigations
- [ ] When no vehicle is selected, the header shows a "Select Your Vehicle" prompt
- [ ] Confirmed vehicle state persists across the session (sessionStorage or cookie)

## Tasks

- [ ] **Task 1: Create persistent header vehicle display component**
  - Display vehicle string in a compact bar/badge in the global header
  - Show "Select Your Vehicle" when no vehicle is confirmed
  - Read vehicle state from the session/store on mount

- [ ] **Task 2: Implement "Change Vehicle" action**
  - Clicking "Change" opens the vehicle selector (modal or expanding panel)
  - Pre-populate dropdowns with the currently confirmed vehicle values
  - On re-confirmation, update the header display

- [ ] **Task 3: Implement "Clear Vehicle" action**
  - Clicking "×" or "Clear" removes the confirmed vehicle from state/session
  - Reset all fitment filtering across the site
  - Return header to "Select Your Vehicle" state

- [ ] **Task 4: Persist confirmed vehicle in session**
  - On confirmation, save vehicle data to `sessionStorage` (or cookie for guest users)
  - On app load, check for persisted vehicle and restore to state
  - Clear storage on explicit "Clear" action

- [ ] **Task 5: Integrate header component into global layout**
  - Add the vehicle display component to the app-level layout/shell
  - Ensure it renders on all routes/views
