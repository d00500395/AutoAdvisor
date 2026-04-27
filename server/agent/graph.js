const { z } = require('zod');
const { ChatOllama } = require('@langchain/ollama');
const { StateGraph, Annotation, END } = require('@langchain/langgraph');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const { searchChunks } = require('../rag/search');
const { isVehicleIngested, triggerBackgroundIngest } = require('../rag/backgroundIngest');

// ─────────────────────────────────────────────────────────────────────
// LLM — same Ollama instance pattern as llm/app.js
// ─────────────────────────────────────────────────────────────────────
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 30000);
const MAX_RAG_CHUNKS = Number(process.env.RAG_TOP_K || 3);
const MAX_RAG_CHARS = Number(process.env.RAG_CHUNK_CHAR_LIMIT || 900);

const llm = new ChatOllama({
  baseUrl: process.env.OLLAMA_URL || 'http://golem:11434',
  model: process.env.OLLAMA_MODEL || 'gpt-oss:20b',
  temperature: 0,
  timeout: OLLAMA_TIMEOUT_MS,
});

// ─────────────────────────────────────────────────────────────────────
// Structured output schemas (Zod)
// ─────────────────────────────────────────────────────────────────────
const DiagnosisOutputSchema = z.object({
  likelyCause:    z.string().describe('Plain-language explanation of the root cause'),
  confidenceLevel: z.enum(['high', 'medium', 'low']).describe('Confidence in the diagnosis'),
  recommendedParts: z.array(z.object({
    partName:      z.string().describe('Part name, e.g. "Front Brake Pads"'),
    partCategory:  z.string().describe('Category, e.g. "Brakes"'),
    oemPartNumber: z.string().optional().describe('OEM part number if known'),
    causationProbability: z.number().min(0).max(100).describe('Estimated probability (0-100%) that this part is the cause of the symptom'),
  })).describe('Parts needed for the repair'),
  repairDifficulty: z.enum(['DIY-Easy', 'DIY-Moderate', 'Shop-Recommended']),
  urgency:          z.enum(['Drive carefully', 'Fix soon', 'Stop driving']),
  additionalNotes:  z.string().describe('Caveats, related issues to watch for'),
});

const ClarifyingQuestionsSchema = z.object({
  questions: z.array(z.string()).min(1).max(2).describe('1-2 targeted clarifying questions for the user'),
});

const VehicleContextSchema = z.object({
  year: z.union([z.number(), z.string()]).optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  trim: z.string().optional(),
  engine: z.string().optional(),
  mileage: z.union([z.number(), z.string()]).optional(),
});

const RagRetrieveToolSchema = z.object({
  query: z.string().min(1),
  vehicleContext: VehicleContextSchema,
  category: z.string().optional(),
  topK: z.number().int().positive().default(5),
  minScore: z.number().min(0).max(1).default(0.3),
});

const LazyLoadVehicleDataToolSchema = z.object({
  vehicleContext: VehicleContextSchema,
});

const ragRetrieveTool = {
  name: 'ragRetrieveTool',
  description: 'Retrieve top-k relevant repair chunks for a symptom and vehicle context.',
  schema: RagRetrieveToolSchema,
  async invoke(input) {
    const parsed = RagRetrieveToolSchema.parse(input);
    return searchChunks(parsed.query, {
      category: parsed.category,
      vehicle: parsed.vehicleContext,
      limit: parsed.topK,
      minScore: parsed.minScore,
    });
  },
};

const lazyLoadVehicleDataTool = {
  name: 'lazyLoadVehicleDataTool',
  description: 'Trigger non-blocking background ingestion for a vehicle if data is missing.',
  schema: LazyLoadVehicleDataToolSchema,
  async invoke(input) {
    const parsed = LazyLoadVehicleDataToolSchema.parse(input);
    const started = triggerBackgroundIngest(parsed.vehicleContext);
    return { started };
  },
};

// ─────────────────────────────────────────────────────────────────────
// Agent State Definition (Annotation pattern from llm/app.js)
// ─────────────────────────────────────────────────────────────────────
const AgentState = Annotation.Root({
  // Inputs
  symptomDescription: Annotation({ reducer: (x, y) => y ?? x, default: () => '' }),
  vehicleContext:     Annotation({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  clarifyingAnswers:  Annotation({ reducer: (x, y) => y ?? x, default: () => [] }),

  // Intermediate state
  symptomCategory:      Annotation({ reducer: (x, y) => y ?? x, default: () => '' }),
  ragContext:            Annotation({ reducer: (x, y) => y ?? x, default: () => [] }),
  needsClarification:   Annotation({ reducer: (x, y) => y ?? x, default: () => false }),
  clarifyingQuestions:   Annotation({ reducer: (x, y) => y ?? x, default: () => [] }),

  // Output
  diagnosisResult: Annotation({ reducer: (x, y) => y ?? x, default: () => null }),
  ragSourcesUsed:  Annotation({ reducer: (x, y) => y ?? x, default: () => [] }),
  ragAvailable:    Annotation({ reducer: (x, y) => y ?? x, default: () => false }),
});

// ─────────────────────────────────────────────────────────────────────
// Helper: format the vehicle context into a readable string
// ─────────────────────────────────────────────────────────────────────
function vehicleString(ctx) {
  return [ctx.year, ctx.make, ctx.model, ctx.trim, ctx.engine]
    .filter(Boolean).join(' ');
}

function inferSymptomCategory(description = '') {
  const text = String(description).toLowerCase();
  const categoryMatchers = [
    ['brakes', /\b(brake|rotor|pad|caliper|abs|stopping|squeal|grind)\b/],
    ['engine', /\b(engine|misfire|spark|plug|stall|rough idle|timing|knock|tick|oil burning)\b/],
    ['transmission', /\b(transmission|gear|shift|shifting|slip|slipping|clutch|torque converter)\b/],
    ['electrical', /\b(battery|alternator|starter|fuse|wiring|electrical|light|dashboard|sensor)\b/],
    ['suspension', /\b(strut|shock|suspension|bounce|bumpy|control arm)\b/],
    ['steering', /\b(steering|power steering|wheel pull|alignment|turning)\b/],
    ['cooling', /\b(overheat|coolant|radiator|thermostat|water pump|temperature)\b/],
    ['heating-ac', /\b(ac|a\/c|air conditioning|heater|heat not working|blower)\b/],
    ['exhaust', /\b(exhaust|muffler|catalytic|cat converter|emissions)\b/],
    ['fuel-system', /\b(fuel|injector|pump|filter|no start|hard start)\b/],
    ['tires-wheels', /\b(tire|tyre|wheel|rim|balance|flat)\b/],
    ['body-exterior', /\b(door|window|mirror|hood|trunk|bumper|paint)\b/],
    ['interior', /\b(seat|radio|screen|interior|dashboard trim|window switch)\b/],
  ];

  for (const [category, pattern] of categoryMatchers) {
    if (pattern.test(text)) return category;
  }

  return 'other';
}

function needsClarificationHeuristically(description = '') {
  const text = String(description).toLowerCase().trim();
  if (!text) return true;

  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const hasDiagnosticSignal = /\b(when|while|after|before|cold|warm|hot|idle|startup|accelerat|brak|turn|left|right|mph|rpm|check engine|code|smell|vibration|leak|stall|rough|misfire|click|grind|squeal|humming|whining|only)\b/.test(text);
  const isVeryVague = /^(help|not working|issue|problem|weird noise|car makes noise|what's wrong)[.!? ]*$/i.test(text);

  if (isVeryVague) return true;
  if (wordCount < 6) return true;
  if (wordCount < 12 && !hasDiagnosticSignal) return true;

  return false;
}

function trimRagContent(content = '') {
  const text = String(content).trim();
  if (text.length <= MAX_RAG_CHARS) return text;
  return `${text.slice(0, MAX_RAG_CHARS)}…`;
}

function extractFirstJsonObject(content = '') {
  const cleaned = String(content)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```json?\n?/g, '')
    .replace(/```/g, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in response');
  }

  return jsonMatch[0];
}

function normalizeRecommendedParts(parts) {
  if (!Array.isArray(parts)) return [];

  return parts
    .filter((part) => part && typeof part === 'object')
    .slice(0, 5)
    .map((part) => ({
      partName: String(part.partName || '').trim(),
      partCategory: String(part.partCategory || 'General').trim(),
      oemPartNumber: String(part.oemPartNumber || '').trim(),
      causationProbability: Math.max(0, Math.min(100, Number(part.causationProbability || 0))),
    }))
    .filter((part) => part.partName);
}

// ─────────────────────────────────────────────────────────────────────
// NODE 1: symptom_classifier
// Categorizes the symptom into a domain (brakes, engine, electrical, etc.)
// ─────────────────────────────────────────────────────────────────────
async function symptomClassifier(state) {
  console.log('--- NODE: symptom_classifier ---');

  const category = inferSymptomCategory(state.symptomDescription);
  console.log('Classified symptom category (heuristic):', category);

  return { symptomCategory: category };
}

// ─────────────────────────────────────────────────────────────────────
// NODE 2: rag_retriever (placeholder — will be a tool later)
// For now, passes through. When RAG is wired up, this node will query
// the vector store and populate state.ragContext.
// ─────────────────────────────────────────────────────────────────────
async function ragRetriever(state) {
  console.log('--- NODE: rag_retriever ---');

  try {
    // Check if we have any data for this vehicle
    const hasData = await isVehicleIngested(state.vehicleContext);

    if (!hasData) {
      // First request for this vehicle — skip RAG, trigger background ingestion
      console.log('No RAG data for this vehicle — triggering background ingestion');
      await lazyLoadVehicleDataTool.invoke({ vehicleContext: state.vehicleContext });
      return { ragContext: [], ragSourcesUsed: [], ragAvailable: false };
    }

    // We have data — search for relevant chunks
    const query = `${state.symptomDescription} ${state.symptomCategory}`;
    const results = await ragRetrieveTool.invoke({
      query,
      category: state.symptomCategory,
      vehicleContext: state.vehicleContext,
      topK: MAX_RAG_CHUNKS,
      minScore: 0.3,
    });

    if (results.length === 0) {
      console.log('RAG data exists but no relevant chunks matched — using LLM only');
      return { ragContext: [], ragSourcesUsed: [], ragAvailable: true };
    }

    const trimmedResults = results.slice(0, MAX_RAG_CHUNKS);
    console.log(`Found ${trimmedResults.length} relevant chunks (top score: ${trimmedResults[0].score.toFixed(3)})`);

    const ragContext = trimmedResults.map(r =>
      `[Source: ${r.source || 'manual'}] ${trimRagContent(r.content)}`
    );
    const ragSourcesUsed = trimmedResults.map(r => ({
      source: r.source,
      title: r.title,
      score: r.score,
    }));

    return { ragContext, ragSourcesUsed, ragAvailable: true };
  } catch (err) {
    console.error('RAG retrieval error:', err.message);
    return { ragContext: [], ragSourcesUsed: [], ragAvailable: false };
  }
}

// ─────────────────────────────────────────────────────────────────────
// NODE 3: clarity_checker
// Determines if we have enough info to diagnose, or need to ask the user
// ─────────────────────────────────────────────────────────────────────
async function clarityChecker(state) {
  console.log('--- NODE: clarity_checker ---');

  // If the user already provided clarifying answers, don't ask again
  if (state.clarifyingAnswers && state.clarifyingAnswers.length > 0) {
    console.log('User already answered clarifying questions — proceeding to diagnosis');
    return { needsClarification: false };
  }

  const needsClarification = needsClarificationHeuristically(state.symptomDescription);
  console.log('Clarity check result (heuristic):', needsClarification ? 'insufficient' : 'sufficient');

  return { needsClarification };
}

// ─────────────────────────────────────────────────────────────────────
// NODE 4a: clarify_asker
// Generates 1-2 targeted clarifying questions
// ─────────────────────────────────────────────────────────────────────
async function clarifyAsker(state) {
  console.log('--- NODE: clarify_asker ---');

  const messages = [
    new SystemMessage(
      `You are an expert automotive diagnostician. The user's symptom description is ambiguous. Generate 1-2 short, targeted clarifying questions to narrow down the diagnosis.

Respond as a JSON object: {"questions": ["question1", "question2"]}
Only ask what's truly needed. Be specific and practical.`
    ),
    new HumanMessage(
      `Vehicle: ${vehicleString(state.vehicleContext)}
Symptom: ${state.symptomDescription}
Category: ${state.symptomCategory}`
    ),
  ];

  const response = await llm.invoke(messages);

  let questions;
  try {
    // Extract JSON object from response — LLM may include reasoning text before it
    const jsonMatch = response.content.match(/\{[\s\S]*"questions"\s*:\s*\[[\s\S]*\]\s*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response.content;
    const cleaned = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    questions = ClarifyingQuestionsSchema.parse(parsed).questions;
  } catch {
    // Fallback: treat entire response as a single question
    questions = [response.content.trim()];
  }
  console.log('Clarifying questions:', questions);

  return { clarifyingQuestions: questions };
}

// ─────────────────────────────────────────────────────────────────────
// NODE 4b: diagnosis_writer
// Uses LLM reasoning (+ RAG context when available) to produce a diagnosis
// ─────────────────────────────────────────────────────────────────────
async function diagnosisWriter(state) {
  console.log('--- NODE: diagnosis_writer ---');

  const ragSection = state.ragContext.length > 0
    ? `\n\nRelevant repair knowledge:\n${state.ragContext.join('\n---\n')}`
    : '\n\nNo service manual data is available for this vehicle yet. Do NOT guess or fabricate specific part numbers, transmission codes, or component model numbers. Use general diagnostic language instead (e.g. "the automatic transmission" not "the 4L80E").';

  const clarifySection = state.clarifyingAnswers.length > 0
    ? `\nClarifying Q&A:\n${state.clarifyingQuestions.map((q, i) =>
        `Q: ${q}\nA: ${state.clarifyingAnswers[i] || 'No answer'}`
      ).join('\n')}`
    : '';

  const messages = [
    new SystemMessage(
      `You are an expert automotive diagnostician. Based on the vehicle info, symptom, and any available context, produce a diagnosis.

You MUST respond with a JSON object matching this exact schema:
{
  "likelyCause": "plain-language explanation of the root cause",
  "confidenceLevel": "high" | "medium" | "low",
  "recommendedParts": [
    {
      "partName": "descriptive part name",
      "partCategory": "category name",
      "oemPartNumber": "",
      "causationProbability": 0-100
    }
  ],
  "repairDifficulty": "DIY-Easy" | "DIY-Moderate" | "Shop-Recommended",
  "urgency": "Drive carefully" | "Fix soon" | "Stop driving",
  "additionalNotes": "caveats or related issues to watch for"
}

Include 1-4 likely parts in "recommendedParts" when appropriate. Use generic descriptive names only, and leave "oemPartNumber" blank unless the provided repair knowledge explicitly shows an OEM number.
Be specific to the vehicle make/model/year. Base your reasoning on common failure patterns for this vehicle.
Never mention a specific transmission family/code (e.g., 4L80E, 6L80, 4R70W, 5R55E) unless that exact code appears in the provided "Relevant repair knowledge" section.
Respond with ONLY the JSON object, no markdown fences or extra text.`
    ),
    new HumanMessage(
      `Vehicle: ${vehicleString(state.vehicleContext)}
${state.vehicleContext.mileage ? `Mileage: ${state.vehicleContext.mileage}` : ''}
Symptom: ${state.symptomDescription}
Category: ${state.symptomCategory}${clarifySection}${ragSection}`
    ),
  ];

  const response = await llm.invoke(messages);

  let result;
  try {
    const cleaned = extractFirstJsonObject(response.content);
    const parsed = JSON.parse(cleaned);
    const normalized = {
      likelyCause: String(parsed.likelyCause || '').trim(),
      confidenceLevel: parsed.confidenceLevel,
      recommendedParts: normalizeRecommendedParts(parsed.recommendedParts),
      repairDifficulty: parsed.repairDifficulty,
      urgency: parsed.urgency,
      additionalNotes: String(parsed.additionalNotes || '').trim(),
    };

    const validated = DiagnosisOutputSchema.safeParse(normalized);
    if (!validated.success) {
      throw new Error(validated.error.message);
    }

    result = validated.data;
  } catch (err) {
    console.error('Failed to parse diagnosis JSON:', err.message);
    result = {
      likelyCause: response.content.trim(),
      confidenceLevel: 'low',
      recommendedParts: [],
      repairDifficulty: 'Shop-Recommended',
      urgency: 'Drive carefully',
      additionalNotes: 'The AI produced a non-structured response. Please consult a mechanic.',
    };
  }

  // Guardrail: if no RAG evidence was provided, strip any guessed transmission codes.
  if (state.ragContext.length === 0) {
    const transmissionCodeRegex = /\b(?:\d[A-Z]\d{2,3}[A-Z]{0,2}|[4-6]R\d{2,3}[A-Z]{1,2}|700R4)\b/gi;
    const sanitize = (text = '') =>
      text.replace(transmissionCodeRegex, 'automatic transmission');

    result.likelyCause = sanitize(result.likelyCause || '');
    result.additionalNotes = sanitize(result.additionalNotes || '');
  }

  console.log('Diagnosis result:', result);
  return { diagnosisResult: result };
}

// ─────────────────────────────────────────────────────────────────────
// NODE 5: parts_recommender
// Maps the diagnosis to specific parts using LLM reasoning
// ─────────────────────────────────────────────────────────────────────
async function partsRecommender(state) {
  console.log('--- NODE: parts_recommender ---');

  const existingParts = normalizeRecommendedParts(state.diagnosisResult?.recommendedParts);
  if (existingParts.length > 0) {
    console.log('Parts already included in diagnosis — skipping extra LLM call');
    return {
      diagnosisResult: {
        ...state.diagnosisResult,
        recommendedParts: existingParts,
      },
    };
  }

  const messages = [
    new SystemMessage(
      `You are an automotive parts specialist. Given a vehicle and diagnosis, recommend the specific parts needed for the repair.

Respond with a JSON array of UP TO 5 part objects (no more than 5):
[
  {
    "partName": "Front Brake Pads",
    "partCategory": "Brakes",
    "oemPartNumber": "",
    "causationProbability": 85
  }
]

IMPORTANT: Use generic, descriptive part names only (e.g. "Input Shaft Bearing", "Torque Converter", "Oxygen Sensor"). Do NOT include specific transmission codes, component model numbers, or part family designators (e.g. do NOT say "5L80 Input Shaft" or "4L60E Torque Converter" — just say "Input Shaft" or "Torque Converter"). Leave oemPartNumber as an empty string.
causationProbability is an integer 0-100 representing how likely this part is the root cause. Assign different values — the most likely culprit gets the highest number.
Prioritize the most critical parts first. Maximum 5 parts.
Respond with ONLY the JSON array, no markdown fences or extra text.`
    ),
    new HumanMessage(
      `Vehicle: ${vehicleString(state.vehicleContext)}
${state.vehicleContext.mileage ? `Mileage: ${state.vehicleContext.mileage}` : ''}
Diagnosis: ${state.diagnosisResult.likelyCause}
Category: ${state.symptomCategory}`
    ),
  ];

  const response = await llm.invoke(messages);

  let parts;
  try {
    const cleaned = response.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    parts = JSON.parse(cleaned);
    if (!Array.isArray(parts)) parts = [];
    parts = parts.slice(0, 5); // Hard cap at 5 parts
  } catch {
    console.error('Failed to parse parts JSON, using empty array');
    parts = [];
  }

  // Merge parts into the diagnosis result
  const updatedResult = { ...state.diagnosisResult, recommendedParts: parts };
  console.log('Parts recommended:', parts.length);
  return { diagnosisResult: updatedResult };
}

// ─────────────────────────────────────────────────────────────────────
// Routing: after clarity_checker
// ─────────────────────────────────────────────────────────────────────
function routeAfterClarityCheck(state) {
  if (state.needsClarification) {
    console.log('ROUTE → clarify_asker');
    return 'clarify_asker';
  }
  console.log('ROUTE → diagnosis_writer');
  return 'diagnosis_writer';
}

// ─────────────────────────────────────────────────────────────────────
// Build the State Graph
// ─────────────────────────────────────────────────────────────────────
const workflow = new StateGraph(AgentState)
  .addNode('symptom_classifier', symptomClassifier)
  .addNode('rag_retriever', ragRetriever)
  .addNode('clarity_checker', clarityChecker)
  .addNode('clarify_asker', clarifyAsker)
  .addNode('diagnosis_writer', diagnosisWriter)
  .addNode('parts_recommender', partsRecommender)
  // Edges
  .addEdge('__start__', 'symptom_classifier')
  .addEdge('symptom_classifier', 'rag_retriever')
  .addEdge('rag_retriever', 'clarity_checker')
  .addConditionalEdges('clarity_checker', routeAfterClarityCheck, {
    clarify_asker: 'clarify_asker',
    diagnosis_writer: 'diagnosis_writer',
  })
  .addEdge('clarify_asker', '__end__')
  .addEdge('diagnosis_writer', 'parts_recommender')
  .addEdge('parts_recommender', '__end__');

const graph = workflow.compile();

// ─────────────────────────────────────────────────────────────────────
// Exported function: run the diagnostic agent
// ─────────────────────────────────────────────────────────────────────
async function runDiagnosis({ symptomDescription, vehicleContext, clarifyingAnswers = [] }) {
  console.log('=== Starting diagnostic agent ===');
  console.log('Vehicle:', vehicleString(vehicleContext));
  console.log('Symptom:', symptomDescription);

  const result = await graph.invoke({
    symptomDescription,
    vehicleContext,
    clarifyingAnswers,
  });

  console.log('=== Agent complete ===');
  return result;
}

module.exports = { runDiagnosis, generateReplacementProcess };

// ─────────────────────────────────────────────────────────────────────
// Standalone function: generate step-by-step part replacement process
// Uses RAG retrieval for vehicle-specific repair knowledge
// ─────────────────────────────────────────────────────────────────────
async function generateReplacementProcess({ partName, vehicleContext, diagnosisSummary }) {
  console.log('=== Generating replacement process for:', partName, '===');

  // 1. RAG retrieval for this specific part + vehicle
  let ragSection = '';
  try {
    const hasData = await isVehicleIngested(vehicleContext);
    if (hasData) {
      const query = `replace ${partName} ${vehicleString(vehicleContext)}`;
      const results = await ragRetrieveTool.invoke({
        query,
        vehicleContext,
        topK: 5,
        minScore: 0.25,
      });
      if (results.length > 0) {
        ragSection = `\n\nRelevant service manual excerpts:\n${results.map(r => `[Source: ${r.source || 'manual'}] ${r.content}`).join('\n---\n')}`;
        console.log(`RAG: found ${results.length} chunks for part replacement`);
      }
    }
  } catch (err) {
    console.error('RAG error during replacement process:', err.message);
  }

  // 2. LLM call for step-by-step replacement
  const messages = [
    new SystemMessage(
      `You are an expert automotive repair technician. Given a vehicle, a diagnosed issue, and a specific part, provide a clear step-by-step replacement process.

Respond with a JSON object:
{
  "steps": ["Disconnect the battery...", "Remove the cover...", ...],
  "tools": ["tool1", "tool2", ...],
  "estimatedTime": "e.g. 1-2 hours",
  "difficulty": "Easy" | "Moderate" | "Advanced",
  "warnings": ["safety warning 1", ...]
}

Be specific to the vehicle make/model/year. Include torque specs or part-specific notes when known from the provided service manual excerpts.
Do NOT invent specific component model numbers, transmission codes, or part family designators (e.g. do NOT say "5L80" or "4L60E"). Use generic descriptive names instead.
Do NOT prefix steps with numbers — just the description text for each step.
Respond with ONLY the JSON object, no markdown fences or extra text.`
    ),
    new HumanMessage(
      `Vehicle: ${vehicleString(vehicleContext)}
Part to replace: ${partName}
Diagnosis context: ${diagnosisSummary}${ragSection}`
    ),
  ];

  const response = await llm.invoke(messages);

  let result;
  try {
    let cleaned = response.content
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/```json?\n?/g, '').replace(/```/g, '')
      .trim();
    // Extract the first JSON object even if surrounded by text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in response');
    result = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Failed to parse replacement process JSON:', err.message);
    console.error('Raw content:', response.content.substring(0, 300));
    return {
      steps: ['Could not parse structured response. Please try again.'],
      tools: [],
      estimatedTime: 'Unknown',
      difficulty: 'Unknown',
      warnings: [],
    };
  }

  // Strip leading number prefixes from steps (e.g. "1. ", "2) ", "Step 3: ")
  if (Array.isArray(result.steps)) {
    result.steps = result.steps
      .filter(s => typeof s === 'string' && s.trim())
      .map(s => s.replace(/^\s*(?:step\s*)?\d+[\.\)\:\-]\s*/i, '').trim());
  }

  console.log('Replacement process generated:', result.steps?.length, 'steps');
  return result;
}
