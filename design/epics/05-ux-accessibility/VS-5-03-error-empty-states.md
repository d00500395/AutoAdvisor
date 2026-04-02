# VS-5-03: Error & Empty States

**Epic:** UX & Accessibility
**Priority:** P0 — Must Have
**Requirement Refs:** §7.3

## User Story

> As a **shopper**, I want to see clear messages when something goes wrong (API error, no results, partial data), so I know what happened and what I can do next.

## Description

The vehicle selector and fitment system must handle all error and edge-case states gracefully, with clear user messaging and functional fallbacks.

## Acceptance Criteria

- [ ] When no parts are found for a vehicle, display: "No parts found for this vehicle. Try a different configuration."
- [ ] When VIN decode fails, fall back to manual entry with an error message
- [ ] When trim data is unavailable, allow proceeding with Year/Make/Model only, showing a note that results may be broader
- [ ] When an API call times out, show a graceful error and allow manual entry fallback
- [ ] When the fitment API is unavailable, degrade gracefully (show all parts unfiltered) with a notice
- [ ] All error messages are distinct and actionable (not generic "Something went wrong")

## Tasks

- [ ] **Task 1: Implement "No results" state for catalog filtering**
  - When fitment filter returns 0 products, show an empty state message
  - Include a suggestion to try a different trim or clear the vehicle
  - Display a CTA to "Change Vehicle" or "Clear Vehicle"

- [ ] **Task 2: Implement VIN decode error handling**
  - On VIN decode failure, display error: "Unable to decode VIN. Please enter your vehicle manually."
  - Automatically switch to the manual dropdown tab/view
  - Log the error for monitoring

- [ ] **Task 3: Implement partial selection handling (no trim)**
  - When the trim endpoint returns an empty list, hide the trim dropdown
  - Allow the user to proceed with Year/Make/Model only
  - Show a note: "Results may be broader since no trim was specified."

- [ ] **Task 4: Implement API timeout / network error handling**
  - Wrap all selector API calls with timeout handling (configurable, e.g., 5s)
  - On timeout, show: "Vehicle data is temporarily unavailable. Please try again or enter manually."
  - Provide a retry button

- [ ] **Task 5: Implement fitment API degradation**
  - If the fitment API is unreachable, disable fitment filtering globally
  - Show a banner: "Fitment filtering is temporarily unavailable. Showing all products."
  - Continue to function normally otherwise
