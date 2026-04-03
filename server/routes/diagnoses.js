const express = require('express');
const router = express.Router();
const Diagnosis = require('../models/Diagnosis');
const { runDiagnosis, generateReplacementProcess } = require('../agent/graph');

const GUEST_DIAG_RETENTION_MS = 24 * 60 * 60 * 1000;

async function cleanupExpiredGuestDiagnoses() {
  const cutoff = new Date(Date.now() - GUEST_DIAG_RETENTION_MS);
  await Diagnosis.deleteMany({
    userId: { $exists: false },
    createdAt: { $lt: cutoff },
  });
}

function rememberGuestDiagnosis(req, diagnosisId) {
  if (!req.session || req.session.userId) return;

  const ids = Array.isArray(req.session.guestDiagnosisIds)
    ? req.session.guestDiagnosisIds.map(String)
    : [];
  const id = String(diagnosisId);

  if (!ids.includes(id)) ids.push(id);
  req.session.guestDiagnosisIds = ids.slice(-25);
}

function buildDiagnosisAccessQuery(req, diagnosisId) {
  if (req.session?.userId) {
    return { _id: diagnosisId, userId: req.session.userId };
  }

  const guestIds = Array.isArray(req.session?.guestDiagnosisIds)
    ? req.session.guestDiagnosisIds.map(String)
    : [];

  if (!guestIds.includes(String(diagnosisId))) {
    return null;
  }

  return { _id: diagnosisId, userId: { $exists: false } };
}

function buildDiagnosisListFilter(req) {
  if (req.session?.userId) {
    return { userId: req.session.userId };
  }

  const guestIds = Array.isArray(req.session?.guestDiagnosisIds)
    ? req.session.guestDiagnosisIds.map(String)
    : [];

  if (guestIds.length === 0) {
    return null;
  }

  return { _id: { $in: guestIds }, userId: { $exists: false } };
}

// POST /api/diagnoses — Submit a symptom, triggers the AI agent
router.post('/', async (req, res) => {
  try {
    await cleanupExpiredGuestDiagnoses();

    const { symptomDescription, vehicleContext, vehicleId } = req.body;

    if (!symptomDescription || symptomDescription.trim().length < 10) {
      return res.status(400).json({ error: 'Symptom description must be at least 10 characters.' });
    }
    if (!vehicleContext || !vehicleContext.year || !vehicleContext.make || !vehicleContext.model) {
      return res.status(400).json({ error: 'Vehicle context (year, make, model) is required.' });
    }

    // Create a pending diagnosis record
    const diagnosis = await Diagnosis.create({
      userId: req.session?.userId || undefined,
      vehicleId: vehicleId || undefined,
      symptomDescription: symptomDescription.trim(),
      vehicleContext,
      status: 'pending',
    });

    rememberGuestDiagnosis(req, diagnosis._id);

    // Run the agent
    const agentResult = await runDiagnosis({
      symptomDescription: symptomDescription.trim(),
      vehicleContext,
    });

    // Check if the agent needs clarification
    if (agentResult.needsClarification && agentResult.clarifyingQuestions.length > 0) {
      diagnosis.clarifyingQuestions = agentResult.clarifyingQuestions;
      diagnosis.status = 'clarifying';
      await diagnosis.save();

      return res.json({
        _id: diagnosis._id,
        status: 'clarifying',
        clarifyingQuestions: agentResult.clarifyingQuestions,
      });
    }

    // Agent produced a full diagnosis
    diagnosis.diagnosisResult = agentResult.diagnosisResult;
    diagnosis.ragSourcesUsed = agentResult.ragSourcesUsed || [];
    diagnosis.status = 'complete';
    await diagnosis.save();

    return res.json({
      ...diagnosis.toObject(),
      ragAvailable: agentResult.ragAvailable ?? false,
    });
  } catch (err) {
    console.error('Diagnosis error:', err);
    return res.status(500).json({ error: 'Diagnosis failed. Please try again.' });
  }
});

// POST /api/diagnoses/:id/followup — Submit answers to clarifying questions
router.post('/:id/followup', async (req, res) => {
  try {
    await cleanupExpiredGuestDiagnoses();

    const { clarifyingAnswers } = req.body;
    const query = buildDiagnosisAccessQuery(req, req.params.id);
    if (!query) {
      return res.status(404).json({ error: 'Diagnosis not found.' });
    }
    const diagnosis = await Diagnosis.findOne(query);

    if (!diagnosis) {
      return res.status(404).json({ error: 'Diagnosis not found.' });
    }
    if (diagnosis.status !== 'clarifying') {
      return res.status(400).json({ error: 'This diagnosis is not awaiting clarification.' });
    }
    if (!Array.isArray(clarifyingAnswers) || clarifyingAnswers.length === 0) {
      return res.status(400).json({ error: 'Please provide answers to the clarifying questions.' });
    }

    diagnosis.clarifyingAnswers = clarifyingAnswers;

    // Re-run the agent with clarifying answers — it will skip clarity_checker
    const agentResult = await runDiagnosis({
      symptomDescription: diagnosis.symptomDescription,
      vehicleContext: diagnosis.vehicleContext,
      clarifyingAnswers,
    });

    diagnosis.diagnosisResult = agentResult.diagnosisResult;
    diagnosis.ragSourcesUsed = agentResult.ragSourcesUsed || [];
    diagnosis.status = 'complete';
    await diagnosis.save();

    return res.json({
      ...diagnosis.toObject(),
      ragAvailable: agentResult.ragAvailable ?? false,
    });
  } catch (err) {
    console.error('Follow-up error:', err);
    return res.status(500).json({ error: 'Follow-up failed. Please try again.' });
  }
});

// GET /api/diagnoses — List all diagnoses
router.get('/', async (req, res) => {
  try {
    await cleanupExpiredGuestDiagnoses();

    const filter = buildDiagnosisListFilter(req);
    if (!filter) {
      return res.json([]);
    }
    if (req.query.vehicleId) filter.vehicleId = req.query.vehicleId;
    const diagnoses = await Diagnosis.find(filter).sort({ createdAt: -1 });
    res.json(diagnoses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch diagnoses.' });
  }
});

// GET /api/diagnoses/:id — Get a single diagnosis
router.get('/:id', async (req, res) => {
  try {
    await cleanupExpiredGuestDiagnoses();

    const query = buildDiagnosisAccessQuery(req, req.params.id);
    if (!query) return res.status(404).json({ error: 'Diagnosis not found.' });
    const diagnosis = await Diagnosis.findOne(query);
    if (!diagnosis) return res.status(404).json({ error: 'Diagnosis not found.' });
    res.json(diagnosis);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch diagnosis.' });
  }
});

// DELETE /api/diagnoses/:id — Delete a diagnosis
router.delete('/:id', async (req, res) => {
  try {
    await cleanupExpiredGuestDiagnoses();

    const query = buildDiagnosisAccessQuery(req, req.params.id);
    if (!query) return res.status(404).json({ error: 'Diagnosis not found.' });
    const diagnosis = await Diagnosis.findOneAndDelete(query);
    if (!diagnosis) return res.status(404).json({ error: 'Diagnosis not found.' });
    res.json({ message: 'Diagnosis deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete diagnosis.' });
  }
});

// POST /api/diagnoses/replacement-process — Generate step-by-step part replacement
router.post('/replacement-process', async (req, res) => {
  try {
    const { partName, vehicleContext, diagnosisSummary, diagnosisId } = req.body;

    if (!partName || !vehicleContext || !diagnosisSummary) {
      return res.status(400).json({ error: 'partName, vehicleContext, and diagnosisSummary are required.' });
    }

    const result = await generateReplacementProcess({ partName, vehicleContext, diagnosisSummary });

    // Save to diagnosis if diagnosisId provided and this request has access to it
    if (diagnosisId) {
      const query = buildDiagnosisAccessQuery(req, diagnosisId);
      if (query) {
        await Diagnosis.findOneAndUpdate(
          query,
          { $push: { replacementProcesses: { partName, ...result } } }
        );
      }
    }

    res.json(result);
  } catch (err) {
    console.error('Replacement process error:', err);
    res.status(500).json({ error: 'Failed to generate replacement process.' });
  }
});

module.exports = router;
