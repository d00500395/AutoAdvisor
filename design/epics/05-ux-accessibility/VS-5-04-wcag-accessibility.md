# VS-5-04: WCAG Accessibility Compliance

**Epic:** UX & Accessibility
**Priority:** P0 — Must Have
**Requirement Refs:** §7.4

## User Story

> As a **shopper using assistive technology**, I want the vehicle selector to be fully keyboard-navigable and screen-reader compatible, so I can identify my vehicle and shop for parts independently.

## Description

The entire vehicle selection experience must conform to WCAG 2.1 AA standards. All interactive elements must be keyboard accessible, screen-reader friendly, and meet contrast requirements.

## Acceptance Criteria

- [ ] All dropdowns are keyboard-navigable (Tab, Arrow keys, Enter, Escape)
- [ ] All dropdowns and inputs are screen-reader compatible with proper ARIA labels
- [ ] Vehicle confirmation summary is announced to screen readers via `aria-live` region
- [ ] Error messages are associated with their input fields via `aria-describedby`
- [ ] All interactive elements meet WCAG 2.1 AA color contrast ratios (4.5:1 for text)
- [ ] Focus management follows logical tab order through the selection flow
- [ ] No keyboard traps in the selector UI
- [ ] Passes automated WCAG 2.1 AA audit (e.g., axe-core)

## Tasks

- [ ] **Task 1: Add ARIA labels to all form controls**
  - Add `aria-label` or `<label>` elements to all dropdowns and inputs
  - Add `aria-required="true"` to required fields
  - Add `role="combobox"` and related ARIA attributes to type-ahead dropdowns

- [ ] **Task 2: Implement keyboard navigation**
  - Ensure all dropdowns can be opened, navigated, and selected via keyboard
  - Tab moves focus between dropdown fields in logical order
  - Arrow keys navigate within dropdown options
  - Enter selects; Escape closes

- [ ] **Task 3: Add `aria-live` regions for dynamic updates**
  - Vehicle confirmation announcement: `aria-live="polite"`
  - Error messages: `aria-live="assertive"`
  - Loading state changes: announce via `aria-live`

- [ ] **Task 4: Associate errors with inputs**
  - Use `aria-describedby` to link error messages to their input fields
  - Use `aria-invalid="true"` on fields with validation errors

- [ ] **Task 5: Verify focus management**
  - After vehicle confirmation, move focus to the result summary
  - After an error, move focus to the error message or the offending input
  - After opening a modal selector, trap focus inside the modal

- [ ] **Task 6: Run automated accessibility audit**
  - Integrate axe-core or Lighthouse accessibility audit into CI
  - Fix all critical and serious violations
  - Document any known exceptions with justification
