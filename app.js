const state = {
  view: "dashboard",
  selectedPatient: null,
  odontogramPatientId: null,
  treatmentPatientId: null,
  prescriptionPatientId: null,
  agendaDate: new Date().toISOString().slice(0, 10),
  selectedTooth: 14,
  toothMode: "permanent",
  odontograms: [],
  patients: [],
  appointments: [],
  treatments: [],
  treatmentPlans: [],
  invoices: [],
  prescriptions: [],
  xrays: [],
  settings: {},
};
const NAV = [
  ["dashboard", "⌂", "dashboard"],
  ["odontogram", "◈", "odontogram"],
  ["patients", "♙", "patients"],
  ["treatments", "▣", "treatments"],
  ["treatmentPlan", "▤", "treatmentPlan"],
  ["appointments", "▦", "appointments"],
  ["prescriptions", "Rx", "prescriptions"],
  ["xrays", "▧", "xrays"],
  ["settings", "⚙", "settings"],
];
const PROCEDURES = [
  ["decay", "decay"],
  ["filling", "filling"],
  ["crown", "crown"],
  ["rct", "rct"],
  ["extract", "extract"],
  ["implant", "implant"],
  ["clear", "clear"],
];
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => `SYR ${Number(value || 0).toFixed(2)}`;
function setText() {
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";
  $$("[data-i18n]").forEach(
    (node) => (node.textContent = t(node.dataset.i18n)),
  );
  $$("[data-i18n-placeholder]").forEach(
    (node) => (node.placeholder = t(node.dataset.i18nPlaceholder)),
  );
  $("#langBtn").textContent = currentLanguage === "ar" ? "English" : "العربية";
  $("#doctorName").textContent = state.settings.doctorName || "Dr. Hussein";
  $("#clinicName").textContent = state.settings.clinicName || t("appName");
  const collapsed = document.body.classList.contains("sidebar-collapsed");
  $("#sidebarToggle").setAttribute(
    "aria-label",
    collapsed ? t("sidebarExpand") : t("sidebarCollapse"),
  );
  $("#sidebarToggle").setAttribute("aria-expanded", String(!collapsed));
}
function renderNav() {
  $("#nav").innerHTML = NAV.map(
    ([id, icon, key]) =>
      `<button class="nav-item ${state.view === id ? "active" : ""}" data-view="${id}"><span class="nav-icon">${icon}</span><span data-i18n="${key}">${t(key)}</span></button>`,
  ).join("");
  $$(".nav-item").forEach(
    (button) =>
      (button.onclick = () => {
        state.view = button.dataset.view;
        render();
      }),
  );
}
async function refresh(preserveEmptySelection = false) {
  [
    state.patients,
    state.odontograms,
    state.appointments,
    state.treatments,
    state.treatmentPlans,
    state.invoices,
    state.prescriptions,
    state.xrays,
  ] = await Promise.all(
    [
      "patients",
      "odontograms",
      "appointments",
      "treatments",
      "treatmentPlans",
      "invoices",
      "prescriptions",
      "xrays",
    ].map(dbGetAll),
  );

  for (const patient of state.patients) {
    if ("email" in patient || "bloodType" in patient) {
      const { email, bloodType, ...cleanPatient } = patient;
      await dbPut("patients", cleanPatient);
    }
  }
  state.patients = await dbGetAll("patients");
  state.settings = (await dbGetAll("settings"))[0] || {
    id: 1,
    currencySymbol: "SYR",
    clinicName: "------ Dental Clinic",
    doctorName: "Dr. ------",
    workStartHour: "09:00",
    workEndHour: "18:00",
    slotDuration: 30,
    currentLanguage: "ar",
    pinEnabled: false,
    pinHash: "",
  };
  currentLanguage = state.settings.currentLanguage || "ar";
  state.selectedPatient = preserveEmptySelection
    ? null
    : state.selectedPatient
      ? state.patients.find(
          (patient) => patient.id === state.selectedPatient.id,
        ) ||
        state.patients[0] ||
        null
      : state.patients[0] || null;
  for (const treatment of state.treatments) {
    if (treatment.status === "Planned") {
      await dbPut("treatments", {
        ...treatment,
        status: "planned",
      });
    }
  }

  state.treatments = await dbGetAll("treatments");
  render();
}

async function hashPIN(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
function lockApp() {
  const lockScreen = $("#lockScreen");

  if (!lockScreen) {
    console.error("PIN lock screen was not found.");
    return;
  }

  document.querySelector(".app-shell").classList.add("app-locked");

  lockScreen.classList.remove("hidden");

  $("#pinInput").value = "";
  $("#newPINInput").value = "";
  $("#confirmPINInput").value = "";
  $("#pinError").textContent = "";

  $("#unlockSection").classList.remove("hidden");
  $("#setupPINSection").classList.add("hidden");

  $("#lockTitle").textContent = "Dentistry";
  $("#lockMessage").textContent = "Enter your PIN to continue";

  setTimeout(() => {
    $("#pinInput").focus();
  }, 50);
}

function unlockApp() {
  document.querySelector(".app-shell").classList.remove("app-locked");

  $("#lockScreen").classList.add("hidden");

  $("#pinInput").value = "";
  $("#pinError").textContent = "";
}
function showPINSetup() {
  // Never show setup if a PIN is already configured.
  if (state.settings.pinEnabled === true) {
    lockApp();
    return;
  }

  const lockScreen = $("#lockScreen");

  if (!lockScreen) {
    return;
  }

  document.querySelector(".app-shell").classList.add("app-locked");

  lockScreen.classList.remove("hidden");

  $("#unlockSection").classList.add("hidden");
  $("#setupPINSection").classList.remove("hidden");

  $("#lockTitle").textContent = "Set up your PIN";
  $("#lockMessage").textContent =
    "Create a 4–6 digit PIN to protect your clinic";

  $("#pinError").textContent = "";

  $("#newPINInput").value = "";
  $("#confirmPINInput").value = "";

  setTimeout(() => {
    $("#newPINInput").focus();
  }, 50);
}
async function savePIN() {
  const pin = $("#newPINInput").value.trim();

  const confirmPIN = $("#confirmPINInput").value.trim();

  if (!/^\d{4,6}$/.test(pin)) {
    $("#pinError").textContent = "PIN must contain 4–6 digits.";

    return;
  }

  if (pin !== confirmPIN) {
    $("#pinError").textContent = "PINs do not match.";

    return;
  }

  const pinHash = await hashPIN(pin);

  const newSettings = {
    ...state.settings,

    id: 1,

    pinEnabled: true,

    pinHash,
  };

  await dbPut("settings", newSettings);

  state.settings = newSettings;

  $("#pinError").textContent = "";

  unlockApp();

  resetInactivityTimer();
}
let inactivityTimer = null;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);

  if (!state.settings.pinEnabled) {
    return;
  }

  inactivityTimer = setTimeout(
    () => {
      lockApp();
    },
    10 * 60 * 1000,
  );
}

async function verifyPIN() {
  const pin = $("#pinInput").value.trim();

  if (!pin) {
    $("#pinError").textContent = "Please enter your PIN.";

    return;
  }

  if (!state.settings.pinHash) {
    $("#pinError").textContent = "No PIN has been configured.";

    return;
  }

  try {
    const enteredHash = await hashPIN(pin);

    if (enteredHash === state.settings.pinHash) {
      unlockApp();

      resetInactivityTimer();
    } else {
      $("#pinError").textContent = "Incorrect PIN.";

      $("#pinInput").value = "";

      $("#pinInput").focus();
    }
  } catch (error) {
    console.error("PIN verification failed:", error);

    $("#pinError").textContent = "Unable to verify PIN.";
  }
}

function render() {
  setText();
  renderNav();
  const section = NAV.find((item) => item[0] === state.view);
  $("#currentSection").textContent = section
    ? t(section[2]).toUpperCase()
    : "OVERVIEW";
  $("#selectedPatientLabel").textContent =
    state.view === "appointments"
      ? ""
      : state.selectedPatient?.name || t("selectPatient");
  $(".page-heading h1").textContent = section ? t(section[2]) : t("dashboard");
  const views = {
    dashboard: renderDashboard,
    odontogram: renderOdontogram,
    patients: renderPatients,
    treatments: renderTreatments,
    treatmentPlan: renderTreatmentPlans,
    appointments: renderAppointments,
    prescriptions: renderPrescriptions,
    xrays: renderXrays,
    settings: renderSettings,
  };
  $("#view").innerHTML = (views[state.view] || renderDashboard)();
  bindView();
}
function renderDashboard() {
  const upcoming = state.appointments
    .filter((item) => item.date >= today())
    .sort((a, b) =>
      `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
    )
    .slice(0, 4);
  const owed = state.invoices.reduce(
    (sum, item) => sum + Number(item.balance || 0),
    0,
  );
  return `<div class="stats-grid"><div class="stat"><div class="stat-icon">♙</div><div><div class="stat-label">${t("activePatients")}</div><div class="stat-value">${state.patients.length}</div></div></div><div class="stat"><div class="stat-icon">◷</div><div><div class="stat-label">${t("upcoming")}</div><div class="stat-value">${upcoming.length}</div></div></div><div class="stat"><div class="stat-icon">₿</div><div><div class="stat-label">${t("outstanding")}</div><div class="stat-value">${money(owed)}</div></div></div></div><div class="content-grid"><section class="card"><div class="card-heading"><h2>${t("upcoming")}</h2><button class="button button-primary" data-action="addAppointment">＋ ${t("addAppointment")}</button></div>${upcoming.length ? upcoming.map((item) => `<div class="appointment dashboard-appointment"><div><b>${esc(item.patientName)}</b><small>${esc(item.procedure || "Clinical visit")} · ${esc(item.startTime)} · ${t(item.status)}</small></div><button class="appointment-delete" data-delete-appointment="${item.id}" title="${t("deleteAppointment")}" aria-label="${t("deleteAppointment")}">×</button></div>`).join("") : `<p class="muted">${t("noVisits")}</p>`}</section><section class="card"><div class="card-heading"><h2>${t("patients")}</h2><button class="button button-ghost" data-view="patients">${t("add")}</button></div>${state.patients.slice(0, 5).map(patientRow).join("")}</section></div>`;
}
function patientRow(patient) {
  return `<div class="patient-row" data-patient-id="${patient.id}"><div><b>${esc(patient.name)}</b><small><bdi dir="ltr">${esc(patient.phone || "No phone")}</bdi></small></div><span class="badge ${patient.allergies ? "badge-danger" : ""}">${patient.allergies ? "!" : "OK"}</span></div>`;
}
function patientSelector(id, selectedPatient) {
  const options = state.patients
    .map(
      (patient) =>
        `<option value="${patient.id}" ${patient.id === selectedPatient?.id ? "selected" : ""}>${esc(patient.name)} · ${esc(patient.phone || "")}</option>`,
    )
    .join("");
  return `<div class="field patient-context-picker"><label>${t("patient")}</label><select id="${id}"><option value="">${t("selectPatient")}</option>${options}</select></div>`;
}
function renderOdontogram() {
  const primary = state.toothMode === "primary";
  const odontogramPatient =
    state.patients.find(
      (patient) => patient.id === Number(state.odontogramPatientId),
    ) || state.selectedPatient;
  const patientOptions = state.patients
    .map(
      (patient) =>
        `<option value="${patient.id}" ${patient.id === odontogramPatient?.id ? "selected" : ""}>${esc(patient.name)} · ${esc(patient.phone || "")}</option>`,
    )
    .join("");
  const upperCount = primary ? 10 : 16;
  const lowerCount = primary ? 10 : 16;
  state.selectedPatient = odontogramPatient;
  return `<section class="card workspace-card"><div class="workspace-toolbar"><div><div class="eyebrow">${t("odontogram")}</div><h2>${odontogramPatient ? esc(odontogramPatient.name) : t("selectPatient")}</h2><div class="field odontogram-patient-picker"><label>${t("patient")}</label><select id="odontogramPatientSelect"><option value="">${t("selectPatient")}</option>${patientOptions}</select></div></div><div class="segmented"><button class="${!primary ? "active" : ""}" data-mode="permanent">${t("permanent")}</button><button class="${primary ? "active" : ""}" data-mode="primary">${t("primary")}</button></div></div><div class="odontogram-wrap ${primary ? "primary-odontogram" : ""}"><div class="arch-title">${t("maxillary")}</div><div class="teeth-row">${Array.from({ length: upperCount }, (_, i) => tooth(primary ? i + 1 : i + 1)).join("")}</div><div class="arch-title" style="margin-top:26px">${t("mandibular")}</div><div class="teeth-row">${Array.from({ length: lowerCount }, (_, i) => tooth(primary ? i + 11 : i + 17)).join("")}</div><div class="legend">${[
    ["healthy", "healthy"],
    ["decay", "decay"],
    ["filling", "filling"],
    ["crown", "crown"],
    ["rct", "rct"],
    ["extract", "extract"],
    ["implant", "implant"],
  ]
    .map(
      ([color, key]) =>
        `<span><i style="background:var(--${color === "healthy" ? "surface" : color})"></i>${t(key)}</span>`,
    )
    .join("")}</div></div></section>`;
}
function tooth(number) {
  const primary = state.toothMode === "primary";
  const record = state.odontograms.find(
    (item) =>
      item.patientId === state.selectedPatient?.id &&
      item.toothNumber === number,
  );
  const condition = record?.condition || "healthy";
  const label = primary ? String.fromCharCode(64 + number) : number;
  return `<button class="tooth ${primary ? "primary-tooth " : ""}${condition}" data-tooth="${number}" title="${t("tooth")} ${label}"><span class="tooth-mark"></span><span class="tooth-label">${label}</span></button>`;
}
function renderPatients() {
  return `<section class="content-grid"><div class="card"><div class="card-heading"><h2>${t("patients")}</h2><button class="button button-primary" data-action="newPatient">＋ ${t("newPatient")}</button></div>${patientSelector("patientRecordSelect", state.selectedPatient)}<div id="patientList">${state.patients.map(patientRow).join("")}</div></div><div class="card">${state.selectedPatient ? patientForm(state.selectedPatient) : `<p class="muted">${t("selectPatient")}</p>`}</div></section>`;
}
function patientForm(patient) {
  return `<div class="card-heading"><h2>${esc(patient.name)}</h2><span class="badge ${patient.allergies ? "badge-danger" : ""}">${patient.allergies ? "! " + esc(patient.allergies) : t("healthy")}</span></div>${patient.medicalFlags ? `<div class="alert-banner">⚠ ${esc(patient.medicalFlags)}</div>` : ""}<form id="patientForm" class="form-grid"><div class="field"><label>${t("patient")}</label><input name="name" value="${esc(patient.name)}" required></div><div class="field"><label>${t("phone")}</label><input name="phone" value="${esc(patient.phone)}"></div><div class="field"><label>${t("location")}</label><input name="location" value="${esc(patient.location)}"></div><div class="field"><label>${t("workStudy")}</label><input name="workStudy" value="${esc(patient.workStudy)}"></div><div class="field"><label>${t("dob")}</label><input type="date" name="dob" value="${esc(patient.dob)}"></div><div class="field"><label>${t("gender")}</label><select name="gender"><option value="Female" ${patient.gender === "Female" || !patient.gender ? "selected" : ""}>Female</option><option value="Male" ${patient.gender === "Male" ? "selected" : ""}>Male</option></select></div><div class="field"><label>${t("allergies")}</label><input name="allergies" value="${esc(patient.allergies)}"></div><div class="field full-span"><label>${t("medicalFlags")}</label><input name="medicalFlags" value="${esc(patient.medicalFlags)}"></div><div class="field full-span"><label>${t("notes")}</label><textarea name="notes" rows="3">${esc(patient.notes)}</textarea></div><div class="form-actions full-span"><button class="button button-primary">${t("save")}</button><button type="button" class="button delete-patient-button" data-delete-patient="${patient.id}">${t("deletePatient")}</button></div></form><div class="card-heading" style="margin-top:28px"><h3>${t("clinicalHistory")}</h3></div><div class="timeline">${
    state.treatments
      .filter((item) => item.patientId === patient.id)
      .map(
        (item) =>
          `<div class="timeline-item"><span class="timeline-dot"></span><div><b>${esc(item.description)}</b><small>${esc(item.date)} · ${money(item.fee)} · ${esc(item.status)}</small></div></div>`,
      )
      .join("") || `<p class="muted">${t("noVisits")}</p>`
  }</div>`;
}
function addTreatmentPlan() {
  const patient = state.selectedPatient;

  if (!patient) {
    toast(t("selectPatient"));

    return;
  }

  modal(
    t("addTreatmentPlan"),
    `
        <form
            id="treatmentPlanForm"
            class="form-grid"
        >

            <div class="field">

                <label>
                    ${t("tooth")}
                </label>

                <input
                    type="number"
                    name="toothNumber"
                    min="1"
                    max="85"
                >

            </div>

            <div class="field">

                <label>
                    ${t("diagnosis")}
                </label>

                <input
                    name="diagnosis"
                    required
                >

            </div>

            <div class="field full-span">

                <label>
                    ${t("procedure")}
                </label>

                <input
                    name="procedure"
                    required
                >

            </div>

            <div class="field">

                <label>
                    ${t("fee")}
                </label>

                <input
                    type="number"
                    name="fee"
                    min="0"
                    step="0.01"
                    value="0"
                >

            </div>

            <div class="field">

                <label>
                    ${t("priority")}
                </label>

                <select name="priority">

                    <option value="low">
                        ${t("low")}
                    </option>

                    <option
                        value="medium"
                        selected
                    >
                        ${t("medium")}
                    </option>

                    <option value="high">
                        ${t("high")}
                    </option>

                </select>

            </div>

            <div class="field">

                <label>
                    ${t("status")}
                </label>

                <select name="status">

                    <option value="planned">
                        ${t("planned")}
                    </option>

                    <option value="accepted">
                        ${t("accepted")}
                    </option>

                    <option value="scheduled">
                        ${t("scheduled")}
                    </option>

                    <option value="in-progress">
                        ${t("inProgress")}
                    </option>

                    <option value="completed">
                        ${t("completed")}
                    </option>

                    <option value="cancelled">
                        ${t("cancelled")}
                    </option>

                </select>

            </div>

            <div class="field full-span">

                <label>
                    ${t("notes")}
                </label>

                <textarea
                    name="notes"
                    rows="3"
                ></textarea>

            </div>

            <div class="form-actions full-span">

                <button
                    class="button button-primary"
                    type="submit"
                >
                    ${t("save")}
                </button>

            </div>

        </form>
        `,
  );

  $("#treatmentPlanForm").onsubmit = async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(event.target));

    try {
      await dbPut("treatmentPlans", {
        patientId: patient.id,

        toothNumber: Number(data.toothNumber) || null,

        diagnosis: data.diagnosis,

        procedure: data.procedure,

        fee: Number(data.fee) || 0,

        priority: data.priority,

        status: data.status,

        notes: data.notes || "",

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString(),
      });

      $("#modal").classList.remove("show");

      await refresh();
    } catch (error) {
      console.error("Failed to create treatment plan:", error);

      toast("Unable to save treatment plan.");
    }
  };
}
function editTreatmentPlan(id) {
  const plan = state.treatmentPlans.find((item) => item.id === id);

  if (!plan) {
    return;
  }

  modal(
    t("edit"),
    `
        <form
            id="editTreatmentPlanForm"
            class="form-grid"
        >

            <div class="field">

                <label>
                    ${t("tooth")}
                </label>

                <input
                    type="number"
                    name="toothNumber"
                    min="1"
                    max="85"
                    value="${esc(plan.toothNumber || "")}"
                >

            </div>

            <div class="field">

                <label>
                    ${t("diagnosis")}
                </label>

                <input
                    name="diagnosis"
                    required
                    value="${esc(plan.diagnosis || "")}"
                >

            </div>

            <div class="field full-span">

                <label>
                    ${t("procedure")}
                </label>

                <input
                    name="procedure"
                    required
                    value="${esc(plan.procedure || "")}"
                >

            </div>

            <div class="field">

                <label>
                    ${t("fee")}
                </label>

                <input
                    type="number"
                    name="fee"
                    min="0"
                    step="0.01"
                    value="${Number(plan.fee || 0)}"
                >

            </div>

            <div class="field">

                <label>
                    ${t("priority")}
                </label>

                <select name="priority">

                    <option
                        value="low"
                        ${plan.priority === "low" ? "selected" : ""}
                    >
                        ${t("low")}
                    </option>

                    <option
                        value="medium"
                        ${
                          plan.priority === "medium" || !plan.priority
                            ? "selected"
                            : ""
                        }
                    >
                        ${t("medium")}
                    </option>

                    <option
                        value="high"
                        ${plan.priority === "high" ? "selected" : ""}
                    >
                        ${t("high")}
                    </option>

                </select>

            </div>

            <div class="field">

                <label>
                    ${t("status")}
                </label>

                <select name="status">

                    <option
                        value="planned"
                        ${plan.status === "planned" ? "selected" : ""}
                    >
                        ${t("planned")}
                    </option>

                    <option
                        value="accepted"
                        ${plan.status === "accepted" ? "selected" : ""}
                    >
                        ${t("accepted")}
                    </option>

                    <option
                        value="scheduled"
                        ${plan.status === "scheduled" ? "selected" : ""}
                    >
                        ${t("scheduled")}
                    </option>

                    <option
                        value="in-progress"
                        ${plan.status === "in-progress" ? "selected" : ""}
                    >
                        ${t("inProgress")}
                    </option>

                    <option
                        value="completed"
                        ${plan.status === "completed" ? "selected" : ""}
                    >
                        ${t("completed")}
                    </option>

                    <option
                        value="cancelled"
                        ${plan.status === "cancelled" ? "selected" : ""}
                    >
                        ${t("cancelled")}
                    </option>

                </select>

            </div>

            <div class="field full-span">

                <label>
                    ${t("notes")}
                </label>

                <textarea
                    name="notes"
                    rows="3"
                >${esc(plan.notes || "")}</textarea>

            </div>

            <div class="form-actions full-span">

                <button
                    class="button button-primary"
                    type="submit"
                >
                    ${t("save")}
                </button>

            </div>

        </form>
        `,
  );

  $("#editTreatmentPlanForm").onsubmit = async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(event.target));

    try {
      await dbPut("treatmentPlans", {
        ...plan,

        toothNumber: Number(data.toothNumber) || null,

        diagnosis: data.diagnosis,

        procedure: data.procedure,

        fee: Number(data.fee) || 0,

        priority: data.priority,

        status: data.status,

        notes: data.notes || "",

        updatedAt: new Date().toISOString(),
      });

      $("#modal").classList.remove("show");

      await refresh();
    } catch (error) {
      console.error("Failed to update treatment plan:", error);

      toast("Unable to update treatment plan.");
    }
  };
}
function renderTreatmentPlans() {
  const patient = state.selectedPatient;

  if (!patient) {
    return `
            <section class="card">
                <p class="muted">
                    ${t("selectPatient")}
                </p>
            </section>
        `;
  }

  const plans = state.treatmentPlans.filter(
    (item) => item.patientId === patient.id,
  );

  return `
        <section class="card">

            <div class="card-heading">

                <div>
                    <h2>
                        ${t("treatmentPlan")}
                    </h2>

                    <p class="muted">
                        ${esc(patient.name)}
                    </p>
                </div>

                <button
                    class="button button-primary"
                    data-action="addTreatmentPlan"
                >
                    ＋
                    ${t("addTreatmentPlan")}
                </button>

            </div>

            ${
              plans.length
                ? `
                        <div class="treatment-plan-list">

                            ${plans
                              .map(
                                (item) =>
                                  `
                                        <div
                                            class="treatment-plan-item"
                                        >

                                            <div
                                                class="treatment-plan-main"
                                            >

                                                <div
                                                    class="treatment-plan-tooth"
                                                >
                                                    ${
                                                      item.toothNumber
                                                        ? `#${esc(item.toothNumber)}`
                                                        : "—"
                                                    }
                                                </div>

                                                <div>
                                                    <strong>
                                                        ${esc(item.procedure)}
                                                    </strong>

                                                    <small>
                                                        ${t("diagnosis")}:
                                                        ${esc(
                                                          item.diagnosis || "—",
                                                        )}
                                                    </small>
                                                </div>

                                            </div>

                                            <div class="treatment-plan-details">

    <span class="badge">
        ${t(item.priority || "medium")}
    </span>

    <span class="badge">
        ${t(item.status || "planned")}
    </span>

    <strong>
        ${money(item.fee)}
    </strong>

    <div class="treatment-plan-actions">

        <button
            type="button"
            class="button button-ghost"
            data-edit-treatment-plan="${item.id}"
        >
            ${t("edit")}
        </button>

        <button
            type="button"
            class="button treatment-plan-delete"
            data-delete-treatment-plan="${item.id}"
        >
            ×
        </button>

    </div>

</div>

                                        </div>
                                    `,
                              )
                              .join("")}

                        </div>
                    `
                : `
                        <p class="muted">
                            ${t("noTreatmentPlans")}
                        </p>
                    `
            }

        </section>
    `;
}
function renderTreatments() {
  const treatmentPatient =
    state.patients.find(
      (patient) => patient.id === Number(state.treatmentPatientId),
    ) || state.selectedPatient;
  const items = state.treatments.filter(
    (item) => item.patientId === treatmentPatient?.id,
  );
  const total = items.reduce((sum, item) => sum + Number(item.fee || 0), 0);
  const patientOptions = state.patients
    .map(
      (patient) =>
        `<option value="${patient.id}" ${patient.id === treatmentPatient?.id ? "selected" : ""}>${esc(patient.name)} · ${esc(patient.phone || "")}</option>`,
    )
    .join("");
  return `<section class="content-grid"><div class="card"><div class="card-heading"><h2>${t("treatments")}</h2><button class="button button-primary" data-action="addTreatment">＋ ${t("addTreatment")}</button></div><div class="field treatment-patient-picker"><label>${t("patient")}</label><select id="treatmentPatientSelect"><option value="">${t("selectPatient")}</option>${patientOptions}</select></div><div class="table-wrap"><table class="data-table"><thead><tr><th>${t("tooth")}</th><th>${t("procedure")}</th><th>${t("date")}</th><th>${t("fee")}</th><th>${t("status")}</th></tr></thead><tbody>${items
    .map(
      (
        item,
      ) => `<tr><td>#${item.toothNumber || "—"}</td><td>${esc(item.description)}</td><td>${esc(item.date)}</td><td>${money(item.fee)}</td><td>
    <select
        class="treatment-status-select"
        data-treatment-status="${item.id}"
    >
        <option
            value="planned"
            ${item.status === "planned" ? "selected" : ""}
        >
            ${t("planned")}
        </option>

        <option
            value="accepted"
            ${item.status === "accepted" ? "selected" : ""}
        >
            ${t("accepted")}
        </option>

        <option
            value="scheduled"
            ${item.status === "scheduled" ? "selected" : ""}
        >
            ${t("scheduled")}
        </option>

        <option
            value="in-progress"
            ${item.status === "in-progress" ? "selected" : ""}
        >
            ${t("inProgress")}
        </option>

        <option
            value="completed"
            ${item.status === "completed" ? "selected" : ""}
        >
            ${t("completed")}
        </option>

        <option
            value="cancelled"
            ${item.status === "cancelled" ? "selected" : ""}
        >
            ${t("cancelled")}
        </option>
    </select>
</td></tr>`,
    )
    .join(
      "",
    )}</tbody></table></div></div><div class="card invoice-print"><div class="card-heading"><h2>${t("invoice")}</h2><button class="button button-ghost" onclick="window.print()">⌁ ${t("print")}</button></div><div class="patient-summary"><div><h3>${esc(treatmentPatient?.name || t("selectPatient"))}</h3><p>${t("invoice")} · ${today()}</p></div><span class="badge badge-blue">SYR</span></div><div class="form-actions"><span class="muted">${t("invoiceTotal")}</span><strong>${money(total)}</strong></div></div></section>`;
}
function timeToMinutes(value) {
  const [hours, minutes] = String(value || "00:00")
    .split(":")
    .map(Number);
  return hours * 60 + minutes;
}
function minutesToTime(value) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
function calendarDateLabel(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    currentLanguage === "ar" ? "ar-SA" : "en-US",
    { weekday: "short", day: "numeric", month: "short" },
  );
}
function calendarWeekDates(centerDate) {
  const center = new Date(`${centerDate}T12:00:00`);
  const day = center.getDay();
  const start = new Date(center);
  start.setDate(center.getDate() - day);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}
function renderAppointments() {
  const entries = state.appointments.filter(
    (item) => item.date === state.agendaDate,
  );
  const start = timeToMinutes(state.settings.workStartHour || "09:00");
  const end = timeToMinutes(state.settings.workEndHour || "18:00");
  const slot = Number(state.settings.slotDuration) || 30;
  const times = [];
  for (let value = start; value <= end; value += slot)
    times.push(minutesToTime(value));
  const weekDates = calendarWeekDates(state.agendaDate);
  const weekStrip = weekDates
    .map(
      (date) =>
        `<button class="calendar-day ${date === state.agendaDate ? "active" : ""}" data-agenda-date="${date}"><span>${calendarDateLabel(date)}</span><b>${state.appointments.filter((item) => item.date === date).length}</b></button>`,
    )
    .join("");
  return `<section class="card calendar-card"><div class="card-heading"><div><h2>${t("appointments")}</h2><div class="agenda-date-controls"><button class="icon-button" data-agenda-date="previous" title="${t("previousDay")}" aria-label="${t("previousDay")}">‹</button><button class="button button-ghost" data-agenda-date="today">${t("today")}</button><b>${calendarDateLabel(state.agendaDate)}</b><button class="icon-button" data-agenda-date="next" title="${t("nextDay")}" aria-label="${t("nextDay")}">›</button></div></div><button class="button button-primary" data-action="addAppointment">＋ ${t("addAppointment")}</button></div><div class="calendar-week">${weekStrip}</div><div class="calendar-summary"><strong>${entries.length}</strong><span>${t("appointments")} · ${state.agendaDate}</span></div><div class="agenda">${times
    .map(
      (time) =>
        `<div class="agenda-row"><div class="agenda-time">${time}</div><div>${entries
          .filter((item) => item.startTime === time)
          .map(
            (item) =>
              `<div class="appointment"><div><b>${esc(item.patientName)} · ${esc(item.procedure)}</b><span>${esc(item.startTime)} · ${t(item.status)}</span></div><button class="appointment-delete" data-delete-appointment="${item.id}" title="${t("deleteAppointment")}" aria-label="${t("deleteAppointment")}">×</button></div>`,
          )
          .join("")}</div></div>`,
    )
    .join("")}</div></section>`;
}
function renderPrescriptions() {
  const prescriptionPatient =
    state.patients.find(
      (patient) => patient.id === Number(state.prescriptionPatientId),
    ) || state.selectedPatient;
  const prescriptions = state.prescriptions.filter(
    (item) => item.patientId === prescriptionPatient?.id,
  );
  const patientOptions = state.patients
    .map(
      (patient) =>
        `<option value="${patient.id}" ${patient.id === prescriptionPatient?.id ? "selected" : ""}>${esc(patient.name)} · ${esc(patient.phone || "")}</option>`,
    )
    .join("");
  return `<section class="content-grid prescriptions-screen"><div class="card"><div class="card-heading"><h2>${t("prescriptions")}</h2><button class="button button-primary" data-action="addPrescription">＋ ${t("addPrescription")}</button></div><div class="field treatment-patient-picker"><label>${t("patient")}</label><select id="prescriptionPatientSelect"><option value="">${t("selectPatient")}</option>${patientOptions}</select></div>${prescriptions.map((item) => `<div class="prescription-row"><div><b>${item.medications.map((m) => esc(m.name)).join(", ")}</b><small>${esc(item.date)} · ${item.medications.length} ${t("medication")}</small></div><div class="prescription-actions"><button class="button button-ghost" data-edit-prescription="${item.id}">${t("edit")}</button><button class="button button-ghost" data-print-prescription="${item.id}">${t("print")}</button></div></div><div class="prescription-print ${state.printPrescriptionId === item.id ? "active" : ""}"><header><h1>${esc(state.settings.clinicName || t("appName"))}</h1><p>${esc(state.settings.doctorName || "")}</p></header><h2>${t("prescriptions")}</h2><p><b>${t("patient")}:</b> ${esc(prescriptionPatient?.name || "")}</p><p><b>${t("date")}:</b> ${esc(item.date)}</p><hr>${item.medications.map((m) => `<div class="prescription-medication"><h3>${esc(m.name)}</h3><p>${t("dosage")}: ${esc(m.dosage)} · ${t("frequency")}: ${esc(m.frequency)} · ${t("duration")}: ${esc(m.duration)}</p><p>${t("instructions")}: ${esc(m.instructions)}</p></div>`).join("")}<hr><p>${esc(item.notes || "")}</p><footer>${esc(state.settings.doctorName || "")}</footer></div>`).join("") || `<p class="muted">${t("noVisits")}</p>`}</div><div class="card"><h2>${t("medication")}</h2><p class="muted">${t("addPrescription")}</p><div class="badge badge-blue">Amoxicillin 500mg</div> <div class="badge badge-blue">Ibuprofen 400mg</div> <div class="badge badge-blue">Chlorhexidine 0.12%</div></div></section>`;
}

function renderXrays() {
  const images = state.xrays.filter(
    (item) => item.patientId === state.selectedPatient?.id,
  );

  return `
        <section class="card">

            <div class="card-heading">

                <div>
                    <h2>
                        ${t("xrays")}
                    </h2>

                    <p class="muted">
                        ${images.length}
                        ${t("saved")}
                    </p>
                </div>

            </div>

            ${patientSelector("xrayPatientSelect", state.selectedPatient)}

            ${
              state.selectedPatient
                ? `
                        <div class="xray-upload-form">

                            <div class="field">

                                <label>
                                    ${t("xrayType")}
                                </label>

                                <select id="xrayType">

                                    <option value="periapical">
                                        ${t("periapical")}
                                    </option>

                                    <option value="bitewing">
                                        ${t("bitewing")}
                                    </option>

                                    <option value="panoramic">
                                        ${t("panoramic")}
                                    </option>

                                    <option value="cephalometric">
                                        ${t("cephalometric")}
                                    </option>

                                    <option value="cbct">
                                        ${t("cbct")}
                                    </option>

                                    <option value="other">
                                        ${t("other")}
                                    </option>

                                </select>

                            </div>

                            <div class="field">

                                <label>
                                    ${t("toothNumber")}
                                </label>

                                <input
                                    id="xrayToothNumber"
                                    type="number"
                                    min="1"
                                    max="85"
                                    placeholder="${t("toothNumber")}"
                                >

                            </div>

                            <div class="field full-span">

                                <label>
                                    ${t("clinicalNotes")}
                                </label>

                                <textarea
                                    id="xrayNotes"
                                    rows="3"
                                    placeholder="${t("clinicalNotes")}"
                                ></textarea>

                            </div>

                            <label class="button button-primary">

                                ＋ ${t("upload")}

                                <input
                                    id="xrayUpload"
                                    type="file"
                                    accept="image/*"
                                    hidden
                                >

                            </label>

                        </div>
                    `
                : `
                        <p class="muted">
                            ${t("selectPatient")}
                        </p>
                    `
            }

            <div class="xray-grid">

                ${
                  images.length
                    ? images
                        .map(
                          (item) => `
                                    <div class="xray-item">

                                        <img
                                            src="${item.base64Data}"
                                            alt="${esc(item.filename)}"
                                        >

                                        <div class="xray-info">

                                            <div>

                                                <b>
                                                    ${esc(item.filename)}
                                                </b>

                                                <div class="xray-meta">

                                                    <span>
                                                        ${t(
                                                          item.type || "other",
                                                        )}
                                                    </span>

                                                    ${
                                                      item.toothTag
                                                        ? `
                                                                <span>
                                                                    ${t("toothNumber")}
                                                                    #${esc(item.toothTag)}
                                                                </span>
                                                            `
                                                        : ""
                                                    }

                                                    <span>
                                                        ${esc(item.date)}
                                                    </span>

                                                </div>

                                                ${
                                                  item.notes
                                                    ? `
                                                            <p class="xray-notes">
                                                                ${esc(
                                                                  item.notes,
                                                                )}
                                                            </p>
                                                        `
                                                    : ""
                                                }

                                            </div>

                                            <button
                                                type="button"
                                                class="xray-delete-button"
                                                data-delete-xray="${item.id}"
                                                title="${t("deleteXray")}"
                                                aria-label="${t("deleteXray")}"
                                            >
                                                ×
                                            </button>

                                        </div>

                                    </div>
                                `,
                        )
                        .join("")
                    : `
                            <p class="muted">
                                ${t("noVisits")}
                            </p>
                        `
                }

            </div>

        </section>
    `;
}

function renderSettings() {
  const s = state.settings;
  return `<section class="content-grid"><div class="card"><div class="card-heading"><h2>${t("clinic")}</h2></div><form id="settingsForm" class="form-grid"><div class="field"><label>${t("clinic")}</label><input name="clinicName" value="${esc(s.clinicName)}"></div><div class="field"><label>${t("doctor")}</label><input name="doctorName" value="${esc(s.doctorName)}"></div><div class="field full-span"><label>${t("phone")}</label><input name="phone" value="${esc(s.phone)}"></div><div class="field full-span"><label>${t("address")}</label><input name="address" value="${esc(s.address)}"></div><div class="field"><label>${t("currency")}</label><option selected>SYR</option></div><div class="field"><label>${t("slot")}</label><select name="slotDuration"><option ${String(s.slotDuration) === "15" ? "selected" : ""}>15</option><option ${String(s.slotDuration) === "30" ? "selected" : ""}>30</option><option ${String(s.slotDuration) === "60" ? "selected" : ""}>60</option></select></div><div class="field"><label>${t("start")}</label><input type="time" name="workStartHour" value="${esc(s.workStartHour)}"></div><div class="field"><label>${t("end")}</label><input type="time" name="workEndHour" value="${esc(s.workEndHour)}"></div><div class="form-actions full-span"><button class="button button-primary">${t("save")}</button></div></form></div><div class="card"><div class="card-heading"><h2>${t("backup")}</h2></div><p class="muted">${t("saved")}</p><div class="form-actions" style="justify-content:flex-start"><button class="button button-primary" data-action="export">${t("export")}</button><button class="button button-ghost" data-action="import">${t("import")}</button><button class="button" style="color:var(--danger);border:1px solid #fecaca" data-action="wipe">${t("wipe")}</button></div></div></section>`;
}
async function openTooth(number) {
  state.selectedTooth = number;
  const record = state.odontograms.find(
    (item) =>
      item.patientId === state.selectedPatient?.id &&
      item.toothNumber === number,
  );
  $("#drawerTooth").textContent = `#${number}`;
  $("#drawerAnatomy").textContent =
    currentLanguage === "ar" ? "رحى علوية / سفلية" : "Molar · clinical surface";
  $("#toothActions").innerHTML = PROCEDURES.map(
    ([key, label]) =>
      `<button class="action-btn ${record?.condition === key ? "active" : ""}" data-procedure="${key}">${t(label)}</button>`,
  ).join("");
  $("#toothNote").value = record?.notes || "";
  document.body.classList.add("drawer-open");
  $$(".action-btn").forEach(
    (button) => (button.onclick = () => updateTooth(button.dataset.procedure)),
  );
}
async function updateTooth(condition) {
  if (!state.selectedPatient) return;

  const existing = state.odontograms.find(
    (item) =>
      item.patientId === state.selectedPatient.id &&
      item.toothNumber === state.selectedTooth,
  );

  if (condition === "clear") {
    if (existing) {
      await dbDelete("odontograms", existing.id);
    }
  } else {
    await dbPut("odontograms", {
      ...(existing || {}),
      patientId: state.selectedPatient.id,
      toothNumber: state.selectedTooth,
      condition,
      procedure: t(condition),
      timestamp: new Date().toISOString(),
    });
  }

  await refresh();
  openTooth(state.selectedTooth, false);
}
function modal(title, body) {
  $("#modalContent").innerHTML = `<h2>${title}</h2>${body}`;
  $("#modal").classList.add("show");
}

async function getPatientBackup(patientId) {
  const relatedStores = [
    "odontograms",
    "appointments",
    "treatments",
    "invoices",
    "prescriptions",
    "xrays",
  ];

  const backup = {
    patient: await dbGet("patients", patientId),

    related: {},
  };

  for (const store of relatedStores) {
    const records = await dbGetAll(store);

    backup.related[store] = records.filter(
      (record) => record.patientId === patientId,
    );
  }

  return backup;
}

async function restorePatientBackup(backup) {
  if (!backup?.patient) {
    throw new Error("Invalid patient backup");
  }

  await dbPut("patients", backup.patient);

  for (const [store, records] of Object.entries(backup.related)) {
    for (const record of records) {
      await dbPut(store, record);
    }
  }

  await refresh();
}

async function compressXray(file) {
  const bitmap = await createImageBitmap(file);

  const maxWidth = 1600;
  const maxHeight = 1600;

  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);

  const width = Math.round(bitmap.width * scale);

  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create canvas context.");
  }

  context.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image compression failed."));
          return;
        }

        resolve(blob);
      },
      "image/webp",
      0.82,
    );
  });
}
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Could not read compressed image."));
    };

    reader.readAsDataURL(blob);
  });
}
function bindView() {
  $$("[data-patient-id]").forEach(
    (row) =>
      (row.onclick = () => {
        state.selectedPatient = state.patients.find(
          (p) => p.id === Number(row.dataset.patientId),
        );
        render();
      }),
  );
  $$("[data-view]").forEach(
    (el) =>
      (el.onclick = () => {
        state.view = el.dataset.view;
        render();
      }),
  );
  $$("[data-delete-treatment-plan]").forEach((button) => {
    button.onclick = async () => {
      const planId = Number(button.dataset.deleteTreatmentPlan);

      if (!confirm(t("deleteTreatmentPlan") + "?")) {
        return;
      }

      try {
        const plan = await dbGet("treatmentPlans", planId);

        if (!plan) {
          return;
        }

        await dbDelete("treatmentPlans", planId);

        await refresh();

        showUndo(t("treatmentPlanDeleted"), async () => {
          await dbPut("treatmentPlans", plan);

          await refresh();
        });
      } catch (error) {
        console.error("Treatment plan deletion failed:", error);

        toast("Unable to delete treatment plan.");
      }
    };
  });
  $$("[data-edit-treatment-plan]").forEach((button) => {
    button.onclick = () => {
      const planId = Number(button.dataset.editTreatmentPlan);

      editTreatmentPlan(planId);
    };
  });
  $$("[data-tooth]").forEach(
    (el) => (el.onclick = () => openTooth(Number(el.dataset.tooth))),
  );
  $$("[data-mode]").forEach(
    (el) =>
      (el.onclick = () => {
        state.toothMode = el.dataset.mode;
        render();
      }),
  );
  $$("[data-delete-appointment]").forEach((button) => {
    button.onclick = async () => {
      if (!confirm(t("confirmDeleteAppointment"))) {
        return;
      }

      const appointmentId = Number(button.dataset.deleteAppointment);

      try {
        const appointment = await dbGet("appointments", appointmentId);

        if (!appointment) {
          return;
        }

        await dbDelete("appointments", appointmentId);

        await refresh();

        showUndo("Appointment deleted", async () => {
          await dbPut("appointments", appointment);

          await refresh();
        });
      } catch (error) {
        console.error("Appointment deletion failed:", error);

        toast("Unable to delete appointment.");
      }
    };
  });

  $$("[data-delete-patient]").forEach((button) => {
    button.onclick = async () => {
      if (!confirm(t("confirmDeletePatient"))) {
        return;
      }

      const patientId = Number(button.dataset.deletePatient);

      try {
        const backup = await getPatientBackup(patientId);

        await dbDeletePatient(patientId);

        if (state.selectedPatient?.id === patientId) {
          state.selectedPatient = null;
        }

        state.treatmentPatientId = null;

        state.prescriptionPatientId = null;

        await refresh(true);

        showUndo("Patient deleted", async () => {
          await restorePatientBackup(backup);

          state.selectedPatient = backup.patient;

          await refresh();
        });
      } catch (error) {
        console.error("Patient deletion failed:", error);

        toast("Unable to delete patient.");
      }
    };
  });

  $$("[data-delete-xray]").forEach((button) => {
    button.onclick = async () => {
      const xrayId = Number(button.dataset.deleteXray);

      if (!confirm(t("deleteXray") + "?")) {
        return;
      }

      try {
        const xray = await dbGet("xrays", xrayId);

        if (!xray) {
          return;
        }

        await dbDelete("xrays", xrayId);

        await refresh();

        showUndo(t("deleteXray"), async () => {
          await dbPut("xrays", xray);

          await refresh();
        });
      } catch (error) {
        console.error("X-ray deletion failed:", error);

        toast("Unable to delete X-ray.");
      }
    };
  });
  $$("[data-treatment-status]").forEach((select) => {
    select.onchange = async () => {
      const treatmentId = Number(select.dataset.treatmentStatus);

      const treatment = state.treatments.find(
        (item) => item.id === treatmentId,
      );

      if (!treatment) {
        return;
      }

      try {
        await dbPut("treatments", {
          ...treatment,
          status: select.value,
        });

        toast(t("saved"));

        await refresh();
      } catch (error) {
        console.error("Failed to update treatment status:", error);

        toast("Unable to update status.");

        render();
      }
    };
  });
  $$("[data-edit-prescription]").forEach(
    (button) =>
      (button.onclick = () =>
        editPrescription(Number(button.dataset.editPrescription))),
  );
  $$("[data-print-prescription]").forEach(
    (button) =>
      (button.onclick = () =>
        printPrescription(Number(button.dataset.printPrescription))),
  );
  $$("[data-agenda-date]").forEach(
    (button) =>
      (button.onclick = () => {
        const current = new Date(`${state.agendaDate}T12:00:00`);
        if (button.dataset.agendaDate === "previous")
          current.setDate(current.getDate() - 1);
        if (button.dataset.agendaDate === "next")
          current.setDate(current.getDate() + 1);
        state.agendaDate = ["previous", "next"].includes(
          button.dataset.agendaDate,
        )
          ? current.toISOString().slice(0, 10)
          : button.dataset.agendaDate === "today"
            ? today()
            : button.dataset.agendaDate;
        render();
      }),
  );
  const treatmentPatientSelect = $("#treatmentPatientSelect");
  if (treatmentPatientSelect)
    treatmentPatientSelect.onchange = () => {
      state.treatmentPatientId = Number(treatmentPatientSelect.value) || null;
      state.selectedPatient =
        state.patients.find(
          (patient) => patient.id === state.treatmentPatientId,
        ) || state.selectedPatient;
      render();
    };
  const odontogramPatientSelect = $("#odontogramPatientSelect");
  if (odontogramPatientSelect)
    odontogramPatientSelect.onchange = () => {
      state.odontogramPatientId = Number(odontogramPatientSelect.value) || null;
      state.selectedPatient =
        state.patients.find(
          (patient) => patient.id === state.odontogramPatientId,
        ) || null;
      render();
    };
  const prescriptionPatientSelect = $("#prescriptionPatientSelect");
  if (prescriptionPatientSelect)
    prescriptionPatientSelect.onchange = () => {
      state.prescriptionPatientId =
        Number(prescriptionPatientSelect.value) || null;
      state.selectedPatient =
        state.patients.find(
          (patient) => patient.id === state.prescriptionPatientId,
        ) || state.selectedPatient;
      render();
    };
  const patientRecordSelect = $("#patientRecordSelect");
  if (patientRecordSelect)
    patientRecordSelect.onchange = () => {
      state.selectedPatient =
        state.patients.find(
          (patient) => patient.id === Number(patientRecordSelect.value),
        ) || null;
      render();
    };
  const xrayPatientSelect = $("#xrayPatientSelect");
  if (xrayPatientSelect)
    xrayPatientSelect.onchange = () => {
      state.selectedPatient =
        state.patients.find(
          (patient) => patient.id === Number(xrayPatientSelect.value),
        ) || null;
      render();
    };
  const form = $("#patientForm");
  if (form)
    form.onsubmit = async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      await dbPut("patients", { ...state.selectedPatient, ...data });
      toast(t("patientSaved"));
      await refresh();
    };
  const settingsForm = $("#settingsForm");
  if (settingsForm)
    settingsForm.onsubmit = async (event) => {
      event.preventDefault();
      await dbPut("settings", {
        ...state.settings,
        id: 1,
        ...Object.fromEntries(new FormData(settingsForm)),
        currencySymbol: "SYR",
      });
      toast(t("saved"));
      await refresh();
    };
  const xray = $("#xrayUpload");

  if (xray) {
    xray.onchange = async () => {
      const file = xray.files[0];

      if (!file) {
        return;
      }

      if (!state.selectedPatient) {
        toast("Please select a patient first.");

        xray.value = "";
        return;
      }

      try {
        const compressed = await compressXray(file);

        const base64Data = await blobToBase64(compressed);

        const xrayType = $("#xrayType")?.value || "other";

        const toothNumber = Number($("#xrayToothNumber")?.value) || null;

        const notes = $("#xrayNotes")?.value.trim() || "";

        await dbPut("xrays", {
          patientId: state.selectedPatient.id,

          filename: file.name,

          base64Data,

          mimeType: "image/webp",

          originalMimeType: file.type,

          toothTag: toothNumber,

          type: xrayType,

          date: today(),

          notes,
        });

        toast("X-ray uploaded successfully.");

        await refresh();
      } catch (error) {
        console.error("X-ray upload failed:", error);

        toast("Unable to process X-ray.");
      }

      xray.value = "";
    };
  }

  if (xray) {
    xray.onchange = async () => {
      const file = xray.files[0];

      if (!file) {
        return;
      }

      if (!state.selectedPatient) {
        toast(t("selectPatientFirst"));

        xray.value = "";
        return;
      }

      try {
        const compressed = await compressXray(file);

        const base64Data = await blobToBase64(compressed);

        await dbPut("xrays", {
          patientId: state.selectedPatient.id,

          filename: file.name,

          base64Data,

          mimeType: "image/webp",

          originalMimeType: file.type,

          toothTag: state.selectedTooth,

          date: today(),

          notes: "",
        });

        toast(t("xrayUploaded"));

        await refresh();
      } catch (error) {
        console.error("X-ray upload failed:", error);

        toast(t("unableProcessXray"));
      }

      xray.value = "";
    };
  }
  const saveToothNote = $("#saveToothNote");
  if (saveToothNote) saveToothNote.onclick = saveCurrentToothNote;
  $$("[data-action]").forEach(
    (el) => (el.onclick = () => actions(el.dataset.action)),
  );
}
async function saveCurrentToothNote() {
  if (!state.selectedPatient) return;

  const existing = state.odontograms.find(
    (item) =>
      item.patientId === state.selectedPatient.id &&
      item.toothNumber === state.selectedTooth,
  );

  await dbPut("odontograms", {
    ...(existing || {}),
    patientId: state.selectedPatient.id,
    toothNumber: state.selectedTooth,
    condition: existing?.condition || "healthy",
    notes: $("#toothNote").value,
    timestamp: new Date().toISOString(),
  });

  toast(t("saved"));

  state.odontograms = await dbGetAll("odontograms");
}
async function actions(action) {
  if (action === "newPatient") return newPatient();
  if (action === "addAppointment") return addAppointment();
  if (action === "addTreatment") return addTreatment();
  if (action === "addTreatmentPlan") return addTreatmentPlan();
  if (action === "addPrescription") return addPrescription();
  if (action === "export") return exportData();
  if (action === "import") return $("#importInput").click();
  if (action === "wipe") {
    if (prompt(t("confirmWipe")) === "WIPE") {
      const currentSettings = {
        ...state.settings,
      };

      for (const store of STORES) {
        if (store !== "settings") {
          await dbClear(store);
        }
      }

      await dbPut("settings", {
        ...currentSettings,
        id: 1,
      });

      state.selectedPatient = null;

      await refresh();
    }
  }
}
function newPatient() {
  modal(
    t("newPatient"),
    `<form id="newPatientForm" class="form-grid"><div class="field full-span"><label>${t("patient")}</label><input name="name" required></div><div class="field"><label>${t("phone")}</label><input name="phone"></div><div class="field"><label>${t("location")}</label><input name="location"></div><div class="field"><label>${t("workStudy")}</label><input name="workStudy"></div><div class="field"><label>${t("dob")}</label><input type="date" name="dob"></div><div class="field full-span"><label>${t("allergies")}</label><input name="allergies"></div><div class="form-actions full-span"><button class="button button-primary">${t("save")}</button></div></form>`,
  );
  $("#newPatientForm").onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const id = await dbPut("patients", {
      ...data,
      createdAt: new Date().toISOString(),
    });
    state.selectedPatient = { ...data, id };
    $("#modal").classList.remove("show");
    await refresh();
  };
}
function addAppointment() {
  const patientOptions = state.patients
    .map(
      (patient) =>
        `<option value="${patient.id}" ${patient.id === state.selectedPatient?.id ? "selected" : ""}>${esc(patient.name)} · ${esc(patient.phone || "")}</option>`,
    )
    .join("");
  modal(
    t("addAppointment"),
    `<form id="appointmentForm" class="form-grid"><div class="field full-span"><label>${t("patient")}</label><select name="patientId" required><option value="">${t("selectPatient")}</option>${patientOptions}</select></div><div class="field"><label>${t("date")}</label><input type="date" name="date" value="${state.agendaDate}"></div><div class="field"><label>${t("time")}</label><input type="time" name="startTime" value="10:00"></div><div class="field full-span"><label>${t("procedure")}</label><input name="procedure" value="Routine examination"></div><div class="form-actions full-span"><button class="button button-primary">${t("save")}</button></div></form>`,
  );
  $("#appointmentForm").onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const patient = state.patients.find(
      (item) => item.id === Number(data.patientId),
    );
    if (!patient) return;
    await dbPut("appointments", {
      ...data,
      patientId: patient.id,
      patientName: patient.name,
      duration: 30,
      status: "booked",
    });
    state.selectedPatient = patient;
    $("#modal").classList.remove("show");
    await refresh();
  };
}
function addTreatment() {
  const patientOptions = state.patients
    .map(
      (patient) =>
        `<option value="${patient.id}" ${patient.id === state.treatmentPatientId || patient.id === state.selectedPatient?.id ? "selected" : ""}>${esc(patient.name)} · ${esc(patient.phone || "")}</option>`,
    )
    .join("");
  modal(
    t("addTreatment"),
    `<form id="treatmentForm" class="form-grid"><div class="field full-span"><label>${t("patient")}</label><select name="patientId" required><option value="">${t("selectPatient")}</option>${patientOptions}</select></div><div class="field"><label>${t("tooth")}</label><input type="number" name="toothNumber" min="1" max="32"></div><div class="field"><div class="field">
    <label>${t("status")}</label>

    <select name="status">
        <option value="planned">
            ${t("planned")}
        </option>

        <option value="accepted">
            ${t("accepted")}
        </option>

        <option value="scheduled">
            ${t("scheduled")}
        </option>

        <option value="in-progress">
            ${t("inProgress")}
        </option>

        <option value="completed">
            ${t("completed")}
        </option>

        <option value="cancelled">
            ${t("cancelled")}
        </option>
    </select>
</div><input type="number" name="fee" value="0"></div><div class="field full-span"><label>${t("procedure")}</label><input name="description" required></div><div class="form-actions full-span"><button class="button button-primary">${t("save")}</button></div></form>`,
  );
  $("#treatmentForm").onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const patient = state.patients.find(
      (item) => item.id === Number(data.patientId),
    );
    if (!patient) return;
    await dbPut("treatments", {
      ...data,
      patientId: patient.id,
      toothNumber: Number(data.toothNumber) || null,
      fee: Number(data.fee) || 0,
      status: data.status || "planned",
      date: today(),
    });
    $("#modal").classList.remove("show");
    await refresh();
  };
}
function prescriptionMedicationFields(medication = {}, index = 0) {
  return `<div class="prescription-edit-medication"><div class="field full-span"><label>${t("medication")}</label><select name="name${index}"><option ${medication.name === "Amoxicillin 500mg" ? "selected" : ""}>Amoxicillin 500mg</option><option ${medication.name === "Ibuprofen 400mg" ? "selected" : ""}>Ibuprofen 400mg</option><option ${medication.name === "Paracetamol 500mg" ? "selected" : ""}>Paracetamol 500mg</option><option ${medication.name === "Chlorhexidine 0.12% rinse" ? "selected" : ""}>Chlorhexidine 0.12% rinse</option></select></div><div class="field"><label>${t("dosage")}</label><input name="dosage${index}" value="${esc(medication.dosage || "")}"></div><div class="field"><label>${t("frequency")}</label><input name="frequency${index}" value="${esc(medication.frequency || "")}"></div><div class="field"><label>${t("duration")}</label><input name="duration${index}" value="${esc(medication.duration || "")}"></div><div class="field"><label>${t("instructions")}</label><input name="instructions${index}" value="${esc(medication.instructions || "")}"></div></div>`;
}
function prescriptionForm(record) {
  const medications = record?.medications?.length ? record.medications : [{}];
  return `<form id="rxForm" class="form-grid">${medications.map((medication, index) => prescriptionMedicationFields(medication, index)).join("")}<div class="field full-span"><label>${t("notes")}</label><textarea name="notes" rows="3">${esc(record?.notes || "")}</textarea></div><div class="form-actions full-span"><button class="button button-primary">${t("save")}</button></div></form>`;
}
function addPrescription() {
  const patientOptions = state.patients
    .map(
      (patient) =>
        `<option value="${patient.id}" ${patient.id === state.prescriptionPatientId || patient.id === state.selectedPatient?.id ? "selected" : ""}>${esc(patient.name)} · ${esc(patient.phone || "")}</option>`,
    )
    .join("");
  modal(
    t("addPrescription"),
    `<form id="rxForm" class="form-grid"><div class="field full-span"><label>${t("patient")}</label><select name="patientId" required><option value="">${t("selectPatient")}</option>${patientOptions}</select></div>${prescriptionForm().replace('<form id="rxForm" class="form-grid">', "").replace("</form>", "")}</form>`,
  );
  $("#rxForm").onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const patient = state.patients.find(
      (item) => item.id === Number(data.patientId),
    );
    if (!patient) return;
    await dbPut("prescriptions", {
      patientId: patient.id,
      date: today(),
      medications: [
        {
          name: data.name0,
          dosage: data.dosage0,
          frequency: data.frequency0,
          duration: data.duration0,
          instructions: data.instructions0,
        },
      ],
      notes: data.notes || "",
    });
    state.prescriptionPatientId = patient.id;
    state.selectedPatient = patient;
    $("#modal").classList.remove("show");
    await refresh();
  };
}
function editPrescription(id) {
  const record = state.prescriptions.find((item) => item.id === id);
  if (!record) return;
  modal(t("edit"), prescriptionForm(record));
  $("#rxForm").onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const medications = record.medications.map((_, index) => ({
      name: data[`name${index}`],
      dosage: data[`dosage${index}`],
      frequency: data[`frequency${index}`],
      duration: data[`duration${index}`],
      instructions: data[`instructions${index}`],
    }));
    await dbPut("prescriptions", {
      ...record,
      medications,
      notes: data.notes || "",
    });
    $("#modal").classList.remove("show");
    await refresh();
  };
}
function printPrescription(id) {
  state.printPrescriptionId = id;
  document.body.classList.add("printing-prescription");
  render();
  setTimeout(() => window.print(), 50);
  window.onafterprint = () => {
    document.body.classList.remove("printing-prescription");
    state.printPrescriptionId = null;
    render();
  };
}
function excelText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
async function exportData() {
  const data = await dbExport();
  const sheets = Object.entries(data)
    .map(([name, rows]) => {
      const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
      const header = columns
        .map((column) => `<th>${excelText(column)}</th>`)
        .join("");
      const body = rows
        .map(
          (row) =>
            `<tr>${columns.map((column) => `<td>${excelText(typeof row[column] === "object" ? JSON.stringify(row[column]) : row[column])}</td>`).join("")}</tr>`,
        )
        .join("");
      return `<h2>${excelText(name)}</h2><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
    })
    .join("");
  const workbook = `<!doctype html><html><head><meta charset="utf-8"><meta name="mizan-export" content="1"><style>body{font-family:Arial}h2{background:#0284c7;color:#fff;padding:8px}table{border-collapse:collapse;margin-bottom:24px}th,td{border:1px solid #cbd5e1;padding:6px;text-align:left}th{background:#e0f2fe}</style></head><body><h1>Mizan Dental Export</h1>${sheets}</body></html>`;
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `mizan-dental-export-${new Date().toISOString().replace(/[:.]/g, "-")}.xls`;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 1000);
  toast(t("exported"));
}
function parseExcelBackup(source) {
  const document = new DOMParser().parseFromString(source, "text/html");
  if (!document.querySelector('meta[name="mizan-export"]'))
    throw Error("Unsupported workbook");
  const data = {};
  document.querySelectorAll("h2").forEach((heading) => {
    const store = heading.textContent.trim();
    if (!STORES.includes(store)) return;
    const table = heading.nextElementSibling;
    const headers = [...(table?.querySelectorAll("thead th") || [])].map(
      (cell) => cell.textContent.trim(),
    );
    data[store] = [...(table?.querySelectorAll("tbody tr") || [])].map(
      (row) => {
        const item = {};
        [...row.querySelectorAll("td")].forEach((cell, index) => {
          const key = headers[index];
          if (!key) return;
          let value = cell.textContent;
          if (
            [
              "id",
              "patientId",
              "toothNumber",
              "fee",
              "duration",
              "paidAmount",
              "balance",
              "discount",
              "slotDuration",
            ].includes(key) &&
            value !== ""
          )
            value = Number(value);
          if (["items", "medications"].includes(key) && value)
            value = JSON.parse(value);
          item[key] = value;
        });
        return item;
      },
    );
  });
  return data;
}
function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.append(node);
  setTimeout(() => node.remove(), 2400);
}
let undoAction = null;
let undoTimer = null;

function showUndo(message, action) {
  clearTimeout(undoTimer);

  undoAction = action;

  const existingToast = document.querySelector(".undo-toast");

  if (existingToast) {
    existingToast.remove();
  }

  const node = document.createElement("div");

  node.className = "toast undo-toast";

  node.innerHTML = `
        <span>${esc(message)}</span>
        <button type="button" id="undoBtn">
            Undo
        </button>
    `;

  document.body.append(node);

  $("#undoBtn").onclick = async () => {
    if (!undoAction) return;

    const actionToRun = undoAction;

    undoAction = null;

    clearTimeout(undoTimer);

    node.remove();

    try {
      await actionToRun();
    } catch (error) {
      console.error("Undo failed:", error);

      toast("Unable to undo action.");
    }
  };

  undoTimer = setTimeout(() => {
    undoAction = null;
    node.remove();
  }, 5000);
}

$("#langBtn").onclick = async () => {
  currentLanguage = currentLanguage === "en" ? "ar" : "en";

  await dbPut("settings", {
    ...state.settings,
    id: 1,
    currentLanguage,
  });

  render();

  if (document.body.classList.contains("drawer-open")) {
    openTooth(state.selectedTooth);
  }
};
$("#newPatientBtn").onclick = () => newPatient();
$("#unlockBtn").onclick = verifyPIN;

$("#savePINBtn").onclick = savePIN;

$("#pinInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    verifyPIN();
  }
});

$("#confirmPINInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    savePIN();
  }
});
$("#backupBtn").onclick = () => exportData();
$("#closeDrawer").onclick = () => document.body.classList.remove("drawer-open");
$("#drawerBackdrop").onclick = () =>
  document.body.classList.remove("drawer-open");
$("#modalClose").onclick = () => $("#modal").classList.remove("show");
$("#globalSearch").oninput = (event) => {
  const term = event.target.value.toLowerCase();
  const patient = state.patients.find(
    (item) =>
      item.name.toLowerCase().includes(term) ||
      item.phone?.toLowerCase().includes(term),
  );
  if (patient) {
    state.selectedPatient = patient;
    state.view = "patients";
    render();
  }
};
$("#importInput").onchange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = parseExcelBackup(reader.result);
      if (!validateBackup(data)) throw Error();
      if (confirm(t("confirmWipe"))) {
        await safeImport(data);
        toast(t("restored"));
        await refresh();
      }
    } catch {
      alert("Invalid Excel backup file");
    }
  };
  reader.readAsText(file);
};

if (localStorage.getItem("mizan-sidebar-collapsed") === "true")
  document.body.classList.add("sidebar-collapsed");
$("#sidebarToggle").onclick = () => {
  const collapsed = document.body.classList.toggle("sidebar-collapsed");
  localStorage.setItem("mizan-sidebar-collapsed", String(collapsed));
  setText();
};
function updateClock() {
  const now = new Date();

  const language = state.settings.currentLanguage || "ar";

  $("#clock").textContent = now.toLocaleTimeString(
    language === "ar" ? "ar-SA" : "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  $("#dateLabel").textContent = now.toLocaleDateString(
    language === "ar" ? "ar-SA" : "en-US",
    {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}
document.addEventListener("keydown", (event) => {
  if (event.target.matches("input, textarea, select")) {
    return;
  }

  if (event.key === "Escape") {
    $("#modal").classList.remove("show");
    document.body.classList.remove("drawer-open");
  }

  if (event.key.toLowerCase() === "n") {
    newPatient();
  }

  if (event.key.toLowerCase() === "a") {
    addAppointment();
  }

  if (event.key.toLowerCase() === "p") {
    state.view = "patients";
    render();
  }

  if (event.key.toLowerCase() === "o") {
    state.view = "odontogram";
    render();
  }

  if (event.ctrlKey && event.key.toLowerCase() === "k") {
    event.preventDefault();
    $("#globalSearch").focus();
  }
});
["mousemove", "mousedown", "keydown", "touchstart"].forEach((eventName) => {
  document.addEventListener(
    eventName,
    () => {
      if (!document.body.classList.contains("app-locked")) {
        resetInactivityTimer();
      }
    },
    true,
  );
});

setInterval(updateClock, 1000);
updateClock();
async function startApplication() {
  try {
    await openDB();

    await seedDatabase();

    await refresh();

    // Only show PIN setup when a PIN has NEVER been configured.
    if (state.settings.pinEnabled === true) {
      lockApp();
    } else {
      showPINSetup();
    }

    resetInactivityTimer();
  } catch (error) {
    console.error("Application startup failed:", error);
  }
}

startApplication();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
