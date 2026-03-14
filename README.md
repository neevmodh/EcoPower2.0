# ⚡ EcoPower 2.0 — Energy-as-a-Service Platform

<div align="center">

![EcoPower](https://img.shields.io/badge/EcoPower-2.0-22C55E?style=for-the-badge&logo=zap&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![AI](https://img.shields.io/badge/AI-Groq_LLaMA_3.3_70B-FF6B35?style=for-the-badge)

**A production-grade Solar Energy Management SaaS platform built for Ahmedabad's residential, commercial, and industrial sectors.**

*Real-time telemetry · AI-powered insights · P2P energy trading · Multi-site fleet management · Smart EV charging*

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
  - [Admin Panel](#-admin-panel)
  - [Consumer Panel](#-consumer-panel)
  - [Enterprise Panel](#-enterprise-panel)
- [Platform Features](#-platform-features)
- [API Reference](#-api-reference)
- [Data Models](#-data-models)
- [Project Structure](#-project-structure)
- [Key Components](#-key-components)

---

## 🌍 Overview

EcoPower 2.0 is a full-stack **Energy-as-a-Service (EaaS)** platform that connects solar energy producers, consumers, and grid operators in a unified ecosystem. Built specifically for the Ahmedabad metropolitan area, it supports three distinct user roles with purpose-built dashboards, real-time data, and AI-driven recommendations.

**Core value propositions:**
- Homeowners monitor solar generation, battery state, and grid interaction in real time
- Enterprises manage multi-site solar fleets with ESG reporting and carbon tracking
- Admins oversee the entire platform — users, devices, billing, firmware, and grid health

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) + React 19 | SSR/CSR hybrid, role-based routing |
| **Backend** | Node.js + Express 5 | REST API server on port 5005 |
| **Database** | MongoDB Atlas + Mongoose 9 | Document store for all platform data |
| **AI** | Groq API — LLaMA 3.3 70B Versatile | RAG-powered energy advisor chatbot |
| **Maps** | React Leaflet + OpenStreetMap | Geographic site distribution |
| **Auth** | JWT (jsonwebtoken) + bcryptjs | Stateless role-based authentication |
| **Payments** | Custom Razorpay-style flow | Card / UPI / Netbanking / Wallet |
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
│         Database: eaas_platform                         │
└─────────────────────────────────────────────────────────┘
```

**API Proxy:** Next.js rewrites all `/api/*` requests to `http://localhost:5005/api/*` — no CORS issues, single origin for the browser.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone & Install

```bash
git clone <repo-url>
cd ecopower
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables section)
```

### 3. Seed the Database

```bash
npm run seed:complete
```

This creates:
- 3 users (admin, enterprise, consumer)
- 5 Ahmedabad locations with GPS coordinates
- 10+ IoT devices
- 6 months of telemetry readings
- Energy plans (Basic Solar, Advanced Solar, Premium Solar, PAYG)
- 60 invoices with varied statuses (Paid / Pending / Overdue)
- Carbon stats, support tickets, subscriptions

### 4. Start the Backend

```bash
npm run server
# ✅ Backend running on port 5005
```

### 5. Start the Frontend

```bash
npm run dev
# ✅ Frontend running on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Environment Variables

Create `.env.local` in the project root:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/eaas_platform

# Groq AI (get from https://console.groq.com)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🗄 Database Setup

**Connection string format:**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/eaas_platform
```

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

### 🔴 Admin Panel

**Route:** `/admin`

The command center for platform operators. Full visibility and control over every aspect of the EcoPower ecosystem.

| Page | Route | Features |
|---|---|---|
| **Dashboard** | `/admin` | KPI overview, live metrics, revenue chart, device health |
| **Users & Tenants** | `/admin/users` | Full CRUD — create, edit, suspend, delete users; role assignment |
| **Devices** | `/admin/devices` | IoT device registry, status monitoring, serial tracking |
| **Energy Plans** | `/admin/plans` | Create/edit subscription plans; PAYG shown as system plan |
| **Revenue** | `/admin/billing` | Invoice management, payment status, revenue analytics |
| **Support Queue** | `/admin/support` | Ticket management with priority, status, assignment |
| **Analytics** | `/admin/analytics` | Time-filtered charts (7d/30d/90d/1y), generation vs consumption |
| **Firmware** | `/admin/firmware` | OTA update management, version tracking, rollout control |
| **Weather Forecast** | `/admin/weather-forecast` | 7-day solar irradiance forecast for Ahmedabad |
| **Blockchain** | `/admin/blockchain` | Immutable audit trail for energy transactions |
| **Grid Balancing** | `/admin/grid-balancing` | Real-time grid load management and frequency control |

---

### 🟢 Consumer Panel

**Route:** `/consumer`

Home solar system management for residential users. Real-time energy flow, billing, trading, and EV charging.

| Page | Route | Features |
|---|---|---|
| **Dashboard** | `/consumer` | Live energy flow animation, 24h chart, devices, sustainability, billing tabs |
| **Analytics** | `/consumer/analytics` | Time-filtered generation/consumption charts, solar efficiency trends |
| **Subscription** | `/consumer/subscription` | 5-step plan wizard, PAYG quick-start, upgrade/downgrade, cancel/pause |
| **Billing** | `/consumer/billing` | Invoice history, payment status, multi-step payment flow |
| **P2P Trading** | `/consumer/trading` | Buy/sell excess solar energy with neighbors; market price chart |
| **EV Charging** | `/consumer/ev-charging` | Vehicle management, smart scheduling, nearby stations with navigation |
| **DISCOM / Grid** | `/consumer/discom` | Grid tariff comparison, net metering, DISCOM portal integration |
| **Support** | `/consumer/support` | Raise and track support tickets |

**Consumer Dashboard Tabs:**
- **Energy Flow** — Live animated solar → inverter → home → battery diagram
- **Hourly Chart** — 24-hour solar vs consumption bar chart from real telemetry
- **Devices** — All connected IoT devices with status and firmware version
- **Impact** — CO₂ prevented, trees equivalent, solar self-sufficiency progress bars
- **Billing** — Recent invoices with pending amount summary

**PAYG Plan:** ₹6.5/kWh, no fixed monthly fee, no lock-in period. Quick-start banner on dashboard links directly to subscription wizard with PAYG pre-selected.

---

### 🔵 Enterprise Panel

**Route:** `/enterprise`

Multi-site solar fleet management for industrial and commercial organizations.

| Page | Route | Features |
|---|---|---|
| **Fleet Dashboard** | `/enterprise` | Fleet KPIs, hourly generation chart, geographic map, site leaderboard, billing, ESG board |
| **Multi-Site** | `/enterprise/sites` | Per-site energy data, status, capacity, efficiency metrics |
| **Team** | `/enterprise/team` | Team member management, role assignment, invite flow |
| **Analytics** | `/enterprise/analytics` | Cross-site aggregated analytics, time filters, site comparison |
| **Sustainability** | `/enterprise/sustainability` | Carbon footprint dashboard, ESG score, renewable mix donut chart, monthly trend |
| **Subscription** | `/enterprise/subscription` | Enterprise plan selection (Starter/Growth/Scale), upgrade modal with price diff |
| **Billing** | `/enterprise/billing` | Corporate invoice management, expandable rows, bulk payment |

**Enterprise Fleet Dashboard Tabs:**
- **Fleet** — 4 KPI cards + hourly chart + full-width Ahmedabad map + site leaderboard
- **Billing** — Corporate invoices with expand/collapse detail rows
- **ESG Board** — CO₂ offset, forest equivalent, renewable mix metrics

**Enterprise Plans:**

| Plan | Price | Sites | Users | Solar |
|---|---|---|---|---|
| Starter | ₹15,000/mo | 3 | 10 | 50 kW |
| Growth | ₹35,000/mo | 10 | 50 | 150 kW |
| Scale | ₹75,000/mo | Unlimited | Unlimited | 500 kW |

---

## ✨ Platform Features

### 🤖 AI Advisor (Groq LLaMA 3.3 70B)
- Floating chat widget on every page
- RAG knowledge base with EcoPower-specific context
- Role-aware responses (admin/consumer/enterprise mode)
- Suggested questions, timestamps, copy button
- Dark terminal theme, no markdown asterisks
- Falls back to direct Groq API if backend proxy fails

### 🔔 Notification Center
- Bell icon in header on all three role panels
- Role-specific notifications (admin gets device alerts, consumer gets billing reminders, enterprise gets site reports)
- Auto-seeds on first load if no notifications exist
- Mark as read, mark all read, delete
- Polls every 30 seconds for new notifications
- Unread count badge

### 💳 Payment Flow
Multi-step payment wizard (`components/PaymentFlow.js`):
1. **Method Selection** — Card / UPI / Netbanking / Wallet
2. **Details Entry** — Card number with Luhn validation, UPI ID format check, bank selection
3. **OTP Verification** — 6-digit OTP with 30s resend timer
4. **Processing** — Animated progress with realistic delay
5. **Success / Failure** — Transaction ID, download receipt option

### 🗺 Ahmedabad Map
- React Leaflet with OpenStreetMap tiles
- Color-coded markers by location type (residential/commercial/industrial)
- Popup cards with site name, address, type badge
- Auto-centers on available locations
- Legend overlay

### 📡 Smart Meter Live
- WebSocket-simulated real-time readings
- Live battery SoC animation
- Solar generation pulse indicator

### ⚡ P2P Energy Trading
- Create energy listings with price/quantity
- Browse available offers from neighbors
- Seller profile modal with rating
- Buy flow → payment flow integration
- Transaction history with Sold/Bought badges
- 7-day market price trend chart
- Wallet balance tracking

### 🚗 EV Charging
- Register multiple vehicles with battery/range tracking
- Live battery % animation during charging
- Start/Stop charging with session logging
- Schedule charging by time + preferred source (solar/grid/any)
- Nearby stations with availability, price, fast-charge, solar badges
- Navigate button opens Google Maps directions

### 🌱 Sustainability & ESG
- CO₂ offset calculated using India grid emission factor (0.82 kg/kWh)
- Forest equivalent (21 kg CO₂ absorbed per tree/year)
- ESG score (0–100) based on renewable mix
- Monthly carbon savings trend chart
- Progress bars vs corporate targets

---

## 📡 API Reference

All routes are prefixed with `/api/`. Next.js proxies them to `http://localhost:5005/api/`.

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
GET    /api/subscriptions        Get user subscriptions
POST   /api/subscriptions        Create subscription
PUT    /api/subscriptions/:id    Update/upgrade plan
DELETE /api/subscriptions/:id/cancel   Cancel subscription
POST   /api/subscriptions/:id/pause    Pause subscription
POST   /api/subscriptions/:id/resume   Resume subscription
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
GET    /api/notifications        Get notifications (userId + role)
PUT    /api/notifications/:id/read        Mark one as read
PUT    /api/notifications/mark-all-read   Mark all as read
DELETE /api/notifications/:id             Delete notification
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
POST   /api/groq                 Chat with AI advisor (RAG + LLaMA 3.3 70B)
```

Request body: `{ message: string, role: string, history: array }`

### Locations
```
GET    /api/locations            List locations (role/userId filter)
POST   /api/locations            Add location
PUT    /api/locations/:id        Update location
```

---

## 🗃 Data Models

| Model | Collection | Key Fields |
|---|---|---|
| **User** | users | name, email, password (hashed), role, organizationId |
| **Location** | locations | name, address, coordinates {lat,lng}, location_type, userId |
| **Device** | devices | device_serial, device_type, status, firmware_version, locationId, userId |
| **EnergyReading** | energyreadings | solarGeneration, consumption, gridImport, gridExport, batteryStateOfCharge, timestamp |
| **Invoice** | invoices | invoiceId, userId, subscriptionId, totalAmount, status, billingPeriod, dueDate |
| **Subscription** | subscriptions | userId, planId, locationId, status, billingCycle, startDate |
| **EnergyPlan** | energyplans | name, basePrice, ratePerKwh, maxKwh, includedSolarKw, targetAudience |
| **CarbonStat** | carbonstats | subscription_id, carbon_saved_kg, trees_equivalent |
| **SupportTicket** | supporttickets | userId, subject, description, status, priority, category |
| **Notification** | notifications | userId, role, title, message, type, read, createdAt |
| **Payment** | payments | invoiceId, userId, amount, method, status, transactionId |
| **PaymentMethod** | paymentmethods | userId, type, last4, upiId, bankName, isDefault |
| **AuditLog** | auditlogs | action, userId, entityType, entityId, timestamp |

---

## 📁 Project Structure

```
ecopower/
├── app/                          # Next.js App Router
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Landing page (homepage)
│   ├── globals.css               # Global styles + CSS variables
│   ├── login/
│   │   └── page.js               # Login page
│   ├── admin/
│   │   ├── layout.js             # Admin layout (sidebar + header)
│   │   ├── page.js               # Admin dashboard
│   │   ├── users/page.js         # User management
│   │   ├── devices/page.js       # Device registry
│   │   ├── plans/page.js         # Energy plan management
│   │   ├── billing/page.js       # Revenue & invoices
│   │   ├── support/page.js       # Support ticket queue
│   │   ├── analytics/page.js     # Platform analytics
│   │   ├── firmware/page.js      # OTA firmware management
│   │   ├── weather-forecast/page.js  # Solar weather forecast
│   │   ├── blockchain/page.js    # Audit blockchain
│   │   └── grid-balancing/page.js    # Grid load management
│   ├── consumer/
│   │   ├── layout.js             # Consumer layout
│   │   ├── page.js               # Consumer dashboard
│   │   ├── analytics/page.js     # Energy analytics
│   │   ├── subscription/page.js  # Plan management + PAYG
│   │   ├── billing/page.js       # Invoice & payment history
│   │   ├── trading/page.js       # P2P energy trading
│   │   ├── ev-charging/page.js   # EV charging management
│   │   ├── discom/page.js        # DISCOM / grid tariff
│   │   └── support/page.js       # Support tickets
│   └── enterprise/
│       ├── layout.js             # Enterprise layout
│       ├── page.js               # Fleet dashboard
│       ├── sites/page.js         # Multi-site management
│       ├── team/page.js          # Team management
│       ├── analytics/page.js     # Fleet analytics
│       ├── sustainability/page.js # ESG & carbon tracking
│       ├── subscription/page.js  # Enterprise plan management
│       └── billing/page.js       # Corporate billing
│
├── components/                   # Shared React components
│   ├── AIAdvisor.js              # Floating AI chat widget
│   ├── AhmedabadMap.js           # Leaflet map (Ahmedabad sites)
│   ├── DashboardLayout.js        # Shared header + sidebar wrapper
│   ├── Modal.js                  # Dialog component (prop: `open`)
│   ├── NotificationCenter.js     # Bell icon + notification panel
│   ├── PaymentFlow.js            # 5-step payment wizard
│   ├── Sidebar.js                # Role-aware navigation sidebar
│   ├── UserProfile.js            # User profile dropdown
│   ├── LanguageSwitcher.js       # Language selector
│   ├── SmartMeterLive.js         # Real-time meter widget
│   ├── RazorpayPayment.js        # Razorpay payment form
│   ├── AdvancedSubscription.js   # Advanced subscription UI
│   └── SubscriptionFlow.js       # Subscription wizard flow
│
├── server/                       # Express backend
│   ├── index.js                  # App entry, route mounting
│   ├── db.js                     # MongoDB connection
│   ├── models/                   # Mongoose schemas
│   │   ├── User.js
│   │   ├── Device.js
│   │   ├── EnergyReading.js
│   │   ├── Invoice.js
│   │   ├── Subscription.js
│   │   ├── EnergyPlan.js
│   │   ├── CarbonStat.js
│   │   ├── SupportTicket.js
│   │   ├── Notification.js
│   │   ├── Payment.js
│   │   ├── PaymentMethod.js
│   │   ├── Location.js
│   │   ├── AuditLog.js
│   │   └── ...
│   ├── routes/                   # API route handlers
│   │   ├── users.js
│   │   ├── devices.js
│   │   ├── telemetry.js
│   │   ├── invoices.js
│   │   ├── subscriptions.js
│   │   ├── plans.js
│   │   ├── carbon.js
│   │   ├── notifications.js
│   │   ├── tickets.js
│   │   ├── payments.js
│   │   ├── payment-methods.js
│   │   ├── locations.js
│   │   └── groq.js
│   └── seed_complete.js          # Full database seeder
│
├── lib/
│   ├── api.js                    # API helper functions
│   └── groqClient.js             # Groq AI client (proxy + direct fallback)
│
├── context/
│   └── AuthContext.js            # JWT auth state, login/logout, role detection
│
├── next.config.mjs               # Next.js config + /api/* proxy rewrite
├── package.json
└── .env.local                    # Environment variables (not committed)
```

---

## 🧩 Key Components

### `Modal.js`
All dialogs use this component. **Important:** uses `open` prop (not `isOpen`).
```jsx
<Modal open={showModal} onClose={() => setShowModal(false)} title="Dialog Title">
  {/* content */}
</Modal>
```

### `PaymentFlow.js`
Drop-in multi-step payment component.
```jsx
<PaymentFlow
  invoiceId="INV-001"
  amount={2499}
  onSuccess={(txnId) => console.log('Paid:', txnId)}
  onClose={() => setPayModal(false)}
/>
```

### `AIAdvisor.js`
Floating AI chat widget. Add to any page:
```jsx
<AIAdvisor mode="consumer" /> // mode: "admin" | "consumer" | "enterprise"
```

### `AhmedabadMap.js`
```jsx
<AhmedabadMap locations={locations} /> // locations must have coordinates.lat/lng
```

### `NotificationCenter.js`
Already included in `DashboardLayout.js` header — no manual inclusion needed.

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
| Dark Green | `#16A34A` | Hover states, gradients |
| Background | `#F8FAFC` | Page background |
| Surface | `#FFFFFF` | Cards |
| Text Main | `#0F172A` | Headings |
| Text Muted | `#64748B` | Labels, secondary text |
| Border | `#E2E8F0` | Card borders |
| Sidebar | `#0A0F1E` | Dark sidebar background |
| Admin Accent | `#8B5CF6` | Purple — admin role |
| Enterprise Accent | `#38BDF8` | Blue — enterprise role |
| Consumer Accent | `#22C55E` | Green — consumer role |

**CSS class:** `.glass-card` — white card with border, border-radius 16px, subtle shadow.

---

## � Deploying to Vercel

This project is configured for zero-config Vercel deployment. The Express backend runs as a Vercel Serverless Function — no separate server needed in production.

### How it works

```
Vercel
├── Next.js app          → handled by @vercel/next (all non-/api routes)
└── api/index.js         → handled by @vercel/node (all /api/* routes)
                            └── imports server/app.js (Express)
                                └── connects to MongoDB Atlas on each cold start
```

`vercel.json` wires this up automatically. `next.config.mjs` only proxies `/api/*` to localhost in development — in production, Vercel routes handle it directly.

### Step-by-step

**1. Push to GitHub**
```bash
git add .
git commit -m "initial commit"
git push origin main
```

**2. Import on Vercel**
- Go to [vercel.com/new](https://vercel.com/new)
- Import your GitHub repository
- Framework preset: **Next.js** (auto-detected)
- Root directory: `.` (leave as-is)

**3. Add Environment Variables**

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Value | Notes |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://...` | From MongoDB Atlas |
| `GROQ_API_KEY` | `gsk_...` | From console.groq.com |
| `JWT_SECRET` | random 32-char string | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Your Vercel URL |

**4. Deploy**

Click **Deploy**. Vercel builds Next.js and bundles the serverless function automatically.

### MongoDB Atlas — allow Vercel IPs

Vercel functions use dynamic IPs. In MongoDB Atlas → Network Access, add `0.0.0.0/0` (allow all) or use the Vercel IP ranges for tighter security.

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
