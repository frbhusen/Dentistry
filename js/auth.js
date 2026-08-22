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
        $("#pinError").textContent = "PIN must contain 4–6 digits.";

        return;
    }

    if (pin !== confirmPIN) {
        $("#pinError").textContent = "PINs do not match.";

        return;
    }

    const pinHash = await hashPIN(pin);

    const newSettings = {
        ...state.settings,

        id: 1,

        pinEnabled: true,

        pinHash,
    };

    await dbPut("settings", newSettings);

    state.settings = newSettings;

    $("#pinError").textContent = "";

    unlockApp();

    resetInactivityTimer();
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
            $("#pinError").textContent = "Incorrect PIN.";

            $("#pinInput").value = "";

            $("#pinInput").focus();
        }
    } catch (error) {
        console.error("PIN verification failed:", error);

        $("#pinError").textContent = "Unable to verify PIN.";
    }
}

let inactivityTimer = null;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);

    if (!state.settings.pinEnabled) {
        return;
    }

    inactivityTimer = setTimeout(
        () => {
            lockApp();
        },
        10 * 60 * 1000,
    );
}
