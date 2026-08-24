async function hashPIN(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

function lockApp() {
    const lockScreen = $("#lockScreen");

    if (!lockScreen) {
        console.error("PIN lock screen was not found.");
        return;
    }

    document.querySelector(".app-shell").classList.add("app-locked");

    lockScreen.classList.remove("hidden");

    $("#pinInput").value = "";
    $("#newPINInput").value = "";
    $("#confirmPINInput").value = "";
    $("#pinError").textContent = "";

    $("#unlockSection").classList.remove("hidden");
    $("#setupPINSection").classList.add("hidden");

    $("#lockTitle").textContent = "AeroDent";
    $("#lockMessage").textContent = "Enter your PIN to continue";

    setTimeout(() => {
        $("#pinInput").focus();
    }, 50);
}

function unlockApp() {
    document.querySelector(".app-shell").classList.remove("app-locked");

    $("#lockScreen").classList.add("hidden");

    $("#pinInput").value = "";
    $("#pinError").textContent = "";

    resetInactivityTimer();
}

function showPINSetup() {
    // Never show setup if a PIN is already configured.
    if (state.settings.pinEnabled === true) {
        lockApp();
        return;
    }

    const lockScreen = $("#lockScreen");

    if (!lockScreen) {
        return;
    }

    document.querySelector(".app-shell").classList.add("app-locked");

    lockScreen.classList.remove("hidden");

    $("#unlockSection").classList.add("hidden");
    $("#setupPINSection").classList.remove("hidden");

    $("#lockTitle").textContent = "Set up your PIN";
    $("#lockMessage").textContent =
        "Create a 4–6 digit PIN to protect your clinic";

    $("#pinError").textContent = "";

    $("#newPINInput").value = "";
    $("#confirmPINInput").value = "";

    setTimeout(() => {
        $("#newPINInput").focus();
    }, 50);
}

async function savePIN() {
    const pin = $("#newPINInput").value.trim();

    const confirmPIN = $("#confirmPINInput").value.trim();

    if (!/^\d{4,6}$/.test(pin)) {
        $("#pinError").textContent = t("pinInvalid");

        return;
    }

    if (pin !== confirmPIN) {
        $("#pinError").textContent = t("pinMismatch");

        return;
    }

    const pinHash = await hashPIN(pin);

    const newSettings = {
        ...state.settings,

        id: 1,

        pinEnabled: true,

        pinHash,
    };

    try {
    await dbPut("settings", newSettings);

    state.settings = newSettings;

    $("#pinError").textContent = "";

    unlockApp();

    resetInactivityTimer();
} catch (error) {
    console.error("Failed to save PIN:", error);

    $("#pinError").textContent =
        "Unable to save PIN. Please try again.";
}
}

async function verifyPIN() {
    const pin = $("#pinInput").value.trim();

    if (!pin) {
        $("#pinError").textContent = "Please enter your PIN.";

        return;
    }

    if (!state.settings.pinHash) {
        $("#pinError").textContent = "No PIN has been configured.";

        return;
    }

    try {
        const enteredHash = await hashPIN(pin);

        if (enteredHash === state.settings.pinHash) {
            unlockApp();

            resetInactivityTimer();
        } else {
            $("#pinError").textContent = t("pinIncorrect");

            $("#pinInput").value = "";

            $("#pinInput").focus();
        }
    } catch (error) {
        console.error("PIN verification failed:", error);

        $("#pinError").textContent = t("pinVerifyFailed");
    }
}

let inactivityTimer = null;

const INACTIVITY_LIMIT = 10 * 60 * 1000;

let lastActivityTime = Date.now();

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);

    if (!state.settings.pinEnabled) {
        return;
    }

    if (
        document
            .querySelector(".app-shell")
            ?.classList.contains("app-locked")
    ) {
        return;
    }

    lastActivityTime = Date.now();

    inactivityTimer = setTimeout(checkInactivity, INACTIVITY_LIMIT);
}

function checkInactivity() {
    if (!state.settings.pinEnabled) {
        return;
    }

    if (
        document
            .querySelector(".app-shell")
            ?.classList.contains("app-locked")
    ) {
        return;
    }

    const inactiveFor =
        Date.now() - lastActivityTime;

    if (inactiveFor >= INACTIVITY_LIMIT) {
        lockApp();
        return;
    }

    inactivityTimer = setTimeout(
        checkInactivity,
        INACTIVITY_LIMIT - inactiveFor
    );
}