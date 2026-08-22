function renderAppointments() {
    const entries = state.appointments.filter(
        (item) => item.date === state.agendaDate,
    );
    const start = timeToMinutes(state.settings.workStartHour || "09:00");
    const end = timeToMinutes(state.settings.workEndHour || "18:00");
    const slot = Number(state.settings.slotDuration) || 30;
    const times = [];
    for (let value = start; value <= end; value += slot)
        times.push(minutesToTime(value));
    const weekDates = calendarWeekDates(state.agendaDate);
    const weekStrip = weekDates
        .map(
            (date) =>
                `<button class="calendar-day ${date === state.agendaDate ? "active" : ""}" data-agenda-date="${date}"><span>${calendarDateLabel(date)}</span><b>${state.appointments.filter((item) => item.date === date).length}</b></button>`,
        )
        .join("");
    return `<section class="card calendar-card"><div class="card-heading"><div><h2>${t("appointments")}</h2><div class="agenda-date-controls"><button class="icon-button" data-agenda-date="previous" title="${t("previousDay")}" aria-label="${t("previousDay")}">‹</button><button class="button button-ghost" data-agenda-date="today">${t("today")}</button><b>${calendarDateLabel(state.agendaDate)}</b><button class="icon-button" data-agenda-date="next" title="${t("nextDay")}" aria-label="${t("nextDay")}">›</button></div></div><button class="button button-primary" data-action="addAppointment">＋ ${t("addAppointment")}</button></div><div class="calendar-week">${weekStrip}</div><div class="calendar-summary"><strong>${entries.length}</strong><span>${t("appointments")} · ${state.agendaDate}</span></div><div class="agenda">${times
        .map(
            (time) =>
                `<div class="agenda-row"><div class="agenda-time">${time}</div><div>${entries
                    .filter((item) => item.startTime === time)
                    .map(
                        (item) =>
                            `<div class="appointment"><div><b>${esc(item.patientName)} · ${esc(item.procedure)}</b><span>${esc(item.startTime)} · ${t(item.status)}</span></div><button class="appointment-delete" data-delete-appointment="${item.id}" title="${t("deleteAppointment")}" aria-label="${t("deleteAppointment")}">×</button></div>`,
                    )
                    .join("")}</div></div>`,
        )
        .join("")}</div></section>`;
}

function addAppointment() {
    const patientOptions = state.patients
        .map(
            (patient) =>
                `<option value="${patient.id}" ${patient.id === state.selectedPatient?.id ? "selected" : ""}>${esc(patient.name)} · ${esc(patient.phone || "")}</option>`,
        )
        .join("");
    modal(
        t("addAppointment"),
        `<form id="appointmentForm" class="form-grid"><div class="field full-span"><label>${t("patient")}</label><select name="patientId" required><option value="">${t("selectPatient")}</option>${patientOptions}</select></div><div class="field"><label>${t("date")}</label><input type="date" name="date" value="${state.agendaDate}"></div><div class="field"><label>${t("time")}</label><input type="time" name="startTime" value="10:00"></div><div class="field full-span"><label>${t("procedure")}</label><input name="procedure" value="Routine examination"></div><div class="form-actions full-span"><button class="button button-primary">${t("save")}</button></div></form>`,
    );
    $("#appointmentForm").onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const patient = state.patients.find(
            (item) => item.id === Number(data.patientId),
        );
        if (!patient) return;
        await dbPut("appointments", {
            ...data,
            patientId: patient.id,
            patientName: patient.name,
            duration: 30,
            status: "booked",
        });
        state.selectedPatient = patient;
        $("#modal").classList.remove("show");
        await refresh();
    };
}







function timeToMinutes(value) {
    const [hours, minutes] = String(value || "00:00")
        .split(":")
        .map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(value) {
    return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
function calendarDateLabel(date) {
    return new Date(`${date}T12:00:00`).toLocaleDateString(
        currentLanguage === "ar" ? "ar-SA" : "en-US",
        { weekday: "short", day: "numeric", month: "short" },
    );
}
function calendarWeekDates(centerDate) {
    const center = new Date(`${centerDate}T12:00:00`);
    const day = center.getDay();
    const start = new Date(center);
    start.setDate(center.getDate() - day);
    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return date.toISOString().slice(0, 10);
    });
}