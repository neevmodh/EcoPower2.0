# ⚡ EcoPower 2.0 — Energy-as-a-Service Platform

<div align="center">

![EcoPower](https://img.shields.io/badge/EcoPower-2.0-22C55E?style=for-the-badge&logo=zap&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![AI](https://img.shields.io/badge/AI-Groq_LLaMA_3.3_70B-FF6B35?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)

**A production-grade Solar Energy Management SaaS platform built for Ahmedabad's residential, commercial, and industrial sectors.**

*Real-time telemetry · AI-powered insights · P2P energy trading · Multi-site fleet management · Smart EV charging · PDF export everywhere*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Test Credentials](#-test-credentials)
- [Role-Based Dashboards](#-role-based-dashboards)
- [Platform Features](#-platform-features)
- [Export & PDF System](#-export--pdf-system)
- [API Reference](#-api-reference)
- [Data Models](#-data-models)
- [Project Structure](#-project-structure)
- [Key Components](#-key-components)
- [Deploying to Vercel](#-deploying-to-vercel)

---

## 🌍 Overview

EcoPower 2.0 is a full-stack **Energy-as-a-Service (EaaS)** platform that connects solar energy producers, consumers, and grid operators in a unified ecosystem. Built for the Ahmedabad metropolitan area, it supports three distinct user roles with purpose-built dashboards, real-time data, AI-driven recommendations, and branded PDF export across every feature.

**Core value propositions:**
- Homeowners monitor solar generation, battery state, and grid interaction in real time
- Enterprises manage multi-site solar fleets with ESG reporting and carbon tracking
- Admins oversee the entire platform — users, devices, billing, firmware, and grid health
- Every role can export invoices, reports, and certificates as branded PDFs

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) + React 19 | SSR/CSR hybrid, role-based routing |
| **Backend** | Node.js + Express 5 | REST API server on port 5005 |
| **Database** | MongoDB Atlas + Mongoose 9 | Document store — database: `eaas_platform` |
| **AI** | Groq API — LLaMA 3.3 70B Versatile | RAG-powered energy advisor chatbot |
| **Maps** | React Leaflet + OpenStreetMap | Geographic site distribution |
| **Auth** | JWT (jsonwebtoken) + bcryptjs | Stateless role-based authentication |
| **Payments** | Custom Razorpay-style flow | Card / UPI / Netbanking / Wallet |
| **PDF Export** | jsPDF 4 + jsPDF-AutoTable 5 | Branded PDF generation (invoices, reports, certificates) |
| **Charts** | Custom SVG + inline bar/donut charts | Zero-dependency data visualization |
| **Icons** | Lucide React | Consistent icon system |
| **Animations** | Framer Motion | Page transitions and micro-interactions |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Next.js)                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  /admin  │  │  /consumer   │  │   /enterprise     │  │
│  └──────────┘  └──────────────┘  └───────────────────┘  │
│                        │                                 │
│              /api/* proxy (next.config.mjs)              │
└────────────────────────┼────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼────────────────────────────────┐
│              Express API Server (port 5005)              │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │  Users  │ │ Devices  │ │Telemetry │ │  Invoices  │  │
│  ├─────────┤ ├──────────┤ ├──────────┤ ├────────────┤  │
│  │  Plans  │ │ Tickets  │ │  Carbon  │ │   Groq AI  │  │
│  ├─────────┤ ├──────────┤ ├──────────┤ ├────────────┤  │
│  │Payments │ │  Subs    │ │Locations │ │Notifications│ │
│  └─────────┘ └──────────┘ └──────────┘ └────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ Mongoose ODM
┌────────────────────────▼────────────────────────────────┐
│                  MongoDB Atlas Cluster                   │
│              Database: eaas_platform                     │
└─────────────────────────────────────────────────────────┘
```

**API Proxy:** Next.js rewrites all `/api/*` requests to `http://localhost:5005/api/*` in development. On Vercel, `api/index.js` handles all `/api/*` routes as a serverless function.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone & Install

```bash
git clone https://github.com/neevmodh/EcoPower2.0.git
cd EcoPower2.0-main
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Seed the Database

```bash
npm run seed:complete
```

Creates: 3 users, 5 Ahmedabad locations, 10+ IoT devices, 6 months of telemetry, energy plans, 60 invoices, carbon stats, support tickets, subscriptions.

### 4. Start the Backend

```bash
npm run server
# Backend running on port 5005
```

### 5. Start the Frontend

```bash
npm run dev
# Frontend running on http://localhost:3000
```

---

## 🔐 Environment Variables

Create `.env.local` in the project root:

```env
# MongoDB — database name must be eaas_platform
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/eaas_platform

# Groq AI (get from https://console.groq.com)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

> **Note:** `NEXT_PUBLIC_GROQ_API_KEY` is used as a client-side fallback when the backend proxy is unavailable.

---

## 🗄 Database Setup

**Connection string format:**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/eaas_platform
```

The database name **must** be `eaas_platform` (underscore, not dash).

**Available seed scripts:**

| Script | Command | Description |
|---|---|---|
| Full seed | `npm run seed:complete` | All data — users, devices, telemetry, invoices |
| Ahmedabad seed | `npm run seed` | Location-specific Ahmedabad data |
| Demo profiles | `node server/seed_demo_profiles.js` | Additional demo user profiles |

---

## 🔑 Test Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | admin@ecopower.com | password123 | Full platform control |
| **Enterprise** | vikram@techcorp.in | password123 | Multi-site fleet management |
| **Consumer** | rahul.sharma@gmail.com | password123 | Home solar dashboard |

---

## 📊 Role-Based Dashboards

### 🔴 Admin Panel — `/admin`

| Page | Route | Features |
|---|---|---|
| Dashboard | `/admin` | KPI overview, live metrics, revenue chart, device health |
| Users & Tenants | `/admin/users` | Full CRUD — create, edit, suspend, delete users |
| Devices | `/admin/devices` | IoT device registry, status monitoring, serial tracking |
| Energy Plans | `/admin/plans` | Create/edit subscription plans |
| Revenue | `/admin/billing` | Invoice management, bulk PDF export, payment status |
| Support Queue | `/admin/support` | Ticket management with priority, status, assignment |
| Analytics | `/admin/analytics` | Time-filtered charts (7d/30d/90d/1y), CSV export |
| Firmware | `/admin/firmware` | OTA update management, version tracking |
| Weather Forecast | `/admin/weather-forecast` | 7-day solar irradiance forecast for Ahmedabad |
| Blockchain | `/admin/blockchain` | Immutable audit trail for energy transactions |
| Grid Balancing | `/admin/grid-balancing` | Real-time grid load management |

### 🟢 Consumer Panel — `/consumer`

| Page | Route | Features |
|---|---|---|
| Dashboard | `/consumer` | Live energy flow, 24h chart, devices, sustainability, billing tabs |
| Analytics | `/consumer/analytics` | Time-filtered generation/consumption charts |
| Subscription | `/consumer/subscription` | 5-step plan wizard, PAYG quick-start, upgrade/downgrade |
| Billing | `/consumer/billing` | Invoice history, payment flow, PDF download per invoice + bulk export |
| P2P Trading | `/consumer/trading` | Buy/sell excess solar energy with neighbors |
| EV Charging | `/consumer/ev-charging` | Vehicle management, smart scheduling, nearby stations |
| DISCOM / Grid | `/consumer/discom` | Grid tariff comparison, net metering, DISCOM certificate PDF |
| Support | `/consumer/support` | Raise and track support tickets |

**Consumer Dashboard Tabs:** Energy Flow · Hourly Chart · Devices · Impact · Billing

**PAYG Plan:** Rs.6.5/kWh, no fixed monthly fee, no lock-in.

### 🔵 Enterprise Panel — `/enterprise`

| Page | Route | Features |
|---|---|---|
| Fleet Dashboard | `/enterprise` | Fleet KPIs, hourly chart, Ahmedabad map, site leaderboard, ESG board |
| Multi-Site | `/enterprise/sites` | Per-site energy data, status, capacity, efficiency |
| Team | `/enterprise/team` | Team member management, role assignment |
| Analytics | `/enterprise/analytics` | Cross-site aggregated analytics, site comparison |
| Sustainability | `/enterprise/sustainability` | Carbon footprint, ESG score, renewable mix, ESG PDF export |
| Subscription | `/enterprise/subscription` | Enterprise plan selection (Starter/Growth/Scale) |
| Billing | `/enterprise/billing` | Corporate invoices, expandable rows, bulk PDF export |

**Enterprise Plans:**

| Plan | Price | Sites | Users | Solar |
|---|---|---|---|---|
| Starter | Rs.15,000/mo | 3 | 10 | 50 kW |
| Growth | Rs.35,000/mo | 10 | 50 | 150 kW |
| Scale | Rs.75,000/mo | Unlimited | Unlimited | 500 kW |

---

## 📄 Export & PDF System

EcoPower has a full branded PDF export system across all roles. Every download button generates a professional PDF with the EcoPower dark header, green accent bar, and footer with GST/CIN details.

### Export Functions

| Function | File | Used In | Output |
|---|---|---|---|
| `downloadInvoicePDF(inv)` | `InvoicePDF.js` | Consumer/Enterprise/Admin billing | Single tax invoice PDF |
| `downloadAllInvoicesPDF(invoices, label)` | `InvoicePDF.js` | Consumer/Enterprise/Admin billing | Cover + all invoices + summary PDF |
| `downloadDashboardReport({...})` | `ExportUtils.js` | Consumer dashboard | Energy & billing report PDF |
| `downloadESGReport({...})` | `ExportUtils.js` | Enterprise sustainability | ESG sustainability report PDF (2 pages) |
| `downloadAnalyticsCSV({...})` | `ExportUtils.js` | Admin analytics | Analytics data CSV |
| `downloadSubscriptionInvoicePDF(inv)` | `ExportUtils.js` | Consumer/Enterprise subscription | Subscription invoice PDF |
| `downloadDISCOMCertificate()` | `ExportUtils.js` | Consumer DISCOM page | Net-metering approval certificate PDF |

### PDF Contents

**Tax Invoice** (`downloadInvoicePDF`):
- Branded header with company details
- Invoice number, billing period, due date, energy consumed
- Charges breakdown table (base + GST + discount)
- Energy usage progress bar
- Summary card with totals
- Payment instructions (if unpaid) or confirmation (if paid)

**All Invoices** (`downloadAllInvoicesPDF`):
- Dark cover page with account summary stats
- One full invoice page per invoice
- Final summary table with totals

**Dashboard Report** (`downloadDashboardReport`):
- 8 KPI boxes (solar generated, consumed, grid import, solar coverage, money saved, CO2 saved, trees, total paid)
- Full invoice history table

**ESG Report** (`downloadESGReport`):
- Green cover page with 5 stat boxes
- Page 2: ESG metrics table with benchmark comparison

**DISCOM Certificate** (`downloadDISCOMCertificate`):
- Net-metering approval certificate with GUVNL authority details
- Certificate number, validity, feed-in tariff rate

### Technical Notes

jsPDF-AutoTable v5 requires explicit plugin registration. The `loadJsPDF()` helper in both `ExportUtils.js` and `InvoicePDF.js` handles this:

```js
async function loadJsPDF() {
  const [{ jsPDF }, { applyPlugin }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  applyPlugin(jsPDF); // required for v5 — does not auto-patch prototype
  return jsPDF;
}
```

All text uses ASCII-safe strings (no emoji or unicode symbols) to avoid jsPDF Helvetica font crashes.

---

## ✨ Platform Features

### 🤖 AI Advisor (Groq LLaMA 3.3 70B)
- Floating chat widget on every page
- RAG knowledge base with EcoPower-specific context
- Role-aware responses (admin/consumer/enterprise mode)
- Suggested questions, timestamps, copy button
- Falls back to direct Groq API if backend proxy fails

### 🔔 Notification Center
- Bell icon in header on all three role panels
- Role-specific notifications
- Auto-seeds on first load if no notifications exist
- Mark as read, mark all read, delete
- Polls every 30 seconds, unread count badge

### 💳 Payment Flow
Multi-step payment wizard (`components/PaymentFlow.js`):
1. Method Selection — Card / UPI / Netbanking / Wallet
2. Details Entry — card number with Luhn validation, UPI ID format check
3. OTP Verification — 6-digit OTP with 30s resend timer
4. Processing — animated progress
5. Success / Failure — transaction ID, download receipt

### 🗺 Ahmedabad Map
- React Leaflet with OpenStreetMap tiles
- Color-coded markers by location type
- Popup cards with site name, address, type badge

### ⚡ P2P Energy Trading
- Create energy listings with price/quantity
- Browse offers, buy flow → payment flow integration
- Transaction history, wallet balance, 7-day market price chart

### 🚗 EV Charging
- Register vehicles with battery/range tracking
- Live battery % animation during charging
- Schedule charging by time + preferred source (solar/grid/any)
- Nearby stations with availability, price, fast-charge badges
- Navigate button opens Google Maps directions

### 🌱 Sustainability & ESG
- CO2 offset using India grid emission factor (0.82 kg/kWh)
- Forest equivalent (21 kg CO2 absorbed per tree/year)
- ESG score (0–100) based on renewable mix
- Monthly carbon savings trend chart

---

## 📡 API Reference

All routes prefixed with `/api/`. Next.js proxies to `http://localhost:5005/api/` in dev.

### Authentication
```
POST   /api/users/login          Login, returns JWT token
POST   /api/users/register       Register new user
GET    /api/users                List all users (admin)
PUT    /api/users/:id            Update user
DELETE /api/users/:id            Delete user
```

### Devices
```
GET    /api/devices              List devices (role/userId filter)
POST   /api/devices              Register new device
PUT    /api/devices/:id          Update device
DELETE /api/devices/:id          Remove device
```

### Telemetry
```
GET    /api/telemetry/dashboard  Dashboard summary (role/userId/range filter)
GET    /api/telemetry            Raw telemetry readings
```
Query params: `?role=admin`, `?userId=xxx`, `?range=7d|30d|90d|1y`

### Invoices
```
GET    /api/invoices             List invoices (role/userId filter)
POST   /api/invoices             Generate invoice
PUT    /api/invoices/:id         Update invoice status
```

### Subscriptions
```
GET    /api/subscriptions              Get user subscriptions
POST   /api/subscriptions             Create subscription
PUT    /api/subscriptions/:id         Update/upgrade plan
DELETE /api/subscriptions/:id/cancel  Cancel subscription
POST   /api/subscriptions/:id/pause   Pause subscription
POST   /api/subscriptions/:id/resume  Resume subscription
```

### Plans
```
GET    /api/plans                List all energy plans
POST   /api/plans                Create plan (admin)
PUT    /api/plans/:id            Update plan
DELETE /api/plans/:id            Delete plan
```

### Carbon
```
GET    /api/carbon               Carbon stats (aggregated for admin, per-user for consumer)
```

### Notifications
```
GET    /api/notifications                      Get notifications
PUT    /api/notifications/:id/read             Mark one as read
PUT    /api/notifications/mark-all-read        Mark all as read
DELETE /api/notifications/:id                  Delete notification
```

### Support Tickets
```
GET    /api/tickets              List tickets
POST   /api/tickets              Create ticket
PUT    /api/tickets/:id          Update ticket (status, priority, reply)
DELETE /api/tickets/:id          Delete ticket
```

### Payments
```
POST   /api/payments             Process payment
GET    /api/payments             Payment history
GET    /api/payment-methods      Saved payment methods
POST   /api/payment-methods      Add payment method
DELETE /api/payment-methods/:id  Remove payment method
```

### AI
```
POST   /api/groq                 Chat with AI advisor
```
Request body: `{ message: string, role: string, history: array }`

### Locations
```
GET    /api/locations            List locations
POST   /api/locations            Add location
PUT    /api/locations/:id        Update location
```

---

## 🗃 Data Models

| Model | Collection | Key Fields |
|---|---|---|
| User | users | name, email, password (hashed), role, organizationId |
| Location | locations | name, address, coordinates {lat,lng}, location_type, userId |
| Device | devices | device_serial, device_type, status, firmware_version, locationId, userId |
| EnergyReading | energyreadings | solarGeneration, consumption, gridImport, gridExport, batteryStateOfCharge, timestamp |
| Invoice | invoices | invoiceId, userId, subscriptionId, totalAmount, status, billingPeriod, dueDate |
| Subscription | subscriptions | userId, planId, locationId, status, billingCycle, startDate |
| EnergyPlan | energyplans | name, basePrice, ratePerKwh, maxKwh, includedSolarKw, targetAudience |
| CarbonStat | carbonstats | subscription_id, carbon_saved_kg, trees_equivalent |
| SupportTicket | supporttickets | userId, subject, description, status, priority, category |
| Notification | notifications | userId, role, title, message, type, read, createdAt |
| Payment | payments | invoiceId, userId, amount, method, status, transactionId |
| PaymentMethod | paymentmethods | userId, type, last4, upiId, bankName, isDefault |
| AuditLog | auditlogs | action, userId, entityType, entityId, timestamp |

---

## 📁 Project Structure

```
ecopower/
├── app/                          # Next.js App Router
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Landing page
│   ├── globals.css               # Global styles
│   ├── login/page.js             # Login page
│   ├── admin/                    # Admin role pages
│   │   ├── layout.js
│   │   ├── page.js               # Admin dashboard
│   │   ├── users/page.js
│   │   ├── devices/page.js
│   │   ├── plans/page.js
│   │   ├── billing/page.js
│   │   ├── support/page.js
│   │   ├── analytics/page.js
│   │   ├── firmware/page.js
│   │   ├── weather-forecast/page.js
│   │   ├── blockchain/page.js
│   │   └── grid-balancing/page.js
│   ├── consumer/                 # Consumer role pages
│   │   ├── layout.js
│   │   ├── page.js               # Consumer dashboard
│   │   ├── analytics/page.js
│   │   ├── subscription/page.js
│   │   ├── billing/page.js
│   │   ├── trading/page.js
│   │   ├── ev-charging/page.js
│   │   ├── discom/page.js
│   │   └── support/page.js
│   └── enterprise/               # Enterprise role pages
│       ├── layout.js
│       ├── page.js               # Fleet dashboard
│       ├── sites/page.js
│       ├── team/page.js
│       ├── analytics/page.js
│       ├── sustainability/page.js
│       ├── subscription/page.js
│       └── billing/page.js
│
├── components/                   # Shared React components
│   ├── AIAdvisor.js              # Floating AI chat widget
│   ├── AhmedabadMap.js           # Leaflet map
│   ├── DashboardLayout.js        # Header + sidebar wrapper
│   ├── ExportUtils.js            # PDF/CSV export helpers (dashboard, ESG, DISCOM, subscription)
│   ├── InvoicePDF.js             # Invoice PDF generator (single + bulk)
│   ├── Modal.js                  # Dialog component (prop: open)
│   ├── NotificationCenter.js     # Bell icon + notification panel
│   ├── PaymentFlow.js            # 5-step payment wizard
│   ├── Sidebar.js                # Role-aware navigation sidebar
│   ├── SmartMeterLive.js         # Real-time meter widget
│   └── UserProfile.js            # User profile dropdown
│
├── server/                       # Express backend
│   ├── index.js                  # Entry point, route mounting
│   ├── db.js                     # MongoDB connection (eaas_platform)
│   ├── models/                   # Mongoose schemas
│   └── routes/                   # API route handlers
│       ├── users.js, devices.js, telemetry.js
│       ├── invoices.js, subscriptions.js, plans.js
│       ├── carbon.js, notifications.js, tickets.js
│       ├── payments.js, payment-methods.js
│       ├── locations.js, groq.js
│
├── api/
│   └── index.js                  # Vercel serverless entry (imports server/app.js)
│
├── lib/
│   ├── api.js                    # API helper (auto-detects local vs Vercel)
│   └── groqClient.js             # Groq AI client (proxy + direct fallback)
│
├── context/
│   └── AuthContext.js            # JWT auth state, login/logout, role detection
│
├── next.config.mjs               # Next.js config + /api/* proxy rewrite (dev only)
├── package.json
└── .env.local                    # Environment variables (not committed)
```

---

## 🧩 Key Components

### `Modal.js`
Uses `open` prop (not `isOpen`):
```jsx
<Modal open={showModal} onClose={() => setShowModal(false)} title="Title">
  {/* content */}
</Modal>
```

### `PaymentFlow.js`
```jsx
<PaymentFlow
  invoiceId="INV-001"
  amount={2499}
  onSuccess={(txnId) => console.log('Paid:', txnId)}
  onClose={() => setPayModal(false)}
/>
```

### `AIAdvisor.js`
```jsx
<AIAdvisor mode="consumer" /> // mode: "admin" | "consumer" | "enterprise"
```

### `InvoicePDF.js`
```js
import { downloadInvoicePDF, downloadAllInvoicesPDF } from '@/components/InvoicePDF';

await downloadInvoicePDF(invoice);
await downloadAllInvoicesPDF(invoices, 'Account Name');
```

### `ExportUtils.js`
```js
import { downloadDashboardReport, downloadESGReport, downloadDISCOMCertificate, downloadSubscriptionInvoicePDF, downloadAnalyticsCSV } from '@/components/ExportUtils';
```

### `groqClient.js`
```js
import { askGroq } from '@/lib/groqClient';
const response = await askGroq(messages); // tries backend proxy first, falls back to direct API
```

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| Primary Green | `#22C55E` | CTAs, active states, success |
| Dark Green | `#16A34A` | Hover states |
| Background | `#F8FAFC` | Page background |
| Surface | `#FFFFFF` | Cards |
| Text Main | `#0F172A` | Headings |
| Text Muted | `#64748B` | Labels, secondary text |
| Border | `#E2E8F0` | Card borders |
| Sidebar | `#0A0F1E` | Dark sidebar background |
| Admin Accent | `#8B5CF6` | Purple — admin role |
| Enterprise Accent | `#38BDF8` | Blue — enterprise role |
| Consumer Accent | `#22C55E` | Green — consumer role |

CSS class `.glass-card` — white card with border, border-radius 16px, subtle shadow.

---

## 🚀 Deploying to Vercel

This project is deployed at Vercel with the Express backend running as a serverless function.

### How it works

```
Vercel
├── Next.js app       → all non-/api routes (CDN + SSR)
└── api/index.js      → all /api/* routes (serverless function)
                          └── imports server/app.js (Express)
                              └── connects to MongoDB Atlas on cold start
```

### Steps

**1. Push to GitHub**
```bash
git add .
git commit -m "deploy"
git push origin main
```

**2. Import on Vercel**
- Go to [vercel.com/new](https://vercel.com/new)
- Import the GitHub repo
- Framework preset: Next.js (auto-detected)
- Root directory: `.`

**3. Add Environment Variables** in Vercel → Settings → Environment Variables:

| Variable | Notes |
|---|---|
| `MONGODB_URI` | Must end with `/eaas_platform` |
| `GROQ_API_KEY` | From console.groq.com |
| `NEXT_PUBLIC_GROQ_API_KEY` | Same value, client-side fallback |
| `JWT_SECRET` | Random 32-char string |
| `NEXTAUTH_SECRET` | Random 32-char string |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL |
| `NEXTAUTH_URL` | Your Vercel URL |

**4. MongoDB Atlas — allow all IPs**

In Atlas → Network Access, add `0.0.0.0/0` (Vercel uses dynamic IPs).

### Local vs Production

| | Local | Vercel |
|---|---|---|
| Frontend | `npm run dev` (port 3000) | Vercel CDN |
| Backend | `npm run server` (port 5005) | Serverless function |
| API routing | Next.js proxy rewrite | `vercel.json` routes |
| Env vars | `.env.local` | Vercel dashboard |

---

## 📜 License

MIT — built for EcoPower 2.0 Hackathon, Ahmedabad 2026.
