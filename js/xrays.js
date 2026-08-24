function renderXrays() {
    const images = state.xrays.filter(
        (item) => item.patientId === state.selectedPatient?.id,
    );

    return `
        <section class="card">

            <div class="card-heading">

                <div>
                    <h2>
                        ${t("xrays")}
                    </h2>

                    <p class="muted">
                        ${images.length}
                        ${t("saved")}
                    </p>
                </div>

            </div>

            ${patientSelector("xrayPatientSelect", state.selectedPatient)}

            ${state.selectedPatient
            ? `
                        <div class="xray-upload-form">

                            <div class="field">

                                <label>
                                    ${t("xrayType")}
                                </label>

                                <select id="xrayType">

                                    <option value="periapical">
                                        ${t("periapical")}
                                    </option>

                                    <option value="bitewing">
                                        ${t("bitewing")}
                                    </option>

                                    <option value="panoramic">
                                        ${t("panoramic")}
                                    </option>

                                    <option value="cephalometric">
                                        ${t("cephalometric")}
                                    </option>

                                    <option value="cbct">
                                        ${t("cbct")}
                                    </option>

                                    <option value="other">
                                        ${t("other")}
                                    </option>

                                </select>

                            </div>

                            <div class="field">

                                <label>
                                    ${t("toothNumber")}
                                </label>

                                <input
                                    id="xrayToothNumber"
                                    type="number"
                                    min="1"
                                    max="85"
                                    placeholder="${t("toothNumber")}"
                                >

                            </div>

                            <div class="field full-span">

                                <label>
                                    ${t("clinicalNotes")}
                                </label>

                                <textarea
                                    id="xrayNotes"
                                    rows="3"
                                    placeholder="${t("clinicalNotes")}"
                                ></textarea>

                            </div>

                            <label class="button button-primary">

                                ＋ ${t("upload")}

                                <input
                                    id="xrayUpload"
                                    type="file"
                                    accept="image/*"
                                    hidden
                                >

                            </label>

                        </div>
                    `
            : `
                        <p class="muted">
                            ${t("selectPatient")}
                        </p>
                    `
        }

            <div class="xray-grid">

                ${images.length
            ? images
                .map(
                    (item) => `
                                    <div
    class="xray-item xray-item-clickable"
    data-open-xray="${item.id}"
>

                                        <img
                                            src="${item.base64Data}"
                                            alt="${esc(item.filename)}"
                                        >

                                        <div class="xray-info">

                                            <div>

                                                <b>
                                                    ${esc(item.filename)}
                                                </b>

                                                <div class="xray-meta">

                                                    <span>
                                                        ${t(
                        item.type || "other",
                    )}
                                                    </span>

                                                    ${item.toothTag
                            ? `
                                                                <span>
                                                                    ${t("toothNumber")}
                                                                    #${esc(item.toothTag)}
                                                                </span>
                                                            `
                            : ""
                        }

                                                    <span>
                                                        ${formatXrayTimestamp(item)}
                                                    </span>

                                                </div>

                                                ${item.notes
                            ? `
                                                            <p class="xray-notes">
                                                                ${esc(
                                item.notes,
                            )}
                                                            </p>
                                                        `
                            : ""
                        }

                                            </div>

                                            <button
                                                type="button"
                                                class="xray-delete-button"
                                                data-delete-xray="${item.id}"
                                                title="${t("deleteXray")}"
                                                aria-label="${t("deleteXray")}"
                                            >
                                                ×
                                            </button>

                                        </div>

                                    </div>
                                `,
                )
                .join("")
            : `
                            <p class="muted">
                                ${t("noVisits")}
                            </p>
                        `
        }

            </div>

        </section>
    `;
}

function formatXrayTimestamp(xray) {
    return [xray.date, xray.time]
        .filter(Boolean)
        .map((value) => esc(value))
        .join(" · ");
}

function editXray(xrayId) {
    const xray = state.xrays.find((item) => item.id === xrayId);

    if (!xray) {
        return;
    }

    modal(
        t("edit"),
        `
        <form id="xrayEditForm" class="form-grid">
            <div class="field full-span">
                <label>${t("xrayName")}</label>
                <input
                    name="filename"
                    value='${esc(xray.filename || "")}'
                    required
                >
            </div>

            <div class="field">
                <label>${t("date")}</label>
                <input
                    type="date"
                    name="date"
                    value="${esc(xray.date || today())}"
                    required
                >
            </div>

            <div class="field">
                <label>${t("xrayType")}</label>
                <select name="type">
                    <option
                        value="periapical"
                        ${xray.type === "periapical" ? "selected" : ""}
                    >
                        ${t("periapical")}
                    </option>
                    <option
                        value="bitewing"
                        ${xray.type === "bitewing" ? "selected" : ""}
                    >
                        ${t("bitewing")}
                    </option>
                    <option
                        value="panoramic"
                        ${xray.type === "panoramic" ? "selected" : ""}
                    >
                        ${t("panoramic")}
                    </option>
                    <option
                        value="cephalometric"
                        ${xray.type === "cephalometric" ? "selected" : ""}
                    >
                        ${t("cephalometric")}
                    </option>
                    <option
                        value="cbct"
                        ${xray.type === "cbct" ? "selected" : ""}
                    >
                        ${t("cbct")}
                    </option>
                    <option
                        value="other"
                        ${!xray.type || xray.type === "other" ? "selected" : ""}
                    >
                        ${t("other")}
                    </option>
                </select>
            </div>

            <div class="field">
                <label>${t("time")}</label>
                <input
                    type="time"
                    name="time"
                    value='${esc(xray.time || "")}'
                >
            </div>

            <div class="form-actions full-span">
                <button type="button" class="button button-ghost" id="cancelXrayEdit">
                    ${t("cancel")}
                </button>

                <button class="button button-primary">
                    ${t("save")}
                </button>
            </div>
        </form>
        `,
    );

    $("#cancelXrayEdit").onclick = () => openXrayViewer(xrayId);

    $("#xrayEditForm").onsubmit = async (event) => {
        event.preventDefault();

        const data = Object.fromEntries(new FormData(event.target));

        await dbPut("xrays", {
            ...xray,
            filename: data.filename.trim(),
            date: data.date,
            type: data.type || "other",
            time: data.time,
        });

        await refresh();
        openXrayViewer(xrayId);
    };
}

function openXrayViewer(xrayId) {
    const xray = state.xrays.find((item) => item.id === xrayId);

    if (!xray) {
        return;
    }

    modal(
        xray.filename || t("xrays"),
        `
        <div class="xray-viewer">

            <div class="xray-viewer-toolbar">

                <div class="xray-viewer-info">

                    <span class="badge">
                        ${t(xray.type || "other")}
                    </span>

                    ${xray.toothTag
            ? `
                                <span class="badge">
                                    ${t("toothNumber")}
                                    #${esc(xray.toothTag)}
                                </span>
                            `
            : ""
        }

                    <span class="muted">
                        ${formatXrayTimestamp(xray)}
                    </span>

                </div>

                <div class="xray-viewer-actions">

                    <button
                        type="button"
                        class="button button-ghost"
                        id="xrayEdit"
                    >
                        ${t("edit")}
                    </button>

                    <button
                        type="button"
                        class="button button-ghost"
                        id="xrayZoomOut"
                    >
                        −
                    </button>

                    <span
                        id="xrayZoomLabel"
                        class="xray-zoom-label"
                    >
                        100%
                    </span>

                    <button
                        type="button"
                        class="button button-ghost"
                        id="xrayZoomIn"
                    >
                        +
                    </button>

                    <button
                        type="button"
                        class="button button-ghost"
                        id="xrayReset"
                    >
                        ${t("reset")}
                    </button>

                    <button
                        type="button"
                        class="button button-ghost"
                        id="xrayRotate"
                    >
                        ↻
                    </button>

                    <a
                        class="button button-primary"
                        id="xrayDownload"
                        download="${esc(xray.filename || "xray.webp")}"
                    >
                        ${t("download")}
                    </a>

                </div>

            </div>

            <div
                class="xray-viewer-stage"
                id="xrayViewerStage"
            >

                <img
                    id="xrayViewerImage"
                    src="${xray.base64Data}"
                    alt='${esc(xray.filename || "X-ray")}'
                    draggable="false"
                >

            </div>

            ${xray.notes
            ? `
                        <div class="xray-viewer-notes">
                            <strong>
                                ${t("clinicalNotes")}
                            </strong>

                            <p>
                                ${esc(xray.notes)}
                            </p>
                        </div>
                    `
            : ""
        }

        </div>
        `,
    );

    const image = $("#xrayViewerImage");
    const stage = $("#xrayViewerStage");
    const download = $("#xrayDownload");
    const zoomLabel = $("#xrayZoomLabel");

    if (!image || !stage || !download || !zoomLabel) {
        return;
    }

    let zoom = 1;
    let rotation = 0;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let activePointerId = null;
    let panStartX = 0;
    let panStartY = 0;

    download.href = xray.base64Data;

    function constrainPan() {
        const angle = (rotation * Math.PI) / 180;
        const cosine = Math.abs(Math.cos(angle));
        const sine = Math.abs(Math.sin(angle));
        const rotatedWidth =
            (image.offsetWidth * cosine + image.offsetHeight * sine) * zoom;
        const rotatedHeight =
            (image.offsetWidth * sine + image.offsetHeight * cosine) * zoom;
        const maxPanX = Math.max(0, (rotatedWidth - stage.clientWidth) / 2);
        const maxPanY = Math.max(0, (rotatedHeight - stage.clientHeight) / 2);

        panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
        panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
    }

    function updateViewer() {
        if (zoom <= 1) {
            panX = 0;
            panY = 0;
        } else {
            constrainPan();
        }

        image.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom}) rotate(${rotation}deg)`;

        zoomLabel.textContent = `${Math.round(zoom * 100)}%`;

        stage.classList.toggle("is-pannable", zoom > 1);
    }

    function setZoom(nextZoom) {
        zoom = Math.max(0.5, Math.min(4, nextZoom));

        updateViewer();
    }

    function stopPanning() {
        if (activePointerId !== null && stage.hasPointerCapture(activePointerId)) {
            stage.releasePointerCapture(activePointerId);
        }

        isPanning = false;
        activePointerId = null;
        stage.classList.remove("is-panning");
    }

    stage.addEventListener("pointerdown", (event) => {
        if (zoom <= 1 || event.button !== 0) {
            return;
        }

        isPanning = true;
        activePointerId = event.pointerId;
        panStartX = event.clientX - panX;
        panStartY = event.clientY - panY;

        stage.setPointerCapture(event.pointerId);
        stage.classList.add("is-panning");
        event.preventDefault();
    });

    stage.addEventListener("pointermove", (event) => {
        if (!isPanning || event.pointerId !== activePointerId) {
            return;
        }

        panX = event.clientX - panStartX;
        panY = event.clientY - panStartY;

        updateViewer();
    });

    stage.addEventListener("pointerup", stopPanning);
    stage.addEventListener("pointercancel", stopPanning);
    stage.addEventListener("lostpointercapture", stopPanning);

    stage.addEventListener(
        "wheel",
        (event) => {
            event.preventDefault();

            if (event.deltaY === 0) {
                return;
            }

            setZoom(zoom + (event.deltaY < 0 ? 0.25 : -0.25));
        },
        { passive: false },
    );

    $("#xrayZoomIn").onclick = () => {
        setZoom(zoom + 0.25);
    };

    $("#xrayZoomOut").onclick = () => {
        setZoom(zoom - 0.25);
    };

    $("#xrayReset").onclick = () => {
        zoom = 1;
        rotation = 0;
        panX = 0;
        panY = 0;

        updateViewer();
    };

    $("#xrayRotate").onclick = () => {
        rotation = (rotation + 90) % 360;

        updateViewer();
    };

    $("#xrayEdit").onclick = () => editXray(xrayId);

    updateViewer();
}
async function compressXray(file) {
    const bitmap = await createImageBitmap(file);

    const maxWidth = 1600;
    const maxHeight = 1600;

    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);

    const width = Math.round(bitmap.width * scale);

    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Could not create canvas context.");
    }

    context.drawImage(bitmap, 0, 0, width, height);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Image compression failed."));
                    return;
                }

                resolve(blob);
            },
            "image/webp",
            0.82,
        );
    });
}
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = () => {
            reject(new Error("Could not read compressed image."));
        };

        reader.readAsDataURL(blob);
    });
}
