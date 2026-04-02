# VS-3-03: Vehicle Nickname

**Epic:** My Garage
**Priority:** P2 — Nice to Have
**Requirement Refs:** FR-10

## User Story

> As a **shopper with multiple vehicles**, I want to assign nicknames to my saved vehicles (e.g., "My Daily Driver") so I can easily tell them apart in my garage.

## Description

Allow users to assign an optional freeform nickname when saving or editing a vehicle in My Garage. The nickname is displayed alongside or in place of the full vehicle string in garage views and quick-select cards.

## Acceptance Criteria

- [ ] A nickname text input is available when saving a vehicle to the garage
- [ ] Nickname is optional (max 30 characters)
- [ ] Nickname can be edited after saving
- [ ] Nickname is displayed on garage cards and quick-select buttons
- [ ] If no nickname is set, the full vehicle string is displayed

## Tasks

- [ ] **Task 1: Add nickname field to save flow**
  - Add an optional text input ("Give this vehicle a nickname") to the save dialog
  - Validate max 30 characters

- [ ] **Task 2: Add nickname editing**
  - Add an "Edit" action on garage cards
  - Allow changing the nickname (inline edit or modal)
  - Call `PUT /api/garage/:id` to persist changes

- [ ] **Task 3: Display nickname in UI**
  - Show nickname as the primary label on garage cards and quick-select
  - Show full vehicle string as secondary text below the nickname
