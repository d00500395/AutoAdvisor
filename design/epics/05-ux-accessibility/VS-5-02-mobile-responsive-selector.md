# VS-5-02: Mobile Responsive Selector

**Epic:** UX & Accessibility
**Priority:** P1 — Should Have
**Requirement Refs:** §7.2

## User Story

> As a **mobile shopper**, I want the vehicle selector to work well on my phone, with native-feeling controls and full-screen modals, so I can easily select my vehicle on a small screen.

## Description

On mobile devices, the vehicle selector adapts to smaller screens. Dropdowns are replaced with native mobile pickers or full-screen modal selectors. The "My Garage" section is accessible from the mobile navigation menu.

## Acceptance Criteria

- [ ] Vehicle selector renders a mobile-optimized layout on screens < 768px
- [ ] Dropdowns use native mobile pickers on iOS/Android or a full-screen modal selector
- [ ] Type-ahead search works on mobile (virtual keyboard compatible)
- [ ] My Garage is accessible from the mobile navigation menu/hamburger
- [ ] The persistent vehicle header display is responsive and works on mobile
- [ ] All touch targets meet minimum 44×44px size guidelines

## Tasks

- [ ] **Task 1: Create mobile selector layout**
  - Design a stacked/full-width layout for the vehicle selector on mobile
  - Replace horizontal dropdown row with a vertical step-by-step flow

- [ ] **Task 2: Implement full-screen modal selector for mobile**
  - On mobile, each dropdown step opens a full-screen selection modal
  - Show a scrollable list of options with a search bar at the top
  - Selecting an option returns to the main flow and advances to the next step

- [ ] **Task 3: Ensure native picker compatibility**
  - Test that `<select>` elements trigger native OS pickers on iOS Safari and Android Chrome
  - Optionally use native pickers for simpler fields (Year) and custom modals for Make/Model

- [ ] **Task 4: Add My Garage to mobile nav**
  - Add a "My Garage" link to the mobile hamburger/bottom nav menu
  - Ensure garage cards are touch-friendly and responsive

- [ ] **Task 5: Responsive header vehicle display**
  - Condense the persistent vehicle display for mobile (abbreviate if needed)
  - Ensure "Change" and "Clear" actions are still accessible
