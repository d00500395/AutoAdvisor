# VS-3-04: Default Vehicle

**Epic:** My Garage
**Priority:** P2 — Nice to Have
**Requirement Refs:** FR-11

## User Story

> As a **returning shopper**, I want to designate one of my saved vehicles as the default, so that vehicle is automatically selected when I visit the site.

## Description

Users can mark one saved vehicle as their default. On site load, the default vehicle is automatically confirmed and fitment filtering is applied without requiring any interaction.

## Acceptance Criteria

- [ ] A "Set as Default" action is available on each garage vehicle card
- [ ] Only one vehicle can be the default at a time
- [ ] The default vehicle is visually distinguished in the garage (e.g., star icon, badge)
- [ ] On site load, the default vehicle is auto-confirmed and fitment filtering is applied
- [ ] User can remove the default designation
- [ ] If the default vehicle is deleted, no auto-selection occurs on next visit

## Tasks

- [ ] **Task 1: Add `isDefault` flag to garage data model**
  - Add `isDefault: Boolean` field to the saved vehicle schema
  - Ensure only one vehicle has `isDefault: true` at a time (toggle logic)

- [ ] **Task 2: Build "Set as Default" UI action**
  - Add a toggle/button on each garage card
  - On click, call `PUT /api/garage/:id` with `{ isDefault: true }`
  - Backend unsets `isDefault` on all other vehicles for the user

- [ ] **Task 3: Implement auto-selection on site load**
  - On app initialization, fetch garage vehicles
  - If a default vehicle exists, auto-populate the vehicle selector and trigger confirmation
  - Apply fitment filtering automatically

- [ ] **Task 4: Handle default vehicle deletion**
  - When deleting a vehicle that is the default, clear the default flag
  - On next visit, no auto-selection occurs — show the normal selector
