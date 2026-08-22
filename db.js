const DB_NAME = "mizan-dental-db";

const DB_VERSION = 2;

const STORES = [
    "patients",
    "odontograms",
    "appointments",
    "treatments",
    "treatmentPlans",
    "invoices",
    "prescriptions",
    "xrays",
    "settings",
];

let database;
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      STORES.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          const os = db.createObjectStore(store, {
            keyPath: "id",
            autoIncrement: true,
          });
          if (store !== "settings") os.createIndex("patientId", "patientId");
        }
      });
    };
    request.onsuccess = () => {
      database = request.result;
      resolve(database);
    };
    request.onerror = () => reject(request.error);
  });
}
async function dbReady() {
  return database || openDB();
}
async function dbGetAll(store) {
  const db = await dbReady();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbGet(store, id) {
  const db = await dbReady();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbPut(store, value) {
  const db = await dbReady();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(store, "readwrite")
      .objectStore(store)
      .put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbDelete(store, id) {
  const db = await dbReady();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(store, "readwrite")
      .objectStore(store)
      .delete(id);
    req.onsuccess = resolve;
    req.onerror = () => reject(req.error);
  });
}
async function dbDeletePatient(patientId) {
  const db = await dbReady();
  const relatedStores = [
    "odontograms",
    "appointments",
    "treatments",
    "invoices",
    "prescriptions",
    "xrays",
  ];
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      ["patients", ...relatedStores],
      "readwrite",
    );
    const removeRelated = (store) => {
      const objectStore = transaction.objectStore(store);
      const request = objectStore.index("patientId").getAllKeys(patientId);
      request.onsuccess = () =>
        request.result.forEach((id) => objectStore.delete(id));
      request.onerror = () => transaction.abort();
    };
    relatedStores.forEach(removeRelated);
    transaction.objectStore("patients").delete(patientId);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () =>
      reject(transaction.error || new Error("Patient deletion aborted"));
  });
}
async function dbClear(store) {
  const db = await dbReady();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readwrite").objectStore(store).clear();
    req.onsuccess = resolve;
    req.onerror = () => reject(req.error);
  });
}
async function dbExport() {
  const data = {};
  for (const store of STORES) data[store] = await dbGetAll(store);
  return data;
}

function validateBackup(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return false;
    }

    // A backup must contain at least one recognized store.
    const availableStores = STORES.filter(
        (store) => Array.isArray(data[store])
    );

    if (!availableStores.length) {
        return false;
    }

    // Every present store must contain an array.
    for (const key of Object.keys(data)) {
        if (!STORES.includes(key)) {
            continue;
        }

        if (!Array.isArray(data[key])) {
            return false;
        }
    }

    return true;
}


function validateImportedData(data) {
    if (!validateBackup(data)) {
        throw new Error("Invalid backup structure.");
    }

    // Check IDs.
    for (const store of STORES) {
        const rows = Array.isArray(data[store])
            ? data[store]
            : [];

        for (const item of rows) {
            if (!item || typeof item !== "object" || Array.isArray(item)) {
                throw new Error(
                    `Invalid record found in ${store}.`
                );
            }

            if (
                item.id !== undefined &&
                item.id !== null &&
                item.id !== "" &&
                !Number.isFinite(Number(item.id))
            ) {
                throw new Error(
                    `Invalid ID found in ${store}.`
                );
            }
        }
    }

    // Patient IDs must be unique.
    const patientIds = new Set();

    for (const patient of data.patients || []) {
        if (patient.id === undefined || patient.id === null) {
            continue;
        }

        const id = Number(patient.id);

        if (patientIds.has(id)) {
            throw new Error(
                `Duplicate patient ID found: ${id}`
            );
        }

        patientIds.add(id);
    }

    return true;
}


function normalizeImportedData(data) {
    const normalized = {};

    for (const store of STORES) {
        normalized[store] = Array.isArray(data[store])
            ? data[store].map((item) => ({ ...item }))
            : [];
    }

    return normalized;
}


async function dbImport(data) {
    validateImportedData(data);

    const normalized = normalizeImportedData(data);

    // Clear existing data first.
    for (const store of STORES) {
        await dbClear(store);
    }

    // Restore every known store.
    for (const store of STORES) {
        for (const item of normalized[store]) {
            await dbPut(store, item);
        }
    }
}


function verifyImportedData(original, imported) {
    for (const store of STORES) {
        const originalRows = Array.isArray(original[store])
            ? original[store]
            : [];

        const importedRows = Array.isArray(imported[store])
            ? imported[store]
            : [];

        if (originalRows.length !== importedRows.length) {
            console.error(
                `Import verification failed for ${store}:`,
                originalRows.length,
                importedRows.length
            );

            return false;
        }
    }

    return true;
}


async function safeImport(data) {
    const previousData = await dbExport();

    try {
        validateImportedData(data);

        await dbImport(data);

        const importedData = await dbExport();

        if (!verifyImportedData(data, importedData)) {
            throw new Error(
                "Imported data could not be verified."
            );
        }

        return true;
    } catch (error) {
        console.error("Import failed:", error);

        try {
            await dbImport(previousData);
        } catch (restoreError) {
            console.error(
                "Failed to restore previous database:",
                restoreError
            );
        }

        throw error;
    }
}

async function seedDatabase() {
  if ((await dbGetAll("patients")).length) return;
  const patientId = await dbPut("patients", {
    name: "Test Patient",
    phone: "+966 55 218 4301",
    location: "Damascus",
    workStudy: "University student",
    dob: "1992-07-14",
    gender: "Female",
    allergies: "Penicillin",
    medicalFlags: "Hypertension",
    notes: "Prefers morning appointments.",
    createdAt: new Date().toISOString(),
  });
  await dbPut("odontograms", {
    patientId,
    toothNumber: 14,
    surface: "O",
    condition: "decay",
    procedure: "Exam",
    notes: "Occlusal lesion",
    timestamp: new Date().toISOString(),
  });
  await dbPut("appointments", {
    patientId,
    patientName: "Test Patient",
    date: new Date().toISOString().slice(0, 10),
    startTime: "10:30",
    duration: 30,
    status: "booked",
    procedure: "Routine examination",
    notes: "",
  });
  await dbPut("treatments", {
    patientId,
    toothNumber: 14,
    description: "Composite restoration",
    fee: 180,
    status: "Planned",
    date: new Date().toISOString().slice(0, 10),
  });
}
