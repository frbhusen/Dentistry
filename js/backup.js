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
    const document = new DOMParser().parseFromString(source, "text/html");
    if (!document.querySelector('meta[name="mizan-export"]'))
        throw Error("Unsupported workbook");
    const data = {};
    document.querySelectorAll("h2").forEach((heading) => {
        const store = heading.textContent.trim();
        if (!STORES.includes(store)) return;
        const table = heading.nextElementSibling;
        const headers = [...(table?.querySelectorAll("thead th") || [])].map(
            (cell) => cell.textContent.trim(),
        );
        data[store] = [...(table?.querySelectorAll("tbody tr") || [])].map(
            (row) => {
                const item = {};
                [...row.querySelectorAll("td")].forEach((cell, index) => {
                    const key = headers[index];
                    if (!key) return;
                    let value = cell.textContent;
                    if (
                        [
                            "id",
                            "patientId",
                            "toothNumber",
                            "fee",
                            "duration",
                            "paidAmount",
                            "balance",
                            "discount",
                            "slotDuration",
                        ].includes(key) &&
                        value !== ""
                    )
                        value = Number(value);
                    if (["items", "medications"].includes(key) && value)
                        value = JSON.parse(value);
                    item[key] = value;
                });
                return item;
            },
        );
    });
    return data;
}
