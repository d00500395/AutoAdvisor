# VS-1-01: Cascading Dropdown Selection

**Epic:** Vehicle Selector Widget
**Priority:** P0 — Must Have
**Requirement Refs:** FR-01, ACES §5.1
**User Story (US-01):**

> As a **shopper**, I want to select my vehicle by Year, Make, Model, and Sub-model/Trim so that I only see parts that fit my car.

## Description

Implement a cascading dropdown selector where each dropdown is dependent on the prior selection. Options are dynamically populated from VCdb data via API calls. Dropdowns follow the sequence: **Year → Make → Model → Trim**.

Each subsequent dropdown is disabled/empty until its parent has a value. Changing a parent selection resets all child dropdowns.

## Acceptance Criteria

- [ ] Year dropdown displays all available years from VCdb data (default range: 1980–present)
- [ ] Selecting a Year populates the Make dropdown with only makes available for that year
- [ ] Selecting a Make populates the Model dropdown with only models for that year + make
- [ ] Selecting a Model populates the Trim dropdown with only trims for that year + make + model
- [ ] Each dropdown is disabled until its parent has a valid selection
- [ ] Changing a parent selection clears and resets all child dropdowns
- [ ] A loading indicator is shown while dropdown options are being fetched
- [ ] Dropdown options load in < 300ms (per NFR)

## Tasks

- [ ] **Task 1: Create Year dropdown component**
  - Fetch available years from `GET /api/vehicles/years`
  - Render as a `<select>` element with a placeholder option ("Select Year")
  - Sort years in descending order (newest first)

- [ ] **Task 2: Create Make dropdown component**
  - Disabled by default; enabled when Year is selected
  - Fetch makes from `GET /api/vehicles/makes?year={y}`
  - Sort alphabetically

- [ ] **Task 3: Create Model dropdown component**
  - Disabled by default; enabled when Make is selected
  - Fetch models from `GET /api/vehicles/models?year={y}&make={m}`
  - Sort alphabetically

- [ ] **Task 4: Create Trim dropdown component**
  - Disabled by default; enabled when Model is selected
  - Fetch trims from `GET /api/vehicles/trims?year={y}&make={m}&model={mo}`
  - Sort alphabetically; allow proceeding without trim if none are available

- [ ] **Task 5: Implement cascading reset logic**
  - When Year changes → clear Make, Model, Trim
  - When Make changes → clear Model, Trim
  - When Model changes → clear Trim
  - Reset child dropdown data and disable child selectors

- [ ] **Task 6: Add loading states**
  - Show a spinner or "Loading..." text inside each dropdown while its API call is in-flight
  - Disable the dropdown during loading

- [ ] **Task 7: Build backend API endpoints for cascading data**
  - `GET /api/vehicles/years` — return distinct years
  - `GET /api/vehicles/makes?year=` — return makes for year
  - `GET /api/vehicles/models?year=&make=` — return models for year+make
  - `GET /api/vehicles/trims?year=&make=&model=` — return trims

- [ ] **Task 8: Seed VCdb data into database**
  - Import or seed a subset of VCdb vehicle configurations into MongoDB
  - Create indexes on year, make, model, trim fields for fast lookups
