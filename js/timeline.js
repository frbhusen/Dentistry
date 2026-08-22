
function renderPatientTimeline(patientId) {
    const events = [];

    // Appointments
    state.appointments
        .filter((item) => item.patientId === patientId)
        .forEach((item) => {
            events.push({
                type: "appointment",
                date: item.date || "",
                time: item.startTime || "",
                title: item.procedure || t("appointment"),
                description: `${item.startTime || ""} · ${t(item.status || "booked")}`,
                icon: "📅",
                status: item.status || "booked",
            });
        });

    // Treatments
    state.treatments
        .filter((item) => item.patientId === patientId)
        .forEach((item) => {
            events.push({
                type: "treatment",
                date: item.date || "",
                time: "",
                title: item.description || t("treatment"),
                description: `${item.toothNumber ? `#${item.toothNumber} · ` : ""}${money(item.fee)}`,
                icon: "🦷",
                status: item.status || "planned",
            });
        });

    // Treatment plans
    state.treatmentPlans
        .filter((item) => item.patientId === patientId)
        .forEach((item) => {
            events.push({
                type: "treatment-plan",
                date: item.updatedAt || item.createdAt || "",
                time: "",
                title: item.procedure || t("treatmentPlan"),
                description: `${item.toothNumber ? `#${item.toothNumber} · ` : ""}${t(
                    "diagnosis",
                )}: ${item.diagnosis || "—"}`,
                icon: "📋",
                status: item.status || "planned",
            });
        });

    // Prescriptions
    state.prescriptions
        .filter((item) => item.patientId === patientId)
        .forEach((item) => {
            events.push({
                type: "prescription",
                date: item.date || "",
                time: "",
                title: t("prescriptions"),
                description:
                    item.medications?.map((medication) => medication.name).join(", ") ||
                    t("medication"),
                icon: "💊",
                status: "",
            });
        });

    // X-rays
    state.xrays
        .filter((item) => item.patientId === patientId)
        .forEach((item) => {
            events.push({
                type: "xray",
                id: item.id,
                date: item.date || "",
                time: "",
                title: item.filename || t("xrays"),
                description: `${t(item.type || "other")}${item.toothTag ? ` · ${t("toothNumber")} #${item.toothTag}` : ""
                    }`,
                icon: "📷",
                status: "",
            });
        });

    // Newest first
    events.sort((a, b) => {
        const first = `${b.date} ${b.time}`.trim();

        const second = `${a.date} ${a.time}`.trim();

        return first.localeCompare(second);
    });

    if (!events.length) {
        return `
            <div class="timeline-empty">
                ${t("noVisits")}
            </div>
        `;
    }

    return `
    <div class="patient-timeline">

        ${events
            .map(
                (event) => `
                    <div
                        class="timeline-event ${
                            event.type === "xray"
                                ? "timeline-event-clickable"
                                : ""
                        }"
                        ${
                            event.type === "xray"
                                ? `data-open-xray="${event.id}"`
                                : ""
                        }
                    >

                        <div class="timeline-marker">
                            ${event.icon}
                        </div>

                        <div class="timeline-content">

                            <div class="timeline-event-header">

                                <div>
                                    <strong>
                                        ${esc(event.title)}
                                    </strong>

                                    <small>
                                        ${esc(event.date)}
                                        ${
                                            event.time
                                                ? ` · ${esc(event.time)}`
                                                : ""
                                        }
                                    </small>
                                </div>

                                ${
                                    event.status
                                        ? `
                                            <span class="badge">
                                                ${t(event.status)}
                                            </span>
                                        `
                                        : ""
                                }

                            </div>

                            <p>
                                ${esc(event.description)}
                            </p>

                        </div>

                    </div>
                `,
            )
            .join("")}

    </div>
`;
}
