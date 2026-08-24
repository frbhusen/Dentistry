const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    [...document.querySelectorAll(selector)];

function esc(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        (char) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            })[char],
    );
}
function today() {
    return new Date()
        .toISOString()
        .slice(0, 10);
}
function money(value) {
    const symbol = state.settings?.currencySymbol || "SYR";
    return `${symbol} ${Number(value || 0).toLocaleString()}`;
}

function excelText(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}