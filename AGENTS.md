# Ceylon Best Tours (TechNova) — Engineering Rules & Architecture Standards

> **MANDATORY PROJECT GOVERNANCE**: This ruleset is the single source of truth for all AI-assisted engineering and human pair-programming in this repository. It must be strictly followed across all frontend, backend, database, and testing tasks.

---

## 1. Project Technology Stack & Core Architecture

| Domain | Technology | Configuration & Conventions |
| :--- | :--- | :--- |
| **Monorepo Structure** | Independent root subprojects | `backend/` (Express API) & `frontend/` (React SPA) |
| **Frontend Framework** | React 19 (`react` ^19.2.4) + Vite 7 | Modern React with hooks, functional components, context providers |
| **Styling & Design System** | TailwindCSS v4 (`@tailwindcss/vite`) + Custom Tokens | Single source of truth: [`frontend/src/components/pages/Admin/AdminDashboard/adminTheme.jsx`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/frontend/src/components/pages/Admin/AdminDashboard/adminTheme.jsx) |
| **Routing & Navigation** | `react-router-dom` v7 (`^7.13.2`) | Dual layout: `SiteLayout` (Public/Customer) & `AdminLayout` (Admin portal) |
| **Backend Runtime** | Express 5 (`express` ^5.2.1, Node.js) | Structured controllers, routes, middleware, and direct PostgreSQL access |
| **Database Engine** | PostgreSQL (PostGIS enabled) | Native node driver (`pg` ^8.13.1 `Pool`), explicit parameterized SQL |
| **ORM Policy** | **ABSOLUTELY NO ORM** | Explicit raw SQL only. No Prisma, Sequelize, TypeORM, Drizzle, etc. |
| **Testing Framework** | Node.js Test Runner (`node:test`, `node:assert/strict`) | Built-in zero-dependency test runner in `backend/tests/` |

---

## 2. Strict Database & Direct-SQL Architecture (Non-Negotiable)

### 2.1 The Absolute ORM Prohibition
* **NEVER install, import, recommend, or migrate to an ORM.**
* This project explicitly rejects:
  * Prisma
  * Sequelize
  * TypeORM
  * Drizzle ORM
  * MikroORM
  * Objection.js / Bookshelf.js / Knex query builders
* All database interactions must use the PostgreSQL native driver (`pg`) via [`backend/db/connection.js`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/backend/db/connection.js).

### 2.2 Direct-SQL Query Standards
* **Connection Access**: Import the centralized pool:
  ```javascript
  const pool = require('../db/connection'); // or db
  ```
* **Parameterized Queries Only**: Always pass user inputs as positional parameters (`$1`, `$2`, `$3`). NEVER concatenate or interpolate variables into SQL strings.
  ```javascript
  // CORRECT:
  const { rows } = await pool.query(
    'SELECT booking_id, customer_name, quoted_price FROM booking WHERE user_id = $1 AND booking_status = $2',
    [userId, 'CONFIRMED']
  );

  // FORBIDDEN:
  // pool.query(`SELECT * FROM booking WHERE user_id = ${userId}`);
  ```
* **Explicit Column Projections**: Avoid `SELECT *`. Explicitly select required columns to ensure performance, type predictability, and schema resilience.
* **Database Aggregation & Window Functions**: Leverage PostgreSQL's native capabilities (`COUNT(*) OVER()`, `jsonb_agg`, `ROUND(AVG(...), 1)`, `ST_MakePoint`) rather than fetching entire tables into Node.js memory.

### 2.3 Transaction Handling & Connection Continuity
* Operations requiring atomicity (e.g. booking creation, review submission with image attachments, status transitions) **must checkout a client from the pool**:
  ```javascript
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Perform statements using client.query(...)
    const { rows: inserted } = await client.query(
      'INSERT INTO review (user_id, booking_id, rating, feedback) VALUES ($1, $2, $3, $4) RETURNING review_id',
      [userId, bookingId, rating, feedback]
    );

    await client.query('COMMIT');
    return inserted[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release(); // MANDATORY: always release in finally block
  }
  ```

### 2.4 Schema Synchronicity & Migrations
* The authoritative schema files are [`backend/db/schema.sql`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/backend/db/schema.sql) and [`backend/db/init.sql`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/backend/db/init.sql).
* Migrations live in [`backend/db/migrations/`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/backend/db/migrations/) (e.g. `002_review_filter_function.sql`, `003_pagination_functions.sql`).
* When modifying database logic:
  1. Write a numbered migration in `backend/db/migrations/`.
  2. Synchronize both `backend/db/schema.sql` and `backend/db/init.sql`.
  3. Never drop tables that contain active production/seed data without explicit migration scripts.
  4. Preserve PostgreSQL ENUMs (`user_role`, `tour_type_enum`, `booking_status_type`, etc.) and spatial indexes (`idx_place_geom`).

---

## 3. Anti-Slop UI Design & Frontend Engineering Rules

### 3.1 Design Philosophy: Anti-Slop Standards
Interfaces must look intentionally engineered for the **Ceylon Best Tours** luxury travel brand, not generated by generic AI templates.
* **Prohibited "Slop" Tropes**:
  * No generic saturated purple/violet gradients on cards or backgrounds.
  * No floating decorative blurry blobs (`blur-3xl bg-purple-500/20`).
  * No emojis used as button icons or primary action controls (use `lucide-react` icons like `<CheckCircle />`, `<Calendar />`, `<MapPin />`, `<Search />`).
  * No nested cards with triple shadows and redundant rounded borders.
  * No pure black (`#000000`) or default browser blues/reds.

### 3.2 Visual Identity & Single Source of Truth
All UI colors, surfaces, and typography must adhere to the design tokens defined in [`frontend/src/components/pages/Admin/AdminDashboard/adminTheme.jsx`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/frontend/src/components/pages/Admin/AdminDashboard/adminTheme.jsx):
* **Brand Palette**:
  * `BRAND.coral` (`#EF8354`): Primary brand color, CTA buttons, active tabs, star ratings, highlighted accents.
  * `BRAND.gunmetal` (`#2D3142`): Primary text, headings, dark-mode surfaces.
  * `BRAND.payneGray` (`#4F5D75`): Secondary text, subtitles, table headers, meta chips.
  * `BRAND.silver` (`#BFC0C0`): Neutral borders, dividers, subtle outlines.
  * `BRAND.white` (`#FFFFFF`): Light-mode cards, modal surfaces.
* **Semantic Status Roles (`STATE`)**:
  * Success: `#2F9E44` (Confirmed, Accepted, Paid, Replied)
  * Warning: `#E3A857` (Pending, Quoted, Needs Attention)
  * Danger: `#E0483B` (Cancelled, Rejected, Error)
  * Info: `#6366F1` (Tour Started, Informational notices)
* **Typography (`FONT`)**:
  * Heading: `'Montserrat', 'Segoe UI', sans-serif` (Bold, adventurous, weights 600–900).
  * Body: `'Open Sans', 'Segoe UI', sans-serif` (Clean, legible, weights 400–600).

### 3.3 Reusable Component Usage
* **Check Before Building**: Always inspect [`frontend/src/components/common/`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/frontend/src/components/common/) before creating UI widgets.
* **Pagination**: Use the shared [`Pagination.jsx`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/frontend/src/components/common/Pagination.jsx) component for all paginated tables, card grids, and sidebars.
  * Pass `scrollToRef={false}` for embedded administrative panels or sidebars to prevent disruptive window jumps.
* **State Completeness**: Every listing or data-driven component must explicitly implement:
  1. **Loading State**: Subtle branded spinner or pulse skeletons (e.g. Coral accent).
  2. **Empty State**: Purposeful contextual icon, explanation, and clear CTA.
  3. **Error State**: Non-blocking toast or clean inline alert banner.
  4. **Active/Hover/Focus State**: Crisp border color transitions (`transition-colors duration-150`).

---

## 4. Express Backend Architecture

### 4.1 Structure & Separation of Concerns
* **Routes** ([`backend/routes/`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/backend/routes/)): Mount endpoints and apply authentication/authorization middleware. Never write SQL queries directly inside route files.
* **Controllers** ([`backend/controllers/`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/backend/controllers/)): Request validation, business logic orchestration, database queries via `pool.query`, and clean HTTP status responses.
* **Middleware** ([`backend/middleware/`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/backend/middleware/)):
  * Authentication: [`authMiddleware.js`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/backend/middleware/authMiddleware.js) (`verifyToken`).
  * Role Authorization: [`adminMiddleware.js`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/backend/middleware/adminMiddleware.js) (`adminOnly` checking `['ADMIN', 'SUPER_ADMIN', 'STAFF']`).
  * Media Storage: Cloudinary upload middlewares for vehicle, package, payment, and review images.
* **Global Error Handling**: Centralized in [`backend/server.js`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/backend/server.js). Catches PostgreSQL error codes (`23505` unique violation, `23503` foreign key violation) and returns safe, sanitized error responses.

### 4.2 Security Rules
* Never expose database credentials or internal database exceptions to the frontend.
* Passwords must always be hashed using `bcryptjs` / `bcrypt` with salt rounds >= 10.
* Customer endpoints must scope database queries to `req.user.user_id` or verified customer email. Do not rely on client-supplied user IDs without server-side validation.

---

## 5. Mandatory Validation & Testing Commands

Before declaring any coding task complete, execute the project's actual validation tools:

### Backend Testing
```powershell
# Run full backend test suite (schema regression, pagination, controller integrity):
npm test --prefix backend

# Run individual test suites:
npm run test:schema --prefix backend
npm run test:pagination --prefix backend
```

### Frontend Validation & Build
```powershell
# Test production bundling, JSX parsing, and module resolution:
npm run build --prefix frontend

# Run ESLint checks:
npm run lint --prefix frontend
```

---

## 6. Definition of Done (Checklist)

A task is only complete when:
- [ ] No ORM or query builder was introduced; all database queries use `pg` with `$1...$n` parameters.
- [ ] Transactions checkout a client and call `BEGIN`, `COMMIT`, `ROLLBACK` with `client.release()` in a `finally` block.
- [ ] Existing reusable components (e.g. [`Pagination.jsx`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/frontend/src/components/common/Pagination.jsx)) were reused rather than duplicated.
- [ ] UI styling adheres to `BRAND` and `STATE` tokens in `adminTheme.jsx` and rejects generic AI-slop tropes.
- [ ] `npm test --prefix backend` passes with 0 failures.
- [ ] `npm run build --prefix frontend` succeeds with 0 compilation errors.
- [ ] Schema changes (if any) are recorded in `backend/db/migrations/`, `schema.sql`, and `init.sql`.
