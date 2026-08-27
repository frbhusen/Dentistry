function renderPrescriptions() {
    const prescriptionPatient =
        state.patients.find(
            (patient) => patient.id === Number(state.prescriptionPatientId),
        ) || state.selectedPatient;
    const prescriptions = state.prescriptions.filter(
        (item) => item.patientId === prescriptionPatient?.id,
    );
    const safePrescriptions = prescriptions.filter(
        (item) => Array.isArray(item.medications),
    );
    const patientOptions = state.patients
        .map(
            (patient) =>
                `<option value="${patient.id}" ${patient.id === prescriptionPatient?.id ? "selected" : ""}>${esc(patient.name)} · ${esc(patient.phone || "")}</option>`,
        )
        .join("");
    return `<section class="content-grid prescriptions-screen"><div class="card"><div class="card-heading"><h2>${t("prescriptions")}</h2><button class="button button-primary" data-action="addPrescription">＋ ${t("addPrescription")}</button></div><div class="field treatment-patient-picker"><label>${t("patient")}</label><select id="prescriptionPatientSelect"><option value="">${t("selectPatient")}</option>${patientOptions}</select></div>${safePrescriptions.map((item) => `<div class="prescription-row"><div><b>${item.medications.map((m) => esc(m.name)).join(", ")}</b><small>${esc(item.date)} · ${item.medications.length} ${t("medication")}</small></div><div class="prescription-actions"><button class="button button-ghost" data-edit-prescription="${item.id}">${t("edit")}</button><button class="button button-ghost" data-delete-prescription="${item.id}">×</button><button class="button button-ghost" data-print-prescription="${item.id}">${t("print")}</button></div></div><div class="prescription-print ${state.printPrescriptionId === item.id ? "active" : ""}"><header><h1>${esc(state.settings.clinicName || t("appName"))}</h1><p>${esc(state.settings.doctorName || "")}</p></header><h2>${t("prescriptions")}</h2><p><b>${t("patient")}:</b> ${esc(prescriptionPatient?.name || "")}</p><p><b>${t("date")}:</b> ${esc(item.date)}</p><hr>${item.medications.map((m) => `<div class="prescription-medication"><h3>${esc(m.name)}</h3><p>${t("dosage")}: ${esc(m.dosage)} · ${t("frequency")}: ${esc(m.frequency)} · ${t("duration")}: ${esc(m.duration)}</p><p>${t("instructions")}: ${esc(m.instructions)}</p></div>`).join("")}<hr><p>${esc(item.notes || "")}</p><footer>${esc(state.settings.doctorName || "")}</footer></div>`).join("") || `<p class="muted">${t("noVisits")}</p>`}</div><div class="card"><h2>${t("medication")}</h2><p class="muted">${t("addPrescription")}</p><div class="badge badge-blue">Amoxicillin 500mg</div> <div class="badge badge-blue">Ibuprofen 400mg</div> <div class="badge badge-blue">Chlorhexidine 0.12%</div></div></section>`;
}
function prescriptionMedicationFields(medication = {}, index = 0) {
    return `
        <div
            class="prescription-edit-medication"
            data-medication-index="${index}"
        >
            <div class="field full-span">
                <label>${t("medication")}</label>

                <input
                    name="name${index}"
                    value="${esc(medication.name || "")}"
                    placeholder="${t("medication")}"
                    required
                >
            </div>

            <div class="field">
                <label>${t("dosage")}</label>
                <input
                    name="dosage${index}"
                    value="${esc(medication.dosage || "")}"
                >
            </div>

            <div class="field">
                <label>${t("frequency")}</label>
                <input
                    name="frequency${index}"
                    value="${esc(medication.frequency || "")}"
                >
            </div>

            <div class="field">
                <label>${t("duration")}</label>
                <input
                    name="duration${index}"
                    value="${esc(medication.duration || "")}"
                >
            </div>

            <div class="field">
                <label>${t("instructions")}</label>
                <input
                    name="instructions${index}"
                    value="${esc(medication.instructions || "")}"
                >
            </div>

            <div class="form-actions full-span">
                <button
                    type="button"
                    class="button medication-delete-button"
                    data-delete-medication="${index}"
                >
                    Delete medication
                </button>
            </div>
        </div>
    `;
}
function prescriptionForm(record) {
    const medications = record?.medications?.length ? record.medications : [{}];
    return `
        <div id="prescriptionMedications" class="full-span">
            ${medications.map((medication, index) => prescriptionMedicationFields(medication, index)).join("")}
        </div>
        <div class="form-actions full-span">
            <button type="button" class="button button-ghost" id="addMedicationBtn">+ Add medication</button>
        </div>
        <div class="field full-span">
            <label>${t("notes")}</label>
            <textarea name="notes" rows="3">${esc(record?.notes || "")}</textarea>
        </div>
        <div class="form-actions full-span">
            <button class="button button-primary" type="submit">${t("save")}</button>
        </div>
    `;
}
function bindPrescriptionMedicationControls() {
    const container =
        $("#prescriptionMedications");

    const addButton =
        $("#addMedicationBtn");

    if (!container || !addButton) {
        return;
    }

    addButton.onclick = () => {
        const index =
            container.querySelectorAll(
                ".prescription-edit-medication"
            ).length;

        container.insertAdjacentHTML(
            "beforeend",
            prescriptionMedicationFields({}, index)
        );

        bindPrescriptionMedicationControls();
    };

    container
        .querySelectorAll(
            "[data-delete-medication]"
        )
        .forEach((button) => {
            button.onclick = () => {
                const medication = button.closest(
                    ".prescription-edit-medication"
                );

                if (!medication) {
                    return;
                }

                medication.remove();
            };
        });
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
        `<form id="rxForm" class="form-grid">
        <div class="field full-span">
            <label>${t("patient")}</label>
            <select name="patientId" required>
                <option value="">${t("selectPatient")}</option>
                ${patientOptions}
            </select>
        </div>
        ${prescriptionForm()}
    </form>`,
    );
    bindPrescriptionMedicationControls();
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
            medications: collectPrescriptionMedications(),
            notes: data.notes || "",
        });
        state.prescriptionPatientId = patient.id;
        state.selectedPatient = patient;
        $("#modal").classList.remove("show");
        await refresh();
    };
}
function collectPrescriptionMedications() {
    const container = $("#prescriptionMedications");

    if (!container) {
        return [];
    }

    return [
        ...container.querySelectorAll(
            ".prescription-edit-medication"
        ),
    ]
        .map((medication) => ({
            name:
                medication.querySelector(
                    'input[name^="name"]'
                )?.value.trim() || "",

            dosage:
                medication.querySelector(
                    'input[name^="dosage"]'
                )?.value.trim() || "",

            frequency:
                medication.querySelector(
                    'input[name^="frequency"]'
                )?.value.trim() || "",

            duration:
                medication.querySelector(
                    'input[name^="duration"]'
                )?.value.trim() || "",

            instructions:
                medication.querySelector(
                    'input[name^="instructions"]'
                )?.value.trim() || "",
        }))
        .filter((medication) => medication.name);
}
function editPrescription(id) {
    const record = state.prescriptions.find((item) => item.id === id);
    if (!record) return;
    modal(t("edit"), `<form id="rxForm" class="form-grid">${prescriptionForm(record)}</form>`);
    bindPrescriptionMedicationControls();
    $("#rxForm").onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const medications =
            collectPrescriptionMedications();
        await dbPut("prescriptions", {
            ...record,
            medications,
            notes: data.notes || "",
        });
        $("#modal").classList.remove("show");
        await refresh();
    };
}
async function deletePrescription(id) {
    const record = state.prescriptions.find((item) => item.id === id);
    if (!record) return;
    if (!confirm(t("confirmDeleteTreatment"))) return;

    await dbDelete("prescriptions", id);
    await refresh();

    showUndo(t("treatmentDeleted"), async () => {
        await dbPut("prescriptions", record);
        await refresh();
    });
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