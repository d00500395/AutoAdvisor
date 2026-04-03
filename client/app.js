/* =====================================================================
   AutoAdvisor — Vue.js Application
   Vehicle Selection Page with Cascading Dropdowns, VIN Decode, My Garage
   ===================================================================== */

const { createApp, ref, computed, watch, onMounted, nextTick } = Vue;
const { createRouter, createWebHistory, useRoute, onBeforeRouteLeave } = VueRouter;

function normalizeBasePath(basePath = '/') {
  if (!basePath || basePath === '/') return '/';
  return `/${String(basePath).replace(/^\/+|\/+$/g, '')}/`;
}

const appScriptSrc = document.currentScript?.src
  || document.querySelector('script[src$="app.js"]')?.src
  || window.location.href;

let APP_BASE_PATH = '/';
if (window.location.protocol !== 'file:') {
  try {
    const scriptUrl = new URL(appScriptSrc, window.location.href);
    APP_BASE_PATH = normalizeBasePath(scriptUrl.pathname.replace(/app\.js$/, ''));
  } catch {
    APP_BASE_PATH = '/';
  }
}

function appPath(path = '') {
  const cleaned = String(path || '').replace(/^\/+/, '');
  if (!cleaned) return APP_BASE_PATH;
  return APP_BASE_PATH === '/' ? `/${cleaned}` : `${APP_BASE_PATH}${cleaned}`;
}

const API = window.location.protocol === 'file:'
  ? 'http://localhost:3000/api'
  : `${window.location.origin}${appPath('api')}`;

// ─────────────────────────────────────────────────────────────────────
// Shared auth state — module-level reactive ref used by guard + root app
// ─────────────────────────────────────────────────────────────────────
const authUser = ref(null);

// ─────────────────────────────────────────────────────────────────────
// Template loader — fetches external .html template files
// ─────────────────────────────────────────────────────────────────────
async function loadTemplate(name) {
  const res = await fetch(appPath(`templates/${name}.html`));
  if (!res.ok) throw new Error(`Failed to load template: ${name}`);
  return res.text();
}

// ─────────────────────────────────────────────────────────────────────
// Shared composable: API helper
// ─────────────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const url = `${API}${path}`;
  const { signal, ...fetchOpts } = options;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...fetchOpts.headers },
    credentials: 'include',
    signal,
    ...fetchOpts,
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server returned non-JSON response (${res.status}). Try restarting the server.`);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ─────────────────────────────────────────────────────────────────────
// Page: Login / Register
// ─────────────────────────────────────────────────────────────────────
const LoginPage = {
  setup() {
    const isRegister = ref(false);
    const username = ref('');
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const error = ref('');

    function toggleMode() {
      isRegister.value = !isRegister.value;
      error.value = '';
    }

    async function submit() {
      error.value = '';
      if (!username.value.trim() || !password.value) {
        error.value = 'Username and password are required.';
        return;
      }
      if (isRegister.value && !email.value.trim()) {
        error.value = 'Email is required.';
        return;
      }

      loading.value = true;
      try {
        const endpoint = isRegister.value ? '/users/register' : '/users/login';
        const body = isRegister.value
          ? { username: username.value.trim(), email: email.value.trim(), password: password.value }
          : { username: username.value.trim(), password: password.value };

        const user = await apiFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(body),
        });

        // Clear any stale session data from before auth
        sessionStorage.removeItem('confirmedVehicle');

        // Set shared auth state and navigate
        authUser.value = user;
        router.push('/');
      } catch (e) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    }

    return { isRegister, username, email, password, loading, error, toggleMode, submit };
  },
  template: '',
};

// ─────────────────────────────────────────────────────────────────────
// Component: SearchableDropdown (type-ahead filtering — FR-03)
// ─────────────────────────────────────────────────────────────────────
const SearchableDropdown = {
  props: {
    options: { type: Array, default: () => [] },
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: 'Select...' },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    label: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const isOpen = ref(false);
    const search = ref('');
    const highlightIdx = ref(-1);
    const inputRef = ref(null);

    const filtered = computed(() => {
      if (!search.value) return props.options;
      const q = search.value.toLowerCase();
      return props.options.filter(o => o.toLowerCase().includes(q));
    });

    const displayValue = computed(() => {
      if (isOpen.value) return search.value;
      return props.modelValue || '';
    });

    function open() {
      if (props.disabled || props.loading) return;
      isOpen.value = true;
      search.value = '';
      highlightIdx.value = -1;
    }

    function close() {
      isOpen.value = false;
      search.value = '';
    }

    function select(val) {
      emit('update:modelValue', val);
      close();
    }

    function onInput(e) {
      search.value = e.target.value;
      highlightIdx.value = 0;
      if (!isOpen.value) isOpen.value = true;
    }

    function onKeydown(e) {
      if (!isOpen.value && (e.key === 'ArrowDown' || e.key === 'Enter')) {
        open();
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown') {
        highlightIdx.value = Math.min(highlightIdx.value + 1, filtered.value.length - 1);
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        highlightIdx.value = Math.max(highlightIdx.value - 1, 0);
        e.preventDefault();
      } else if (e.key === 'Enter' && highlightIdx.value >= 0) {
        select(filtered.value[highlightIdx.value]);
        e.preventDefault();
      } else if (e.key === 'Escape') {
        close();
      }
    }

    function onBlur() {
      // Delay to allow click on option to register
      setTimeout(close, 150);
    }

    return { isOpen, search, highlightIdx, filtered, displayValue, inputRef,
             open, close, select, onInput, onKeydown, onBlur };
  },
  template: '',
};

function getRootApp() {
  return app._instance?.proxy?.$root || null;
}

function persistConfirmedVehicle(vehicle) {
  const normalized = {
    year: vehicle.year ? String(vehicle.year) : '',
    make: vehicle.make || '',
    model: vehicle.model || '',
    trim: vehicle.trim || '',
    engine: vehicle.engine || '',
  };

  const root = getRootApp();
  if (root) root.confirmedVehicle = normalized;
  sessionStorage.setItem('confirmedVehicle', JSON.stringify(normalized));
}

function readConfirmedVehicle() {
  const root = getRootApp();
  if (root?.confirmedVehicle) return root.confirmedVehicle;

  try {
    return JSON.parse(sessionStorage.getItem('confirmedVehicle'));
  } catch {
    return null;
  }
}

function useVehicleSelection() {
  const tab = ref('manual');
  const years = ref([]);
  const makes = ref([]);
  const models = ref([]);
  const trimOptions = ref([]);

  const loadingYears = ref(false);
  const loadingMakes = ref(false);
  const loadingModels = ref(false);
  const loadingTrims = ref(false);

  const selectedYear = ref('');
  const selectedMake = ref('');
  const selectedModel = ref('');
  const selectedTrim = ref('');
  const selectedEngine = ref('');

  const vinInput = ref('');
  const vinError = ref('');
  const vinLoading = ref(false);
  const garageVehicles = ref([]);
  const error = ref('');

  const dropdownAborts = { makes: null, models: null, trims: null };

  const vehicleSummary = computed(() => {
    return [selectedYear.value, selectedMake.value, selectedModel.value,
      selectedTrim.value, selectedEngine.value].filter(Boolean).join(' ');
  });

  const canConfirm = computed(() => {
    return selectedYear.value && selectedMake.value && selectedModel.value;
  });

  async function fetchYears() {
    loadingYears.value = true;
    try { years.value = (await apiFetch('/vehicles/years')).map(String); }
    catch (e) { error.value = e.message; }
    finally { loadingYears.value = false; }
  }

  async function fetchMakes() {
    if (dropdownAborts.makes) dropdownAborts.makes.abort();
    dropdownAborts.makes = new AbortController();
    loadingMakes.value = true;
    try { makes.value = await apiFetch('/vehicles/makes', { signal: dropdownAborts.makes.signal }); }
    catch (e) { if (e.name !== 'AbortError') error.value = e.message; }
    finally { loadingMakes.value = false; }
  }

  async function fetchModels() {
    if (!selectedYear.value || !selectedMake.value) return;
    if (dropdownAborts.models) dropdownAborts.models.abort();
    dropdownAborts.models = new AbortController();
    loadingModels.value = true;
    try {
      models.value = await apiFetch(
        `/vehicles/models?year=${selectedYear.value}&make=${encodeURIComponent(selectedMake.value)}`,
        { signal: dropdownAborts.models.signal }
      );
    } catch (e) {
      if (e.name !== 'AbortError') error.value = e.message;
    } finally {
      loadingModels.value = false;
    }
  }

  async function fetchTrimOptions() {
    if (!selectedYear.value || !selectedMake.value || !selectedModel.value) return;
    if (dropdownAborts.trims) dropdownAborts.trims.abort();
    dropdownAborts.trims = new AbortController();
    loadingTrims.value = true;
    try {
      trimOptions.value = await apiFetch(
        `/vehicles/trims?year=${selectedYear.value}&make=${encodeURIComponent(selectedMake.value)}&model=${encodeURIComponent(selectedModel.value)}`,
        { signal: dropdownAborts.trims.signal }
      );
    } catch (e) {
      if (e.name !== 'AbortError') error.value = e.message;
    } finally {
      loadingTrims.value = false;
    }
  }

  async function fetchGarage() {
    try { garageVehicles.value = await apiFetch('/garage'); }
    catch { /* ignore */ }
  }

  async function applyVehicle(vehicle) {
    if (!vehicle) return;

    tab.value = 'manual';
    selectedYear.value = vehicle.year ? String(vehicle.year) : '';
    selectedMake.value = vehicle.make || '';
    selectedModel.value = '';
    selectedTrim.value = '';
    selectedEngine.value = '';

    await nextTick();

    if (selectedYear.value && selectedMake.value) {
      await fetchModels();
    }

    selectedModel.value = vehicle.model || '';

    if (selectedModel.value) {
      await fetchTrimOptions();
    }

    selectedTrim.value = vehicle.trim || '';
    selectedEngine.value = vehicle.engine || '';
  }

  function clearSelection() {
    selectedYear.value = '';
    selectedMake.value = '';
    selectedModel.value = '';
    selectedTrim.value = '';
    selectedEngine.value = '';
    vinInput.value = '';
    vinError.value = '';
    models.value = [];
    trimOptions.value = [];
  }

  async function decodeVin() {
    vinError.value = '';
    const vin = vinInput.value.trim().toUpperCase();
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      vinError.value = 'Invalid VIN format. Must be 17 alphanumeric characters (no I, O, or Q).';
      return;
    }
    vinLoading.value = true;
    try {
      const decoded = await apiFetch(`/vehicles/vin/${vin}`);
      await applyVehicle(decoded);
    } catch (e) {
      vinError.value = e.message || 'Unable to decode VIN. Please enter your vehicle manually.';
    } finally {
      vinLoading.value = false;
    }
  }

  async function initialize({ loadGarage = false, applyInitialVehicle = false } = {}) {
    await fetchYears();
    await fetchMakes();

    if (loadGarage) {
      await fetchGarage();
    }

    if (applyInitialVehicle) {
      const initialVehicle = garageVehicles.value.find(v => v.isDefault) || readConfirmedVehicle();
      if (initialVehicle?.year && initialVehicle?.make && initialVehicle?.model) {
        await applyVehicle(initialVehicle);
        persistConfirmedVehicle(initialVehicle);
        return true;
      }
    }

    return false;
  }

  watch(selectedYear, () => {
    selectedModel.value = '';
    selectedTrim.value = '';
    selectedEngine.value = '';
    models.value = [];
    trimOptions.value = [];
  });

  watch(selectedMake, () => {
    selectedModel.value = '';
    selectedTrim.value = '';
    selectedEngine.value = '';
    models.value = [];
    trimOptions.value = [];
  });

  watch(selectedModel, (val) => {
    selectedTrim.value = '';
    selectedEngine.value = '';
    trimOptions.value = [];
    if (val) fetchTrimOptions();
  });

  watch([selectedYear, selectedMake], ([year, make], [prevYear, prevMake]) => {
    if ((year && make) && (year !== prevYear || make !== prevMake)) {
      fetchModels();
    }
  });

  return {
    tab,
    years, makes, models, trimOptions,
    loadingYears, loadingMakes, loadingModels, loadingTrims,
    selectedYear, selectedMake, selectedModel, selectedTrim, selectedEngine,
    vinInput, vinError, vinLoading,
    garageVehicles,
    error,
    vehicleSummary, canConfirm,
    fetchGarage, applyVehicle, clearSelection, decodeVin, initialize,
  };
}

const VehicleSelectionForm = {
  components: { SearchableDropdown },
  props: {
    tab: { type: String, required: true },
    years: { type: Array, required: true },
    makes: { type: Array, required: true },
    models: { type: Array, required: true },
    trimOptions: { type: Array, required: true },
    loadingYears: { type: Boolean, default: false },
    loadingMakes: { type: Boolean, default: false },
    loadingModels: { type: Boolean, default: false },
    loadingTrims: { type: Boolean, default: false },
    selectedYear: { type: String, default: '' },
    selectedMake: { type: String, default: '' },
    selectedModel: { type: String, default: '' },
    selectedTrim: { type: String, default: '' },
    selectedEngine: { type: String, default: '' },
    vinInput: { type: String, default: '' },
    vinError: { type: String, default: '' },
    vinLoading: { type: Boolean, default: false },
    canConfirm: { type: Boolean, default: false },
    vehicleSummary: { type: String, default: '' },
    showConfirm: { type: Boolean, default: true },
    confirmLabel: { type: String, default: '✓ Confirm Vehicle' },
  },
  emits: [
    'update:tab',
    'update:selectedYear',
    'update:selectedMake',
    'update:selectedModel',
    'update:selectedTrim',
    'update:selectedEngine',
    'update:vinInput',
    'decode-vin',
    'confirm',
    'clear',
  ],
  template: '',
};

// ─────────────────────────────────────────────────────────────────────
// Page: Home / Dashboard
// ─────────────────────────────────────────────────────────────────────
const HomePage = {
  setup() {
    const garageVehicles = ref([]);
    const diagnoses = ref([]);
    const loading = ref(true);
    const isAuthenticated = computed(() => !!authUser.value);

    onMounted(async () => {
      try {
        if (!isAuthenticated.value) {
          garageVehicles.value = [];
          diagnoses.value = [];
          return;
        }

        const [garageRes, diagRes] = await Promise.all([
          apiFetch('/garage').catch(() => []),
          apiFetch('/diagnoses').catch(() => []),
        ]);
        garageVehicles.value = garageRes;
        diagnoses.value = diagRes;
      } finally {
        loading.value = false;
      }
    });

    function vStr(v) {
      return [v.year, v.make, v.model, v.trim].filter(Boolean).join(' ');
    }

    function vCtxStr(d) {
      const v = d.vehicleContext || {};
      return [v.year, v.make, v.model, v.trim].filter(Boolean).join(' ');
    }

    function fmtDate(iso) {
      if (!iso) return '';
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    async function deleteDiagnosis(id) {
      try {
        await apiFetch(`/diagnoses/${id}`, { method: 'DELETE' });
        diagnoses.value = diagnoses.value.filter(d => d._id !== id);
      } catch {}
    }

    const showDeleteAllModal = ref(false);
    const deleteOneId = ref(null);

    function confirmDeleteOne(id) {
      deleteOneId.value = id;
    }

    async function confirmDeleteOneAction() {
      const id = deleteOneId.value;
      deleteOneId.value = null;
      if (id) await deleteDiagnosis(id);
    }

    async function deleteAllDiagnoses() {
      showDeleteAllModal.value = false;
      const ids = diagnoses.value.map(d => d._id);
      await Promise.all(ids.map(id =>
        apiFetch(`/diagnoses/${id}`, { method: 'DELETE' }).catch(() => {})
      ));
      diagnoses.value = [];
    }

    return { garageVehicles, diagnoses, loading, isAuthenticated, vStr, vCtxStr, fmtDate, deleteDiagnosis, showDeleteAllModal, deleteAllDiagnoses, deleteOneId, confirmDeleteOne, confirmDeleteOneAction };
  },
  template: '',
};

// ─────────────────────────────────────────────────────────────────────
// Page: Vehicle Selector (/diagnose) — full multi-step diagnostic flow
// ─────────────────────────────────────────────────────────────────────
const DiagnosePage = {
  components: { VehicleSelectionForm },
  setup() {
    const route = useRoute();
    const selector = useVehicleSelection();
    const step = ref(1);       // 1=select vehicle, 2=describe symptom, 3=agent running, 4=results, 5=clarifying
    const isAuthenticated = computed(() => !!authUser.value);

    // Symptom input (Step 2)
    const symptomText = ref('');
    const mileage = ref('');

    // Agent state (Steps 3-5)
    const agentStatus = ref('');   // human-readable status
    const diagnosisId = ref(null);
    const diagnosisResult = ref(null);
    const clarifyingQuestions = ref([]);
    const clarifyingAnswers = ref([]);
    const diagnosisError = ref('');

    // Save state
    const diagnosisSaved = ref(false);
    const diagnosisSaveMsg = ref('');
    let loadingDiagnosis = false;

    // AbortControllers to cancel in-flight requests
    let diagnosisAbort = null;

    // --- Actions ---
    function confirmVehicle() {
      if (!selector.canConfirm.value) return;
      step.value = 2;

      persistConfirmedVehicle({
        year: selector.selectedYear.value,
        make: selector.selectedMake.value,
        model: selector.selectedModel.value,
        trim: selector.selectedTrim.value,
        engine: selector.selectedEngine.value,
      });
    }

    function editSelection() {
      step.value = 1;
    }

    function clearVehicleSelection() {
      selector.clearSelection();
      step.value = 1;
    }

    // Submit symptom to the diagnostic agent
    async function submitSymptom() {
      if (symptomText.value.trim().length < 10) {
        diagnosisError.value = 'Please describe the symptom in at least 10 characters.';
        return;
      }
      // Cancel any in-flight diagnosis request
      if (diagnosisAbort) diagnosisAbort.abort();
      diagnosisAbort = new AbortController();

      diagnosisError.value = '';
      diagnosisSaved.value = false;
      diagnosisSaveMsg.value = '';
      step.value = 3;
      agentStatus.value = 'Classifying symptom...';

      try {
        const payload = {
          symptomDescription: symptomText.value.trim(),
          vehicleContext: {
            year: Number(selector.selectedYear.value),
            make: selector.selectedMake.value,
            model: selector.selectedModel.value,
            trim: selector.selectedTrim.value || undefined,
            engine: selector.selectedEngine.value || undefined,
            mileage: mileage.value ? Number(mileage.value) : undefined,
          },
        };

        agentStatus.value = 'Running AI diagnostic agent...';
        const result = await apiFetch('/diagnoses', {
          method: 'POST',
          body: JSON.stringify(payload),
          signal: diagnosisAbort.signal,
        });

        if (result.status === 'clarifying') {
          diagnosisId.value = result._id;
          clarifyingQuestions.value = result.clarifyingQuestions;
          clarifyingAnswers.value = result.clarifyingQuestions.map(() => '');
          step.value = 5;
        } else {
          diagnosisResult.value = result;
          diagnosisId.value = result._id;
          replacementResults.value = {};
          replacementVisible.value = {};
          populateReplacementResults(result);
          step.value = 4;
        }
      } catch (e) {
        if (e.name === 'AbortError') return; // Request was cancelled, ignore
        diagnosisError.value = e.message || 'Diagnosis failed. Please try again.';
        step.value = 2;
      }
    }

    // Submit clarifying answers
    async function submitClarification() {
      const answers = clarifyingAnswers.value.filter(a => a.trim());
      if (answers.length === 0) {
        diagnosisError.value = 'Please answer at least one question.';
        return;
      }
      if (diagnosisAbort) diagnosisAbort.abort();
      diagnosisAbort = new AbortController();

      diagnosisError.value = '';
      diagnosisSaved.value = false;
      diagnosisSaveMsg.value = '';
      step.value = 3;
      agentStatus.value = 'Processing your answers...';

      try {
        const result = await apiFetch(`/diagnoses/${diagnosisId.value}/followup`, {
          method: 'POST',
          body: JSON.stringify({ clarifyingAnswers: clarifyingAnswers.value }),
          signal: diagnosisAbort.signal,
        });
        diagnosisResult.value = result;
        replacementResults.value = {};
        replacementVisible.value = {};
        populateReplacementResults(result);
        step.value = 4;
      } catch (e) {
        if (e.name === 'AbortError') return;
        diagnosisError.value = e.message || 'Follow-up failed. Please try again.';
        step.value = 5;
      }
    }

    // Save diagnosis — only available for signed-in users
    function saveDiagnosis() {
      if (!isAuthenticated.value) return;
      diagnosisSaved.value = true;
      diagnosisSaveMsg.value = 'Diagnosis saved!';
    }

    // Delete unsaved diagnosis from DB
    async function deleteDiagnosis() {
      if (diagnosisId.value) {
        try { await apiFetch(`/diagnoses/${diagnosisId.value}`, { method: 'DELETE' }); } catch {}
      }
    }

    // Custom "Save or Delete?" modal state
    const unsavedModal = ref(false);
    let unsavedResolve = null;

    function showUnsavedModal() {
      return new Promise(resolve => {
        unsavedResolve = resolve;
        unsavedModal.value = true;
      });
    }

    async function unsavedChoice(choice) {
      unsavedModal.value = false;
      if (choice === 'save') {
        saveDiagnosis();
      } else {
        await deleteDiagnosis();
      }
      if (unsavedResolve) unsavedResolve();
      unsavedResolve = null;
    }

    // Prompt before leaving unsaved results
    async function promptUnsaved() {
      if (step.value === 4 && diagnosisResult.value && !diagnosisSaved.value) {
        if (!isAuthenticated.value) {
          await deleteDiagnosis();
          return;
        }
        await showUnsavedModal();
      }
    }

    function clearDiagnosisState() {
      diagnosisResult.value = null;
      diagnosisId.value = null;
      clarifyingQuestions.value = [];
      clarifyingAnswers.value = [];
      diagnosisError.value = '';
      diagnosisSaved.value = false;
      diagnosisSaveMsg.value = '';
      replacementResults.value = {};
      replacementVisible.value = {};
    }

    // Start a new diagnosis
    async function newDiagnosis() {
      await promptUnsaved();
      symptomText.value = '';
      mileage.value = '';
      clearDiagnosisState();
      step.value = 2;
    }

    // Edit and resubmit the previous prompt while keeping vehicle context
    async function editLastPrompt() {
      await promptUnsaved();
      clearDiagnosisState();
      step.value = 2;
    }

    // Navigation guard — prompt to save when leaving via route change
    onBeforeRouteLeave(async () => {
      if (step.value === 4 && diagnosisResult.value && !diagnosisSaved.value) {
        if (!isAuthenticated.value) {
          await deleteDiagnosis();
          return;
        }
        await showUnsavedModal();
      }
    });

    // Quick-select from garage
    async function quickSelect(v) {
      await selector.applyVehicle(v);
      confirmVehicle();
    }

    // Save to garage
    const saveLoading = ref(false);
    const saveMessage = ref('');

    async function saveToGarage() {
      if (!isAuthenticated.value) {
        saveMessage.value = 'Sign in to save vehicles to your garage.';
        return;
      }

      saveLoading.value = true;
      saveMessage.value = '';
      try {
        await apiFetch('/garage', {
          method: 'POST',
          body: JSON.stringify({
            year: Number(selector.selectedYear.value),
            make: selector.selectedMake.value,
            model: selector.selectedModel.value,
            trim: selector.selectedTrim.value,
            engine: selector.selectedEngine.value,
          }),
        });
        saveMessage.value = 'Vehicle saved to garage!';
        selector.fetchGarage();
      } catch (e) {
        saveMessage.value = e.message;
      } finally {
        saveLoading.value = false;
      }
    }

    // ── Load a saved diagnosis by ID ──
    async function loadDiagnosis(id) {
      try {
        loadingDiagnosis = true;
        agentStatus.value = 'Loading saved diagnosis...';
        step.value = 3;
        const diag = await apiFetch(`/diagnoses/${id}`);

        // Restore vehicle selection
        if (diag.vehicleContext) {
          await selector.applyVehicle(diag.vehicleContext);
        }

        // Restore symptom & mileage
        symptomText.value = diag.symptomDescription || '';
        mileage.value = diag.vehicleContext?.mileage ? String(diag.vehicleContext.mileage) : '';

        // Restore clarifying Q&A
        clarifyingQuestions.value = diag.clarifyingQuestions || [];
        clarifyingAnswers.value = diag.clarifyingAnswers || [];

        // Restore result
        diagnosisId.value = diag._id;
        diagnosisResult.value = diag;
        diagnosisSaved.value = true;
        diagnosisSaveMsg.value = '';

        // Restore replacement processes
        replacementResults.value = {};
        replacementVisible.value = {};
        populateReplacementResults(diag);

        step.value = 4;
        loadingDiagnosis = false;
      } catch (e) {
        loadingDiagnosis = false;
        diagnosisError.value = e.message || 'Failed to load diagnosis.';
        step.value = 1;
      }
    }

    // Pre-populate replacement results from a saved diagnosis
    function populateReplacementResults(diag) {
      if (diag.replacementProcesses?.length) {
        const results = {};
        for (const rp of diag.replacementProcesses) {
          results[rp.partName] = rp;
        }
        replacementResults.value = results;
      }
    }

    // Init
    onMounted(async () => {
      const applied = await selector.initialize({ loadGarage: true, applyInitialVehicle: true });

      // Check for route param to load saved diagnosis
      if (route.params.id) {
        await loadDiagnosis(route.params.id);
      } else if (applied) {
        step.value = 2;
      }
    });

    function vStr(v) {
      return [v.year, v.make, v.model, v.trim].filter(Boolean).join(' ');
    }

    watch([
      selector.selectedYear,
      selector.selectedMake,
      selector.selectedModel,
      selector.selectedTrim,
      selector.selectedEngine,
    ], () => {
      if (step.value > 1 && !loadingDiagnosis) step.value = 1;
    });

    // ── Part replacement process ──
    const replacementLoading = ref(null);   // partName currently loading
    const replacementResults = ref({});     // { partName: { steps, tools, ... } } — persists once loaded
    const replacementVisible = ref({});     // { partName: boolean } — toggles visibility

    async function getReplacementProcess(part) {
      const key = part.partName;

      // If already loaded, just toggle visibility
      if (replacementResults.value[key] && !replacementResults.value[key].error) {
        replacementVisible.value = {
          ...replacementVisible.value,
          [key]: !replacementVisible.value[key],
        };
        return;
      }

      // If previous error, clear it and retry
      if (replacementResults.value[key]?.error) {
        const copy = { ...replacementResults.value };
        delete copy[key];
        replacementResults.value = copy;
      }

      replacementLoading.value = key;
      try {
        const result = await apiFetch('/diagnoses/replacement-process', {
          method: 'POST',
          body: JSON.stringify({
            partName: key,
            vehicleContext: {
              year: Number(selector.selectedYear.value),
              make: selector.selectedMake.value,
              model: selector.selectedModel.value,
              trim: selector.selectedTrim.value || undefined,
              engine: selector.selectedEngine.value || undefined,
            },
            diagnosisSummary: diagnosisResult.value?.diagnosisResult?.likelyCause || '',
            diagnosisId: diagnosisResult.value?._id || undefined,
          }),
        });
        replacementResults.value = { ...replacementResults.value, [key]: result };
        replacementVisible.value = { ...replacementVisible.value, [key]: true };
      } catch (e) {
        replacementResults.value = { ...replacementResults.value, [key]: { error: e.message } };
      } finally {
        replacementLoading.value = null;
      }
    }

    return {
      ...selector,
      step,
      isAuthenticated,
      confirmVehicle, editSelection, clearVehicleSelection,
      quickSelect,
      saveLoading, saveMessage, saveToGarage,
      vStr,
      // Diagnosis state
      symptomText, mileage,
      agentStatus, diagnosisId, diagnosisResult,
      clarifyingQuestions, clarifyingAnswers, diagnosisError,
      submitSymptom, submitClarification, newDiagnosis, editLastPrompt,
      // Save
      diagnosisSaved, diagnosisSaveMsg, saveDiagnosis,
      unsavedModal, unsavedChoice,
      // Replacement process
      replacementLoading, replacementResults, replacementVisible, getReplacementProcess,
    };
  },
  template: '',
};

// ─────────────────────────────────────────────────────────────────────
// Page: My Garage (/vehicles)
// ─────────────────────────────────────────────────────────────────────
const GaragePage = {
  components: { VehicleSelectionForm },
  setup() {
    const selector = useVehicleSelection();
    const vehicles = ref([]);
    const loading = ref(true);
    const error = ref('');

    // Add vehicle form
    const showForm = ref(false);
    const nickname = ref('');
    const formLoading = ref(false);
    const formError = ref('');
    const editingNicknameId = ref('');
    const nicknameDraft = ref('');

    async function loadVehicles() {
      loading.value = true;
      try { vehicles.value = await apiFetch('/garage'); }
      catch(e) { error.value = e.message; }
      finally { loading.value = false; }
    }

    async function addVehicle() {
      formError.value = '';
      if (!selector.selectedYear.value || !selector.selectedMake.value || !selector.selectedModel.value) {
        formError.value = 'Year, Make, and Model are required.';
        return;
      }
      formLoading.value = true;
      try {
        await apiFetch('/garage', {
          method: 'POST',
          body: JSON.stringify({
            year: Number(selector.selectedYear.value),
            make: selector.selectedMake.value.trim(),
            model: selector.selectedModel.value.trim(),
            trim: selector.selectedTrim.value.trim(),
            engine: selector.selectedEngine.value.trim(),
            nickname: nickname.value.trim(),
          }),
        });
        nickname.value = '';
        selector.clearSelection();
        showForm.value = false;
        await loadVehicles();
      } catch(e) { formError.value = e.message; }
      finally { formLoading.value = false; }
    }

    async function removeVehicle(id) {
      try {
        const wasDefault = vehicles.value.find(v => v._id === id)?.isDefault;
        await apiFetch(`/garage/${id}`, { method: 'DELETE' });
        if (wasDefault) {
          sessionStorage.removeItem('confirmedVehicle');
          const root = getRootApp();
          if (root) root.confirmedVehicle = null;
        }
        await loadVehicles();
      } catch(e) { error.value = e.message; }
    }

    const removeModalId = ref(null);

    function confirmRemove(id) {
      removeModalId.value = id;
    }

    async function confirmRemoveAction() {
      const id = removeModalId.value;
      removeModalId.value = null;
      if (id) await removeVehicle(id);
    }

    async function setDefault(id) {
      try {
        const vehicle = await apiFetch(`/garage/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ isDefault: true }),
        });
        persistConfirmedVehicle(vehicle);
        await loadVehicles();
      } catch(e) { error.value = e.message; }
    }

    function beginNicknameEdit(vehicle) {
      editingNicknameId.value = vehicle._id;
      nicknameDraft.value = vehicle.nickname || '';
    }

    function cancelNicknameEdit() {
      editingNicknameId.value = '';
      nicknameDraft.value = '';
    }

    async function saveNickname(id) {
      try {
        await apiFetch(`/garage/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ nickname: nicknameDraft.value.trim() }),
        });
        cancelNicknameEdit();
        await loadVehicles();
      } catch (e) {
        error.value = e.message;
      }
    }

    function vStr(v) {
      return [v.year, v.make, v.model, v.trim].filter(Boolean).join(' ');
    }

    function selectVehicle(v) {
      persistConfirmedVehicle(v);
    }

    onMounted(async () => {
      await selector.initialize();
      await loadVehicles();
    });

    return {
      ...selector,
      vehicles, loading, error,
      showForm, nickname, formLoading, formError,
      editingNicknameId, nicknameDraft,
      addVehicle, removeVehicle, setDefault,
      beginNicknameEdit, cancelNicknameEdit, saveNickname,
      vStr, selectVehicle,
      removeModalId, confirmRemove, confirmRemoveAction,
    };
  },
  template: '',
};

// ─────────────────────────────────────────────────────────────────────
// Vue Router
// ─────────────────────────────────────────────────────────────────────
const routes = [
  { path: '/login',    component: LoginPage, meta: { public: true } },
  { path: '/',         component: HomePage },
  { path: '/diagnose', component: DiagnosePage },
  { path: '/diagnose/:id', component: DiagnosePage },
  { path: '/vehicles', component: GaragePage },
];

const router = createRouter({
  history: createWebHistory(APP_BASE_PATH),
  routes,
});

// Navigation guard — silently restore session if available
router.beforeEach(async (to, from, next) => {
  // Only attempt restore once
  if (!authUser.value && !authUser._checked) {
    try {
      const user = await apiFetch('/users/me');
      authUser.value = user;
    } catch {
      // Not logged in — that's fine
    }
    authUser._checked = true;
  }
  // Garage requires auth
  if (to.path === '/vehicles' && !authUser.value) {
    return next('/login');
  }
  next();
});

// ─────────────────────────────────────────────────────────────────────
// App Instance
// ─────────────────────────────────────────────────────────────────────
const app = createApp({
  data() {
    // Restore from session
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem('confirmedVehicle')); } catch {}
    return {
      confirmedVehicle: saved || null,
    };
  },
  computed: {
    currentUser() {
      return authUser.value;
    },
    vehicleString() {
      if (!this.confirmedVehicle) return '';
      const v = this.confirmedVehicle;
      return [v.year, v.make, v.model, v.trim, v.engine].filter(Boolean).join(' ');
    },
  },
  methods: {
    changeVehicle() {
      this.$router.push('/diagnose');
    },
    clearVehicle() {
      this.confirmedVehicle = null;
      sessionStorage.removeItem('confirmedVehicle');
    },
    async logout() {
      try { await apiFetch('/users/logout', { method: 'POST' }); } catch {}
      authUser.value = null;
      this.confirmedVehicle = null;
      sessionStorage.removeItem('confirmedVehicle');
      this.$router.push('/login');
    },
  },
});

app.use(router);

// Load external templates, then mount
Promise.all([
  loadTemplate('SearchableDropdown').then(t => { SearchableDropdown.template = t; }),
  loadTemplate('VehicleSelectionForm').then(t => { VehicleSelectionForm.template = t; }),
  loadTemplate('LoginPage').then(t => { LoginPage.template = t; }),
  loadTemplate('HomePage').then(t => { HomePage.template = t; }),
  loadTemplate('DiagnosePage').then(t => { DiagnosePage.template = t; }),
  loadTemplate('GaragePage').then(t => { GaragePage.template = t; }),
]).then(() => {
  app.mount('#app');
}).catch(err => {
  console.error('Failed to load templates:', err);
  document.getElementById('app').innerHTML =
    '<p style="color:red;padding:2rem;">Failed to load application templates. Please refresh.</p>';
});
