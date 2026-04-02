# VS-4-01: Catalog Fitment Filtering

**Epic:** Fitment Filtering
**Priority:** P0 — Must Have
**Requirement Refs:** FR-12

## User Story

> As a **shopper** with a confirmed vehicle, I want category pages and search results to show only parts compatible with my car, so I don't waste time on parts that won't fit.

## Description

Once a vehicle is confirmed, all category and search result pages filter products to show only ACES-compatible parts. The filter uses the confirmed vehicle's Year/Make/Model/Trim (and optional refinements) to match against ACES application data stored for each product.

## Acceptance Criteria

- [ ] Category pages show only parts that have ACES fitment data matching the confirmed vehicle
- [ ] Search results are filtered to only compatible parts
- [ ] Filtering applies immediately after vehicle confirmation
- [ ] Clearing the vehicle removes the filter and shows all products
- [ ] Results count updates to reflect filtered totals
- [ ] Filtered pages load within 1 second (per NFR)
- [ ] Products with no ACES data (universal fit) are still shown (see VS-4-03)

## Tasks

- [ ] **Task 1: Design fitment lookup query**
  - Define the database query to match products by ACES application data
  - Match on Year, Make, Model, Trim (and Engine/Body if provided)
  - Use indexes for performance on 500K+ vehicle configurations

- [ ] **Task 2: Build backend fitment filter middleware/service**
  - Create a service function that accepts vehicle attributes and returns matching product IDs
  - Integrate with category and search endpoints as a query filter
  - Support both exact match and partial match (Make/Model/Year only, no trim)

- [ ] **Task 3: Update category page to apply fitment filter**
  - Pass confirmed vehicle context to the category API call
  - Display filtered results with an updated count
  - Show a banner: "Showing parts for {Year} {Make} {Model}"

- [ ] **Task 4: Update search results to apply fitment filter**
  - Append vehicle context to search queries
  - Filter search results by fitment compatibility
  - Show fitment context in search results header

- [ ] **Task 5: Handle filter removal**
  - When vehicle is cleared, remove fitment filter from all queries
  - Refresh current page to show unfiltered results
