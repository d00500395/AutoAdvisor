# VS-1-06: Optional Refinement Selectors

**Epic:** Vehicle Selector Widget
**Priority:** P1 — Should Have
**Requirement Refs:** ACES §5.2

## User Story

> As a **power user**, I want to refine my selection by engine type, body style, drive type, or transmission, so I get exact fitment for my specific vehicle configuration.

## Description

After the primary selection (Year/Make/Model/Trim), conditionally display additional refinement dropdowns when the selected vehicle has multiple configurations that affect fitment. These secondary selectors (Engine Type, Body Style, Drive Type, Transmission) are shown only when disambiguation is needed.

## Acceptance Criteria

- [ ] Engine Type dropdown appears when multiple engine configs exist for the selected Y/M/M/T
- [ ] Body Style dropdown appears when body style affects part fitment for the selected vehicle
- [ ] Drive Type dropdown appears when drivetrain-specific options exist (2WD vs. 4WD)
- [ ] Transmission dropdown appears when transmission-dependent options exist
- [ ] Refinement dropdowns are hidden when only one option exists (auto-selected silently)
- [ ] Refinement fields are optional — the user can proceed without selecting them
- [ ] Selected refinements are included in the vehicle summary card and header display

## Tasks

- [ ] **Task 1: Build backend engine options endpoint**
  - `GET /api/vehicles/engines?year=&make=&model=&trim=`
  - Return available engine configurations for the selected vehicle
  - Include engine descriptor string (e.g., "2.5L 4-Cylinder", "5.0L V8")

- [ ] **Task 2: Build backend endpoints for body style, drive type, transmission**
  - `GET /api/vehicles/body-styles?year=&make=&model=&trim=`
  - `GET /api/vehicles/drive-types?year=&make=&model=&trim=`
  - `GET /api/vehicles/transmissions?year=&make=&model=&trim=`

- [ ] **Task 3: Implement conditional rendering logic**
  - After Trim is selected, fetch all refinement options in parallel
  - Only show a refinement dropdown if more than 1 option is returned
  - If exactly 1 option exists, silently auto-select it (no UI shown)

- [ ] **Task 4: Create refinement dropdown components**
  - Render Engine, Body Style, Drive Type, Transmission dropdowns as needed
  - Follow same styling and behavior as primary dropdowns

- [ ] **Task 5: Update vehicle summary with refinement data**
  - Include selected refinements in the confirmation summary card
  - Include refinements in the persistent header vehicle display
  - Pass refinement data through to fitment filtering
