
let undoAction = null;
let undoTimer = null;

function setText() {
    document.documentElement.lang =
        currentLanguage;

    document.documentElement.dir =
        currentLanguage === "ar"
            ? "rtl"
            : "ltr";

    $$("[data-i18n]").forEach(
        (node) =>
        (node.textContent =
            t(node.dataset.i18n)),
    );

    $$("[data-i18n-placeholder]").forEach(
        (node) =>
        (node.placeholder =
            t(
                node.dataset
                    .i18nPlaceholder
            )),
    );

    $("#langBtn").textContent =
        currentLanguage === "ar"
            ? "English"
            : "العربية";

    $("#doctorName").textContent =
        state.settings.doctorName ||
        "Dr. Hussein";

    $("#clinicName").textContent =
        state.settings.clinicName ||
        t("appName");

    const collapsed =
        document.body.classList.contains(
            "sidebar-collapsed",
        );

    $("#sidebarToggle").setAttribute(
        "aria-label",
        collapsed
            ? t("sidebarExpand")
            : t("sidebarCollapse"),
    );

    $("#sidebarToggle").setAttribute(
        "aria-expanded",
        String(!collapsed),
    );
}

function renderNav() {
    $("#nav").innerHTML =
        NAV.map(
            ([id, icon, key]) =>
                `<button class="nav-item ${state.view === id
                    ? "active"
                    : ""
                }" data-view="${id}">
                    <span class="nav-icon">
                        ${icon}
                    </span>
                    <span data-i18n="${key}">
                        ${t(key)}
                    </span>
                </button>`,
        ).join("");

    $$(".nav-item").forEach(
        (button) => {
            button.onclick = () => {
                state.view =
                    button.dataset.view;

                render();
            };
        },
    );
}

function render() {
    setText();
    renderNav();
    const section = NAV.find((item) => item[0] === state.view);
    $("#currentSection").textContent = section
        ? t(section[2]).toUpperCase()
        : "OVERVIEW";
    $("#selectedPatientLabel").textContent =
        state.view === "appointments"
            ? ""
            : state.selectedPatient?.name || t("selectPatient");
    $(".page-heading h1").textContent = section ? t(section[2]) : t("dashboard");
    const views = {
        dashboard: renderDashboard,
        odontogram: renderOdontogram,
        patients: renderPatients,
        treatments: renderTreatments,
        treatmentPlan: renderTreatmentPlans,
        appointments: renderAppointments,
        prescriptions: renderPrescriptions,
        xrays: renderXrays,
        settings: renderSettings,
    };
    $("#view").innerHTML = (views[state.view] || renderDashboard)();
    bindView();
}
function modal(title, body) {
    $("#modalContent").innerHTML = `<h2>${title}</h2>${body}`;
    $("#modal").classList.add("show");
}
function toast(message) {
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    document.body.append(node);
    setTimeout(() => node.remove(), 2400);
}
function showUndo(message, action) {
    clearTimeout(undoTimer);

    undoAction = action;

    const existingToast = document.querySelector(".undo-toast");

    if (existingToast) {
        existingToast.remove();
    }

    const node = document.createElement("div");

    node.className = "toast undo-toast";

    node.innerHTML = `
        <span>${esc(message)}</span>
        <button type="button" id="undoBtn">
            ${t("undo")}
        </button>
    `;

    document.body.append(node);

    $("#undoBtn").onclick = async () => {
        if (!undoAction) return;

        const actionToRun = undoAction;

        undoAction = null;

        clearTimeout(undoTimer);

        node.remove();

        try {
            await actionToRun();
        } catch (error) {
            console.error("Undo failed:", error);

            toast(
                t("unableUndo")
            );
        }
    };

    undoTimer = setTimeout(() => {
        undoAction = null;
        node.remove();
    }, 5000);
}