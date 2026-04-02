# Requirements Document: Vehicle Selection Page
**Product:** Automotive Parts eCommerce  
**Standard References:** ACES (Aftermarket Catalog Exchange Standard) / PIES (Product Information Exchange Standard)  
**Version:** 1.0  
**Date:** March 19, 2026

---

## 1. Purpose & Scope

This document defines the functional, data, and UX requirements for a **Vehicle Selection Page** — the interface through which customers identify their vehicle so the catalog can surface compatible parts. The selection experience is grounded in ACES fitment data and must support downstream compatibility filtering for all marketplace channels (Amazon, eBay Motors, Walmart Marketplace) as well as on-site search.

---

## 2. Background & Context

Automotive fitment data specifies which vehicle makes, models, and configurations a given part is compatible with. The ACES standard (maintained by the Auto Care Association) provides the authoritative database of vehicle configurations, including the:

- **VCdb** — Vehicle Configuration Database (makes, models, years, trims, engines, body styles from 1896–present)
- **Qdb** — Qualifier Database (standardized fitment terminology for filtering)
- **PCdb** — Parts Configuration Database (part types and categories)
- **Brand Table** — Standardized brand/manufacturer labels

Without a proper vehicle selection step, customers cannot benefit from fitment-filtered results, increasing return rates and reducing conversion. Listings without fitment data also lose visibility on Amazon, eBay Motors, and Walmart's parts finder widgets.

---

## 3. Goals

- Allow customers to accurately identify their vehicle using ACES-standard attributes
- Persist vehicle selection across the session (and optionally across sessions via a "My Garage" feature)
- Feed vehicle context into catalog filtering, search, and PDP compatibility checks
- Reduce returns caused by incompatible part purchases
- Support the fitment data requirements of Amazon, eBay Motors, and Walmart Marketplace

---

## 4. User Stories

| ID | As a… | I want to… | So that… |
|----|-------|-----------|----------|
| US-01 | Shopper | Select my vehicle by Year, Make, Model, and Sub-model/Trim | I only see parts that fit my car |
| US-02 | Returning shopper | Save my vehicle to a "garage" | I don't have to re-enter it every visit |
| US-03 | Shopper with multiple vehicles | Switch between saved vehicles | I can shop for any car I own |
| US-04 | Power user | Refine by engine type and body style | I get exact fitment for my specific configuration |
| US-05 | Shopper | Search by VIN | I can skip the manual dropdowns |
| US-06 | Merchandiser | Know when a user has a vehicle selected | I can display a fitment badge/confirmation on the PDP |

---

## 5. ACES Data Requirements

### 5.1 Required Fitment Attributes (Primary Selectors)

These map directly to ACES VCdb fields and must be collected in this order:

| Step | Field | Source | Notes |
|------|-------|--------|-------|
| 1 | **Year** | VCdb | Range: 1896–current model year. Most shops limit to ~1980–present. |
| 2 | **Make** | VCdb | Brand/manufacturer (Ford, Toyota, BMW, etc.) |
| 3 | **Model** | VCdb | Specific model name (Mustang, Tacoma, etc.) |
| 4 | **Sub-model / Trim** | VCdb | Trim level variations that affect part compatibility |

### 5.2 Optional Refinement Attributes (Secondary Selectors)

Displayed conditionally when a part type requires additional disambiguation:

| Field | Source | Condition |
|-------|--------|-----------|
| **Engine Type** | VCdb | Show when multiple engine configs exist for the selected Make/Model/Year |
| **Body Style** | VCdb | Show when body style affects part fitment (sedan vs. coupe vs. SUV) |
| **Drive Type** | VCdb | Show for drivetrain-specific parts (2WD vs. 4WD) |
| **Transmission** | VCdb | Show for transmission-dependent parts |

### 5.3 Qualifier Support (Qdb)

- The system must support ACES Qdb qualifiers to display fitment notes on the PDP (e.g., "Fits with Sport package only")
- Qualifiers should not be primary selectors but must be surfaced as confirmation/advisory text

---

## 6. Functional Requirements

### 6.1 Vehicle Selector Widget

**FR-01 — Cascading Dropdowns**
Each dropdown must be dependent on the prior selection. Options must be dynamically populated from the VCdb:
- Year → populates available Makes
- Make → populates available Models
- Model → populates available Trims/Sub-models
- Trim → optionally reveals Engine, Body Style, Drive Type fields

**FR-02 — Dropdown Ordering**
Default order: Year → Make → Model → Trim. An alternate "Make → Year → Model" order may be offered as a toggle per user preference.

**FR-03 — Search-as-you-type**
Make and Model dropdowns must support type-ahead filtering for catalogs with large vehicle lists.

**FR-04 — Confirmation Step**
After full selection, display a summary card (e.g., "2019 Ford Mustang GT 5.0L V8") with a "Confirm Vehicle" CTA before applying fitment filtering.

**FR-05 — "Change Vehicle" Control**
Once a vehicle is confirmed, a persistent header element must display the selected vehicle with a one-click option to change or clear it.

### 6.2 VIN Lookup (Optional but Recommended)

**FR-06 — VIN Decode**
Accept a 17-character VIN input. Decode via a VIN decode API (e.g., NHTSA vPIC) to auto-populate all selector fields. Display decoded values for user confirmation before applying.

### 6.3 My Garage (Saved Vehicles)

**FR-08 — Save Vehicle**
Authenticated users may save up to 5 vehicles to their account ("My Garage"). Guest users may save 1 vehicle to a browser session cookie.

**FR-09 — Quick-Select from Garage**
On returning visits, the vehicle selector must show saved vehicles as one-click options before showing the manual entry form.

**FR-10 — Vehicle Nickname**
Allow users to assign a nickname to saved vehicles (e.g., "My Daily Driver").

**FR-11 — Default Vehicle**
Users can designate one saved vehicle as default, which auto-populates on site load.

### 6.4 Fitment Filtering Integration

**FR-12 — Catalog Filtering**
Once a vehicle is confirmed, all category and search result pages must filter to show only compatible parts using ACES application data.

**FR-13 — Fitment Badge on PDP**
Product detail pages must display one of three fitment states:
- ✅ **Fits your [Year Make Model]** — confirmed compatible
- ⚠️ **May fit — verify fitment** — partial or qualified match (Qdb qualifier present)
- ❌ **Does not fit your vehicle** — confirmed incompatible (still show product but with clear warning)

**FR-14 — Universal Parts Handling**
Parts without fitment data (universal fit) must be displayed to all customers regardless of vehicle selection, with a "Universal Fit" label.

---

## 7. UX & Design Requirements

### 7.1 Entry Points

The vehicle selector must be accessible from:
- Homepage hero / banner
- Global site header (persistent after selection)
- Category page header
- Search results page header
- PDP (inline, if no vehicle is yet selected)

### 7.2 Mobile Requirements

- Dropdowns must be replaced with native mobile pickers on iOS/Android or a full-screen modal selector
- VIN entry must support the device camera for barcode scanning (optional v2 feature)
- "My Garage" must be accessible in the mobile navigation menu

### 7.3 Empty & Error States

| State | Behavior |
|-------|----------|
| No results for selection | Display message: "No parts found for this vehicle. Try a different configuration." |
| VIN decode failure | Fall back to manual selection with an error message |
| Partial selection (no trim available) | Allow proceeding with Make/Model/Year only; surface a note that results may be broader |
| API timeout | Show a graceful error; allow manual entry fallback |

### 7.4 Accessibility

- All dropdowns must be keyboard-navigable and screen-reader compatible (WCAG 2.1 AA)
- Vehicle confirmation summary must be announced to screen readers
- Error messages must be associated with their corresponding input fields via `aria-describedby`

---

## 8. Data & Integration Requirements

### 8.1 ACES Data Source

| Requirement | Detail |
|-------------|--------|
| Primary source | Auto Care Association VCdb (paid subscription required) |
| Update frequency | Sync with ACA VCdb releases (quarterly minimum; annual new model year additions) |
| File format | ACES XML |
| Internal storage | Relational DB tables mirroring VCdb structure (vehicle, make, model, trim, engine, body_style) |

### 8.2 PIES Attribute Enrichment

PIES data complements vehicle selection on the PDP by providing:
- Part dimensions and weight (for shipping estimates)
- Part type/category mapping via PCdb
- UPC/MPN for marketplace listing matching
- Pricing and regulatory (hazmat) attributes

PIES data does not drive the vehicle selector itself but must be linked to ACES application records to complete the product catalog.

### 8.3 API Contracts

**Vehicle Selector API endpoints (to be built or consumed):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vehicles/years` | GET | Returns all available years |
| `/api/vehicles/makes?year={y}` | GET | Returns makes for a given year |
| `/api/vehicles/models?year={y}&make={m}` | GET | Returns models for year+make |
| `/api/vehicles/trims?year={y}&make={m}&model={mo}` | GET | Returns trims |
| `/api/vehicles/engines?year={y}&make={m}&model={mo}&trim={t}` | GET | Returns engine options |
| `/api/vehicles/vin/{vin}` | GET | Decodes VIN and returns vehicle fields |
| `/api/garage` | GET / POST / DELETE | CRUD for saved vehicles (auth required) |

### 8.4 Marketplace Fitment Sync

Vehicle selection data must power fitment data exports for:

| Marketplace | Format | Required Fields |
|-------------|--------|----------------|
| Amazon | ACES XML (separate Seller Central account) | ASIN, Brand, Vehicle Make/Model/Year, Engine, Trim, Part Type |
| eBay Motors | Compatibility table via eBay API | Make, Model, Trim, Engine, Year |
| Walmart Marketplace | Fitment attributes via approved provider | Part Terminology ID, AAIA Brand ID, MPN, Model Number |

---

## 9. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Dropdown options must load in < 300ms. Vehicle confirmation must apply catalog filter in < 1s. |
| **Scalability** | Must support VCdb catalogs with 500,000+ vehicle configurations |
| **Data freshness** | VCdb and PIES data must be updated within 48 hours of a new ACA release |
| **Availability** | Vehicle selector must degrade gracefully (show all parts unfiltered) if fitment API is unavailable |
| **SEO** | Vehicle-filtered URLs should be indexable where appropriate (e.g., `/brakes/ford/mustang/2019/`) |
| **Analytics** | Track vehicle selection events, drop-off rates at each step, VIN lookup usage, and fitment badge impressions |

---

## 10. Out of Scope (v1)

- OEM part cross-reference lookup
- Camera-based VIN barcode scanning
- Fitment data for off-highway, power sport, or heavy-duty equipment (ACES supports these, but v1 focuses on light-duty passenger vehicles)
- International vehicle catalogs (non-US makes/models outside the VCdb)

---

## 11. Open Questions

1. Will the platform use the full ACA VCdb subscription, or a third-party data provider (e.g., AutoSync, WHI/Epicor)?
2. What is the desired vehicle year range cutoff (full VCdb from 1896, or limited to e.g., 1980–present)?
3. Should VIN decode be handled via the free NHTSA vPIC API or a paid provider for broader coverage?
4. Is "My Garage" scoped to authenticated users only, or should guest persistence via cookie be supported?
5. How should fitment conflicts be handled — where a part has a ACES qualifier that only some users will understand?

---

## 12. Acceptance Criteria

- [ ] User can select Year → Make → Model → Trim using cascading dropdowns populated from VCdb data
- [ ] Each dropdown is empty/disabled until the preceding selection is made
- [ ] Confirmed vehicle persists in the header across page navigation
- [ ] Catalog and search results filter to show only ACES-compatible parts after vehicle selection
- [ ] PDP displays correct fitment badge (Fits / May Fit / Does Not Fit) based on ACES application data
- [ ] Universal fit parts appear regardless of vehicle selection with a "Universal Fit" label
- [ ] Authenticated users can save, retrieve, and delete vehicles from My Garage
- [ ] VIN decode auto-populates all selector fields with a confirmation step before applying
- [ ] Vehicle selector is fully keyboard accessible and passes WCAG 2.1 AA audit
- [ ] Fitment export is structured correctly for Amazon (ACES XML), eBay (compatibility table), and Walmart (required attributes)

---

*Document prepared based on ACES/PIES data standards as documented by the Auto Care Association and Feedonomics automotive fitment best practices.*
