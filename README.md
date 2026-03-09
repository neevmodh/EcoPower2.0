# ⚡ EcoPower — Smart Solar Energy Management Platform

> **Team CodeMantra** | Neev Modh | INSTINCT 4.0 Finals

EcoPower is a full-stack React application simulating a production-grade Solar-as-a-Service platform for residential customers in Gujarat, India. It features real-time energy monitoring, AI-powered analytics, smart device management, and a comprehensive admin console — all running entirely client-side with a CSV-based data engine.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be live at **http://localhost:5173**

---

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | neevmodh205@gmail.com | neev@123 |
| **Customer** | modh4001@gmail.com | modh4001 |
| **Demo** | demo@ecopower.in | Demo@123 |

---

## 🏗️ Architecture

```
ecopower/
├── public/data/           # CSV data files (10 datasets)
│   ├── users.csv
│   ├── energy_readings.csv
│   ├── invoices.csv
│   ├── devices.csv
│   ├── support_tickets.csv
│   ├── plans.csv
│   ├── subscriptions.csv
│   ├── notifications.csv
│   ├── grid_transactions.csv
│   └── weather_forecast.csv
├── src/
│   ├── context/           # AppContext — global state + CSV data engine
│   ├── services/          # Auth, CSV parsing, Groq AI, IoT simulator
│   ├── components/        # Shared UI components (AuthRoutes, Toast, Skeleton)
│   ├── layouts/           # Customer & Admin shell layouts
│   └── pages/
│       ├── LoginPage.jsx
│       ├── customer/      # 14 customer portal pages
│       └── admin/         # 7 admin console pages
└── .env                   # API keys (Groq)
```

### Key Design Decisions

- **Client-Side Data Engine**: Instead of a backend, the platform parses `.csv` files via PapaParse into a React context (`AppContext`), supporting full CRUD operations with in-memory caching and CSV export
- **Two-Portal Architecture**: A rich Customer Portal for energy monitoring and AI features, plus a dark-themed Admin Console for platform management
- **Real-Time IoT Emulation**: Interval-driven math generates realistic solar generation, voltage, and frequency readings live on the dashboard

---

## 📱 Customer Portal (14 Pages)

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/dashboard` | Real-time solar/grid/battery gauges, live IoT metrics, quick stats |
| **Energy Monitor** | `/energy` | Hourly/daily generation vs. consumption charts, net metering view |
| **Services** | `/services` | Plan details, subscription management, upgrade options |
| **Billing** | `/billing` | Invoice history, payment tracking, PDF export |
| **DISCOM** | `/discom` | Grid transaction logs, net metering balance |
| **Devices** | `/devices` | Smart home device control, scheduling, power consumption |
| **Analytics** | `/analytics` | Deep-dive Recharts dashboards with trend analysis |
| **Forecast** | `/forecast` | Solar generation and weather-based predictions |
| **Carbon Tracker** | `/carbon` | CO₂ offset tracking, environmental impact metrics |
| **Support** | `/support` | Ticket management, issue reporting, status tracking |
| **Profile** | `/profile` | Account settings, plan info, notification preferences |
| **AI Advisor** | `/advisor` | 🤖 Conversational AI energy consultant (Groq-powered) |
| **AI Bill Analyzer** | `/bill-analyzer` | 🤖 Invoice audit with actionable savings tips |
| **AI Anomaly Detector** | `/anomaly` | 🤖 30-day telemetry scan for system health issues |

## 🛡️ Admin Console (7 Pages)

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/admin/dashboard` | Platform-wide KPIs, user growth charts |
| **User Management** | `/admin/users` | Full user CRUD, role management |
| **Analytics** | `/admin/analytics` | Cross-platform data analysis |
| **Tickets** | `/admin/tickets` | Support ticket triage and resolution |
| **Billing** | `/admin/billing` | Revenue ledger, invoice management |
| **Data Manager** | `/admin/data` | CSV editor for all application datasets |
| **Settings** | `/admin/settings` | Platform configuration |

---

## 🤖 AI Features (Groq-Powered)

All three AI features are powered by **Groq** running **Llama 3.3 70B** model for ultra-fast inference.

### Configuration

The Groq API key is configured in `.env`:

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

> Get a free key at [console.groq.com](https://console.groq.com)

### 1. AI Energy Advisor (`/advisor`)
- Full conversational AI with chat history
- Context-aware: analyzes user's actual solar data, billing, and connected devices
- Suggested prompts for common energy queries
- Session-based conversation persistence

### 2. AI Bill Analyzer (`/bill-analyzer`)
- Audits EcoPower invoices with line-by-line charge explanation
- Provides 3 actionable tips to reduce next month's bill
- Detects billing anomalies and compares to typical customers
- Export analysis as PDF or copy to clipboard
- Image upload supported (analyzed via account context data)

### 3. AI Anomaly Detector (`/anomaly`)
- Scans 30 days of telemetry data for voltage dips, inverter faults, and grid instability
- Returns structured JSON with health score (0–100)
- Color-coded severity levels (High / Medium / Low)
- One-click escalation: auto-creates support tickets for high-severity anomalies
- Downloadable diagnostic PDF report
- Results cached in localStorage for instant reload

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19 + Vite 7 |
| **Routing** | React Router DOM 7 |
| **Styling** | Tailwind CSS 3 |
| **Charts** | Recharts 3 |
| **Icons** | Lucide React |
| **AI** | Groq API (Llama 3.3 70B) |
| **Data Parsing** | PapaParse |
| **PDF Generation** | jsPDF + jsPDF-AutoTable |
| **Date Handling** | date-fns |
| **Typography** | Syne (headings) + IBM Plex Mono (data) |

---

## 📂 CSV Data Schema

The platform operates on 10 interconnected CSV datasets:

- **users.csv** — User profiles with roles, plans, solar capacity
- **energy_readings.csv** — Hourly solar/consumption/grid readings (~31K records)
- **invoices.csv** — Monthly billing records with amounts and status
- **devices.csv** — Smart home devices with power ratings and schedules
- **support_tickets.csv** — Customer support tickets with priority levels
- **plans.csv** — Subscription plan definitions (Basic, Standard, Premium)
- **subscriptions.csv** — Active user subscriptions
- **notifications.csv** — In-app notification feed
- **grid_transactions.csv** — Net metering grid import/export logs
- **weather_forecast.csv** — Weather data for solar forecast predictions

---

## 📝 License

Built for **INSTINCT 4.0** hackathon by Team CodeMantra.
