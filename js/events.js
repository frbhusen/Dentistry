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
    const treatmentPlanPatientSelect = $("#treatmentPlanPatientSelect");

    if (treatmentPlanPatientSelect) {
        treatmentPlanPatientSelect.onchange = () => {
            const patientId = Number(treatmentPlanPatientSelect.value) || null;

            state.selectedPatient =
                state.patients.find((patient) => patient.id === patientId) || null;

            render();
        };
    }
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
    $$("[data-open-xray]").forEach((element) => {
        element.onclick = () => {
            const xrayId = Number(element.dataset.openXray);

            openXrayViewer(xrayId);
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
                toast(t("selectPatientFirst"));

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

                    notes: notes,
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
