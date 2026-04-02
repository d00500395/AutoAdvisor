# VS-1-03: Type-Ahead Filtering

**Epic:** Vehicle Selector Widget
**Priority:** P1 — Should Have
**Requirement Refs:** FR-03

## User Story

> As a **shopper**, I want to type into the Make and Model dropdowns to quickly filter options, so I can find my vehicle faster without scrolling through long lists.

## Description

The Make and Model dropdowns must support search-as-you-type (type-ahead) filtering. As the user types, the displayed options narrow to only those matching the input substring. This is critical for large VCdb catalogs with many makes and models.

## Acceptance Criteria

- [ ] Make dropdown supports type-ahead filtering as the user types
- [ ] Model dropdown supports type-ahead filtering as the user types
- [ ] Filtering is case-insensitive
- [ ] Matching is substring-based (e.g., typing "mus" shows "Mustang")
- [ ] Cleared input restores the full option list
- [ ] Type-ahead works on both desktop and mobile
- [ ] Filter operation is instant (client-side filtering of already-fetched options)

## Tasks

- [ ] **Task 1: Implement searchable dropdown component**
  - Create a reusable component that wraps a text input + filtered option list
  - On input change, filter the options array by case-insensitive substring match
  - Highlight matching text in results (optional)

- [ ] **Task 2: Apply searchable dropdown to Make field**
  - Replace plain `<select>` with searchable dropdown component
  - Pass fetched makes as the options source

- [ ] **Task 3: Apply searchable dropdown to Model field**
  - Replace plain `<select>` with searchable dropdown component
  - Pass fetched models as the options source

- [ ] **Task 4: Handle keyboard navigation**
  - Arrow keys to navigate filtered options
  - Enter to select highlighted option
  - Escape to close dropdown and clear filter

- [ ] **Task 5: Mobile-friendly implementation**
  - Ensure the type-ahead dropdown works well on touch devices
  - Consider fallback to native `<select>` on very small screens if needed
