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


  const savedSettings = (await dbGetAll("settings"))[0] || {};

  state.settings = {
    id: 1,
    currencySymbol: "SYR",
    clinicName: "------ Dental Clinic",
    doctorName: "Dr. ------",
    phone: "0900000000",
    address: "",
    workStartHour: "09:00",
    workEndHour: "18:00",
    slotDuration: 30,
    currentLanguage: "ar",
    pinEnabled: false,
    pinHash: "",
    ...savedSettings,
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

  state.treatments = await dbGetAll("treatments");

for (const treatment of state.treatments) {
    if (treatment.status === "Planned") {
        treatment.status = "planned";

        await dbPut("treatments", treatment);
    }
}

  render();
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

function renderSettings() {
  const s = state.settings;
  const clinicName = s.clinicName || "";
  const doctorName = s.doctorName || "";
  const phone = s.phone || "";
  const address = s.address || "";
  const workStartHour = s.workStartHour || "09:00";
  const workEndHour = s.workEndHour || "18:00";
  const slotDuration = Number(s.slotDuration) || 30;
  return `<section class="content-grid"><div class="card"><div class="card-heading"><h2>${t("clinic")}</h2></div><form id="settingsForm" class="form-grid"><div class="field"><label>${t("clinic")}</label><input name="clinicName" value="${esc(clinicName)}"></div><div class="field"><label>${t("doctor")}</label><input name="doctorName" value="${esc(doctorName)}"></div><div class="field full-span"><label>${t("phone")}</label><input name="phone" value="${esc(phone)}"></div><div class="field full-span"><label>${t("address")}</label><input name="address" value="${esc(address)}"></div><div class="field">
  <label>${t("currency")}</label>
  <select name="currencySymbol">
    <option
      value="SYR"
      ${s.currencySymbol === "SYR" ? "selected" : ""}
    >
      SYR
    </option>
  </select>
</div><div class="field"><label>${t("slot")}</label><select name="slotDuration"><option ${String(slotDuration) === "15" ? "selected" : ""}>15</option><option ${String(slotDuration) === "30" ? "selected" : ""}>30</option><option ${String(slotDuration) === "60" ? "selected" : ""}>60</option></select></div><div class="field"><label>${t("start")}</label><input type="time" name="workStartHour" value="${esc(workStartHour)}"></div><div class="field"><label>${t("end")}</label><input type="time" name="workEndHour" value="${esc(workEndHour)}"></div><div class="form-actions full-span"><button class="button button-primary">${t("save")}</button></div></form></div><div class="card"><div class="card-heading"><h2>${t("backup")}</h2></div><p class="muted">${t("saved")}</p><div class="form-actions" style="justify-content:flex-start"><button class="button button-primary" data-action="export">${t("export")}</button><button class="button button-ghost" data-action="import">${t("import")}</button><button class="button" style="color:var(--danger);border:1px solid #fecaca" data-action="wipe">${t("wipe")}</button></div></div></section>`;
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



function updateClock() {
  const clock = $("#clock");
  const dateLabel = $("#dateLabel");

  if (!clock || !dateLabel) {
    return;
  }

  const now = new Date();

  const language =
    state.settings?.currentLanguage || "ar";

  clock.textContent =
    now.toLocaleTimeString(
      language === "ar"
        ? "ar-SA"
        : "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  dateLabel.textContent =
    now.toLocaleDateString(
      language === "ar"
        ? "ar-SA"
        : "en-US",
      {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
}


async function startApplication() {
  try {
    await openDB();

    await seedDatabase();

    await refresh();
    updateClock();
    setInterval(updateClock, 1000);
    if (state.settings.pinEnabled === true) {
      lockApp();
    } else {
      showPINSetup();
    }
  } catch (error) {
    console.error("Application startup failed:", error);
  }
}

startApplication();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
