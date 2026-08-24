# BizFlow — SaaS CRM & Operations Platform

BizFlow is a production-grade SaaS CRM and business operations management application built with Next.js 15, React 19, TypeScript, Tailwind CSS v4, and Supabase.

---

## Tech Stack
- **Framework**: Next.js 15 (App Router, Server Actions, Route Handlers)
- **UI Library**: React 19, Vanilla Tailwind CSS v4
- **Language**: Strict TypeScript (no `any`)
- **Backend & Database**: Supabase PostgreSQL, Supabase Auth with SSR cookies (`@supabase/ssr`)
- **Multi-Tenancy**: Organization / Workspace isolated data model with PostgreSQL Row Level Security (RLS)

---

## Getting Started

### 1. Environment Variables
Copy `.env.example` to `.env.local` and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Configure:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Setup & Migrations
Execute the SQL migration in your Supabase project's SQL Editor:
- [database/migrations/001_initial_schema.sql](database/migrations/001_initial_schema.sql)
- [database/migrations/003_tasks_enhancements.sql](database/migrations/003_tasks_enhancements.sql)
- [database/migrations/004_notifications_enhancements.sql](database/migrations/004_notifications_enhancements.sql)

Notification due-date helpers are intentionally mutation/scheduler-ready only; no page load creates due-today or overdue notifications. A future cron or scheduled server job can call `createTaskDueNotification` for assigned tasks.
- [database/migrations/002_profile_preferences.sql](database/migrations/002_profile_preferences.sql)

This sets up:
- Complete database tables: `profiles`, `organizations`, `organization_members`, `customers`, `leads`, `tasks`, `activities`, `notes`, `notifications`, `subscriptions`, `integration_configs`.
- Triggers for automatic updated timestamps and automatic user profile + workspace creation on signup (`handle_new_user`).
- Row Level Security (RLS) policies guaranteeing strict multi-tenant workspace isolation.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Authentication & Route Architecture

- **Auth Pages**:
  - `/login`: Email & password sign-in with redirect parameter support.
  - `/signup`: Workspace registration with automated onboarding.
  - `/forgot-password`: Password reset email dispatch.
  - `/reset-password`: Set new password after email recovery link.
  - `/auth/callback`: OAuth / magic-link / email-confirmation token exchange.
- **Protected App Routes**:
  - `/`: Dashboard analytics overview.
  - `/customers`: Customer accounts and relationships.
  - `/leads`: CRM pipeline opportunities.
  - `/tasks`: Team task and follow-up management.
  - `/settings`: Workspace preferences and user profile.

---

## Project Structure

```
bizFlow/
├── app/
│   ├── (app)/            # Authenticated application shell & pages
│   ├── (auth)/           # Authentication layout and flows (login, signup, reset)
│   ├── auth/             # Callback and auth route handlers
│   ├── globals.css       # Global styles and Tailwind v4 theme
│   └── layout.tsx        # Root HTML layout
├── components/
│   ├── layout/           # Sidebar, Header, DashboardShell, UserNav
│   ├── dashboard/        # Dashboard widgets and charts
│   ├── customers/        # Customer tables and views
│   ├── leads/            # Pipeline views
│   ├── tasks/            # Task lists
│   ├── settings/         # Workspace and user settings
│   └── ui/               # Reusable UI primitives (Button, Card, DataTable, Badge, etc.)
├── database/
│   └── migrations/       # SQL schema migrations with RLS policies
├── lib/
│   ├── auth/             # Server actions and RBAC permissions
│   ├── supabase/         # SSR client, server, and middleware helpers
│   ├── navigation.ts     # Route mapping and metadata
│   └── mock-data.ts      # Initial mock datasets for preview
└── types/
    └── database.types.ts # Strict Supabase database schema TypeScript types
```
