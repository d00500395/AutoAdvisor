# VS-6-04: Performance & Scalability

**Epic:** Data & Integration
**Priority:** P1 — Should Have
**Requirement Refs:** §9

## User Story

> As a **developer**, I need the vehicle selector and fitment system to perform fast and scale to 500K+ vehicle configurations, meeting all non-functional requirements.

## Description

Ensure the system meets performance targets: dropdown options load in < 300ms, vehicle confirmation applies catalog filter in < 1s, and the database supports 500K+ vehicle configurations without degradation.

## Acceptance Criteria

- [ ] Dropdown API responses return in < 300ms at the 95th percentile
- [ ] Catalog fitment filtering applies in < 1 second after confirmation
- [ ] Database supports 500K+ vehicle configuration records without query degradation
- [ ] Load testing confirms performance targets under concurrent user load
- [ ] Graceful degradation if fitment API is unavailable (show all products unfiltered)

## Tasks

- [ ] **Task 1: Optimize database indexes**
  - Profile slow queries and add indexes where needed
  - Create compound indexes for cascading lookup patterns
  - Benchmark query times against 500K+ records

- [ ] **Task 2: Implement API response caching**
  - Cache infrequently changing data (years, makes) with long TTL
  - Cache frequently accessed combinations (popular year+make pairs) with medium TTL
  - Implement cache invalidation on VCdb data refresh

- [ ] **Task 3: Optimize fitment filter query**
  - Profile the fitment matching query with a full product catalog
  - Optimize join/lookup strategy for ACES application data
  - Target < 1s response time for filtered catalog pages

- [ ] **Task 4: Load testing**
  - Write load test scripts (e.g., k6 or Artillery)
  - Simulate concurrent users performing vehicle selection and catalog browsing
  - Identify and resolve bottlenecks

- [ ] **Task 5: Implement graceful degradation**
  - If the VCdb API or database is slow/unavailable, serve cached data or disable filtering
  - Show a user-facing notice when operating in degraded mode
  - Health check endpoint for monitoring
