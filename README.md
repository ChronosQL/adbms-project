# Ceylon Best Tours — Tourism & Vehicle Booking System

A full-stack, enterprise-grade tourism and vehicle booking platform built for **Ceylon Best Tours**. The system features real-world tour packages, custom point-to-point (P2P) trip planning with interactive geospatial maps (PostGIS + Leaflet), quotation negotiation, split payment management, automated PDF receipt/report generation, verified customer reviews, and a comprehensive administrative back-office.

---

## Project Information

This project is developed as part of the **ICT3183 – Group Project / Advanced Database Management Systems (ADBMS)** module at the Faculty of Technology, University of Ruhuna.

- **Degree:** Bachelor of Information and Communication Technology (BICT) (Hons)
- **Year / Semester:** 3rd Year – 1st Semester
- **Project Type:** Real-World ICT Industry Group Project
- **Client Organization:** Ceylon Best Tours
- **Client Representative:** Mr. Dilshan
- **Repository:** [ChronosQL/adbms-project](https://github.com/ChronosQL/adbms-project.git)

---

## Client Information

- **Business Name:** Ceylon Best Tours  
- **Contact Person:** Mr. Dilshan  
- **Business Type:** Local tourism, bespoke travel itineraries & tour vehicle fleet service in Sri Lanka  

---

## Project Team – TechNova

| Name | Registration Number |
|------|--------------------|
| R.P.J.M. Ruvanpathirana | TG/2022/1351 |
| G.R.K.M.T. Rathnayaka | TG/2022/1380 |
| W.K.G. Rajapaksha | TG/2022/1382 |
| R. W. M. A. S Bandara | TG/2022/1386 |
| W.M.A.K. Keshali | TG/2022/1419 |

---

## Project Overview

**Ceylon Best Tours** bridges local tourism operators with domestic and international travelers. The platform modernizes trip scheduling, vehicle fleet reservation, price quotation, and financial tracking into a unified web application with role-based access control (RBAC).

### Key Architectural Highlights
- **Direct-SQL & Zero ORM Policy:** High-performance direct PostgreSQL queries using the native `pg` connection pool with parameterization (`$1, $2, ...`) to eliminate ORM abstraction overhead.
- **Geospatial Intelligence:** PostGIS spatial extension enabled (`ST_DWithin`, `ST_MakePoint`, spatial indices `idx_place_geom`) for attraction proximity calculations and custom route mapping.
- **Transactional Integrity:** Explicit multi-statement transaction management (`BEGIN` / `COMMIT` / `ROLLBACK`) for booking flows, payment processing, and review submissions.
- **Automated Document Generation:** Server-side PDF generation using PDFKit for booking confirmation vouchers, invoices, payment receipts, and administrative analytics reports.
- **Scheduled Maintenance Jobs:** Built-in cron scheduler for tour status transitions, expired quote invalidations, payment audits, and materialized view refreshing.

---

## Key Features

### 1. Customer (Tourist) Experience
- **Authentication & Profiles:** Standard registration/login with bcrypt password hashing, Google OAuth 2.0 social login, and emergency contact management.
- **Point-to-Point (P2P) Custom Booking:** Plan tailored tours by selecting pickup and dropoff locations on an interactive Leaflet map, passenger headcount, and vehicle category.
- **Curated Tour Packages:** Browse rich multi-day itineraries (Adventure, Cultural Heritage, Safari, Beach Side, Hill Country, Wellness & Ayurveda) with nearby attraction recommendations.
- **Dynamic Quotation & Negotiation:** Request custom price quotes, receive admin cost breakdowns, and accept or decline quotes directly from the user dashboard.
- **Payment & Bank Transfer Slips:** Upload bank payment receipts/slips, track approval status, and download official PDF receipts and invoices.
- **Booking Confirmation PDF:** Download branded booking vouchers complete with tour details, breakdown, and reference tokens.
- **Verified Customer Reviews:** Submit 1–5 star ratings and reviews with multi-photo uploads for completed bookings.
- **Customer Inquiry Desk:** Direct messaging channel to communicate with Ceylon Best Tours administration.

### 2. Admin Management Portal
- **Executive Dashboard:** Live metrics for bookings, pending quotes, total revenue, vehicle availability, and quick action shortcuts.
- **Booking Management:** Review incoming booking requests, issue customized price quotes, apply seasonal or additional charges, update booking lifecycle statuses, and view complete status history.
- **Fleet & Category Management:** Manage vehicle categories (Sedans, SUVs, Vans, Mini Buses) and fleet vehicles with specs, daily/km rates, registration numbers, and Cloudinary image galleries.
- **Tour Package Management:** Create and update multi-day packages with itineraries, highlight attractions, Cloudinary banners, destination photo galleries, and availability calendar scheduling.
- **Cash Register & Payments:** Record cash payments, inspect uploaded bank slips with approve/reject workflows, and monitor financial balances.
- **Destination & City PostGIS Directory:** Add and manage cities, destinations, and places with geographic latitude/longitude coordinates.
- **Inquiry & Support Center:** Centralized inbox for customer inquiries with threaded administrative reply functionality.
- **Automated Cron Jobs & Maintenance:** Manually trigger or monitor automated background maintenance jobs (tour lifecycle progression, quote expiration, materialized view refresh, DB vacuum).
- **Business Intelligence & PDF Reports:** Generate and download structured executive PDF reports and JSON analytics:
  - Business Overview Report
  - Earnings & Financial Report
  - Booking Trends Analysis
  - Vehicle Fleet Utilization
  - Customer Review & Sentiment Analysis

---

## Technologies Used

### Frontend
- **Framework:** React 19 (`react` ^19.2.4)
- **Build Tool:** Vite 7 (`vite` ^7.2.4)
- **Styling:** TailwindCSS v4 (`@tailwindcss/vite`, `tailwindcss` ^4.2.1) with custom brand tokens
- **Routing:** React Router v7 (`react-router-dom` ^7.13.2)
- **Geospatial & Maps:** Leaflet (`^1.9.4`) & React-Leaflet (`^5.0.0`)
- **Icons & UI:** Lucide React (`^0.577.0`), React Icons (`^5.6.0`)
- **Charts & Visualization:** Recharts (`^3.9.1`)
- **Animations:** Framer Motion (`^12.38.0`)
- **HTTP Client:** Axios (`^1.16.1`)
- **Authentication:** `@react-oauth/google` (`^0.13.5`)
- **Internationalization:** i18next & `react-i18next`

### Backend
- **Runtime:** Node.js (v20+ recommended)
- **Framework:** Express 5 (`express` ^5.2.1)
- **Database Driver:** Native PostgreSQL Client (`pg` ^8.13.1 `Pool` — Zero ORM)
- **Spatial Engine:** PostGIS
- **Authentication:** JSON Web Tokens (`jsonwebtoken` ^9.0.3) & `bcryptjs` / `bcrypt`
- **Google OAuth:** `google-auth-library` (`^10.9.0`)
- **Media Uploads:** Multer (`^2.1.1`), Cloudinary (`^1.41.0`), `multer-storage-cloudinary`
- **PDF Generation:** PDFKit (`pdfkit` ^0.17.2)
- **Background Tasks:** Node.js cron scheduler & interval workers
- **Testing:** Native Node.js Test Runner (`node:test`, `node:assert/strict`)

### Database
- **Engine:** PostgreSQL 15+ with PostGIS extension
- **Query Paradigm:** Direct SQL with parameterized queries
- **Features:** Stored procedures, triggers, custom ENUM types, spatial indexing (`GIST`), materialized views (`mv_package_popularity`), window functions

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 React 19 + Vite 7 Frontend                  │
│       (Customer Portal & Ceylon Best Tours Admin Panel)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST API & Multipart
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Express 5 Node.js Backend                  │
│   ├── JWT Auth & Role Middleware (verifyToken, adminOnly)   │
│   ├── Controllers & DTO Normalizers                         │
│   ├── Multer + Cloudinary Media Upload Service              │
│   ├── PDFKit Document Engine (Vouchers, Invoices, Reports)  │
│   └── Background Cron Job Scheduler                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Native 'pg' Pool (Direct SQL)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             PostgreSQL Database (PostGIS Enabled)           │
│   ├── Relational Tables & Foreign Keys                      │
│   ├── Spatial Geometry Points & ST_DWithin Proximity        │
│   ├── Stored Procedures & Triggers (set_updated_at)         │
│   ├── Materialized Views (mv_package_popularity)            │
│   └── Multi-Statement Transaction Atomicity                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Design

The PostgreSQL database encompasses normalized relational models and spatial PostGIS data:

- **`user`:** Customer and administrative accounts, role-based access (`ADMIN`, `CUSTOMER`), emergency contacts, auth providers (`LOCAL`, `GOOGLE`).
- **`vehicle_category` & `vehicle`:** Categorized fleet options (capacity, luggage, pricing rates per km/day) and individual vehicle units.
- **`place`:** Tourist attractions and destinations storing geographic geometry (`geometry(Point, 4326)`), latitude, longitude, and images.
- **`activity` & `place_activity`:** Activities associated with specific destinations.
- **`package` & `package_place`:** Pre-defined tour packages, duration, day-by-day itineraries, and highlight destinations.
- **`booking` & `booking_package`:** Point-to-point and package bookings with statuses (`PENDING`, `QUOTED`, `ACCEPTED`, `REJECTED`, `CONFIRMED`, `TOUR_STARTED`, `COMPLETED`, `CLOSED`, `CANCELLED`).
- **`booking_status_history`:** Audit log of all booking lifecycle transitions.
- **`payment`:** Financial records tracking cash register and bank transfer payments, approval statuses, and Cloudinary payment slip URLs.
- **`review` & `review_image`:** Verified customer ratings, feedback, and customer-uploaded tour photos.
- **`contact_inquiry` & `contact_reply`:** Customer messages and administrative reply threads.

---

## API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new customer account |
| POST | `/api/auth/login` | Public | Log in with email and password |
| POST | `/api/auth/google` | Public | Sign in or register via Google OAuth 2.0 |
| GET | `/api/auth/me` | Authenticated | Validate stored token and fetch current user profile |
| PUT | `/api/auth/profile` | Authenticated | Update user profile details and emergency contact |
| PUT | `/api/auth/password` | Authenticated | Change user password |

### Bookings (`/api/bookings`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/bookings/p2p` | Customer | Create custom Point-to-Point booking |
| GET | `/api/bookings/my` | Customer | Retrieve bookings for authenticated user |
| GET | `/api/bookings/:id/confirmation-pdf` | Customer/Admin | Download official booking confirmation PDF |
| PUT | `/api/bookings/:id` | Customer | Update pending booking details |
| GET | `/api/bookings` | Admin | Retrieve all bookings with pagination and filters |
| PATCH | `/api/bookings/:id/quote` | Admin | Set custom price quote for customer review |
| PATCH | `/api/bookings/:id/additional-charges` | Admin | Add extra operational charges to booking |
| PATCH | `/api/bookings/:id/status` | Authenticated | Update booking status (`ACCEPTED`, `REJECTED`, etc.) |

### Tour Packages (`/api/packages`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/packages` | Public | List published tour packages with filters |
| GET | `/api/packages/:id` | Public | Get tour package details, places, and itinerary |
| GET | `/api/packages/:id/recommendations` | Public | Get recommended packages based on interests |
| GET | `/api/packages/places/nearby` | Public | PostGIS geospatial search for nearby attractions |
| GET | `/api/packages/admin/packages` | Admin | List all packages for admin management |
| POST | `/api/packages/admin/packages` | Admin | Create new package with Cloudinary image upload |
| PUT | `/api/packages/admin/packages/:id` | Admin | Update package details and itinerary |
| DELETE | `/api/packages/admin/packages/:id` | Admin | Remove tour package |
| GET | `/api/packages/admin/packages/:id/availability` | Admin | Get package seasonal availability calendar |
| PUT | `/api/packages/admin/packages/:id/availability` | Admin | Update package availability dates |

### Vehicles & Fleet (`/api/vehicles`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/vehicles/categories` | Public | List vehicle categories |
| GET | `/api/vehicles/categories/:id` | Public | Get vehicle category details |
| POST | `/api/vehicles/categories` | Admin | Create category with Cloudinary photos |
| PUT | `/api/vehicles/categories/:id` | Admin | Update category details |
| DELETE | `/api/vehicles/categories/:id` | Admin | Delete vehicle category |
| GET | `/api/vehicles` | Public | List fleet vehicles |
| GET | `/api/vehicles/available` | Public | Get vehicles available for specific dates |
| GET | `/api/vehicles/stats` | Admin | Fleet count and status statistics |
| GET | `/api/vehicles/:id` | Public | Get vehicle specifications |
| POST | `/api/vehicles` | Admin | Add new vehicle with multi-photo upload |
| PUT | `/api/vehicles/:id` | Admin | Update vehicle details |
| DELETE | `/api/vehicles/:id` | Admin | Delete vehicle record |

### Payments (`/api/payments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/payments` | Admin | List all payments across bookings |
| POST | `/api/payments` | Admin | Record manual cash payment |
| PATCH | `/api/payments/:paymentId/approve` | Admin | Approve customer bank payment slip |
| PATCH | `/api/payments/:paymentId/reject` | Admin | Reject invalid payment slip |
| POST | `/api/payments/upload-slip` | Customer | Upload bank transfer slip for booking |
| PATCH | `/api/payments/:paymentId/slip` | Customer | Update existing payment slip |
| GET | `/api/payments/booking/:bookingId` | Authenticated | Get all payments associated with a booking |
| GET | `/api/payments/booking/:bookingId/invoice` | Authenticated | Download booking invoice PDF |
| GET | `/api/payments/:paymentId/receipt/download-url` | Authenticated | Download official payment receipt |

### Reviews & Ratings (`/api/reviews`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/reviews` | Public | Get published reviews with pagination and ratings |
| GET | `/api/reviews/my` | Customer | View reviews submitted by current user |
| GET | `/api/reviews/stats` | Public | Overall average rating and score breakdown |
| GET | `/api/reviews/reviewable-tours` | Customer | Get completed tours eligible for review |
| POST | `/api/reviews` | Customer | Submit tour review with ratings and photos |

### Contact & Inquiries (`/api/contact`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/contact` | Public | Submit new tourist contact inquiry |
| GET | `/api/contact/my` | Customer | View my inquiry history and replies |
| GET | `/api/contact` | Admin | View all customer inquiries |
| POST | `/api/contact/:id/reply` | Authenticated | Add reply to inquiry message thread |
| PATCH | `/api/contact/:id/read` | Admin | Mark inquiry as read |

### Reports & Analytics (`/api/reports`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/reports/business-overview/pdf` | Admin | Download Business Overview PDF report |
| GET | `/api/reports/earnings/pdf` | Admin | Download Earnings & Revenue PDF report |
| GET | `/api/reports/booking-analysis/pdf` | Admin | Download Booking Analysis PDF report |
| GET | `/api/reports/vehicle-analysis/pdf` | Admin | Download Fleet Utilization PDF report |
| GET | `/api/reports/customer-review-analysis/pdf` | Admin | Download Customer Review PDF report |
| GET | `/api/reports/*/data` | Admin | Corresponding JSON analytics for dashboard charts |

### Maintenance & Cron (`/api/maintenance`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/maintenance/run-job/:jobName` | Admin | Manually trigger cron maintenance tasks (`tour-lifecycle`, `quote-expiration`, `payment-audit`, `refresh-analytics`, `db-maintenance`) |

---

## Installation & Setup Guide

### 1. Prerequisites
Ensure you have the following installed on your development machine:
- **Node.js** (v20.x or higher recommended) & **npm** (v10+)
- **PostgreSQL** (v15.x or higher) with **PostGIS** extension
- **Git**
- A **Cloudinary** account (for media storage)
- (Optional) **Google Cloud Console** OAuth 2.0 Client ID for Google login

---

### 2. Clone Repository

```bash
git clone https://github.com/ChronosQL/adbms-project.git
cd adbms-project
```

---

### 3. Database Setup

1. Open PostgreSQL terminal (`psql`) or a database management client (e.g. pgAdmin / DBeaver).
2. Create database and enable PostGIS:

```sql
CREATE DATABASE tours;
\c tours
CREATE EXTENSION IF NOT EXISTS postgis;
```

3. Execute the schema script:

```bash
psql -U postgres -d tours -f backend/db/schema.sql
```

*(Alternatively, run `backend/db/init.sql` to execute the baseline schema and seed data).*

---

### 4. Backend Setup

1. Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

2. Create a `.env` file in `backend/` based on `.env.example`:

```env
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=tours

# Authentication Secret
JWT_SECRET=your_jwt_secure_random_key

# Google OAuth Credentials (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloudinary Media Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

3. Seed default Super Admin account:

```bash
npm run seed:admin
```
> **Default Admin Credentials:**
> - **Email:** `admin@ceylon.com`
> - **Password:** `admin1234`

4. Start the backend server:

```bash
npm run dev       # Starts development server with nodemon and cron workers
# or
npm start         # Starts standard Node.js server
```

The backend API will be running on: `http://localhost:5000`

---

### 5. Frontend Setup

1. Open a new terminal, navigate to the frontend directory, and install dependencies:

```bash
cd frontend
npm install
```

2. Start the Vite development server:

```bash
npm run dev
```

The frontend application will be running on: `http://localhost:5173`

---

## Running Automated Tests

The backend includes a comprehensive zero-dependency test suite running on Node.js built-in test runner:

```powershell
# Run the complete backend test suite:
npm test --prefix backend

# Run individual test suites:
npm run test:schema --prefix backend       # Schema regression & database structure
npm run test:pagination --prefix backend   # SQL pagination and window function checks
npm run test:cron --prefix backend         # Automated cron job verification
```

Frontend validation:

```powershell
# Verify Vite production bundling:
npm run build --prefix frontend

# Run ESLint validation:
npm run lint --prefix frontend
```

---

## Project Structure

```
adbms-project/
├── backend/
│   ├── controllers/         # Request handlers & parameterized PostgreSQL queries
│   ├── cron/                # Scheduled background tasks (jobs.js, scheduler.js)
│   ├── db/                  # Database connectivity, migrations & seeds
│   │   ├── migrations/      # Numbered SQL migration files
│   │   ├── connection.js    # Centralized PostgreSQL pool (pg)
│   │   ├── schema.sql       # Authoritative PostgreSQL + PostGIS schema
│   │   └── seedAdmin.js     # Default admin seeder script
│   ├── dto/                 # Data transfer object normalizers
│   ├── middleware/          # JWT auth, role guard, Cloudinary file uploaders
│   ├── routes/              # Express 5 REST API routes
│   ├── tests/               # Native Node.js test runner suites
│   ├── utils/               # PDFKit document generators & helpers
│   ├── package.json
│   └── server.js            # Express API server entry point
├── frontend/
│   ├── public/              # Static media assets
│   ├── src/
│   │   ├── components/      # Reusable UI widgets, layout wrappers & views
│   │   │   ├── common/      # Generic components (Pagination, Badges, Cards)
│   │   │   ├── navbar/      # Navigation bar with user/admin state
│   │   │   └── pages/
│   │   │       ├── Admin/   # Admin dashboard, fleet, packages, reports, bookings
│   │   │       ├── Shared/  # Login and Register pages
│   │   │       ├── Site/    # Public pages (Home, About, Contact, Packages, Reviews)
│   │   │       └── User/    # Customer dashboard, my bookings, reviews, profile
│   │   ├── context/         # AuthContext and global state providers
│   │   ├── services/        # Axios API client modules
│   │   ├── App.jsx          # Route declarations (SiteLayout & AdminLayout)
│   │   ├── index.css        # TailwindCSS v4 theme tokens and global styles
│   │   └── main.jsx         # React application entry point
│   ├── package.json
│   └── vite.config.js       # Vite 7 build configuration with TailwindCSS plugin
├── AGENTS.md                # System engineering rules & architecture governance
└── README.md                # Project documentation and setup guide
```

---

## Security & Architectural Standards

- **Zero ORM Enforcement:** All database operations utilize pure parameterized SQL queries (`$1, $2, ...`) executed via `pg.Pool`, completely eliminating ORM abstraction risks and SQL injection vulnerabilities.
- **Role-Based Authorization:** Secure endpoints enforce JWT verification and role validation (`CUSTOMER`, `ADMIN`).
- **Data Protection:** Passwords securely hashed using `bcrypt` / `bcryptjs` with salt rounds >= 10.
- **Anti-Slop UI Design:** Tailored luxury travel aesthetic following the Ceylon Best Tours design tokens (`BRAND.coral`, `BRAND.gunmetal`, `BRAND.payneGray`, `BRAND.silver`) with crisp typography and purposeful micro-interactions.

---

## Acknowledgement

We express our sincere gratitude to **Mr. Dilshan** of **Ceylon Best Tours** for providing the business requirements, operational insights, and continuous domain feedback throughout the engineering of this platform.

---

## Version Control & Collaboration

- **Version Control System:** Git & GitHub
- **Organization Repository:** [https://github.com/ChronosQL/adbms-project.git](https://github.com/ChronosQL/adbms-project.git)
- **Branching Strategy:**
  - `main` — Production-ready release branch
  - Feature & team branches (`final`, `amila`, `keshali`, etc.) merged via reviewed pull requests
