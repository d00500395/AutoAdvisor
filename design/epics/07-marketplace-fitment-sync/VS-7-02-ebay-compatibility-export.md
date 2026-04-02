# VS-7-02: eBay Motors Compatibility Export

**Epic:** Marketplace Fitment Sync
**Priority:** P1 — Should Have
**Requirement Refs:** §8.4

## User Story

> As a **marketplace seller**, I want to export fitment data as eBay Motors compatibility tables, so my listings appear in eBay's parts finder and buyers can filter by their vehicle.

## Description

Generate compatibility table data for the eBay Motors API. The export includes Make, Model, Trim, Engine, and Year for each product's fitment records.

## Acceptance Criteria

- [ ] System can generate compatibility table data in eBay's required format
- [ ] Export includes required fields: Make, Model, Trim, Engine, Year
- [ ] Data can be pushed via the eBay API or exported as a file for bulk upload
- [ ] Export handles multi-fitment products correctly

## Tasks

- [ ] **Task 1: Build eBay compatibility table serializer**
  - Create a module that formats fitment data as eBay compatibility table rows
  - Map internal vehicle fields to eBay's expected field names

- [ ] **Task 2: Build export endpoint / script**
  - `GET /api/exports/ebay-compatibility` or CLI script
  - Output as CSV/JSON for bulk upload or direct API push

- [ ] **Task 3: Integrate with eBay Trading/Inventory API (optional)**
  - Use eBay's API to push compatibility data directly to listings
  - Handle API authentication (OAuth) and rate limits

- [ ] **Task 4: Validate and test**
  - Upload sample data to eBay test listings
  - Verify the Parts Finder widget shows correct fitment
  - Fix any mapping issues
