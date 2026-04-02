# AutoAdvisor — Project Requirements

**Full-Stack Web Application with Agentic AI Workflow**
Course Assignment | Spring 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Resources](#2-resources)
3. [REST API Endpoints](#3-rest-api-endpoints)
4. [Data Models & Schemas](#4-data-models--schemas)
5. [Agentic AI Workflow](#5-agentic-ai-workflow)
6. [RAG Implementation Plan](#6-rag-implementation-plan)
7. [Vue.js Frontend Plan](#7-vuejs-frontend-plan)
8. [Wireframes & UX Flow](#8-wireframes--ux-flow)
9. [Tech Stack](#9-tech-stack)
10. [Optional Features](#10-optional-features)

---

## 1. Project Overview

**AutoAdvisor** is a web application that helps everyday drivers diagnose vehicle symptoms and receive AI-powered repair guidance — including which parts are likely needed, why the problem occurs, and how difficult the repair is.

A user describes what their car is doing wrong (e.g., *"grinding noise when I brake"* or *"check engine light is on and car idles rough"*). The AI agent interprets the symptom, retrieves relevant knowledge from an embedded repair manual corpus (RAG), asks clarifying questions if needed, and then returns a structured diagnosis with recommended parts, estimated difficulty, and a plain-language explanation.

**This is explicitly NOT a price comparison tool.** The end goal is diagnosis, guidance, and repair planning — not retail lookup. It is adjacent to the senior project (automotive parts domain) but solves a fundamentally different problem.

---

## 2. Resources

### Resource 1: `Vehicle`
Represents a user's car. Used to scope diagnoses to the correct make/model/year so part recommendations and repair procedures are accurate.

| Attribute | Type | Description |
|---|---|---|
| `_id` | ObjectId | MongoDB document ID |
| `userId` | ObjectId | Reference to owning User (optional auth) |
| `year` | Number | Model year (e.g., 2018) |
| `make` | String | Manufacturer (e.g., "Toyota") |
| `model` | String | Model name (e.g., "Camry") |
| `trim` | String | Trim level (e.g., "LE", "XSE") |
| `mileage` | Number | Current odometer reading |
| `engine` | String | Engine descriptor (e.g., "2.5L 4-cylinder") |
| `createdAt` | Date | Timestamp |

---

### Resource 2: `Diagnosis`
The core resource. Represents a single AI-powered diagnostic session tied to a vehicle and symptom description. Stores all agent outputs so the user can revisit past diagnoses.

| Attribute | Type | Description |
|---|---|---|
| `_id` | ObjectId | MongoDB document ID |
| `vehicleId` | ObjectId | Reference to associated Vehicle |
| `userId` | ObjectId | Reference to owning User (optional auth) |
| `symptomDescription` | String | The user's raw input |
| `clarifyingQuestions` | [String] | Questions the agent asked |
| `clarifyingAnswers` | [String] | User's answers to those questions |
| `diagnosisResult` | Object | Structured output from the agent (see schema) |
| `ragSourcesUsed` | [String] | Names/IDs of knowledge chunks retrieved |
| `status` | String | `"pending"` \| `"complete"` \| `"error"` |
| `createdAt` | Date | Timestamp |

`diagnosisResult` sub-object:

| Attribute | Type | Description |
|---|---|---|
| `likelyCause` | String | Plain-language explanation of root cause |
| `confidenceLevel` | String | `"high"` \| `"medium"` \| `"low"` |
| `recommendedParts` | [Object] | Array of part objects (see below) |
| `repairDifficulty` | String | `"DIY-Easy"` \| `"DIY-Moderate"` \| `"Shop-Recommended"` |
| `urgency` | String | `"Drive carefully"` \| `"Fix soon"` \| `"Stop driving"` |
| `additionalNotes` | String | Caveats, related issues to watch for |

`recommendedParts` sub-object:

| Attribute | Type | Description |
|---|---|---|
| `partName` | String | e.g., "Brake Pads (Front)" |
| `partCategory` | String | e.g., "Brakes", "Engine", "Suspension" |
| `oemPartNumber` | String | Manufacturer part number (if known) |
| `isRequired` | Boolean | Required vs. recommended-while-you're-in-there |

---

### Resource 3: `User` *(optional — for auth track)*
Simple user model for session-based authentication.

| Attribute | Type | Description |
|---|---|---|
| `_id` | ObjectId | MongoDB document ID |
| `username` | String | Unique username |
| `email` | String | Unique email address |
| `passwordHash` | String | bcrypt-hashed password |
| `createdAt` | Date | Timestamp |

---

## 3. REST API Endpoints

All endpoints are prefixed with `/api`. All request/response bodies use JSON.

### Vehicles

| # | Method | Route | Description |
|---|---|---|---|
| 1 | `GET` | `/api/vehicles` | Get all vehicles (for authenticated user, or all if no auth) |
| 2 | `POST` | `/api/vehicles` | Create a new vehicle record |
| 3 | `GET` | `/api/vehicles/:id` | Get a single vehicle by ID |
| 4 | `PUT` | `/api/vehicles/:id` | Update a vehicle (e.g., update mileage) |
| 5 | `DELETE` | `/api/vehicles/:id` | Delete a vehicle and its associated diagnoses |

### Diagnoses *(core resource — includes agentic AI)*

| # | Method | Route | Description |
|---|---|---|---|
| 6 | `POST` | `/api/diagnoses` | **Submit a symptom** — triggers the full AI agent workflow. Returns a completed diagnosis. |
| 7 | `GET` | `/api/diagnoses` | Get all past diagnoses (optionally filter by `?vehicleId=`) |
| 8 | `GET` | `/api/diagnoses/:id` | Get a single diagnosis by ID |
| 9 | `DELETE` | `/api/diagnoses/:id` | Delete a saved diagnosis |
| 10 | `POST` | `/api/diagnoses/:id/followup` | Submit a follow-up question on an existing diagnosis — re-invokes a lighter agent pass |

### Users *(optional — auth track)*

| # | Method | Route | Description |
|---|---|---|---|
| 11 | `POST` | `/api/users/register` | Register a new user (bcrypt hash password) |
| 12 | `POST` | `/api/users/login` | Log in, create session |
| 13 | `POST` | `/api/users/logout` | Destroy session |
| 14 | `GET` | `/api/users/me` | Get current authenticated user info |

> **Minimum 4 distinct RESTful actions covered:** `POST /api/vehicles`, `GET /api/vehicles`, `PUT /api/vehicles/:id`, `POST /api/diagnoses`, `GET /api/diagnoses`, `DELETE /api/diagnoses/:id`

---

## 4. Data Models & Schemas

### `Vehicle` Schema (Mongoose)

```js
const vehicleSchema = new Schema({
  userId:  { type: Schema.Types.ObjectId, ref: 'User' },
  year:    { type: Number, required: true, min: 1900, max: new Date().getFullYear() + 1 },
  make:    { type: String, required: true, trim: true, maxlength: 50 },
  model:   { type: String, required: true, trim: true, maxlength: 50 },
  trim:    { type: String, trim: true, maxlength: 50 },
  mileage: { type: Number, min: 0 },
  engine:  { type: String, trim: true, maxlength: 100 },
}, { timestamps: true });
```

### `Diagnosis` Schema (Mongoose)

```js
const recommendedPartSchema = new Schema({
  partName:      { type: String, required: true },
  partCategory:  { type: String, required: true },
  oemPartNumber: { type: String },
  isRequired:    { type: Boolean, default: true },
}, { _id: false });

const diagnosisResultSchema = new Schema({
  likelyCause:        { type: String, required: true },
  confidenceLevel:    { type: String, enum: ['high', 'medium', 'low'], required: true },
  recommendedParts:   [recommendedPartSchema],
  repairDifficulty:   { type: String, enum: ['DIY-Easy', 'DIY-Moderate', 'Shop-Recommended'] },
  urgency:            { type: String, enum: ['Drive carefully', 'Fix soon', 'Stop driving'] },
  additionalNotes:    { type: String },
}, { _id: false });

const diagnosisSchema = new Schema({
  vehicleId:           { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  userId:              { type: Schema.Types.ObjectId, ref: 'User' },
  symptomDescription:  { type: String, required: true, minlength: 10, maxlength: 1000 },
  clarifyingQuestions: [{ type: String }],
  clarifyingAnswers:   [{ type: String }],
  diagnosisResult:     diagnosisResultSchema,
  ragSourcesUsed:      [{ type: String }],
  status:              { type: String, enum: ['pending', 'complete', 'error'], default: 'pending' },
}, { timestamps: true });
```

### `User` Schema (Mongoose — optional)

```js
const userSchema = new Schema({
  username:     { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });
```

---

## 5. Agentic AI Workflow

### Overview

The agent is implemented using **LangGraph** (Node.js). It is invoked whenever a `POST /api/diagnoses` request is received. The agent takes the symptom description and vehicle context as input, and outputs a structured `diagnosisResult`.

The agent uses **RAG** to ground its responses in real repair knowledge rather than relying solely on LLM parametric memory.

---

### Agent Graph

```
                          ┌─────────────────────┐
                          │    START (Input)     │
                          │  symptom + vehicle   │
                          └──────────┬──────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │  symptom_classifier  │  NODE 1
                          │  Categorize symptom  │
                          │  (noise/warning/     │
                          │   performance/etc.)  │
                          └──────────┬──────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │   rag_retriever      │  NODE 2
                          │  Query knowledge     │
                          │  base with symptom   │
                          │  + vehicle context   │
                          └──────────┬──────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │  clarity_checker     │  NODE 3
                          │  Does the agent      │
                          │  have enough info?   │
                          └──────┬────────┬──────┘
                                 │        │
                    (needs info) │        │ (enough info)
                                 ▼        ▼
                 ┌──────────────────┐   ┌─────────────────────┐
                 │ clarify_asker    │   │   diagnosis_writer   │  NODE 4b
                 │ Generate 1-2     │   │   Synthesize RAG     │
                 │ clarifying Qs    │   │   + LLM knowledge    │
                 │ → return to UI   │   │   into structured    │
                 └──────────────────┘   │   diagnosis output   │
                        NODE 4a         └──────────┬──────────┘
                                                   │
                                                   ▼
                                        ┌─────────────────────┐
                                        │  parts_recommender  │  NODE 5
                                        │  Map diagnosis to   │
                                        │  specific parts +   │
                                        │  OEM part numbers   │
                                        └──────────┬──────────┘
                                                   │
                                                   ▼
                                        ┌─────────────────────┐
                                        │  output_formatter   │  NODE 6
                                        │  Assemble final     │
                                        │  structured JSON    │
                                        │  response           │
                                        └──────────┬──────────┘
                                                   │
                                                   ▼
                                               [ END ]
```

---

### Graph Nodes

| Node | Name | Type | Description |
|---|---|---|---|
| 1 | `symptom_classifier` | Standard | Categorizes the symptom into a domain (brakes, engine, electrical, suspension, etc.) using the LLM. Sets `state.symptomCategory`. |
| 2 | `rag_retriever` | Standard | Uses the `ragRetrieveTool` to query the embedded repair manual corpus. Returns top-k relevant chunks. Sets `state.ragContext`. |
| 3 | `clarity_checker` | Conditional Router | Evaluates whether symptom + RAG context is sufficient to diagnose. Routes to either `clarify_asker` or `diagnosis_writer`. |
| 4a | `clarify_asker` | Standard | Generates 1–2 targeted clarifying questions for the user. Returns early — the API responds to the client with questions, awaiting answers. |
| 4b | `diagnosis_writer` | Standard | Uses the LLM with RAG context to generate a `likelyCause`, `confidenceLevel`, `repairDifficulty`, and `urgency`. |
| 5 | `parts_recommender` | Standard | Uses the `partsLookupTool` to translate diagnosis into a concrete list of recommended parts with OEM numbers. |
| 6 | `output_formatter` | Standard | Assembles all state fields into the final `diagnosisResult` JSON shape that maps to the Mongoose schema. |

---

### Edges

| From | To | Type | Condition |
|---|---|---|---|
| START | `symptom_classifier` | Static | Always |
| `symptom_classifier` | `rag_retriever` | Static | Always |
| `rag_retriever` | `clarity_checker` | Static | Always |
| `clarity_checker` | `clarify_asker` | Conditional | `state.needsClarification === true` |
| `clarity_checker` | `diagnosis_writer` | Conditional | `state.needsClarification === false` |
| `clarify_asker` | END | Static | Returns to client |
| `diagnosis_writer` | `parts_recommender` | Static | Always |
| `parts_recommender` | `output_formatter` | Static | Always |
| `output_formatter` | END | Static | Always |

---

### Routing Function

```js
function routeAfterClarityCheck(state) {
  if (state.needsClarification) {
    return "clarify_asker";
  }
  return "diagnosis_writer";
}
```

---

### Agent State

```js
const AgentState = {
  // Inputs
  symptomDescription: String,
  vehicleContext: Object,       // { year, make, model, mileage, engine }
  clarifyingAnswers: [String],  // populated on follow-up calls

  // Intermediate
  symptomCategory: String,      // set by symptom_classifier
  ragContext: [String],         // chunks returned by rag_retriever
  needsClarification: Boolean,  // set by clarity_checker
  clarifyingQuestions: [String],// set by clarify_asker

  // Output
  diagnosisResult: Object,      // set by output_formatter
  ragSourcesUsed: [String],
};
```

---

### Tools

#### Tool 1: `ragRetrieveTool`

Queries the vector store (embedded repair manual corpus) for chunks relevant to the symptom and vehicle.

```js
{
  name: "ragRetrieveTool",
  description: "Retrieves relevant repair manual passages and diagnostic procedures for a given symptom and vehicle.",
  schema: z.object({
    query: z.string().describe("The symptom description to search for"),
    vehicleMake: z.string().describe("Vehicle manufacturer"),
    vehicleModel: z.string().describe("Vehicle model"),
    vehicleYear: z.number().describe("Vehicle model year"),
    category: z.string().optional().describe("Symptom category (brakes, engine, etc.) to narrow results"),
    topK: z.number().default(5).describe("Number of chunks to retrieve"),
  })
}
```

**Implementation:** Uses a local vector store (e.g., Chroma or in-memory with `langchain`). Embeddings are generated from a curated set of repair procedures, OBD code descriptions, and common symptom guides.

---

#### Tool 2: `partsLookupTool`

Given a confirmed diagnosis, returns a structured list of parts needed for the repair.

```js
{
  name: "partsLookupTool",
  description: "Looks up the standard parts required for a diagnosed repair on a specific vehicle.",
  schema: z.object({
    diagnosisCategory: z.string().describe("The repair category (e.g., 'front brake replacement')"),
    vehicleMake: z.string(),
    vehicleModel: z.string(),
    vehicleYear: z.number(),
    vehicleEngine: z.string().optional(),
  })
}
```

**Implementation:** Either queries a small seeded MongoDB collection of common repairs → parts mappings, or prompts the LLM with a strict JSON output schema constrained by the schema above.

---

## 6. RAG Implementation Plan

### Knowledge Base Sources

The corpus will be a curated, hand-assembled set of plain-text documents covering:

- Common OBD-II diagnostic trouble codes (DTCs) and their causes
- Symptom-to-diagnosis guides for the 5 most common repair categories: brakes, engine, suspension, electrical, cooling/heating
- Standard repair procedures (e.g., "how to replace front brake pads")
- Vehicle-agnostic part descriptions and their roles

These will be chunked, embedded, and stored in a vector database at server startup.

### Embedding & Retrieval Stack

| Component | Tool |
|---|---|
| Embedding model | `nomic-embed-text` via local Ollama (or `text-embedding-3-small` via OpenAI) |
| Vector store | Chroma (local) or LangChain `MemoryVectorStore` for simplicity |
| Retrieval strategy | Similarity search, top-5 chunks, with vehicle make/model metadata filter |
| Integration point | `ragRetrieveTool` inside the LangGraph agent |

### RAG Flow

```
User symptom + vehicle
       │
       ▼
  Embed query
       │
       ▼
  Vector search → top-5 chunks
       │
       ▼
  Inject chunks into LLM prompt
  as grounding context
       │
       ▼
  LLM generates diagnosis
  citing/grounded in chunks
```

---

## 7. Vue.js Frontend Plan

### Application Shell

Single-page application (SPA) with a persistent top navigation bar and dynamic view panels. No page reloads.

### Views / Panels

| View | Route | Description |
|---|---|---|
| Home / Dashboard | `/` | Lists user's saved vehicles and recent diagnoses |
| New Diagnosis | `/diagnose` | Multi-step form: pick vehicle → describe symptom → run agent → view results |
| Diagnosis Detail | `/diagnoses/:id` | Full view of a saved diagnosis with parts list and explanation |
| My Garage | `/vehicles` | CRUD interface for managing saved vehicles |
| Add/Edit Vehicle | `/vehicles/new`, `/vehicles/:id/edit` | Form to add or edit a vehicle |

### AI Integration UX

The AI workflow is embedded as a **guided diagnostic experience**, not a chat interface:

1. **Step 1 — Vehicle Selector:** User picks a saved vehicle or adds one inline.
2. **Step 2 — Symptom Input:** Large textarea with helper prompts ("Describe what you hear, feel, or see. When does it happen?"). Client-side validation: minimum 10 characters, maximum 1000.
3. **Step 3 — Agent Running:** Animated status indicator showing which node the agent is currently in ("Classifying symptom... Searching repair knowledge base... Writing diagnosis...").
4. **Step 3b — Clarifying Questions (conditional):** If the agent needs more info, a clean card UI presents 1–2 questions with input fields. User submits answers to trigger the follow-up endpoint.
5. **Step 4 — Diagnosis Results:** Structured results card showing: urgency badge, likely cause explanation, repair difficulty rating, and an expandable parts list with OEM numbers.

### Client-Side Validation Rules

| Field | Rule |
|---|---|
| Vehicle year | Required, numeric, 1900–current year+1 |
| Vehicle make/model | Required, non-empty string |
| Symptom description | Required, min 10 chars, max 1000 chars |
| Mileage | Optional, numeric, ≥ 0 |

---

## 8. Wireframes & UX Flow

*(To be produced as low-fidelity sketches and submitted alongside this document.)*

### Storyboard Summary

```
[ Home / Dashboard ]
  → Click "New Diagnosis"
      → [ Step 1: Select Vehicle ] ── or ──→ [ Add New Vehicle form ]
          → [ Step 2: Describe Symptom ]
              → [ Step 3: Agent Processing (animated) ]
                  → (if agent needs clarification) → [ Step 3b: Answer Questions ]
                  → (if enough info) → [ Step 4: Diagnosis Results ]
                      → "Save Diagnosis" → back to Dashboard
                      → "Ask a Follow-up" → [ Follow-up Input ] → [ Updated Results ]

[ My Garage ]
  → [ Vehicle Card list ]
      → Click vehicle → [ Diagnosis history for that vehicle ]
      → Edit / Delete vehicle
```

---

## 9. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vue.js 3 (Composition API), Vue Router, plain CSS or Tailwind |
| **Backend** | Node.js, Express.js |
| **AI Agent** | LangGraph (JS), LangChain.js |
| **LLM** | Ollama (local) — `llama3` or `mistral` |
| **Embeddings** | Ollama — `nomic-embed-text` |
| **Vector Store** | LangChain `MemoryVectorStore` or Chroma |
| **Database** | MongoDB with Mongoose ODM |
| **Auth (optional)** | `express-session`, `bcrypt` |
| **HTTP Client** | Fetch API (client side) |
| **CORS** | `cors` npm package |

---

## 10. Optional Features

### User Auth (Planned)

- `POST /api/users/register` — bcrypt hash password, store user
- `POST /api/users/login` — verify password, create session
- Middleware: protect vehicle and diagnosis routes to only return records owned by `req.session.userId`
- Vue: login/register panels, conditional UI visibility based on auth state

### Deployment *(stretch goal)*

- Backend: Render or Railway
- Frontend: Vercel or Netlify
- MongoDB: MongoDB Atlas
- Note: Ollama/local LLM not deployable — would switch to OpenAI API for deployment build

---

*Document version 1.0 — AutoAdvisor Project Requirements*