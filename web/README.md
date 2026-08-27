# AeroDent

A modern, offline-first dental clinic management application built for everyday clinical workflow.

AeroDent is designed to keep patient and practice data available locally, with no backend or internet connection required for normal use.

## Features

- Patient management
- Dental odontogram for permanent and primary teeth
- Treatment records and treatment plans
- Appointment and agenda management
- Prescription management with print support
- X-ray/image records
- Local data storage with IndexedDB
- JSON / Excel data export and import
- PIN protection with PBKDF2 hashing and inactivity auto-lock
- English and Arabic localization
- RTL/LTR interface support
- Responsive interface for desktop and mobile browsers
- Offline-capable PWA support
- Windows desktop application through Tauri

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- IndexedDB
- Web Crypto API
- Service Worker / PWA
- Tauri for Windows desktop packaging

## Project Structure

```text
Dentistry/
├── index.html
├── styles.css
├── i18n.js
├── db.js
├── manifest.json
├── sw.js
├── icons/
├── js/
│   ├── app.js
│   ├── state.js
│   ├── core.js
│   ├── ui.js
│   ├── auth.js
│   ├── patients.js
│   ├── odontogram.js
│   ├── treatments.js
│   ├── treatmentPlans.js
│   ├── appointments.js
│   ├── prescriptions.js
│   ├── xrays.js
│   ├── timeline.js
│   └── backup.js
└── src-tauri/
    ├── src/
    ├── icons/
    └── tauri.conf.json
```

## Running the Web Version

Because the application uses local assets and browser APIs, run it through a local web server instead of opening `index.html` directly.

### Python

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## Windows Desktop App

The Windows version is packaged with Tauri, so users can run AeroDent as a normal desktop application without opening a browser.

Install the project dependencies and Tauri prerequisites, then build with:

```bash
npm install
npx tauri build
```

The generated installers are placed under:

```text
src-tauri/target/release/bundle/
```

For distribution, use the generated Windows installer rather than copying project source files to the user's computer.

## Data & Privacy

AeroDent stores application data locally on the user's device. There is no remote database or cloud server in the application architecture.

This also means local data can be lost when browser/app storage is deleted or the device is reset. Regular backups are strongly recommended.

Use the built-in export feature in **Settings** to create a backup of practice data.

## Security

PIN protection is handled locally using the Web Crypto API. PIN verification uses a PBKDF2-derived hash with a random salt rather than storing the PIN itself.

The application can also automatically lock after a period of inactivity.

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Ctrl + K` | Global search |
| `N` | New patient |
| `A` | Appointment |
| `P` | Patients |
| `O` | Odontogram |
| `Esc` | Close active dialog/drawer |

## Offline Usage

AeroDent is designed for offline use. Once the required application files are installed locally, normal patient management and clinical workflows do not require an internet connection.

## Author

**Hussein Rajab**

- Website: https://husr0.codes
- Email: husen_.rajb@outlook.com

## License

This project is currently maintained as a private/personal project. Licensing terms can be added when the project is prepared for public distribution.
