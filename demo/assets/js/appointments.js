function renderAppointments() {
    const entries = state.appointments.filter(
        (item) => item.date === state.agendaDate,
    );

    const start = timeToMinutes(
        state.settings.workStartHour || "09:00"
    );

    const end = timeToMinutes(
        state.settings.workEndHour || "18:00"
    );

    const slot =
        Number(state.settings.slotDuration) || 30;

    const times = [];

    for (
        let value = start;
        value <= end;
        value += slot
    ) {
        times.push(minutesToTime(value));
    }

    const weekDates =
        calendarWeekDates(state.agendaDate);

    const weekStrip = weekDates
        .map(
            (date) =>
                `<button class="calendar-day ${date === state.agendaDate
                    ? "active"
                    : ""
                }" data-agenda-date="${date}">
                    <span>${calendarDateLabel(date)}</span>
                    <b>${state.appointments.filter(
                    (item) => item.date === date
                ).length
                }</b>
                </button>`
        )
        .join("");

    return `
        <section class="card calendar-card">

            <div class="card-heading">

                <div>
                    <h2>${t("appointments")}</h2>

                    <div class="agenda-date-controls">

                        <button
                            class="icon-button"
                            data-agenda-date="previous"
                            title="${t("previousDay")}"
                            aria-label="${t("previousDay")}"
                        >
                            ‹
                        </button>

                        <button
                            class="button button-ghost"
                            data-agenda-date="today"
                        >
                            ${t("today")}
                        </button>

                        <b>
                            ${calendarDateLabel(
        state.agendaDate
    )}
                        </b>

                        <button
                            class="icon-button"
                            data-agenda-date="next"
                            title="${t("nextDay")}"
                            aria-label="${t("nextDay")}"
                        >
                            ›
                        </button>

                    </div>
                </div>

                <button
                    class="button button-primary"
                    data-action="addAppointment"
                >
                    ＋ ${t("addAppointment")}
                </button>

            </div>

            <div class="calendar-week">
                ${weekStrip}
            </div>

            <div class="calendar-summary">
                <strong>${entries.length}</strong>
                <span>
                    ${t("appointments")} ·
                    ${state.agendaDate}
                </span>
            </div>

            <div class="agenda">

                ${times
            .map(
                (time) =>
                    `
                            <div class="agenda-row">

                                <div class="agenda-time">
                                    ${time}
                                </div>

                                <div>
                                    ${entries
                        .filter((item) => {
                            const appointmentStart =
                                timeToMinutes(item.startTime);

                            const slotStart =
                                timeToMinutes(time);

                            return (
                                appointmentStart >= slotStart &&
                                appointmentStart < slotStart + slot
                            );
                        })
                        .map(
                            (item) =>
                                `
                                                <div class="appointment">

                                                    <div>
                                                        <b>
                                                            ${esc(
                                    item.patientName
                                )}
                                                            ·
                                                            ${esc(
                                    item.procedure
                                )}
                                                        </b>

                                                        <span>
                                                            ${esc(
                                    item.startTime
                                )}
                                                            ·
                                                            ${t(
                                    item.status
                                )}
                                                        </span>
                                                    </div>
                                                    <button class="button button-ghost" data-edit-appointment="${item.id}">${t("edit")}</button>
                                                    <button
                                                        class="appointment-delete"
                                                        data-delete-appointment="${item.id}"
                                                        title="${t(
                                    "deleteAppointment"
                                )}"
                                                        aria-label="${t(
                                    "deleteAppointment"
                                )}"
                                                    >
                                                        ×
                                                    </button>

                                                </div>
                                                `
                        )
                        .join("")}
                                </div>

                            </div>
                            `
            )
            .join("")}

            </div>

        </section>
    `;
}


function addAppointment() {
    const patientOptions = state.patients
        .map(
            (patient) =>
                `<option
                    value="${patient.id}"
                    ${patient.id ===
                    state.selectedPatient?.id
                    ? "selected"
                    : ""
                }
                >
                    ${esc(patient.name)}
                    ·
                    ${esc(patient.phone || "")}
                </option>`
        )
        .join("");

    modal(
        t("addAppointment"),

        `
        <form
            id="appointmentForm"
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
                    ${t("date")}
                </label>

                <input
                    type="date"
                    name="date"
                    value="${state.agendaDate}"
                    required
                >

            </div>

            <div class="field">

                <label>
                    ${t("time")}
                </label>

                <input
                    type="time"
                    name="startTime"
                    value="10:00"
                    required
                >

            </div>

            <div class="field full-span">

                <label>
                    ${t("procedure")}
                </label>

                <input
                    name="procedure"
                    value="${t("routineExamination")}"
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
        `
    );

    $("#appointmentForm").onsubmit =
        async (e) => {
            e.preventDefault();

            const data =
                Object.fromEntries(
                    new FormData(e.target)
                );

            const {
                date,
                startTime
            } = data;

            const patient =
                state.patients.find(
                    (item) =>
                        item.id ===
                        Number(data.patientId)
                );

            if (!patient) {
                return;
            }

            const duration =
                Number(
                    state.settings.slotDuration
                ) || 30;
            const workStart =
                timeToMinutes(
                    state.settings.workStartHour || "09:00"
                );

            const workEnd =
                timeToMinutes(
                    state.settings.workEndHour || "18:00"
                );

            const appointmentStart =
                timeToMinutes(startTime);

            const appointmentEnd =
                appointmentStart + duration;

            if (
                appointmentStart < workStart ||
                appointmentEnd > workEnd
            ) {
                toast(
                    t("appointmentWorkingHours")
                );

                return;
            }
            /*
             * Calculate the new appointment
             * start and end times.
             */
            const newStart =
                new Date(
                    `${date}T${startTime}`
                );

            const newEnd =
                new Date(
                    newStart.getTime() +
                    duration * 60000
                );

            /*
             * Check whether the new appointment
             * overlaps an existing appointment.
             */
            const hasConflict =
                state.appointments.some(
                    (appointment) => {
                        if (appointment.status === "cancelled")
                            return false;
                        if (
                            appointment.date !==
                            date
                        ) {
                            return false;
                        }

                        const existingStart =
                            new Date(
                                `${appointment.date}T${appointment.startTime}`
                            );

                        const existingDuration =
                            Number(
                                appointment.duration
                            ) || 30;

                        const existingEnd =
                            new Date(
                                existingStart.getTime() +
                                existingDuration *
                                60000
                            );

                        return (
                            newStart <
                            existingEnd &&
                            newEnd >
                            existingStart
                        );
                    }
                );

            if (hasConflict) {
                toast(
                    t("appointmentConflict")
                );

                return;
            }

            /*
             * Save the appointment.
             */
            await dbPut(
                "appointments",
                {
                    ...data,
                    patientId: patient.id,
                    patientName: patient.name,
                    duration,
                    status: "booked",
                }
            );

            state.selectedPatient =
                patient;

            $("#modal")
                .classList
                .remove("show");

            await refresh();
        };
}

function editAppointment(id) {
    const appointment = state.appointments.find((item) => item.id === id);
    if (!appointment) return;

    modal(
        t("edit"),
        `
        <form id="editAppointmentForm" class="form-grid">
            <div class="field">
                <label>${t("date")}</label>
                <input type="date" name="date" value="${esc(appointment.date)}" required>
            </div>
            <div class="field">
                <label>${t("time")}</label>
                <input type="time" name="startTime" value="${esc(appointment.startTime)}" required>
            </div>
            <div class="field full-span">
                <label>${t("procedure")}</label>
                <input name="procedure" value="${esc(appointment.procedure || "")}">
            </div>
            <div class="field">
                <label>${t("status")}</label>
                <select name="status">
                    <option value="booked" ${appointment.status === "booked" ? "selected" : ""}>${t("booked")}</option>
                    <option value="completed" ${appointment.status === "completed" ? "selected" : ""}>${t("completed")}</option>
                    <option value="cancelled" ${appointment.status === "cancelled" ? "selected" : ""}>${t("cancelled")}</option>
                </select>
            </div>
            <div class="form-actions full-span">
                <button class="button button-primary" type="submit">${t("save")}</button>
            </div>
        </form>
        `,
    );

    $("#editAppointmentForm").onsubmit = async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.target));
        const duration = Number(appointment.duration) || Number(state.settings.slotDuration) || 30;
        const newStart = new Date(`${data.date}T${data.startTime}`);
        const newEnd = new Date(newStart.getTime() + duration * 60000);

        const hasConflict = state.appointments.some((other) => {
            if (other.id === appointment.id) return false;
            if (other.status === "cancelled") return false;
            if (other.date !== data.date) return false;
            const otherStart = new Date(`${other.date}T${other.startTime}`);
            const otherEnd = new Date(otherStart.getTime() + (Number(other.duration) || 30) * 60000);
            return newStart < otherEnd && newEnd > otherStart;
        });

        if (hasConflict) {
            toast("This time slot is already occupied.");
            return;
        }

        await dbPut("appointments", { ...appointment, ...data });
        $("#modal").classList.remove("show");
        await refresh();
    };
}

function timeToMinutes(value) {
    const [hours, minutes] =
        String(value || "00:00")
            .split(":")
            .map(Number);

    return (
        hours * 60 +
        minutes
    );
}


function minutesToTime(value) {
    return `${String(
        Math.floor(value / 60)
    ).padStart(2, "0")}:${String(
        value % 60
    ).padStart(2, "0")}`;
}


function calendarDateLabel(date) {
    return new Date(
        `${date}T12:00:00`
    ).toLocaleDateString(
        currentLanguage === "ar"
            ? "ar-SA"
            : "en-US",
        {
            weekday: "short",
            day: "numeric",
            month: "short",
        }
    );
}


function calendarWeekDates(centerDate) {
    const center =
        new Date(
            `${centerDate}T12:00:00`
        );

    const day =
        center.getDay();

    const start =
        new Date(center);

    start.setDate(
        center.getDate() - day
    );

    return Array.from(
        { length: 7 },
        (_, index) => {
            const date =
                new Date(start);

            date.setDate(
                start.getDate() +
                index
            );

            return date
                .toISOString()
                .slice(0, 10);
        }
    );
}