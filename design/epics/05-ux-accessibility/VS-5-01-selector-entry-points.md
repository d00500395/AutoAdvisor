# VS-5-01: Selector Entry Points

**Epic:** UX & Accessibility
**Priority:** P0 — Must Have
**Requirement Refs:** §7.1

## User Story

> As a **shopper**, I want to access the vehicle selector from multiple places on the site (homepage, header, category page, search results, PDP), so I can always set or change my vehicle regardless of where I am.

## Description

The vehicle selector must be accessible as a consistent UI element from all major site surfaces. The implementation can vary by context (inline widget, modal, or header link) but the flow must be identical.

## Acceptance Criteria

- [ ] Vehicle selector is accessible from the homepage hero/banner
- [ ] Vehicle selector is accessible from the global site header (persistent)
- [ ] Vehicle selector is accessible from category page headers
- [ ] Vehicle selector is accessible from search results page headers
- [ ] Vehicle selector is accessible inline on the PDP when no vehicle is selected
- [ ] All entry points lead to the same selector experience (consistent state and behavior)
- [ ] Selecting a vehicle from any entry point updates the global vehicle state

## Tasks

- [ ] **Task 1: Implement homepage hero vehicle selector**
  - Embed the full vehicle selector widget in the homepage hero section
  - Style prominently as a primary CTA

- [ ] **Task 2: Implement global header entry point**
  - Add a "Select Vehicle" / vehicle display element to the global header
  - Clicking opens the selector (modal or dropdown panel)
  - This is the same component as VS-1-05 (Change Vehicle Control)

- [ ] **Task 3: Implement category page header entry point**
  - Add a vehicle selector bar/banner at the top of category listing pages
  - Show current vehicle or "Select Your Vehicle" prompt

- [ ] **Task 4: Implement search results header entry point**
  - Add vehicle context banner to search results page
  - Allow changing vehicle inline

- [ ] **Task 5: Implement PDP inline selector**
  - When no vehicle is selected, show a compact selector or CTA on the PDP
  - Position near the fitment badge area
  - After selection, display the fitment badge (VS-4-02)
