function addTreatmentPlan() {
    const patientOptions = state.patients
        .map(
            (patient) =>
                `<option
                        value="${patient.id}"
                        ${patient.id === state.selectedPatient?.id
                    ? "selected"
                    : ""
                }
                    >
                        ${esc(patient.name)}
                        ·
                        ${esc(patient.phone || "")}
                    </option>`,
        )
        .join("");

    modal(
        t("addTreatmentPlan"),
        `
        <form
            id="treatmentPlanForm"
            class="form-grid"
        >

            <div class="field full-span">

                <label>
                    ${t("patient")}
                </label>

                <select
                    name="patientId"
                    required
                >

                    <option value="">
                        ${t("selectPatient")}
                    </option>

                    ${patientOptions}

                </select>

            </div>

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

        const patient = state.patients.find(
            (item) => item.id === Number(data.patientId),
        );

        if (!patient) {
            toast(t("selectPatient"));

            return;
        }

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

            state.selectedPatient = patient;

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
                        ${plan.priority === "medium" || !plan.priority
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
function renderTreatmentPlanList(patientId) {
    const plans = state.treatmentPlans.filter(
        (item) => item.patientId === patientId,
    );

    if (!plans.length) {
        return `
            <p class="muted">
                ${t("noTreatmentPlans")}
            </p>
        `;
    }

    return `
        <div class="treatment-plan-list">

            ${plans
            .map(
                (item) => `
                        <div
                            class="treatment-plan-item"
                        >

                            <div
                                class="treatment-plan-main"
                            >

                                <div
                                    class="treatment-plan-tooth"
                                >
                                    ${item.toothNumber
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
                                        ${esc(item.diagnosis || "—")}
                                    </small>

                                </div>

                            </div>

                            <div
                                class="treatment-plan-details"
                            >

                                <span
                                    class="badge"
                                >
                                    ${t(item.priority || "medium")}
                                </span>

                                <span
                                    class="badge"
                                >
                                    ${t(item.status || "planned")}
                                </span>

                                <strong>
                                    ${money(item.fee)}
                                </strong>

                                <div
                                    class="treatment-plan-actions"
                                >

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
    `;
}
function renderTreatmentPlans() {
    const patient = state.selectedPatient;

    const patientOptions = state.patients
        .map(
            (item) =>
                `<option
                        value="${item.id}"
                        ${item.id === patient?.id ? "selected" : ""}
                    >
                        ${esc(item.name)}
                        ·
                        ${esc(item.phone || "")}
                    </option>`,
        )
        .join("");

    return `
        <section class="card">

            <div class="card-heading">

                <div>
                    <h2>
                        ${t("treatmentPlan")}
                    </h2>

                    ${patient
            ? `
                                <p class="muted">
                                    ${esc(patient.name)}
                                </p>
                            `
            : `
                                <p class="muted">
                                    ${t("selectPatient")}
                                </p>
                            `
        }
                </div>

                <button
                    class="button button-primary"
                    data-action="addTreatmentPlan"
                    ${!patient ? "disabled" : ""}
                >
                    ＋
                    ${t("addTreatmentPlan")}
                </button>

            </div>

            <div class="field treatment-plan-patient-picker">

                <label>
                    ${t("patient")}
                </label>

                <select id="treatmentPlanPatientSelect">

                    <option value="">
                        ${t("selectPatient")}
                    </option>

                    ${patientOptions}

                </select>

            </div>

            ${patient
            ? renderTreatmentPlanList(patient.id)
            : `
                        <div class="timeline-empty">
                            ${t("selectPatient")}
                        </div>
                    `
        }

        </section>
    `;
}
