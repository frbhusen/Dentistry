function bindPatientEvents() {
    $$("[data-patient-id]").forEach(
        (row) => {
            row.onclick = () => {
                state.selectedPatient =
                    state.patients.find(
                        (patient) =>
                            patient.id ===
                            Number(
                                row.dataset.patientId
                            )
                    );

                render();
            };
        }
    );

    const patientRecordSelect =
        $("#patientRecordSelect");

    if (patientRecordSelect) {
        patientRecordSelect.onchange = () => {
            state.selectedPatient =
                state.patients.find(
                    (patient) =>
                        patient.id ===
                        Number(
                            patientRecordSelect.value
                        )
                ) || null;

            render();
        };
    }

    const odontogramPatientSelect =
        $("#odontogramPatientSelect");

    if (odontogramPatientSelect) {
        odontogramPatientSelect.onchange = () => {
            state.odontogramPatientId =
                Number(
                    odontogramPatientSelect.value
                ) || null;

            state.selectedPatient =
                state.patients.find(
                    (patient) =>
                        patient.id ===
                        state.odontogramPatientId
                ) || null;

            render();
        };
    }

    const treatmentPatientSelect =
        $("#treatmentPatientSelect");

    if (treatmentPatientSelect) {
        treatmentPatientSelect.onchange = () => {
            state.treatmentPatientId =
                Number(
                    treatmentPatientSelect.value
                ) || null;

            state.selectedPatient =
                state.patients.find(
                    (patient) =>
                        patient.id ===
                        state.treatmentPatientId
                ) || state.selectedPatient;

            render();
        };
    }

    const treatmentPlanPatientSelect =
        $("#treatmentPlanPatientSelect");

    if (treatmentPlanPatientSelect) {
        treatmentPlanPatientSelect.onchange = () => {
            const patientId =
                Number(
                    treatmentPlanPatientSelect.value
                ) || null;

            state.treatmentPlanPatientId =
                patientId;

            state.selectedPatient =
                state.patients.find(
                    (patient) =>
                        patient.id === patientId
                ) || null;

            render();
        };
    }

    const prescriptionPatientSelect =
        $("#prescriptionPatientSelect");

    if (prescriptionPatientSelect) {
        prescriptionPatientSelect.onchange = () => {
            state.prescriptionPatientId =
                Number(
                    prescriptionPatientSelect.value
                ) || null;

            state.selectedPatient =
                state.patients.find(
                    (patient) =>
                        patient.id ===
                        state.prescriptionPatientId
                ) || state.selectedPatient;

            render();
        };
    }

    const xrayPatientSelect =
        $("#xrayPatientSelect");

    if (xrayPatientSelect) {
        xrayPatientSelect.onchange = () => {
            state.selectedPatient =
                state.patients.find(
                    (patient) =>
                        patient.id ===
                        Number(
                            xrayPatientSelect.value
                        )
                ) || null;

            render();
        };
    }

    $$("[data-delete-patient]").forEach(
        (button) => {
            button.onclick = async () => {

                if (
                    !confirm(
                        t("confirmDeletePatient")
                    )
                ) {
                    return;
                }

                const patientId =
                    Number(
                        button.dataset
                            .deletePatient
                    );

                try {
                    const backup =
                        await getPatientBackup(
                            patientId
                        );

                    await dbDeletePatient(
                        patientId
                    );

                    if (
                        state.selectedPatient
                            ?.id === patientId
                    ) {
                        state.selectedPatient =
                            null;
                    }

                    state.treatmentPatientId =
                        null;

                    state.prescriptionPatientId =
                        null;

                    await refresh(true);

                    showUndo(
                        "Patient deleted",
                        async () => {
                            await restorePatientBackup(
                                backup
                            );

                            state.selectedPatient =
                                backup.patient;

                            await refresh();
                        }
                    );

                } catch (error) {
                    console.error(
                        "Patient deletion failed:",
                        error
                    );

                    toast(
                        "Unable to delete patient."
                    );
                }
            };
        }
    );
}


function bindTreatmentPlanEvents() {
    $$(
        "[data-delete-treatment-plan]"
    ).forEach(
        (button) => {
            button.onclick = async () => {

                const planId =
                    Number(
                        button.dataset
                            .deleteTreatmentPlan
                    );

                if (
                    !confirm(
                        t(
                            "deleteTreatmentPlan"
                        ) + "?"
                    )
                ) {
                    return;
                }

                try {
                    const plan =
                        await dbGet(
                            "treatmentPlans",
                            planId
                        );

                    if (!plan) {
                        return;
                    }

                    await dbDelete(
                        "treatmentPlans",
                        planId
                    );

                    await refresh();

                    showUndo(
                        t(
                            "treatmentPlanDeleted"
                        ),
                        async () => {
                            await dbPut(
                                "treatmentPlans",
                                plan
                            );

                            await refresh();
                        }
                    );

                } catch (error) {
                    console.error(
                        "Treatment plan deletion failed:",
                        error
                    );

                    toast(
                        "Unable to delete treatment plan."
                    );
                }
            };
        }
    );

    $$(
        "[data-edit-treatment-plan]"
    ).forEach(
        (button) => {
            button.onclick = () => {
                const planId =
                    Number(
                        button.dataset
                            .editTreatmentPlan
                    );

                editTreatmentPlan(
                    planId
                );
            };
        }
    );
}


function bindTreatmentEvents() {
    $$(
        "[data-treatment-status]"
    ).forEach(
        (select) => {
            select.onchange = async () => {

                const treatmentId =
                    Number(
                        select.dataset
                            .treatmentStatus
                    );

                const treatment =
                    state.treatments.find(
                        (item) =>
                            item.id ===
                            treatmentId
                    );

                if (!treatment) {
                    return;
                }

                try {
                    await dbPut(
                        "treatments",
                        {
                            ...treatment,
                            status:
                                select.value,
                        }
                    );

                    toast(
                        t("saved")
                    );

                    await refresh();

                } catch (error) {
                    console.error(
                        "Failed to update treatment status:",
                        error
                    );

                    toast(
                        "Unable to update status."
                    );

                    render();
                }
            };
        }
    );
    $$("[data-edit-treatment]").forEach(
    (button) => {
        button.onclick = () =>
            editTreatment(
                Number(
                    button.dataset
                        .editTreatment
                )
            );
    }
);

$$("[data-delete-treatment]").forEach(
    (button) => {
        button.onclick = () =>
            deleteTreatment(
                Number(
                    button.dataset
                        .deleteTreatment
                )
            );
    }
);
}


function bindAppointmentEvents() {
    $$("[data-delete-appointment]").forEach(
        (button) => {
            button.onclick = async () => {

                if (
                    !confirm(
                        t(
                            "confirmDeleteAppointment"
                        )
                    )
                ) {
                    return;
                }

                const appointmentId =
                    Number(
                        button.dataset
                            .deleteAppointment
                    );

                try {
                    const appointment =
                        await dbGet(
                            "appointments",
                            appointmentId
                        );

                    if (!appointment) {
                        return;
                    }

                    await dbDelete(
                        "appointments",
                        appointmentId
                    );

                    await refresh();

                    showUndo(
                        "Appointment deleted",
                        async () => {
                            await dbPut(
                                "appointments",
                                appointment
                            );

                            await refresh();
                        }
                    );

                } catch (error) {
                    console.error(
                        "Appointment deletion failed:",
                        error
                    );

                    toast(
                        "Unable to delete appointment."
                    );
                }
            };
        }
    );

    $$("[data-agenda-date]").forEach(
        (button) => {
            button.onclick = () => {

                const current =
                    new Date(
                        `${state.agendaDate}T12:00:00`
                    );

                if (
                    button.dataset.agendaDate ===
                    "previous"
                ) {
                    current.setDate(
                        current.getDate() - 1
                    );
                }

                if (
                    button.dataset.agendaDate ===
                    "next"
                ) {
                    current.setDate(
                        current.getDate() + 1
                    );
                }

                state.agendaDate =
                    [
                        "previous",
                        "next",
                    ].includes(
                        button.dataset.agendaDate
                    )
                        ? current
                            .toISOString()
                            .slice(
                                0,
                                10
                            )
                        : button.dataset
                            .agendaDate ===
                            "today"
                            ? today()
                            : button.dataset
                                .agendaDate;

                render();
            };
        }
    );
}


function bindXrayEvents() {
    $$("[data-open-xray]").forEach(
        (element) => {
            element.onclick = () => {

                const xrayId =
                    Number(
                        element.dataset
                            .openXray
                    );

                openXrayViewer(
                    xrayId
                );
            };
        }
    );

    $$("[data-delete-xray]").forEach(
        (button) => {
            button.onclick = async (event) => {
                event.stopPropagation();
                const xrayId =
                    Number(
                        button.dataset
                            .deleteXray
                    );

                if (
                    !confirm(
                        t("deleteXray") + "?"
                    )
                ) {
                    return;
                }

                try {
                    const xray =
                        await dbGet(
                            "xrays",
                            xrayId
                        );

                    if (!xray) {
                        return;
                    }

                    await dbDelete(
                        "xrays",
                        xrayId
                    );

                    await refresh();

                    showUndo(
                        t("deleteXray"),
                        async () => {
                            await dbPut(
                                "xrays",
                                xray
                            );

                            await refresh();
                        }
                    );

                } catch (error) {
                    console.error(
                        "X-ray deletion failed:",
                        error
                    );

                    toast(
                        "Unable to delete X-ray."
                    );
                }
            };
        }
    );

    const xray =
        $("#xrayUpload");

    if (xray) {
        xray.onchange =
            async () => {

                const file =
                    xray.files[0];

                if (!file) {
                    return;
                }

                if (
                    !state.selectedPatient
                ) {
                    toast(
                        t(
                            "selectPatientFirst"
                        )
                    );

                    xray.value = "";

                    return;
                }

                try {

                    const compressed =
                        await compressXray(
                            file
                        );

                    const base64Data =
                        await blobToBase64(
                            compressed
                        );

                    const xrayType =
                        $("#xrayType")
                            ?.value ||
                        "other";

                    const toothNumber =
                        Number(
                            $(
                                "#xrayToothNumber"
                            )?.value
                        ) || null;

                    const notes =
                        $(
                            "#xrayNotes"
                        )
                            ?.value.trim() ||
                        "";

                    await dbPut(
                        "xrays",
                        {
                            patientId:
                                state
                                    .selectedPatient
                                    .id,

                            filename:
                                file.name,

                            base64Data,

                            mimeType:
                                "image/webp",

                            originalMimeType:
                                file.type,

                            toothTag:
                                toothNumber,

                            type:
                                xrayType,

                            date:
                                today(),

                            time:
                                new Date()
                                    .toTimeString()
                                    .slice(0, 5),

                            notes:
                                notes,
                        }
                    );

                    toast(
                        t(
                            "xrayUploaded"
                        )
                    );

                    await refresh();

                } catch (error) {
                    console.error(
                        "X-ray upload failed:",
                        error
                    );

                    toast(
                        t(
                            "unableProcessXray"
                        )
                    );
                }

                xray.value = "";
            };
    }
}


function bindPrescriptionEvents() {
    $$(
        "[data-edit-prescription]"
    ).forEach(
        (button) => {
            button.onclick = () =>
                editPrescription(
                    Number(
                        button.dataset
                            .editPrescription
                    )
                );
        }
    );

    $$(
        "[data-print-prescription]"
    ).forEach(
        (button) => {
            button.onclick = () =>
                printPrescription(
                    Number(
                        button.dataset
                            .printPrescription
                    )
                );
        }
    );
}


function bindFormEvents() {
    const form =
        $("#patientForm");

    if (form) {
        form.onsubmit =
            async (event) => {
                event.preventDefault();

                const data =
                    Object.fromEntries(
                        new FormData(
                            form
                        )
                    );

                const updatedPatient = {
                    ...state.selectedPatient,
                    ...data,
                };

                await dbPut(
                    "patients",
                    updatedPatient
                );

                const patientAppointments =
                    state.appointments.filter(
                        (appointment) =>
                            appointment.patientId ===
                            updatedPatient.id
                    );

                for (const appointment of patientAppointments) {
                    await dbPut(
                        "appointments",
                        {
                            ...appointment,
                            patientName:
                                updatedPatient.name,
                        }
                    );
                }

                toast(
                    t("patientSaved")
                );

                await refresh();
            };
    }

    const settingsForm =
        $("#settingsForm");

    if (settingsForm) {
        settingsForm.onsubmit =
            async (event) => {

                event.preventDefault();

                await dbPut(
                    "settings",
                    {
                        ...state.settings,

                        id: 1,

                        ...Object.fromEntries(
                            new FormData(
                                settingsForm
                            )
                        ),
                    }
                );

                toast(
                    t("saved")
                );

                await refresh();
            };
    }

    const saveToothNote =
        $("#saveToothNote");

    if (saveToothNote) {
        saveToothNote.onclick =
            saveCurrentToothNote;
    }
}


function bindNavigationEvents() {
    $$("[data-view]").forEach(
        (element) => {
            element.onclick = () => {
                state.view =
                    element.dataset.view;

                render();
            };
        }
    );

    $$("[data-tooth]").forEach(
        (element) => {
            element.onclick = () =>
                openTooth(
                    Number(
                        element.dataset
                            .tooth
                    )
                );
        }
    );

    $$("[data-mode]").forEach(
        (element) => {
            element.onclick = () => {
                state.toothMode =
                    element.dataset.mode;

                render();
            };
        }
    );

    $$("[data-action]").forEach(
        (element) => {
            element.onclick = () =>
                actions(
                    element.dataset.action
                );
        }
    );
}


function bindView() {
    bindPatientEvents();
    bindTreatmentPlanEvents();
    bindTreatmentEvents();
    bindAppointmentEvents();
    bindXrayEvents();
    bindPrescriptionEvents();
    bindFormEvents();
    bindNavigationEvents();
}


function bindGlobalEvents() {
    $("#langBtn").onclick =
        async () => {

            currentLanguage =
                currentLanguage === "en"
                    ? "ar"
                    : "en";

            await dbPut(
                "settings",
                {
                    ...state.settings,
                    id: 1,
                    currentLanguage,
                }
            );

            render();

            if (
                document.body.classList.contains(
                    "drawer-open"
                )
            ) {
                openTooth(
                    state.selectedTooth
                );
            }
        };

    $("#newPatientBtn").onclick =
        () => newPatient();

    $("#unlockBtn").onclick =
        verifyPIN;

    $("#savePINBtn").onclick =
        savePIN;

    $("#pinInput").addEventListener(
        "keydown",
        (event) => {
            if (
                event.key ===
                "Enter"
            ) {
                verifyPIN();
            }
        }
    );

    $("#confirmPINInput").addEventListener(
        "keydown",
        (event) => {
            if (
                event.key ===
                "Enter"
            ) {
                savePIN();
            }
        }
    );

    $("#backupBtn").onclick =
        () => exportData();

    $("#closeDrawer").onclick =
        () =>
            document.body
                .classList
                .remove(
                    "drawer-open"
                );

    $("#drawerBackdrop").onclick =
        () =>
            document.body
                .classList
                .remove(
                    "drawer-open"
                );

    $("#modalClose").onclick =
        () =>
            $("#modal")
                .classList
                .remove(
                    "show"
                );

    $("#globalSearch").oninput =
        (event) => {

            const term =
                event.target.value
                    .toLowerCase();

            const patient =
                state.patients.find(
                    (item) =>
                        item.name
                            .toLowerCase()
                            .includes(
                                term
                            ) ||
                        item.phone
                            ?.toLowerCase()
                            .includes(
                                term
                            )
                );

            if (patient) {
                state.selectedPatient =
                    patient;

                state.view =
                    "patients";

                render();
            }
        };

    const importInput = $("#importInput");

    if (importInput) {
        importInput.onchange = async (event) => {
            const file = event.target.files?.[0];

            if (!file) {
                return;
            }

            try {
                const source = await file.text();

                const data =
                    parseExcelBackup(source);

                validateImportedData(data);

                const confirmed = confirm(
                    t("confirmWipe")
                );

                if (!confirmed) {
                    return;
                }

                await safeImport(data);

                toast(t("restored"));

                state.selectedPatient = null;
                state.treatmentPatientId = null;
                state.treatmentPlanPatientId = null;
                state.prescriptionPatientId = null;

                await refresh(true);

            } catch (error) {
                console.error(
                    "Backup import failed:",
                    error
                );

                alert(
                    error?.message ||
                    "Invalid backup file."
                );

            } finally {
                /*
                 * Allow the same file to be
                 * selected again.
                 */
                importInput.value = "";
            }
        };
    }

    if (
        localStorage.getItem(
            "aerodent-sidebar-collapsed"
        ) === "true"
    ) {
        document.body.classList.add(
            "sidebar-collapsed"
        );
    }

    $("#sidebarToggle").onclick =
        () => {

            const collapsed =
                document.body.classList.toggle(
                    "sidebar-collapsed"
                );

            localStorage.setItem(
                "aerodent-sidebar-collapsed",
                String(collapsed)
            );

            setText();
        };

    bindKeyboardEvents();
    bindInactivityEvents();
}


function bindKeyboardEvents() {
    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.target.matches(
                    "input, textarea, select"
                )
            ) {
                return;
            }

            if (
                event.key === "Escape"
            ) {
                $("#modal")
                    .classList
                    .remove(
                        "show"
                    );

                document.body.classList.remove(
                    "drawer-open"
                );
            }

            if (
                event.key.toLowerCase() ===
                "n"
            ) {
                newPatient();
            }

            if (
                event.key.toLowerCase() ===
                "a"
            ) {
                addAppointment();
            }

            if (
                event.key.toLowerCase() ===
                "p"
            ) {
                state.view =
                    "patients";

                render();
            }

            if (
                event.key.toLowerCase() ===
                "o"
            ) {
                state.view =
                    "odontogram";

                render();
            }

            if (
                event.ctrlKey &&
                event.key.toLowerCase() ===
                "k"
            ) {
                event.preventDefault();

                $("#globalSearch")
                    .focus();
            }
        }
    );
}


function bindInactivityEvents() {
    const activityEvents = [
        "mousemove",
        "mousedown",
        "keydown",
        "touchstart",
        "scroll",
    ];

    activityEvents.forEach((eventName) => {
        document.addEventListener(
            eventName,
            () => {
                const appShell =
                    document.querySelector(".app-shell");

                if (
                    appShell &&
                    !appShell.classList.contains("app-locked")
                ) {
                    resetInactivityTimer();
                }
            },
            true
        );
    });
}

bindGlobalEvents();
