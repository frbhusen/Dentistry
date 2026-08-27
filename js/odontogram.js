function renderOdontogram() {
	const primary = state.toothMode === "primary";
	const odontogramPatient =
		state.patients.find(
			(patient) => patient.id === Number(state.odontogramPatientId),
		) || state.selectedPatient;
	const patientOptions = state.patients
		.map(
			(patient) =>
				`<option value="${patient.id}" ${patient.id === odontogramPatient?.id ? "selected" : ""}>${esc(patient.name)} · ${esc(patient.phone || "")}</option>`,
		)
		.join("");
	const upperCount = primary ? 10 : 16;
	const lowerCount = primary ? 10 : 16;
	return `<section class="card workspace-card"><div class="workspace-toolbar"><div><div class="eyebrow">${t("odontogram")}</div><h2>${odontogramPatient ? esc(odontogramPatient.name) : t("selectPatient")}</h2><div class="field odontogram-patient-picker"><label>${t("patient")}</label><select id="odontogramPatientSelect"><option value="">${t("selectPatient")}</option>${patientOptions}</select></div></div><div class="segmented"><button class="${!primary ? "active" : ""}" data-mode="permanent">${t("permanent")}</button><button class="${primary ? "active" : ""}" data-mode="primary">${t("primary")}</button></div></div><div class="odontogram-wrap ${primary ? "primary-odontogram" : ""}"><div class="arch-title">${t("maxillary")}</div><div class="teeth-row">${Array.from({ length: upperCount }, (_, i) => tooth(primary ? i + 1 : i + 1)).join("")}</div><div class="arch-title" style="margin-top:26px">${t("mandibular")}</div><div class="teeth-row">${Array.from({ length: lowerCount }, (_, i) => tooth(primary ? i + 11 : i + 17)).join("")}</div><div class="legend">${[
		["healthy", "healthy"],
		["decay", "decay"],
		["filling", "filling"],
		["crown", "crown"],
		["rct", "rct"],
		["extract", "extract"],
		["implant", "implant"],
	]
		.map(
			([color, key]) =>
				`<span><i style="background:var(--${color === "healthy" ? "surface" : color})"></i>${t(key)}</span>`,
		)
		.join("")}</div></div></section>`;
}

const TOOTH_SHAPES = {
	incisor: `<svg class="tooth-shape" viewBox="0 0 40 56" xmlns="http://www.w3.org/2000/svg"><path d="M9 4 Q20 -1 31 4 L30 22 Q30 30 20 30 Q10 30 10 22 Z M14 30 Q13 42 17 52 Q20 55 23 52 Q27 42 26 30 Z"/></svg>`,
	canine: `<svg class="tooth-shape" viewBox="0 0 40 56" xmlns="http://www.w3.org/2000/svg"><path d="M20 1 L30 20 Q31 30 20 32 Q9 30 10 20 Z M14 32 Q12 44 17 53 Q20 56 23 53 Q28 44 26 32 Z"/></svg>`,
	premolar: `<svg class="tooth-shape" viewBox="0 0 40 56" xmlns="http://www.w3.org/2000/svg"><path d="M9 8 Q9 1 20 1 Q31 1 31 8 L30 18 Q26 24 20 22 Q14 24 10 18 Z M13 30 Q10 40 14 50 Q17 55 20 52 Q23 55 26 50 Q30 40 27 30 Z"/></svg>`,
	molar: `<svg class="tooth-shape" viewBox="0 0 40 56" xmlns="http://www.w3.org/2000/svg"><path d="M6 8 Q6 0 20 0 Q34 0 34 8 L33 20 Q30 26 24 24 Q20 27 16 24 Q10 26 7 20 Z M10 30 Q7 40 10 50 Q13 55 17 50 Q18 40 18 30 Z M22 30 Q22 40 23 50 Q27 55 30 50 Q33 40 30 30 Z"/></svg>`,
};

function toothShapeType(positionIndex, rowLength) {
	// distance from the midline of the arch — front teeth are incisors,
	// moving outward: canine, premolars (permanent only), then molars.
	const dist = Math.abs(positionIndex - (rowLength / 2 - 0.5));
	if (rowLength >= 16) {
		if (dist < 2) return "incisor";
		if (dist < 3) return "canine";
		if (dist < 5) return "premolar";
		return "molar";
	}
	// primary teeth have no premolars
	if (dist < 2) return "incisor";
	if (dist < 3) return "canine";
	return "molar";
}
/* deprecated
function tooth(number) {
	const primary = state.toothMode === "primary";

	const odontogramPatient =
		state.patients.find(
			(patient) => patient.id === Number(state.odontogramPatientId),
		) || state.selectedPatient;

	const record = state.odontograms.find(
		(item) =>
			item.patientId === odontogramPatient?.id &&
			item.toothNumber === number &&
			item.toothMode === state.toothMode,
	);
	const condition = record?.condition || "healthy";
	const label = primary ? String.fromCharCode(64 + number) : number;
	return `<button class="tooth ${primary ? "primary-tooth " : ""}${condition}" data-tooth="${number}" title="${t("tooth")} ${label}"><span class="tooth-mark"></span><span class="tooth-label">${label}</span></button>`;
}
*/
function tooth(number, positionIndex, rowLength) {
	const primary = state.toothMode === "primary";

	const odontogramPatient =
		state.patients.find(
			(patient) => patient.id === Number(state.odontogramPatientId),
		) || state.selectedPatient;

	const record = state.odontograms.find(
		(item) =>
			item.patientId === odontogramPatient?.id &&
			item.toothNumber === number &&
			item.toothMode === state.toothMode,
	);
	const condition = record?.condition || "healthy";
	const label = primary ? String.fromCharCode(64 + number) : number;
	const shapeType = toothShapeType(positionIndex, rowLength);

	return `<button class="tooth ${primary ? "primary-tooth " : ""}${condition}" data-tooth="${number}" title="${t("tooth")} ${label}">
		<span class="tooth-visual">
			${TOOTH_SHAPES[shapeType]}
			<span class="tooth-mark"></span>
		</span>
		<span class="tooth-label">${label}</span>
	</button>`;
}

async function openTooth(number) {
	state.selectedTooth = number;
	const record = state.odontograms.find(
		(item) =>
			item.patientId === state.selectedPatient?.id &&
			item.toothNumber === number &&
			item.toothMode === state.toothMode,
	);
	$("#drawerTooth").textContent = `#${number}`;
	$("#drawerAnatomy").textContent =
		currentLanguage === "ar" ? "رحى علوية / سفلية" : "Molar · clinical surface";
	$("#toothActions").innerHTML = PROCEDURES.map(
		([key, label]) =>
			`<button class="action-btn ${record?.condition === key ? "active" : ""}" data-procedure="${key}">${t(label)}</button>`,
	).join("");
	$("#toothNote").value = record?.notes || "";
	document.body.classList.add("drawer-open");
	$$(".action-btn").forEach(
		(button) => (button.onclick = () => updateTooth(button.dataset.procedure)),
	);
}

async function updateTooth(condition) {
	const odontogramPatient =
		state.patients.find(
			(patient) => patient.id === Number(state.odontogramPatientId),
		) || state.selectedPatient;

	if (!odontogramPatient) return;

	const existing = state.odontograms.find(
		(item) =>
			item.patientId === odontogramPatient.id &&
			item.toothNumber === state.selectedTooth &&
			item.toothMode === state.toothMode,
	);

	if (condition === "clear") {
		if (existing) {
			await dbDelete("odontograms", existing.id);
		}
	} else {
		await dbPut("odontograms", {
			...(existing || {}),
			patientId: odontogramPatient.id,
			toothNumber: state.selectedTooth,
			toothMode: state.toothMode,
			condition,
			procedure: t(condition),
			timestamp: new Date().toISOString(),
		});
	}

	await refresh();
	openTooth(state.selectedTooth, false);
}

async function saveCurrentToothNote() {
	const odontogramPatient =
		state.patients.find(
			(patient) => patient.id === Number(state.odontogramPatientId),
		) || state.selectedPatient;

	if (!odontogramPatient) return;

	const existing = state.odontograms.find(
		(item) =>
			item.patientId === odontogramPatient.id &&
			item.toothNumber === state.selectedTooth &&
			item.toothMode === state.toothMode,
	);

	await dbPut("odontograms", {
		...(existing || {}),
		patientId: odontogramPatient.id,
		toothNumber: state.selectedTooth,
		toothMode: state.toothMode,
		condition: existing?.condition || "healthy",
		notes: $("#toothNote").value,
		timestamp: new Date().toISOString(),
	});

	toast(t("saved"));

	state.odontograms = await dbGetAll("odontograms");
}
