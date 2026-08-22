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
                                                        ${esc(item.date)}
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
                        ${esc(xray.date || "")}
                    </span>

                </div>

                <div class="xray-viewer-actions">

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
                    alt="${esc(xray.filename || "X-ray")}"
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
    const download = $("#xrayDownload");
    const zoomLabel = $("#xrayZoomLabel");

    if (!image || !download || !zoomLabel) {
        return;
    }

    let zoom = 1;
    let rotation = 0;

    download.href = xray.base64Data;

    function updateViewer() {
        image.style.transform = `scale(${zoom}) rotate(${rotation}deg)`;

        zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    }

    $("#xrayZoomIn").onclick = () => {
        zoom = Math.min(4, zoom + 0.25);

        updateViewer();
    };

    $("#xrayZoomOut").onclick = () => {
        zoom = Math.max(0.5, zoom - 0.25);

        updateViewer();
    };

    $("#xrayReset").onclick = () => {
        zoom = 1;
        rotation = 0;

        updateViewer();
    };

    $("#xrayRotate").onclick = () => {
        rotation = (rotation + 90) % 360;

        updateViewer();
    };

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
