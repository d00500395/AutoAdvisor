# VS-6-01: VCdb Data Import & Storage

**Epic:** Data & Integration
**Priority:** P0 — Must Have
**Requirement Refs:** §8.1

## User Story

> As a **developer**, I need to import and store VCdb vehicle configuration data so the cascading dropdowns can be populated with accurate ACES-standard vehicle attributes.

## Description

Import the Auto Care Association VCdb (Vehicle Configuration Database) into a relational or document database. The data includes makes, models, years, trims, engines, body styles, and drive types. The database must be structured for fast cascading lookups.

## Acceptance Criteria

- [ ] VCdb data (ACES XML format) is parsed and imported into the application database
- [ ] Database tables/collections mirror VCdb structure: makes, models, years, trims, engines, body styles
- [ ] Data covers the target year range (1980–present minimum)
- [ ] Data can be refreshed when new ACA VCdb releases are published (quarterly minimum)
- [ ] Import process is repeatable and idempotent (re-importing doesn't create duplicates)
- [ ] Data freshness: new ACA releases reflected within 48 hours (per NFR)

## Tasks

- [ ] **Task 1: Obtain VCdb data source**
  - Acquire ACA VCdb subscription or use a third-party provider (AutoSync, WHI/Epicor)
  - Download the ACES XML data files
  - Document data licensing and update cadence

- [ ] **Task 2: Design database schema for VCdb data**
  - Create collections/tables: `vcdb_years`, `vcdb_makes`, `vcdb_models`, `vcdb_trims`, `vcdb_engines`, `vcdb_body_styles`
  - Define relationships: year ↔ make ↔ model ↔ trim ↔ engine/body
  - Or use a denormalized `vehicle_configurations` collection

- [ ] **Task 3: Build ACES XML parser/importer**
  - Parse ACES XML files and extract vehicle configuration records
  - Map XML elements to database schema fields
  - Handle incremental updates (new records, modified records)

- [ ] **Task 4: Create database indexes**
  - Index on `year`, `make`, `model`, `trim` for fast cascading lookups
  - Compound indexes for common query patterns (year+make, year+make+model)
  - Verify query performance against the 300ms requirement

- [ ] **Task 5: Seed development database**
  - Create a seed script with a representative subset of VCdb data for development
  - Cover at least 10 popular makes, 5 models each, 10 years of data
  - Include edge cases: vehicles with multiple engine options, trims without engines

- [ ] **Task 6: Build data refresh pipeline**
  - Script or cron job to re-import VCdb data from new releases
  - Idempotent: upsert records, don't duplicate
  - Log import statistics (records added, updated, unchanged)
