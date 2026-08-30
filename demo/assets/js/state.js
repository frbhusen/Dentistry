const state = {
    view: "dashboard",

    selectedPatient: null,

    odontogramPatientId: null,
    treatmentPatientId: null,
    prescriptionPatientId: null,
    treatmentPlanPatientId: null,
    printPrescriptionId: null,
    agendaDate:
        new Date()
            .toISOString()
            .slice(0, 10),

    selectedTooth: 14,

    toothMode: "permanent",

    odontograms: [],
    patients: [],
    appointments: [],
    treatments: [],
    treatmentPlans: [],
    invoices: [],
    prescriptions: [],
    xrays: [],

    settings: {},
};

const NAV = [
    ["dashboard", "⌂", "dashboard"],
    ["odontogram", "◈", "odontogram"],
    ["patients", "♙", "patients"],
    ["treatments", "▣", "treatments"],
    ["treatmentPlan", "▤", "treatmentPlan"],
    ["appointments", "▦", "appointments"],
    ["prescriptions", "Rx", "prescriptions"],
    ["xrays", "▧", "xrays"],
    ["settings", "⚙", "settings"],
];

const PROCEDURES = [
    ["decay", "decay"],
    ["filling", "filling"],
    ["crown", "crown"],
    ["rct", "rct"],
    ["extract", "extract"],
    ["implant", "implant"],
    ["clear", "clear"],
];