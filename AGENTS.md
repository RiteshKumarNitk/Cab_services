<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:architecture-rules -->
# Business Process Architecture

## First Read
Read `docs/PRODUCT_SPECIFICATION.md` before writing any code. This is the single source of truth for:
- Product Information Architecture (6 departments)
- Workspace designs (Booking, Customer, Vehicle, Driver)
- Design System (colors, typography, spacing, states)
- State diagrams (booking lifecycle, dispatch flow, payment flow)
- API contracts and database relationships

## Core Design Principles
1. **Organize by business departments, not database tables** — Sales & CRM, Operations, Fleet, Drivers, Finance, Marketing
2. **Workspaces, not pages** — Every entity is a workspace with context: Booking workspace, Customer CRM, Vehicle workspace, Driver workspace
3. **Dashboard answers "What needs my attention?"** — Urgent alerts > Today's ops > Customer activity. No vanity metrics.
4. **Reports embedded everywhere** — Export/filters/charts in every module
5. **Colors are semantic** — Blue=action, Green=success, Orange=waiting, Red=problem, Purple=in-progress, Gray=neutral

## Core Pipeline (enforced)
```
Lead → Qualified → Follow-up → Quotation → Negotiation → Customer Approval → Booking → Operations Queue → Vehicle Check → Driver Check → Dispatch → Trip
```

## Key Rules
- **Booking requires approved quotation**: Lead conversion API (`/api/admin/leads/[id]/convert`) returns 400 if no approved quotation exists
- **Trip is NOT auto-created on booking confirm**: Trip only created via Dispatch Queue finalization (`/api/admin/dispatch/[id]/finalize`)
- **Booking Status** tracks full lifecycle: `NEW_LEAD → QUALIFIED → CONTACTED → QUOTE_PREPARING → QUOTE_SENT → QUOTE_ACCEPTED → BOOKING_CONFIRMED → WAITING_ASSIGNMENT → VEHICLE_ASSIGNED → DRIVER_ASSIGNED → READY_FOR_DISPATCH → TRIP_STARTED → PICKUP_COMPLETED → DROP_COMPLETED → TRIP_COMPLETED → INVOICE_GENERATED → CLOSED → CANCELLED`
- **Customer Timeline** is a simplified abstract of internal status (map in `src/lib/customer-timeline.ts`)
- **Vehicle Assignment** routes through `src/lib/vehicle-availability.ts` (checks bookings, maintenance, insurance, fitness, permit, RC before assigning)
- **Driver Assignment** routes through `src/lib/driver-availability.ts` (checks leave, active trips, working hours, max hours, online status)
- **Notifications** should be event-driven, not inline (emit `eventBus.emit(createEvent(...))` from `src/lib/event-bus.ts` after the transaction commits; subscribers in `src/lib/notifications.ts`, `audit-logger.ts`, `webhook-dispatcher.ts`)
- **Booking status rules** (transitions, who may perform them, trip-status sync) live in `src/lib/booking-lifecycle.ts`; API role groups in `src/lib/authz-roles.ts`

## Module Layout (by department)
```
Dashboard (Ops-first: urgent alerts, today's ops, customer activity)
│
├── Operations (Calendar, Dispatch Board, Bookings, Trips)
├── Sales & CRM (Leads, Customers, Quotations, Follow-ups)
├── Fleet (Vehicles, Maintenance)
├── Drivers (Driver workspaces)
├── Finance (Payments, Invoices, Settlements)
├── Marketing (CMS, Blog, Reviews)
├── Reports (embedded in every module)
└── Settings (Organization, Roles, Webhooks, Audit)
```
<!-- END:architecture-rules -->
