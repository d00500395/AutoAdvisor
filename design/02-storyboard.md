# AutoAdvisor Storyboard (From Wireframes)

This storyboard maps the end-to-end UX flow using the wireframes in 01-wireframes.md.

## Scene 1: Entry and Authentication

Reference wireframe: WF-01

- User opens app and lands on Login/Register.
- User enters credentials or creates an account.
- On success, app routes to Home.

Decision point:
- If auth fails, show error and remain on WF-01.

## Scene 2: Home Dashboard

Reference wireframe: WF-02

- User sees "Start New Diagnosis" and Past Diagnoses list.
- User can choose:
  - Start a new diagnosis flow
  - Open a previous diagnosis
  - Delete one diagnosis
  - Delete all diagnoses

Decision point:
- If list is empty, display empty state.

## Scene 3: Vehicle Selection

Reference wireframe: WF-03

- User enters vehicle using cascading dropdowns OR VIN decode.
- Returning user may quick-select a garage vehicle.
- User confirms selected vehicle to proceed.

Decision point:
- If required fields missing (year/make/model), keep user on this step with validation messaging.

## Scene 4: Symptom Input

Reference wireframe: WF-04

- User enters symptom description (required) and optional mileage.
- User submits to AI workflow.

Decision point:
- If symptom text is too short (<10 chars), show validation and block submit.

## Scene 5: Agent Processing

Reference wireframe: WF-05

- UI shows loading card with status text.
- Backend agent executes classification, retrieval, and clarity check.

Decision point:
- If enough information, continue to Scene 7.
- If not enough information, continue to Scene 6.

## Scene 6: Clarifying Questions

Reference wireframe: WF-06

- User receives 1-2 targeted clarifying questions.
- User submits answers.
- Agent reruns with enriched context.

Decision point:
- On submit, transition back through processing and then to results.

## Scene 7: Diagnosis Results

Reference wireframe: WF-07

- User sees urgency, confidence, likely cause, parts, and notes.
- User can expand replacement steps for each part.
- User can save diagnosis, edit prompt and resubmit, or start a new diagnosis.

Decision point:
- Unsaved changes trigger confirmation modal before leaving.

## Scene 8: Garage Management

Reference wireframe: WF-08

- User opens My Garage.
- User can add vehicles, set default, edit nickname, or remove vehicles.

Decision point:
- Remove and destructive actions require confirmation modal.

## Scene 9: Modal Interactions

Reference wireframe: WF-09

- For delete/save/remove decisions, user must explicitly confirm action.
- Primary and secondary actions are always explicit and consistent.

## Scene 10: Mobile Flow Adaptation

Reference wireframe: WF-10

- Entire flow from Scene 1 to 9 remains available on mobile.
- Layout changes to single-column cards and stacked buttons.

---

## End-to-End Flow Summary

1. Login/Register
2. Home Dashboard
3. Vehicle Selection
4. Symptom Input
5. Agent Processing
6. Clarifying Questions (conditional)
7. Diagnosis Results
8. Garage Management (optional branch)
9. Save/Delete confirmations (cross-cutting modal flow)
10. Mobile adaptation across all scenes

This storyboard covers both the primary happy path and key conditional branches in the existing UX.
