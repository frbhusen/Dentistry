async function exportData() {
    const data = await dbExport();
    const sheets = Object.entries(data)
        .map(([name, rows]) => {
            const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
            const header = columns
                .map((column) => `<th>${excelText(column)}</th>`)
                .join("");
            const body = rows
                .map(
                    (row) =>
                        `<tr>${columns.map((column) => `<td>${excelText(typeof row[column] === "object" ? JSON.stringify(row[column]) : row[column])}</td>`).join("")}</tr>`,
                )
                .join("");
            return `<h2>${excelText(name)}</h2><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
        })
        .join("");
    const workbook = `<!doctype html><html><head><meta charset="utf-8"><meta name="mizan-export" content="1"><style>body{font-family:Arial}h2{background:#0284c7;color:#fff;padding:8px}table{border-collapse:collapse;margin-bottom:24px}th,td{border:1px solid #cbd5e1;padding:6px;text-align:left}th{background:#e0f2fe}</style></head><body><h1>Mizan Dental Export</h1>${sheets}</body></html>`;
    const blob = new Blob([workbook], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `mizan-dental-export-${new Date().toISOString().replace(/[:.]/g, "-")}.xls`;
    link.style.display = "none";
    document.body.append(link);
    link.click();
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
        link.remove();
    }, 1000);
    toast(t("exported"));
}

function parseExcelBackup(source) {
    if (!source || typeof source !== "string") {
        throw new Error("Backup file is empty.");
    }

    const parser = new DOMParser();

    const document = parser.parseFromString(
        source,
        "text/html"
    );

    const marker = document.querySelector(
        'meta[name="mizan-export"]'
    );

    if (!marker) {
        throw new Error(
            "This file is not a valid Mizan Dental backup."
        );
    }

    const data = {};

    const headings = [
        ...document.querySelectorAll("h2")
    ];

    for (const heading of headings) {
        const store = heading.textContent.trim();

        if (!STORES.includes(store)) {
            continue;
        }

        const table = heading.nextElementSibling;

        if (!table || table.tagName !== "TABLE") {
            data[store] = [];
            continue;
        }

        const headers = [
            ...table.querySelectorAll(
                "thead th"
            )
        ].map(
            (cell) =>
                cell.textContent.trim()
        );

        const rows = [
            ...table.querySelectorAll(
                "tbody tr"
            )
        ];

        data[store] = rows.map((row) => {
            const cells = [
                ...row.querySelectorAll("td")
            ];

            const item = {};

            cells.forEach((cell, index) => {
                const key = headers[index];

                if (!key) {
                    return;
                }

                let value =
                    cell.textContent.trim();

                /*
                 * Empty cells remain empty strings.
                 */
                if (value === "") {
                    item[key] = "";
                    return;
                }

                /*
                 * Numeric fields.
                 */
                const numericFields = [
                    "id",
                    "patientId",
                    "toothNumber",
                    "fee",
                    "duration",
                    "paidAmount",
                    "balance",
                    "discount",
                    "slotDuration"
                ];

                if (
                    numericFields.includes(key)
                ) {
                    const number =
                        Number(value);

                    if (
                        Number.isFinite(number)
                    ) {
                        item[key] = number;
                    } else {
                        throw new Error(
                            `Invalid number in ${store}.${key}`
                        );
                    }

                    return;
                }

                /*
                 * JSON fields.
                 */
                const jsonFields = [
                    "items",
                    "medications"
                ];

                if (
                    jsonFields.includes(key)
                ) {
                    try {
                        item[key] =
                            JSON.parse(value);
                    } catch (error) {
                        throw new Error(
                            `Invalid JSON in ${store}.${key}`
                        );
                    }

                    return;
                }

                item[key] = value;
            });

            return item;
        });
    }

    /*
     * Stores that are not present in the
     * backup are treated as empty.
     *
     * This makes older backups compatible
     * with newer versions of the app.
     */
    for (const store of STORES) {
        if (!Array.isArray(data[store])) {
            data[store] = [];
        }
    }

    return data;
}
