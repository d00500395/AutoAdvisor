# VS-6-02: Vehicle Selector API Endpoints

**Epic:** Data & Integration
**Priority:** P0 — Must Have
**Requirement Refs:** §8.3

## User Story

> As a **frontend developer**, I need well-defined REST API endpoints to fetch cascading vehicle data, so the dropdowns can be populated dynamically.

## Description

Build the backend API endpoints that serve VCdb data to the frontend vehicle selector. Each endpoint returns filtered options based on the prior selection in the cascade.

## Acceptance Criteria

- [ ] All endpoints return JSON responses
- [ ] All endpoints respond in < 300ms
- [ ] Endpoints handle missing or invalid query parameters with 400 errors
- [ ] Endpoints return sorted results (years descending, all others alphabetical)
- [ ] Endpoints are documented (inline comments or API docs)

## API Contract

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vehicles/years` | GET | Returns all available years |
| `/api/vehicles/makes?year={y}` | GET | Returns makes for a given year |
| `/api/vehicles/models?year={y}&make={m}` | GET | Returns models for year+make |
| `/api/vehicles/trims?year={y}&make={m}&model={mo}` | GET | Returns trims |
| `/api/vehicles/engines?year={y}&make={m}&model={mo}&trim={t}` | GET | Returns engine options |
| `/api/vehicles/vin/:vin` | GET | Decodes VIN and returns vehicle fields |

## Tasks

- [ ] **Task 1: Implement `GET /api/vehicles/years`**
  - Query distinct years from VCdb data
  - Return as sorted array (descending)
  - Cache response (years change infrequently)

- [ ] **Task 2: Implement `GET /api/vehicles/makes`**
  - Accept `year` query param (required)
  - Return distinct makes for that year, sorted alphabetically

- [ ] **Task 3: Implement `GET /api/vehicles/models`**
  - Accept `year` and `make` query params (required)
  - Return distinct models for that year+make, sorted alphabetically

- [ ] **Task 4: Implement `GET /api/vehicles/trims`**
  - Accept `year`, `make`, `model` query params (required)
  - Return distinct trims, sorted alphabetically
  - Return empty array if no trims exist (allow proceeding without trim)

- [ ] **Task 5: Implement `GET /api/vehicles/engines`**
  - Accept `year`, `make`, `model`, `trim` query params
  - Return engine configurations for the selected vehicle

- [ ] **Task 6: Implement `GET /api/vehicles/vin/:vin`**
  - Validate VIN format (17 chars, no I/O/Q)
  - Call NHTSA vPIC API for decode
  - Map response to internal vehicle schema
  - Return structured vehicle object or error

- [ ] **Task 7: Add input validation and error handling**
  - Return 400 for missing required params
  - Return 404 for VIN decode with no results
  - Return 500 with safe message for internal errors

- [ ] **Task 8: Add response caching**
  - Cache years and makes responses (long TTL)
  - Cache models and trims responses (medium TTL)
  - Use in-memory cache or Redis
