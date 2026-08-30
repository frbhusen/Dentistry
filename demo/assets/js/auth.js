async function hashPIN(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

async function derivePINHash(pin, existingSaltHex) {
    const saltBytes = existingSaltHex
        ? new Uint8Array(existingSaltHex.match(/.{1,2}/g).map((b) => parseInt(b, 16)))
        : crypto.getRandomValues(new Uint8Array(16));

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(pin),
        "PBKDF2",
        false,
        ["deriveBits"],
    );

    const derivedBits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: saltBytes, iterations: 150000, hash: "SHA-256" },
        keyMaterial,
        256,
    );

    const toHex = (bytes) =>
        Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("");

    return { hash: toHex(derivedBits), salt: toHex(saltBytes) };
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

    $("#lockTitle").textContent = t("lockTitle");

    $("#lockMessage").textContent = t("lockMessage");

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
    const lockScreen = $("#lockScreen");

    if (!lockScreen) {
        return;
    }

    // If a PIN already exists, always show the unlock screen.
    if (state.settings.pinHash || state.settings.pinEnabled === true) {
        lockApp();
        return;
    }

    document.querySelector(".app-shell").classList.add("app-locked");

    lockScreen.classList.remove("hidden");

    $("#unlockSection").classList.add("hidden");
    $("#setupPINSection").classList.remove("hidden");

    $("#lockTitle").textContent = t("setupPIN");

    $("#lockMessage").textContent = t("setupPINMessage");

    $("#pinError").textContent = "";

    $("#newPINInput").value = "";
    $("#confirmPINInput").value = "";

    setTimeout(() => {
        $("#newPINInput").focus();
    }, 50);
}

async function savePIN() {
    if (state.settings.pinHash || state.settings.pinEnabled === true) {
        lockApp();
        return;
    }

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

    const { hash, salt } = await derivePINHash(pin);

    const newSettings = {
        ...state.settings,

        id: 1,

        pinEnabled: true,

        pinHash: hash,

        pinSalt: salt,
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
            t("pinSaveFailed");
    }
}

let failedPinAttempts = 0;
let pinLockUntil = 0;

async function verifyPIN() {
    if (Date.now() < pinLockUntil) {
        const secondsLeft = Math.ceil((pinLockUntil - Date.now()) / 1000);
        $("#pinError").textContent = t("tooManyAttempts").replace("{seconds}", secondsLeft);
        return;
    }

    const pin = $("#pinInput").value.trim();
    if (!pin) {
        $("#pinError").textContent = t("enterPIN");
        return;
    }
    if (!state.settings.pinHash) {
        $("#pinError").textContent = t("noPINConfigured");
        return;
    }

    try {
        const { hash } = await derivePINHash(pin, state.settings.pinSalt);

        if (hash === state.settings.pinHash) {
            failedPinAttempts = 0;
            unlockApp();
            resetInactivityTimer();
        } else {
            failedPinAttempts++;
            if (failedPinAttempts >= 5) {
                pinLockUntil = Date.now() + 30000;
                failedPinAttempts = 0;
            }
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