# AutoAdvisor Low-Fidelity Wireframes

This document provides a complete set of low-fidelity wireframes for the current app.

## WF-01 Login / Register

```
+-------------------------------------------------------------+
| AutoAdvisor                                   [Logo/Wordmark]|
+-------------------------------------------------------------+
|                                                             |
|  [ Login ] [ Register ]                                     |
|                                                             |
|  Username: [______________________________]                 |
|  Email:    [______________________________] (register only) |
|  Password: [______________________________]                 |
|                                                             |
|  [ Submit ]                                                 |
|                                                             |
|  Error/Validation message area                              |
|                                                             |
+-------------------------------------------------------------+
```

UI components:
- Mode toggle tabs (login/register)
- Input fields with inline validation
- Primary action button
- Error message region

## WF-02 Home / Dashboard

```
+--------------------------------------------------------------------+
| Header: [AutoAdvisor] [Selected Vehicle Badge] [Change] [Logout]   |
+--------------------------------------------------------------------+
|                                                                    |
|  Hero Card                                                         |
|  "Diagnose your vehicle issue"                                    |
|  [ Start New Diagnosis ]                                           |
|                                                                    |
|  Past Diagnoses Card                                 [Delete All]  |
|  --------------------------------------------------------------    |
|  Date | Vehicle Summary | Likely Cause (truncated) | [View] [X]    |
|  Date | Vehicle Summary | Likely Cause (truncated) | [View] [X]    |
|  Date | Vehicle Summary | Likely Cause (truncated) | [View] [X]    |
|                                                                    |
|  Empty State: "No saved diagnoses yet"                            |
|                                                                    |
+--------------------------------------------------------------------+
```

UI components:
- Primary CTA to diagnosis flow
- Diagnosis history list with item actions
- Bulk delete action with confirmation modal

## WF-03 Diagnose Step 1: Vehicle Selection

```
+--------------------------------------------------------------------+
| Stepper: [1 Vehicle] -> [2 Symptom] -> [3 Processing] -> [4 Result]|
+--------------------------------------------------------------------+
|                                                                    |
|  Vehicle Selector Card                                             |
|  [ Manual ] [ VIN Decode ]                                         |
|                                                                    |
|  Year:  [v dropdown]                                               |
|  Make:  [searchable dropdown]                                      |
|  Model: [searchable dropdown]                                      |
|  Trim:  [v dropdown optional]                                      |
|  Engine:[text optional]                                            |
|                                                                    |
|  Quick Select from Garage                                          |
|  [Vehicle Card] [Vehicle Card] [Vehicle Card]                      |
|                                                                    |
|  [ Save to Garage ]   [ Confirm Vehicle ]                          |
|                                                                    |
+--------------------------------------------------------------------+
```

UI components:
- Cascading dropdown controls
- Type-ahead dropdown interaction
- VIN decode tab fallback
- Quick-select garage cards

## WF-04 Diagnose Step 2: Symptom Entry

```
+--------------------------------------------------------------------+
| Stepper: [1 Done] -> [2 Symptom] -> [3 Processing] -> [4 Result]   |
+--------------------------------------------------------------------+
|                                                                    |
|  Symptom Input Card                                                 |
|  "Describe what you hear, feel, or see"                           |
|                                                                    |
|  Symptom:                                                          |
|  [--------------------------------------------------------------]  |
|  [ multiline textarea                                         ]    |
|  [--------------------------------------------------------------]  |
|                                                                    |
|  Mileage (optional): [____________]                                |
|                                                                    |
|  Validation helper (10-1000 chars)                                |
|                                                                    |
|  [ Submit to AI Agent ]                                            |
|                                                                    |
+--------------------------------------------------------------------+
```

UI components:
- Textarea with client-side validation
- Optional mileage input
- Submission action

## WF-05 Diagnose Step 3: Processing / Status

```
+--------------------------------------------------------------------+
| Stepper: [1 Done] -> [2 Done] -> [3 Processing] -> [4 Pending]     |
+--------------------------------------------------------------------+
|                                                                    |
|  Processing Card                                                    |
|  [ spinner / animated indicator ]                                  |
|                                                                    |
|  Current status line:                                               |
|  - Classifying symptom...                                           |
|  - Searching repair knowledge base...                               |
|  - Checking for clarification needs...                              |
|  - Writing diagnosis...                                             |
|                                                                    |
|  (No user input while processing)                                   |
|                                                                    |
+--------------------------------------------------------------------+
```

UI components:
- Status indicator
- Human-readable node/progress messaging

## WF-06 Diagnose Step 3b: Clarifying Questions

```
+--------------------------------------------------------------------+
| Clarifying Questions                                                |
+--------------------------------------------------------------------+
|                                                                    |
|  Q1: [question text]                                                |
|  A1: [______________________________________________]              |
|                                                                    |
|  Q2 (optional): [question text]                                     |
|  A2: [______________________________________________]              |
|                                                                    |
|  [ Submit Answers ]                                                 |
|                                                                    |
+--------------------------------------------------------------------+
```

UI components:
- 1-2 dynamic question prompts
- One input per prompt
- Follow-up submission action

## WF-07 Diagnose Step 4: Results

```
+--------------------------------------------------------------------+
| Diagnosis Results                                                   |
+--------------------------------------------------------------------+
|                                                                    |
|  Vehicle: [Year Make Model Trim]                                   |
|  Symptom Summary: [text]                                            |
|                                                                    |
|  Urgency Badge: [Drive carefully / Fix soon / Stop driving]        |
|  Confidence: [high/medium/low]                                     |
|  Difficulty: [DIY-Easy / DIY-Moderate / Shop-Recommended]          |
|                                                                    |
|  Likely Cause                                                       |
|  [paragraph text]                                                   |
|                                                                    |
|  Recommended Parts                                                  |
|  - Part A [Category] [Prob %] [View Steps/Hide Steps]              |
|      -> steps/tools/time/warnings panel (expand/collapse)           |
|  - Part B [Category] [Prob %] [View Steps/Hide Steps]              |
|                                                                    |
|  Additional Notes                                                   |
|  [paragraph text]                                                   |
|                                                                    |
|  Actions: [Save Diagnosis] [Edit Prompt & Resubmit] [New Diagnosis]|
|                                                                    |
+--------------------------------------------------------------------+
```

UI components:
- Structured diagnosis panel
- Expandable replacement process panels
- Save/edit/new actions

## WF-08 Garage Page

```
+--------------------------------------------------------------------+
| My Garage                                                           |
+--------------------------------------------------------------------+
|                                                                    |
|  [ Add Vehicle ]                                                    |
|                                                                    |
|  Saved Vehicles                                                     |
|  --------------------------------------------------------------    |
|  Vehicle Card: Year Make Model Trim                                |
|    Nickname: [editable text] [Save] [Cancel]                        |
|    [Set Default] [Remove]                                           |
|  --------------------------------------------------------------    |
|  Vehicle Card ...                                                   |
|                                                                    |
+--------------------------------------------------------------------+
```

UI components:
- Add-vehicle flow
- Nickname edit inline
- Set default + remove actions

## WF-09 Shared Modal Patterns

```
+-------------------------------------------+
| Confirmation                              |
+-------------------------------------------+
| Message text                              |
|                                           |
| [Primary Action]   [Secondary Action]     |
+-------------------------------------------+
```

Used for:
- Unsaved diagnosis choice: Save vs Delete
- Delete one diagnosis
- Delete all diagnoses
- Remove vehicle

## WF-10 Mobile Responsive Pattern

```
+-----------------------------+
| Header / nav                |
+-----------------------------+
| Single-column cards         |
| full-width controls         |
| larger tap targets          |
| stacked actions             |
+-----------------------------+
```

Mobile rules:
- Forms collapse to one column
- Buttons stack vertically when needed
- Cards use full width
- Modal content remains centered and scroll-safe
