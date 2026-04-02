# VS-4-02: PDP Fitment Badge

**Epic:** Fitment Filtering
**Priority:** P0 — Must Have
**Requirement Refs:** FR-13, US-06

## User Story

> As a **merchandiser**, I want to display a fitment badge on the product detail page that tells the customer whether the part fits their selected vehicle, so they can buy with confidence and we reduce returns.

## Description

Each product detail page (PDP) displays one of three fitment states based on ACES application data cross-referenced with the user's confirmed vehicle.

## Acceptance Criteria

- [ ] PDP displays **"✅ Fits your {Year Make Model}"** when the part has a confirmed ACES match
- [ ] PDP displays **"⚠️ May fit — verify fitment"** when a partial or qualified match exists (Qdb qualifier present)
- [ ] PDP displays **"❌ Does not fit your vehicle"** when the part is confirmed incompatible
- [ ] The "Does not fit" state still shows the product but with a clear warning (not hidden)
- [ ] If no vehicle is selected, PDP shows a prompt: "Select your vehicle to check fitment"
- [ ] Badge is prominently positioned near the product title / add-to-cart area
- [ ] Qdb qualifier text is displayed alongside the "May fit" badge (e.g., "Fits with Sport package only")

## Tasks

- [ ] **Task 1: Build fitment check API endpoint**
  - `GET /api/fitment/check?productId={pid}&year={y}&make={m}&model={mo}&trim={t}`
  - Return fitment status: `fits`, `partial`, or `incompatible`
  - Include qualifier notes if applicable

- [ ] **Task 2: Create fitment badge component**
  - Accept fitment status as a prop
  - Render appropriate badge variant (green/yellow/red) with icon and text
  - Include vehicle string in the badge message
  - Screen reader accessible (role="status")

- [ ] **Task 3: Integrate badge into PDP**
  - On PDP mount, if a vehicle is confirmed, call the fitment check endpoint
  - Display the badge near the product title or above "Add to Cart"
  - If no vehicle is confirmed, show "Select your vehicle to check fitment" link

- [ ] **Task 4: Handle Qdb qualifier display**
  - When the fitment status is `partial`, display qualifier text from Qdb
  - Render qualifier as a tooltip or expandable note below the badge
  - Example: "Fits with Sport Suspension package only"

- [ ] **Task 5: Add no-vehicle-selected state**
  - If no vehicle is selected, display a CTA to select a vehicle
  - Clicking the CTA opens the vehicle selector (modal or inline)
