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

    const odontogramPatient =
        state.patients.find(
            (patient) =>
                patient.id ===
                Number(state.odontogramPatientId),
        ) || state.selectedPatient;

    const record = state.odontograms.find(
        (item) =>
            item.patientId === odontogramPatient?.id &&
            item.toothNumber === number &&
            item.toothMode === state.toothMode,
    );
    const condition = record?.condition || "healthy";
    const label = primary ? String.fromCharCode(64 + number) : number;
    return `<button class="tooth ${primary ? "primary-tooth " : ""}${condition}" data-tooth="${number}" title="${t("tooth")} ${label}"><span class="tooth-mark"></span><span class="tooth-label">${label}</span></button>`;
}

async function openTooth(number) {
    state.selectedTooth = number;
    const record = state.odontograms.find(
        (item) =>
            item.patientId === state.selectedPatient?.id &&
            item.toothNumber === number &&
            item.toothMode === state.toothMode,
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
    const odontogramPatient =
        state.patients.find(
            (patient) =>
                patient.id ===
                Number(state.odontogramPatientId),
        ) || state.selectedPatient;

    if (!odontogramPatient) return;

    const existing = state.odontograms.find(
        (item) =>
            item.patientId === odontogramPatient.id &&
            item.toothNumber === state.selectedTooth,
    );

    if (condition === "clear") {
        if (existing) {
            await dbDelete("odontograms", existing.id);
        }
    } else {
        await dbPut("odontograms", {
            ...(existing || {}),
            patientId: odontogramPatient.id,
            toothNumber: state.selectedTooth,
            toothMode: state.toothMode,
            condition,
            procedure: t(condition),
            timestamp: new Date().toISOString(),
        });
    }

    await refresh();
    openTooth(state.selectedTooth, false);
}

async function saveCurrentToothNote() {
    const odontogramPatient =
        state.patients.find(
            (patient) =>
                patient.id ===
                Number(state.odontogramPatientId),
        ) || state.selectedPatient;

    if (!odontogramPatient) return;

    const existing = state.odontograms.find(
        (item) =>
            item.patientId === odontogramPatient.id &&
            item.toothNumber === state.selectedTooth,
    );

    await dbPut("odontograms", {
        ...(existing || {}),
        patientId: odontogramPatient.id,
        toothNumber: state.selectedTooth,
        condition: existing?.condition || "healthy",
        notes: $("#toothNote").value,
        timestamp: new Date().toISOString(),
    });

    toast(t("saved"));

    state.odontograms = await dbGetAll("odontograms");
}