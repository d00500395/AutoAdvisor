# VS-2-01: VIN Decode Lookup

**Epic:** VIN & License Plate Lookup
**Priority:** P1 — Should Have
**Requirement Refs:** FR-06, US-05

## User Story

> As a **shopper**, I want to enter my VIN and have my vehicle automatically identified, so I can skip the manual dropdowns and get exact fitment quickly.

## Description

Accept a 17-character VIN input. Decode the VIN via the NHTSA vPIC API (or a paid provider) to auto-populate all vehicle selector fields (Year, Make, Model, Trim, Engine). Display the decoded values in a summary card for user confirmation before applying fitment filtering.

If the VIN decode fails, fall back to manual dropdown selection with an error message.

## Acceptance Criteria

- [ ] A VIN input field is displayed as an alternative to manual dropdowns
- [ ] Input accepts exactly 17 alphanumeric characters (validated client-side)
- [ ] Invalid VIN format shows an inline validation error before submission
- [ ] On valid submission, the VIN is decoded via the backend VIN decode endpoint
- [ ] Decoded vehicle attributes auto-populate the selector fields
- [ ] A summary card displays the decoded vehicle for user confirmation
- [ ] User must explicitly confirm before fitment filtering is applied
- [ ] VIN decode failure displays an error and falls back to manual entry
- [ ] Partial VIN decode (some fields missing) populates what it can and lets the user complete the rest

## Tasks

- [ ] **Task 1: Create VIN input field component**
  - Text input with 17-character max length
  - Client-side format validation: 17 chars, alphanumeric, exclude I/O/Q per VIN standard
  - "Decode" submit button

- [ ] **Task 2: Build backend VIN decode endpoint**
  - `GET /api/vehicles/vin/:vin`
  - Call the NHTSA vPIC API (`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/:vin?format=json`)
  - Parse and map response to internal vehicle schema (year, make, model, trim, engine)
  - Return structured vehicle object or error

- [ ] **Task 3: Handle decode response on the frontend**
  - On success: auto-populate all dropdown fields with decoded values
  - Display vehicle summary card with "Confirm Vehicle" CTA
  - On failure: show error message ("Unable to decode VIN. Please enter your vehicle manually.")

- [ ] **Task 4: Implement partial decode handling**
  - If some fields decode successfully but others don't, populate the available fields
  - Enable manual dropdowns for the missing fields (pre-scoped by decoded values)
  - Show a note: "Some details couldn't be decoded. Please complete the remaining fields."

- [ ] **Task 5: Add VIN input helper text / UX**
  - Show placeholder text: "Enter your 17-digit VIN"
  - Add a "Where is my VIN?" tooltip/link explaining common VIN locations
  - Position the VIN input as a tab or section alongside the manual dropdowns
