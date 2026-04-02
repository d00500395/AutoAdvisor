# VS-3-01: Save Vehicle to Garage

**Epic:** My Garage
**Priority:** P0 — Must Have
**Requirement Refs:** FR-08, US-02

## User Story

> As a **returning shopper**, I want to save my vehicle to a "garage" so I don't have to re-enter it every visit.

## Description

After confirming a vehicle, offer a "Save to My Garage" action. Authenticated users can save up to 5 vehicles. Guest users can save 1 vehicle via a browser session cookie. Saved vehicles are persisted and available on return visits.

## Acceptance Criteria

- [ ] A "Save to My Garage" button appears after vehicle confirmation
- [ ] Authenticated users can save up to 5 vehicles
- [ ] Guest users can save 1 vehicle via session cookie
- [ ] Attempting to save beyond the limit shows a message ("Maximum vehicles reached. Remove a vehicle to add a new one.")
- [ ] Saved vehicles can be viewed in a "My Garage" section
- [ ] Saved vehicles can be deleted from the garage
- [ ] Saving a duplicate vehicle (same Y/M/M/T) is prevented with a notification

## Tasks

- [ ] **Task 1: Build Garage API endpoints**
  - `GET /api/garage` — return saved vehicles for the authenticated user
  - `POST /api/garage` — save a vehicle (validate limit: max 5 for auth, max 1 for guest)
  - `DELETE /api/garage/:id` — remove a saved vehicle
  - Include validation for duplicate vehicles

- [ ] **Task 2: Create Garage data model**
  - Garage document linking `userId` to an array of saved vehicle objects
  - Or: add a `savedToGarage: Boolean` flag + `nickname` to the Vehicle model
  - Include `nickname` and `isDefault` fields

- [ ] **Task 3: Implement "Save to My Garage" button**
  - Appears on the vehicle confirmation summary card
  - On click, calls `POST /api/garage` with the confirmed vehicle data
  - Shows success/error toast notification

- [ ] **Task 4: Implement guest garage via cookie/sessionStorage**
  - For unauthenticated users, save 1 vehicle to a cookie or localStorage
  - Read and restore on subsequent visits
  - Prompt to create account to save more vehicles

- [ ] **Task 5: Build My Garage list view**
  - Display saved vehicles as cards with vehicle details
  - Show a "Delete" action on each card
  - Link to vehicle selection (quick-select)

- [ ] **Task 6: Implement duplicate detection**
  - Before saving, check if a vehicle with the same Year/Make/Model/Trim already exists in the garage
  - If duplicate, show notification: "This vehicle is already in your garage."
