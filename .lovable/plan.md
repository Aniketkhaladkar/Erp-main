
# Solvix Financial Dashboard — Full Build Plan

## Phase 1: Foundation
- **Enable Lovable Cloud** for database + auth
- **Create database schema**: All tables (users, business_units, leads, clients, team_members, projects, tasks, attendance, expense_tools, assets, buy_list, invoices, invoice_items, invoice_reminders, documents) with proper foreign keys and RLS policies
- **Set up role-based auth**: User roles table (admin/manager), login page with email/password, forgot password flow, redirect logic based on role
- **Build app shell**: Dark sidebar navigation with Solvix logo, user info + role badge, collapsible sidebar, dynamic header with page title, responsive layout

## Phase 2: Dashboards
- **Admin Dashboard**: Financial overview cards (Total Revenue, Total Expenses, Total Assets) with ₹ formatting and month-over-month change indicators. Revenue split cards (Tek vs Strategies) with mini sparkline charts. Two clickable business unit panel cards
- **Manager Dashboard**: Only the two business unit panel cards (no financial data)

## Phase 3: Shared Modules (both business units, separate data)
- **Leads Module**: Table view with add/edit/delete modals, category & status filters, search, inline status toggle, bulk actions, CSV export, pagination
- **Clients Module**: Table view + client profile pages with Overview/Invoices/Notes tabs, filters by category & billing label
- **Team Members Module**: Card view (with list toggle), profile pages with Assigned Tasks / Attendance / Completed Tasks tabs, employment label filter
- **Invoices Module**: Invoice creation form with line items and auto-calculations, table of all invoices with status filters, invoice detail page with printable layout, PDF download (client-side via @react-pdf/renderer), "Send Reminder" UI (form only, no real email), separate invoice number prefixes (STK-INV- for Tek, SS-INV- for Strategies)

## Phase 4: Solvix Tek–Specific Modules
- **Projects (Tek)**: Kanban board with Upcoming / In Progress / Completed columns, drag-and-drop status changes, project detail pages with assigned team members and task lists
- **Expense Tools**: Table with subscription tracking, dashboard summary cards (Monthly Burn, Active Count, Upcoming Renewals), color-coded rows for Active/Expiring Soon/Expired, renewal alerts

## Phase 5: Solvix Strategies–Specific Modules
- **Projects (Strategies)**: Table view grouped by billing type (One-Time / Monthly) instead of Kanban
- **Assets Module**: Two tabs — Equipment List (owned items with condition tracking and assignment) and Buy List (wishlist with priority labels, color-coded). "Mark as Purchased" moves items from Buy List → Equipment. Total value summaries at top of each tab

## Phase 6: Polish
- Empty states with friendly CTAs for all modules
- Skeleton loaders for tables and cards
- Toast notifications for all CRUD actions
- Notification bell placeholder in header (for overdue invoices, expiring subscriptions)
- Mobile-responsive layout with collapsible sidebar

## Design System
- Dark sidebar (slate/charcoal), white content area
- Primary accent: deep blue (#1E40AF), green for success/paid, red for overdue, amber for warnings
- Inter font, rounded cards with subtle shadows
- Zebra-striped tables with hover highlights and sticky headers
- All amounts in ₹ with Indian number formatting (e.g., ₹12,45,000)

## Key Architecture Decisions
- All data scoped by `business_unit_id` — no cross-contamination
- RLS policies enforce role-based access (admin sees all, manager sees operational data only)
- Invoice PDF generated client-side with @react-pdf/renderer
- File upload UI built but storage integration deferred
- Email reminder forms built but actual sending deferred
