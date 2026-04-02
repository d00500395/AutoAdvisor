# VS-7-01: Amazon ACES XML Export

**Epic:** Marketplace Fitment Sync
**Priority:** P1 — Should Have
**Requirement Refs:** §8.4

## User Story

> As a **marketplace seller**, I want to export fitment data in Amazon's required ACES XML format, so my listings appear in Amazon's vehicle parts finder and receive better visibility.

## Description

Generate ACES XML files for Amazon Seller Central that map products to compatible vehicles. The export includes ASIN, Brand, Vehicle Make/Model/Year, Engine, Trim, and Part Type.

## Acceptance Criteria

- [ ] System can generate ACES XML export files
- [ ] Export includes required fields: ASIN, Brand, Vehicle Make/Model/Year, Engine, Trim, Part Type
- [ ] XML conforms to ACES standard schema
- [ ] Export can be scheduled or triggered on demand
- [ ] Export handles products with multiple fitment records (multi-vehicle compatibility)

## Tasks

- [ ] **Task 1: Build ACES XML serializer**
  - Create a module that serializes product fitment data into ACES XML format
  - Conform to the ACES XML schema specification
  - Include all required Amazon fields

- [ ] **Task 2: Build export endpoint / script**
  - `GET /api/exports/amazon-aces` or a CLI script to generate the export file
  - Accept filters (product category, date range, etc.)
  - Return or save the generated XML file

- [ ] **Task 3: Validate export against ACES schema**
  - Validate generated XML against the ACES XSD schema
  - Log and report validation errors
  - Ensure all required elements and attributes are present

- [ ] **Task 4: Test with Amazon Seller Central**
  - Upload a sample export to Amazon's fitment validation tool
  - Fix any rejection issues
  - Document the upload process
