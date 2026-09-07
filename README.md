# Nutrition Frontend

React single-page application for the **Nutrition Management System** of the Nutrition Department of Ubay. It provides a login portal, role-based dashboards with charts, staff data-entry forms, per-barangay and overall municipal reports, PDF/Word document export, and admin staff management.

Built with **React 18 + Vite** and styled with **Bootstrap 5** (`react-bootstrap`).

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Authentication & Roles](#authentication--roles)
- [Routing](#routing)
- [API Integration](#api-integration)
- [Features](#features)
  - [Login](#login)
  - [Dashboard](#dashboard)
  - [Data Entry (Staff)](#data-entry-staff)
  - [Barangay Reports](#barangay-reports)
  - [Overall Reports (Admin)](#overall-reports-admin)
  - [All Records (Admin)](#all-records-admin)
  - [Staff Management (Admin)](#staff-management-admin)
- [Report Export](#report-export)
- [Linting](#linting)
- [Environment Variables](#environment-variables)

## Tech Stack

| Category     | Technology |
| ------------ | ---------- |
| Framework    | React 18 (JSX) |
| Build tool   | Vite 8 |
| Language     | JavaScript (ES modules) |
| UI           | Bootstrap 5, React-Bootstrap, React-Bootstrap-Icons, React Icons |
| Routing      | React Router v6 |
| Server state | TanStack React Query |
| Forms        | React Hook Form + Zod resolvers |
| HTTP         | Axios |
| Charts       | Recharts |
| Export       | jsPDF + jspdf-autotable, docx + file-saver |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (18+ recommended, matches Vite 8 requirements)
- The backend API running — see the [Nutrition_backend README](../Nutrition_backend/README.md)

### Installation

```bash
cd Nutrition_frontend
npm install
```

### Configuration

The app talks to the backend through an Axios instance configured in `src/api/axios.js`. The base URL comes from the `VITE_API_URL` environment variable, defaulting to `http://localhost:5210`.

Create a `.env` file (or edit the existing one) at the project root:

```
VITE_API_URL=http://localhost:5210
```

### Running the App

```bash
npm run dev
```

Vite will start the dev server (default `http://localhost:5173`). Login with an admin or staff account created on the backend.

Other scripts:

| Command             | Description                     |
| ------------------- | ------------------------------- |
| `npm run dev`       | Start the Vite dev server       |
| `npm run build`     | Build a production bundle       |
| `npm run preview`   | Preview the production build    |

## Project Structure

```
src/
├── api/
│   ├── axios.js                 # Axios instance + auth interceptors
│   ├── auth.js                  # Login + child record API calls
│   └── reports.js               # Data-entry report API calls (8 modules)
├── assets/                      # Images & logos
├── components/
│   ├── common/
│   │   ├── Navbar.jsx           # Top navigation (role-aware)
│   │   ├── ProtectedRoute.jsx   # Route guard (auth/role)
│   │   └── Placeholder.jsx
│   ├── layout/
│   │   ├── BarangayReportLayout.jsx
│   │   ├── OverallReportLayout.jsx
│   │   └── StaffLayout.jsx      # Collapsible sidebar for data entry
│   ├── overall-reports/         # Admin overall report pages (9)
│   ├── reports/                 # Per-barangay report pages (9)
│   └── staff/                   # Staff data-entry forms (9)
├── context/
│   └── AuthContext.jsx          # Auth state + login/logout/register
├── hooks/
│   └── useAuth.js               # Access AuthContext
├── pages/
│   ├── Login.jsx                # Login screen (rate-limit aware)
│   ├── Dashboard.jsx            # Role-scoped dashboard with charts
│   ├── AdminStaff.jsx           # Admin staff management
│   └── AllRecords.jsx           # Admin tabbed record viewer + PDF
├── utils/
│   └── constants.js             # Barangay list
├── App.jsx                      # Route definitions
└── main.jsx                     # App bootstrap (React Query + Router)
```

## Authentication & Roles

Authentication is managed by `AuthContext` and persisted in `localStorage`:

- `token` — the JWT returned by the backend.
- `user` — serialized user object (id, username, email, role, barangay).

The Axios request interceptor automatically attaches the JWT as `Authorization: Bearer <token>` to every request. The response interceptor detects `401` (on non-login endpoints), clears the session, and redirects to `/login`.

`ProtectedRoute` enforces access:

| Route guard | Allowed users |
| ----------- | ------------- |
| default     | Any authenticated user |
| `adminOnly` | `admin` role |
| `staffOnly` | `staff` role |

**Roles:**

- **admin** — full access: overall reports, all records, staff management, and can view/edit data for every barangay.
- **staff** — BNS/barangay-level users: data entry plus per-barangay reports, scoped to their assigned barangay.

## Routing

Defined in `App.jsx`:

| Route | Page | Access |
| ----- | ---- | ------ |
| `/login` | Login | Public (redirects to `/dashboard` if already logged in) |
| `/dashboard` | Dashboard | Authenticated |
| `/barangay-report` | Barangay report layout | Authenticated |
| `/barangay-report` (index) | Child Records report | Authenticated |
| `/barangay-report/pregnant-women` | Pregnant Women report | Authenticated |
| `/barangay-report/animal-raising` | Animal Raising report | Authenticated |
| `/barangay-report/animal-dispersal` | Animal Dispersal report | Authenticated |
| `/barangay-report/backyard-gardening` | Backyard Gardening report | Authenticated |
| `/barangay-report/vegetable-seeds` | Vegetable Seeds report | Authenticated |
| `/barangay-report/potable-water` | Potable Water report | Authenticated |
| `/barangay-report/iodized-salt` | Iodized Salt report | Authenticated |
| `/barangay-report/cr` | CR report | Authenticated |
| `/overall-report` | Overall report layout | Admin |
| `/overall-report` (+ same sub-routes as above) | Overall reports (9) | Admin |
| `/admin/records` | All Records | Admin |
| `/admin/staff` | Staff Management | Admin |
| `/staff` | Data-entry layout | Staff |
| `/staff/child-records` | Child records entry | Staff |
| `/staff/animal-raising` | Animal raising entry | Staff |
| `/staff/potable-water` | Potable water entry | Staff |
| `/staff/iodized-salt` | Iodized salt entry | Staff |
| `/staff/cr` | CR entry | Staff |
| `/staff/backyard-gardening` | Backyard gardening entry | Staff |
| `/staff/pregnant-women` | Pregnant women entry | Staff |
| `/staff/vegetable-seeds` | Vegetable seeds entry | Staff |
| `/staff/animal-dispersal` | Animal dispersal entry | Staff |
| `/` | Redirects to `/dashboard` | — |

## API Integration

All requests go through the shared Axios instance (`src/api/axios.js`).

- `src/api/auth.js` — login and child-record CRUD (`/auth/login`, `/childrecords`, `/reports/*`).
- `src/api/reports.js` — data-entry APIs for the 8 report modules under `/ReportDataEntry/*` (animal-raising, potable-water, iodized-salt, cr, backyard-gardening, pregnant-women, vegetable-seeds, animal-dispersal).

## Features

### Login

A split-screen login page with:

- Username **or** email + password.
- Show/hide password toggle.
- Friendly error handling for `401` (invalid credentials) and `429` (rate limit exceeded — shows a countdown until retry is allowed, backed by the backend's `retryAfter`).

### Dashboard

Role-scoped analytics dashboard (`Dashboard.jsx`):

- **Admin:** total records, barangay count, total children, and staff records stat cards.
- **Staff:** personal record count and total children; analytics are scoped to the staff member's barangay.
- Charts built with **Recharts**: bar chart of records by barangay (top 8), pie chart of nutritional status, and an age-group distribution (6–11 and 12–59 months).

### Data Entry (Staff)

`StaffLayout` provides a collapsible sidebar (desktop) plus an off-canvas menu (mobile) with nine entry modules:

1. **Child Records** — full CRUD with auto age calculation from birthdate, duplicate detection (name + barangay + purok), search, multi-field filters, pagination, and client-side validation.
2. **Animal Raising** — household animal inventory counts.
3. **Potable Water** — water level assessment (Level 1/2/3).
4. **Iodized Salt** — store/brand inspection flags.
5. **CR** — households with/without CR.
6. **Backyard Gardening** — garden presence flag.
7. **Pregnant Women** — weight, height, BMI, and BMI category.
8. **Vegetable Seeds** — seed types distributed.
9. **Animal Dispersal** — animal dispersal counts.

### Barangay Reports

Each report page lets the user pick a barangay (staff are locked to their own) and generate a per-purok summary with totals, then download it as a **PDF**.

- Child Records report supports a **date range** filter and certifying/approving officer fields (BNS / Brgy. Captain).
- All report PDFs are generated with **jsPDF + jspdf-autotable** and include the nutrition logo.

### Overall Reports (Admin)

Municipal-wide versions of all nine reports with a year selector. Same PDF export behavior.

### All Records (Admin)

Tabbed viewer (`AllRecords.jsx`) for the eight data-entry modules plus a combined "all" view. Includes:

- Keyword search, barangay filter, pagination, and row-count selector.
- **PDF export** of the current view (landscape for wide tables).

### Staff Management (Admin)

`AdminStaff.jsx` provides admin-only management of staff accounts:

- Create staff (username, email, password, barangay) with validation (password match, min length, valid barangay).
- Activate / deactivate and delete staff accounts.

## Report Export

PDF generation uses [jsPDF](https://www.npmjs.com/package/jspdf) with [jspdf-autotable](https://www.npmjs.com/package/jspdf-autotable) for tabular layouts. The `docx` and `file-saver` packages are also installed for Word document generation.

## Linting

The project uses [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) with rules defined in `.oxlintrc.json` (React hooks rules + export conventions).

```bash
npx oxlint src
```

## Environment Variables

| Variable          | Default              | Description                       |
| ----------------- | -------------------- | --------------------------------- |
| `VITE_API_URL`    | `http://localhost:5210` | Base URL of the backend API    |

## License

Internal project for the Nutrition Department of Ubay. No public license is applied.