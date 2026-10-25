# Ceylon Best Tours — Engineering Standards & PostgreSQL Direct-SQL Policy

## Core Directives for Antigravity Agents

1. **Strict Zero-ORM Policy**:
   - The project uses `pg` (`pg.Pool`) in [`backend/db/connection.js`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/backend/db/connection.js).
   - Never import or suggest Prisma, Sequelize, TypeORM, Drizzle, or any ORM.
   - All queries must be raw, parameterized PostgreSQL statements (`$1`, `$2`, etc.).

2. **Transaction Integrity**:
   - For multi-step queries: checkout client via `await db.connect()`.
   - Wrap statements in `BEGIN`, `COMMIT`, and `ROLLBACK` on error.
   - Always call `client.release()` in a `finally` block.

3. **Anti-Slop UI Guidelines**:
   - Reference `BRAND` and `FONT` tokens from [`adminTheme.jsx`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/frontend/src/components/pages/Admin/AdminDashboard/adminTheme.jsx).
   - Use Coral `#EF8354` for primary CTAs and active states, Gunmetal `#2D3142` for text and dark surfaces, Payne's Gray `#4F5D75` for subtitles.
   - Never use generic purple gradients, blurry ambient blobs, or raw emojis for action buttons. Use `lucide-react` icons.

4. **Component Reuse**:
   - Reuse common widgets from [`frontend/src/components/common/`](file:///c:/Users/Lenovo/Desktop/Projects/personal/data_engineering/TechNova/frontend/src/components/common/) (such as `Pagination.jsx`).
   - Slicing and pagination controls must synchronize with active filters and reset to page 1 on filter/search modifications.

5. **Mandatory Verification**:
   - Backend: `npm test --prefix backend` must pass with 0 failures.
   - Frontend: `npm run build --prefix frontend` must compile cleanly without rollup errors.
