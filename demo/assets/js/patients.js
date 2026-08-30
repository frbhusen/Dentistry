function patientRow(patient) {
    return `<div class="patient-row" data-patient-id="${patient.id}"><div><b>${esc(patient.name)}</b><small><bdi dir="ltr">${esc(patient.phone || t("noPhone"))}</bdi></small></div><span class="badge ${patient.allergies ? "badge-danger" : ""}">${patient.allergies ? "!" : "OK"}</span></div>`;
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
function renderPatients() {
    return `<section class="content-grid"><div class="card"><div class="card-heading"><h2>${t("patients")}</h2><button class="button button-primary" data-action="newPatient">＋ ${t("newPatient")}</button></div>${patientSelector("patientRecordSelect", state.selectedPatient)}<div id="patientList">${state.patients.map(patientRow).join("")}</div></div><div class="card">${state.selectedPatient ? patientForm(state.selectedPatient) : `<p class="muted">${t("selectPatient")}</p>`}</div></section>`;
}
function patientForm(patient) {
    return `<div class="card-heading"><h2>${esc(patient.name)}</h2><span class="badge ${patient.allergies ? "badge-danger" : ""}">${patient.allergies ? "! " + esc(patient.allergies) : t("healthy")}</span></div>${patient.medicalFlags ? `<div class="alert-banner">⚠ ${esc(patient.medicalFlags)}</div>` : ""}<form id="patientForm" class="form-grid"><div class="field"><label>${t("patient")}</label><input name="name" value="${esc(patient.name)}" required></div><div class="field"><label>${t("phone")}</label><input name="phone" value="${esc(patient.phone)}"></div><div class="field"><label>${t("location")}</label><input name="location" value="${esc(patient.location)}"></div><div class="field"><label>${t("workStudy")}</label><input name="workStudy" value="${esc(patient.workStudy)}"></div><div class="field"><label>${t("dob")}</label><input type="date" name="dob" value="${esc(patient.dob)}"></div><div class="field"><label>${t("gender")}</label><select name="gender"><option
    value="Female"
    ${patient.gender === "Female" || !patient.gender ? "selected" : ""}
>
    ${t("female")}
</option>

<option
    value="Male"
    ${patient.gender === "Male" ? "selected" : ""}
>
    ${t("male")}
</option></select></div><div class="field"><label>${t("allergies")}</label><input name="allergies" value="${esc(patient.allergies)}"></div><div class="field full-span"><label>${t("medicalFlags")}</label><input name="medicalFlags" value="${esc(patient.medicalFlags)}"></div><div class="field full-span"><label>${t("notes")}</label><textarea name="notes" rows="3">${esc(patient.notes)}</textarea></div><div class="form-actions full-span"><button class="button button-primary">${t("save")}</button><button type="button" class="button delete-patient-button" data-delete-patient="${patient.id}">${t("deletePatient")}</button></div></form><div
    class="card-heading"
    style="margin-top:28px"
>
    <div>
        <h3>
            ${t("clinicalHistory")}
        </h3>

        <p class="muted">
            ${t("patientTimeline")}
        </p>
    </div>
</div>

${renderPatientTimeline(patient.id)}`;
}

async function getPatientBackup(patientId) {
    const relatedStores = [
        "odontograms",
        "appointments",
        "treatments",
        "treatmentPlans",
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