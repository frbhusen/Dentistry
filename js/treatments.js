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
            ) => `<tr><td>#${item.toothNumber || "—"}</td><td>${esc(item.description)}</td><td>${esc(item.date)}</td><td>${money(item.fee)}</td>
            <td>
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
</td>

<td>
    <button
        type="button"
        class="button button-ghost"
        data-edit-treatment="${item.id}"
    >
        ${t("edit")}
    </button>

    <button
        type="button"
        class="button"
        data-delete-treatment="${item.id}"
    >
        ×
    </button>
</td></tr>`,
        )
        .join(
            "",
        )}</tbody></table></div></div><div class="card invoice-print"><div class="card-heading"><h2>${t("invoice")}</h2><button class="button button-ghost" onclick="window.print()">⌁ ${t("print")}</button></div><div class="patient-summary"><div><h3>${esc(treatmentPatient?.name || t("selectPatient"))}</h3><p>${t("invoice")} · ${today()}</p></div><span class="badge badge-blue">SYR</span></div><div class="form-actions"><span class="muted">${t("invoiceTotal")}</span><strong>${money(total)}</strong></div></div></section>`;
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

function editTreatment(id) {
    const treatment = state.treatments.find((item) => item.id === id);

    if (!treatment) {
        return;
    }

    modal(
        t("edit"),
        `
        <form id="editTreatmentForm" class="form-grid">

            <div class="field">
                <label>${t("tooth")}</label>
                <input
                    type="number"
                    name="toothNumber"
                    min="1"
                    max="32"
                    value="${esc(treatment.toothNumber || "")}"
                >
            </div>

            <div class="field">
                <label>${t("fee")}</label>
                <input
                    type="number"
                    name="fee"
                    min="0"
                    step="0.01"
                    value="${Number(treatment.fee || 0)}"
                >
            </div>

            <div class="field full-span">
                <label>${t("procedure")}</label>
                <input
                    name="description"
                    required
                    value="${esc(treatment.description || "")}"
                >
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

    $("#editTreatmentForm").onsubmit = async (event) => {
        event.preventDefault();

        const data = Object.fromEntries(new FormData(event.target));

        await dbPut("treatments", {
            ...treatment,
            toothNumber: Number(data.toothNumber) || null,
            description: data.description,
            fee: Number(data.fee) || 0,
        });

        $("#modal").classList.remove("show");

        await refresh();
    };
}

async function deleteTreatment(id) {
    const treatment = state.treatments.find((item) => item.id === id);

    if (!treatment) {
        return;
    }

    if (!confirm(t("confirmDeleteTreatment"))) {
        return;
    }

    await dbDelete("treatments", id);

    await refresh();

    showUndo(t("treatmentDeleted"), async () => {
        await dbPut("treatments", treatment);

        await refresh();
    });
}
