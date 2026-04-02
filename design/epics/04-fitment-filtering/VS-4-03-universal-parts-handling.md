# VS-4-03: Universal Parts Handling

**Epic:** Fitment Filtering
**Priority:** P1 — Should Have
**Requirement Refs:** FR-14

## User Story

> As a **shopper**, I want to see universal-fit parts (like floor mats, tools, or cleaners) in my results even when I have a vehicle selected, so I don't miss products that work with any car.

## Description

Parts without ACES fitment data (universal fit) are displayed to all customers regardless of vehicle selection. They are clearly labeled with a "Universal Fit" badge so users understand they are not vehicle-specific.

## Acceptance Criteria

- [ ] Products without ACES fitment data appear in results regardless of vehicle selection
- [ ] Universal products display a "Universal Fit" label/badge
- [ ] Universal products appear in a clearly defined section or are visually distinguished from fitment-specific results
- [ ] Universal products do NOT show the "Fits / Does Not Fit" badge — only the "Universal Fit" label
- [ ] Catalog counts include universal products in the total

## Tasks

- [ ] **Task 1: Identify universal products in the database**
  - Flag products with no ACES application records as `universalFit: true`
  - Or: treat any product with zero fitment records as universal

- [ ] **Task 2: Update fitment filter query to include universal products**
  - Modify the catalog/search filter to: (matches vehicle fitment) OR (has no fitment data)
  - Ensure universal products are always returned alongside filtered results

- [ ] **Task 3: Create "Universal Fit" badge component**
  - A distinct badge (e.g., blue/gray) labeled "Universal Fit"
  - Displayed on category cards and PDP for universal products

- [ ] **Task 4: Update PDP fitment logic**
  - If product is universal, show "Universal Fit" badge instead of fitment check
  - Do not call the fitment check endpoint for universal products
