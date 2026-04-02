# VS-1-04: Vehicle Confirmation Step

**Epic:** Vehicle Selector Widget
**Priority:** P0 — Must Have
**Requirement Refs:** FR-04

## User Story

> As a **shopper**, I want to see a summary of my vehicle selection and confirm it before filtering is applied, so I can verify correctness and avoid seeing wrong parts.

## Description

After the user completes the Year/Make/Model/Trim selection, display a summary card showing the full vehicle description (e.g., "2019 Ford Mustang GT 5.0L V8") with a "Confirm Vehicle" call-to-action. Fitment filtering is NOT applied until the user explicitly confirms.

## Acceptance Criteria

- [ ] A summary card appears after all required fields (Year, Make, Model) are selected
- [ ] Summary card displays the full vehicle string: "{Year} {Make} {Model} {Trim} {Engine}" (engine if selected)
- [ ] A "Confirm Vehicle" button is prominently displayed
- [ ] Fitment filtering is only applied after clicking "Confirm Vehicle"
- [ ] User can edit selections before confirming (dropdowns remain editable)
- [ ] Summary card includes an "Edit" or "Clear" option to restart selection
- [ ] Confirmation event is announced to screen readers

## Tasks

- [ ] **Task 1: Build vehicle summary card component**
  - Accept vehicle attributes as props
  - Render formatted vehicle string: `${year} ${make} ${model} ${trim} ${engine}`
  - Display only after minimum required fields are selected (Year + Make + Model)

- [ ] **Task 2: Add "Confirm Vehicle" CTA button**
  - Primary action button below the summary card
  - On click, emit a confirmation event and trigger fitment filtering

- [ ] **Task 3: Implement confirmation state management**
  - Track `isConfirmed` state at the page/store level
  - Only dispatch fitment filter actions when `isConfirmed === true`
  - Reset `isConfirmed` if any dropdown value changes

- [ ] **Task 4: Add "Edit" / "Clear Selection" controls**
  - "Edit" returns the user to the dropdown state with current values preserved
  - "Clear" resets all dropdowns and removes the confirmed vehicle

- [ ] **Task 5: Add screen reader announcement**
  - Use `aria-live` region to announce the confirmed vehicle to assistive technologies
  - Announce changes when vehicle is confirmed or cleared
