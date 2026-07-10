# Aradhana Travel — Product Specification

> India's premium Travel Operations Platform.
> The ERP is 85% of the product. The website is 15%.

---

## Table of Contents

1. [Product Information Architecture](#1-product-information-architecture)
2. [User Personas & Permissions](#2-user-personas--permissions)
3. [Customer Journey](#3-customer-journey)
4. [Admin Workflows](#4-admin-workflows)
5. [Workspace Designs](#5-workspace-designs)
6. [Design System](#6-design-system)
7. [Navigation Hierarchy](#7-navigation-hierarchy)
8. [State Diagrams](#8-state-diagrams)
9. [Database Relationships](#9-database-relationships)
10. [API Contracts](#10-api-contracts)

---

## 1. Product Information Architecture

### Six Departments

```
ARADHANA TRAVEL ERP
│
├── 1. SALES & CRM
│   ├── Dashboard (Sales KPIs)
│   ├── Leads
│   ├── Customers (CRM workspace)
│   ├── Quotations
│   ├── Follow-ups
│   └── Communication Log
│
├── 2. OPERATIONS
│   ├── Dashboard (Ops board)
│   ├── Dispatch Board (Kanban)
│   ├── Calendar
│   ├── Today's Trips
│   ├── All Bookings
│   └── Alerts & Delays
│
├── 3. FLEET
│   ├── Dashboard (Fleet KPIs)
│   ├── Vehicles (workspace)
│   ├── Maintenance
│   ├── Fuel
│   ├── Documents
│   └── Expenses
│
├── 4. DRIVERS
│   ├── Dashboard (Driver KPIs)
│   ├── Drivers (workspace)
│   ├── Attendance
│   ├── Leave
│   ├── Incidents
│   └── Performance
│
├── 5. FINANCE
│   ├── Dashboard (Finance KPIs)
│   ├── Payments
│   ├── Invoices
│   ├── Refunds
│   ├── Expenses
│   └── Settlements
│
├── 6. MARKETING & WEBSITE
│   ├── Dashboard (Website KPIs)
│   ├── CMS
│   ├── Blog
│   ├── Tour Packages
│   ├── SEO
│   └── Reviews
│
├── REPORTS (embedded in every module)
│
└── SETTINGS
    ├── Organization
    ├── Roles & Permissions
    ├── Notifications
    ├── Webhooks
    ├── Audit Log
    └── Integrations
```

### Module-to-Screen Mapping

| Dept | Module | Screens |
|------|--------|---------|
| Sales | Leads | List → Workspace (Profile + Activity + Quotations + Follow-ups) |
| Sales | Customers | List → Workspace (Profile + Trips + Payments + Comm + Notes) |
| Sales | Quotations | List → Detail (Calculator + Approval + Convert) |
| Ops | Dispatch | Board (5 Kanban lanes) |
| Ops | Calendar | Month grid (4 view toggles) |
| Ops | Bookings | List → Workspace (Timeline + Trip + Vehicle + Driver + Payments + Docs + Activity + Notes + Comm) |
| Ops | Today's Trips | Live feed sorted by pickup time |
| Fleet | Vehicles | List → Workspace (Overview + Documents + Maintenance + Fuel + Expenses + Bookings + Timeline) |
| Drivers | Drivers | List → Workspace (Overview + License + Attendance + Leave + Trips + Ratings + Incidents) |
| Finance | Payments | List → Record form → Receipt |
| Finance | Invoices | List → Generate → Send → Track payment |
| Finance | Settlements | List → Calculate → Pay |

---

## 2. User Personas & Permissions

### Persona 1: Operations Manager (primary user)
- **Role**: Runs daily operations
- **Spends time in**: Dispatch Board, Calendar, Today's Trips
- **Needs**: See what needs attention, assign vehicles/drivers, monitor delays
- **Permissions**: Full ops access, read-only on finance/settings

### Persona 2: Sales Executive
- **Role**: Convert leads to bookings
- **Spends time in**: Leads, Customers, Quotations, Follow-ups
- **Needs**: Quick customer lookup, call logging, quotation creation, follow-up reminders
- **Permissions**: Full CRM access, create quotations, read-only on ops

### Persona 3: Fleet Manager
- **Role**: Maintain vehicles
- **Spends time in**: Vehicle workspaces, Maintenance, Fuel
- **Needs**: Document expiry alerts, maintenance scheduling, expense tracking
- **Permissions**: Full fleet access, create expenses

### Persona 4: Driver Manager
- **Role**: Manage drivers
- **Spends time in**: Driver workspaces, Attendance, Leave
- **Needs**: Assign drivers, track attendance, review incidents
- **Permissions**: Full driver access

### Persona 5: Finance Executive
- **Role**: Handle money
- **Spends time in**: Payments, Invoices, Settlements
- **Needs**: Record payments, generate invoices, settle drivers
- **Permissions**: Full finance access, read-only on ops

### Persona 6: Admin/Super Admin
- **Role**: Configure system
- **Spends time in**: Settings
- **Needs**: Manage users, roles, integrations, audit logs
- **Permissions**: Everything

### Persona 7: Customer
- **Role**: Use the service
- **Spends time in**: Customer Portal (website)
- **Needs**: Book, track, pay, review
- **Permissions**: Own data only

### Persona 8: Driver
- **Role**: Execute trips
- **Spends time in**: Driver App (mobile)
- **Needs**: See trips, start/end trip, OTP, log expenses, report incidents
- **Permissions**: Own data only

### Permission Matrix

| Resource | Super Admin | Admin | Ops Mgr | Sales Exec | Fleet Mgr | Driver Mgr | Finance | Driver | Customer |
|----------|:-----------:|:-----:|:-------:|:----------:|:---------:|:----------:|:-------:|:------:|:--------:|
| Organization | CRUD | CRUD | R | R | R | R | R | - | - |
| Users | CRUD | CRUD | R | R | R | R | R | - | - |
| Leads | CRUD | CRUD | R | CRUD | - | - | - | - | - |
| Customers | CRUD | CRUD | R | CRUD | R | R | R | - | - |
| Quotations | CRUD | CRUD | R | CRUD | - | - | R | - | R |
| Bookings | CRUD | CRUD | CRUD | R | R | R | R | R | R |
| Trips | CRUD | CRUD | CRUD | R | R | R | R | R | R |
| Vehicles | CRUD | CRUD | R | - | CRUD | - | R | - | - |
| Maintenance | CRUD | CRUD | R | - | CRUD | - | R | - | - |
| Drivers | CRUD | CRUD | R | - | R | CRUD | R | - | - |
| Payments | CRUD | CRUD | R | - | - | - | CRUD | - | R |
| Invoices | CRUD | CRUD | R | - | - | - | CRUD | - | R |
| Expenses | CRUD | CRUD | R | - | CRUD | - | CRUD | CRUD | - |
| Settlements | CRUD | CRUD | R | - | - | - | CRUD | R | - |
| CMS | CRUD | CRUD | - | - | - | - | - | - | - |
| Settings | CRUD | CRUD | R | - | - | - | - | - | - |

---

## 3. Customer Journey

```
DISCOVERY
    │
    ├── Google Search → Website
    ├── Friend Referral → Website
    ├── Social Media → Website
    └── Direct Call → Sales Executive logs Lead
            │
RESEARCH
    │
    ├── Browse Fleet (sedan/SUV/tempo traveller)
    ├── View Pricing
    ├── Read Testimonials
    ├── Check FAQ
    └── Compare Services
            │
BOOKING
    │
    ├── Fill Trip Form (pickup, drop, date, passengers)
    ├── Receive Auto-Quote (estimated fare)
    ├── Sales Executive Contacts (call/WhatsApp)
    ├── Receive Detailed Quotation (breakdown)
    ├── Negotiate (if needed)
    ├── Approve Quotation
    └── Booking Confirmed (SMS/Email/WhatsApp)
            │
PRE-TRIP
    │
    ├── Vehicle Assigned (notification)
    ├── Driver Assigned (notification with driver details)
    ├── Trip Ready (notification)
    └── Day-before reminder
            │
TRIP
    │
    ├── Driver Arrives (live tracking)
    ├── Trip Starts (OTP verification)
    ├── In Progress (tracking)
    ├── Drop Off
    └── Trip Completed
            │
POST-TRIP
    │
    ├── Rate Driver (1-5 stars + review)
    ├── Invoice Generated (email/WhatsApp)
    ├── Make Payment (online/cash)
    ├── Receipt Sent
    └── Rebook (one-click)
```

### Customer Portal Screens

| Screen | Purpose | Content |
|--------|---------|---------|
| Dashboard | Overview | Active trip, upcoming bookings, quick rebook |
| My Bookings | List | All past/current bookings with status |
| Booking Detail | Workspace | Timeline + Driver + Vehicle + Payment + Invoice |
| My Quotations | List | Quotes with status (pending/approved/expired) |
| Invoices | List | All invoices with payment status |
| Payments | History | Payment transactions |
| Profile | Manage | Name, phone, email, preferred vehicles, saved addresses |
| Support | Contact | Call, WhatsApp, email options |

---

## 4. Admin Workflows

### Workflow A: Lead to Booking (Sales)

```
1. Lead arrives (website/call/walk-in)
2. Sales Executive opens Lead workspace
3. Records contact details + trip requirements
4. Creates Quotation (pricing calculator)
5. Sends quotation via WhatsApp/Email
6. Follows up (call log, reminder set)
7. Customer approves quotation
8. Quotation marked APPROVED
9. Lead converted → Booking created
10. Booking enters Operations Queue
```

### Workflow B: Booking to Trip (Operations)

```
1. Booking appears in Dispatch Board (Awaiting lane)
2. Ops Manager checks Vehicle Availability
3. Assigns vehicle to booking
4. Booking moves to "Vehicle Assigned"
5. Ops Manager checks Driver Availability
6. Assigns driver
7. Booking moves to "Driver Assigned"
8. Ops Manager reviews + clicks Dispatch
9. Trip is CREATED (not before)
10. Trip appears in Calendar + Today's Trips
```

### Workflow C: Trip Execution (Driver)

```
1. Driver opens Driver App
2. Sees Today's Trips
3. Navigates to pickup location
4. Arrives → clicks "Start Trip"
5. Customer confirms OTP
6. Trip status: TRIP_STARTED
7. Reaches pickup → clicks "Pickup Completed"
8. En route to destination
9. Reaches drop → clicks "Drop Completed"
10. Trip status: TRIP_COMPLETED
11. Logs expenses (fuel, toll, parking)
12. Reports incidents (if any)
```

### Workflow D: Payment to Settlement (Finance)

```
1. Customer makes advance payment (booking)
2. Finance records payment
3. Invoice generated automatically on trip completion
4. Customer pays remaining amount
5. Finance records final payment
6. Receipt sent to customer
7. Driver settlement calculated
8. Driver paid → settlement marked PAID
```

---

## 5. Workspace Designs

### 5.1 Booking Workspace

```
┌─────────────────────────────────────────────────────────────┐
│  ← Bookings  /  #BK-00A1B2  │  Status: ● BOOKING CONFIRMED │
├─────────────────────────────────────────────────────────────┤
│  [Timeline] [Trip] [Vehicle] [Driver] [Payments] [Notes] [+] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TIMELINE VIEW                                              │
│                                                             │
│  ● Request Submitted     Jul 8, 9:30 AM                    │
│  ● Being Reviewed        Jul 8, 10:15 AM                   │
│  ● Quotation Sent        Jul 8, 11:00 AM                   │
│  ● Waiting for Approval  ──────────────────────────────     │
│  ○ Booking Confirmed                                       │
│  ○ Vehicle Assigned                                        │
│  ○ Driver Assigned                                         │
│  ○ Trip Ready                                              │
│  ○ Trip Started                                            │
│  ○ In Progress                                             │
│  ○ Trip Completed                                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  TRIP DETAILS (when timeline tab is Trip)                   │
│                                                             │
│  PICKUP                                   DROP              │
│  Hotel Marriot, Jaipur                     Amer Fort         │
│  Jul 15, 2025 · 9:00 AM                   Jul 15, 2025      │
│                                                             │
│  PASSENGERS: 2      VEHICLE: Toyota Innova                 │
│  BAGS: 2            TYPE: Outstation                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  VEHICLE (when vehicle tab)                                 │
│                                                             │
│  Toyota Innova · RJ14-AB-1234                              │
│  Insurance: ✅ till Dec 2025                               │
│  Fitness: ✅ till Mar 2026                                 │
│  Status: ● Available                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  PAYMENTS (when payments tab)                               │
│                                                             │
│  Total Fare:  ₹5,200                                        │
│  Advance:     ₹2,000  (Jul 10 · Cash) · ✅ Received        │
│  Balance:     ₹3,200                                        │
│                                                             │
│  [Record Payment]  [Generate Invoice]                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  NOTES (when notes tab)                                     │
│                                                             │
│  Customer prefers AC on full. Has infant.                   │
│  Asked for booster seat.                                    │
│                                                             │
│  [Add Note...]                                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ACTIVITY FEED (when + tab > Activity)                      │
│                                                             │
│  Jul 10, 2:30 PM  |  Call with customer  |  Duration: 4m   │
│  Jul 9, 11:00 AM  |  Quotation sent via WhatsApp           │
│  Jul 8, 10:15 AM  |  Lead qualified by Ritesh              │
│  Jul 8, 9:30 AM   |  Lead created from website             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Customer CRM Workspace

```
┌─────────────────────────────────────────────────────────────┐
│  ← Customers  /  Rajesh Sharma  │  🟢 Regular               │
├─────────────────────────────────────────────────────────────┤
│  [Profile] [Trips] [Payments] [Invoices] [Comm] [Notes]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PROFILE                                                    │
│                                                             │
│  Name:    Rajesh Sharma                                     │
│  Phone:   +91 98765 43210                                   │
│  Email:   rajesh@email.com                                  │
│  Since:   Jan 2025                                          │
│  Total:   8 trips · ₹42,500                                 │
│                                                             │
│  ADDRESS BOOK                                               │
│  Home:   Bani Park, Jaipur                                  │
│  Office: Sitapura, Jaipur                                   │
│                                                             │
│  PREFERENCES                                                │
│  Preferred Vehicle:  SUV (Innova)                           │
│  Payment Method:     Cash                                   │
│  Notes:              Prefers morning trips                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  RECENT TRIPS (when Trips tab)                              │
│                                                             │
│  Jul 10  │ Jaipur → Delhi       │ ₹8,000  │ Completed       │
│  Jun 28  │ Jaipur → Ajmer       │ ₹3,500  │ Completed       │
│  Jun 15  │ Jaipur Airport       │ ₹600    │ Completed       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  COMMUNICATION (when Comm tab)                              │
│                                                             │
│  Jul 10, 2:30 PM  │ Outbound Call  │ 4 min  │ Interested   │
│  Jul 9, 11:00 AM  │ WhatsApp       │ Quote sent           │
│  Jul 8, 9:30 AM   │ Inbound Call   │ 8 min  │ New inquiry  │
│                                                             │
│  [Log Call]  [Send WhatsApp]  [Send Email]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Dispatch Board

```
┌─────────────────────────────────────────────────────────────┐
│  DISPATCH BOARD  │  🟡 4 pending  │  🟢 12 dispatched today│
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│ AWAITING │ASSIGNING │  READY   │ DELAYED  │    RUNNING       │
│ (2)      │ (0)      │ (5)      │ (2) 🔴   │    (12)          │
├──────────┼──────────┼──────────┼──────────┼──────────────────┤
│BK-00A1   │          │BK-00B2   │BK-0099   │Trip-0045         │
│Rajesh    │          │Priya S   │Vikram    │Driver: Suresh    │
│Jaipur→Del│          │Jaipur→Aj│Since 3h  │Veh: Innova       │
│[Assign]  │          │[Dispatch]│🔴        │Started: 9:30 AM │
│          │          │          │          │                  │
│BK-00A3   │          │BK-00B5   │BK-0102   │Trip-0046         │
│Anita     │          │Vikas     │Meena     │Driver: Raj       │
│Jaipur→Ag│          │Jaipur→Bi│Since 2.5h│Veh: Ertiga       │
│[Assign]  │          │[Dispatch]│🔴        │Started: 10 AM   │
│          │          │          │          │                  │
└──────────┴──────────┴──────────┴──────────┴──────────────────┘
```

### 5.4 Vehicle Workspace

```
┌─────────────────────────────────────────────────────────────┐
│  ← Vehicles  /  Toyota Innova  │  RJ14-AB-1234  │  🟢 Active│
├─────────────────────────────────────────────────────────────┤
│  [Overview] [Documents] [Maintenance] [Fuel] [Expenses] [+] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  OVERVIEW                                                   │
│                                                             │
│  Model:   Toyota Innova Crysta                              │
│  Year:    2023                                              │
│  Type:    SUV                                               │
│  Seats:   7                                                   │
│  Driver:  Suresh Kumar                                      │
│  Status:  ● Available                                        │
│                                                             │
│  DOCUMENTS STATUS                                            │
│  ✅ Insurance  Expires: Dec 2026                             │
│  ✅ Fitness    Expires: Mar 2027                             │
│  ✅ Permit     Expires: Jun 2026                             │
│  ✅ RC         Expires: Jan 2028                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  MAINTENANCE (when Maintenance tab)                          │
│                                                             │
│  Date       │ Type      │ Cost   │ Status    │ Notes        │
│  Jul 5      │ Service   │ ₹3,500 │ ✅ Done                  │
│  Jun 20     │ Tyre      │ ₹8,000 │ ✅ Done   │ 4 new tyres │
│  Aug 1      │ Insurance │ —      │ 🔄 Due                   │
│                                                             │
│  [Schedule Maintenance]                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  UPCOMING BOOKINGS                                           │
│                                                             │
│  Jul 15  │ Rajesh Sharma  │ Jaipur → Delhi │ 9:00 AM        │
│  Jul 16  │ Priya Singh    │ Jaipur → Ajmer │ 10:00 AM       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.5 Driver Workspace

```
┌─────────────────────────────────────────────────────────────┐
│  ← Drivers  /  Suresh Kumar  │  🟢 Online  │  4.8 ★        │
├─────────────────────────────────────────────────────────────┤
│  [Overview] [License] [Attendance] [Trips] [Incidents] [+]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  OVERVIEW                                                   │
│                                                             │
│  Phone:    +91 98765 43210                                   │
│  Vehicle:  Toyota Innova (RJ14-AB-1234)                     │
│  Status:   🟢 Online                                         │
│  Rating:   4.8 ★  (42 reviews)                               │
│  Total:    156 trips · 18,500 km                            │
│                                                             │
│  TODAY'S TRIPS                                               │
│  🟢 Trip #0045  Jaipur → Delhi  │ 9:00 AM  │ Completed      │
│  🟡 Trip #0048  Jaipur Airport  │ 4:00 PM  │ Upcoming      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ATTENDANCE (when Attendance tab)                            │
│                                                             │
│  Mon  │ Jul 7  │ ✅ Present │ 8 AM - 6 PM  │ 2 trips       │
│  Tue  │ Jul 8  │ ✅ Present │ 9 AM - 5 PM  │ 1 trip        │
│  Wed  │ Jul 9  │ ❌ Leave   │ —            │ Medical       │
│  Thu  │ Jul 10 │ 🟡 Half    │ 8 AM - 12 PM │ Personal      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  INCIDENTS (when Incidents tab)                              │
│                                                             │
│  Jul 3  │ Minor accident  │ Resolved  │ Insurance filed    │
│  Jun 20 │ Tyre puncture   │ Resolved  │ Changed at site    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.6 Dashboard (Operations)

```
┌─────────────────────────────────────────────────────────────┐
│  GOOD MORNING, RITESH  │  🗓️ Jul 10, 2026                  │
├─────────────────────────────────────────────────────────────┤
│  🔴 URGENT                                                  │
├─────────────────────────────────────────────────────────────┤
│  Trip #0045 starts in 30 min  —  Driver not assigned       │
│  Vehicle Innova insurance expires in 7 days                 │
│  ₹12,500 in payments overdue (3 invoices)                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🟡 TODAY'S OPERATIONS                                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────┬──────┬──────┬──────┬──────┬──────┐               │
│  │PKUPS │DROPS │RUNNG │FREE  │DRVRS │PEND  │               │
│  │  8   │  6   │  4   │  12  │  18  │  5   │               │
│  └──────┴──────┴──────┴──────┴──────┴──────┘               │
│                                                             │
│  UPCOMING TRIPS                                             │
│  09:00  │ Rajesh    │ Jaipur → Delhi    │ 🔴 No driver     │
│  10:00  │ Priya     │ Jaipur → Ajmer   │ 🟢 Ready          │
│  11:30  │ Vikas     │ Airport pickup    │ 🟡 Veh assigned  │
│  13:00  │ Anita     │ Jaipur → Agra    │ 🟢 Ready          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🔵 CUSTOMER ACTIVITY                                       │
├─────────────────────────────────────────────────────────────┤
│  3 new leads from website  │  1 new review  │  2 quotations │
│                                                             │
│  NEW LEADS                                                  │
│  Amit  ·  Jaipur → Udaipur  ·  Jul 12  ·  Just now         │
│  Neha  ·  Airport          ·  Jul 11  ·  5 min ago         │
│  Rohit ·  Jaipur → Delhi   ·  Jul 15  ·  12 min ago        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Design System

### 6.1 Color Palette

```
Brand:      #DC2626  (Red 600)    — Used sparingly for logo, primary actions
                                     
Semantic:
  Blue:     #2563EB  (Blue 600)    — Actions, links, information
  Green:    #059669  (Emerald 600) — Success, completed, available
  Orange:   #D97706  (Amber 600)   — Waiting, pending, warning
  Red:      #DC2626  (Red 600)     — Problems, errors, urgent, overdue
  Purple:   #7C3AED  (Violet 600)  — In-progress, special states
  Gray:     #6B7280  (Gray 500)    — Neutral, inactive, disabled

Backgrounds:
  Page:     #F9FAFB  (Gray 50)
  Card:     #FFFFFF  (White)
  Sidebar:  #111827  (Gray 900)
  Hover:    #F3F4F6  (Gray 100)
  
Borders:
  Default:  #E5E7EB  (Gray 200)
  Focus:    #2563EB  (Blue 600)
```

### 6.2 Typography

```
Font Family:  Inter (system-ui fallback)

Scale:
  Heading 1:  24px / 32px  / 700  (Page titles)
  Heading 2:  18px / 24px  / 600  (Section headers)
  Heading 3:  14px / 20px  / 600  (Card headers)
  Body:       14px / 20px  / 400  (Content)
  Small:      12px / 16px  / 400  (Labels, metadata)
  Caption:    11px / 14px  / 500  (Badges, timestamps)

Monospace:   JetBrains Mono — Only for IDs, codes, numbers
```

### 6.3 Spacing

```
Grid:      4px base
           Stack: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
           Inline: 4, 8, 12, 16, 20, 24

Card:      padding: 20px, border-radius: 12px
Button:    padding: 8px 16px, border-radius: 8px
Input:     padding: 8px 12px, border-radius: 8px
Badge:     padding: 2px 8px, border-radius: 9999px
```

### 6.4 Component States

```
Button:
  Default:    bg-gray-900 text-white
  Hover:      bg-gray-800
  Active:     bg-gray-700
  Disabled:   bg-gray-200 text-gray-400
  Loading:    Show spinner, disable interaction

Input:
  Default:    border-gray-200 bg-white
  Focus:      border-blue-500 ring-1 ring-blue-500
  Error:      border-red-500 ring-1 ring-red-500
  Disabled:   bg-gray-50 text-gray-400

Card:
  Default:    shadow-sm border-0
  Hover:      shadow-md
  Selected:   ring-2 ring-blue-500

Badge:
  Success:    bg-emerald-100 text-emerald-700
  Warning:    bg-amber-100 text-amber-700
  Error:      bg-red-100 text-red-700
  Info:       bg-blue-100 text-blue-700
  Neutral:    bg-gray-100 text-gray-700
  Purple:     bg-violet-100 text-violet-700

Status Dot:
  🟢 Active/Available/Online/Completed/Success
  🟡 Pending/Waiting/Away/Warning
  🔴 Problem/Delayed/Offline/Urgent/Overdue
  🔵 In Progress/Assigned/Information
  ⚪ Inactive/Disabled/Neutral
```

### 6.5 Layout Rules

```
Sidebar:     256px fixed left, gray-900
Main:        margin-left: 256px, padding: 32px
Max width:   1440px (centered)
Content:     padding: 0 32px

Card grid:   grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6
Form:        max-w-lg (simple), max-w-2xl (complex)
Modal:       max-w-lg (default), max-w-2xl (large)
```

---

## 7. Navigation Hierarchy

### 7.1 Sidebar (Admin)

```
┌──────────────────────┐
│  🔴 AT               │  ← Logo + brand
│  Aradhana Admin      │
├──────────────────────┤
│                      │
│  ● Dashboard         │  ← Operations dashboard (alert-driven)
│                      │
│  OPERATIONS ▼        │  ← Default expanded (ops team primary)
│    ○ Calendar        │
│    ○ Dispatch Board  │  ← Kanban lanes
│    ○ Bookings        │
│    ○ Trips           │
│                      │
│  SALES & CRM ▼       │
│    ○ Leads           │
│    ○ Customers       │  ← CRM workspace
│    ○ Quotations      │
│    ○ Follow-ups      │
│                      │
│  FLEET ▼             │
│    ○ Vehicles        │  ← Workspace
│    ○ Maintenance     │
│                      │
│  DRIVERS             │  ← Driver workspace
│                      │
│  FINANCE             │
│                      │
│  MARKETING ▼         │
│    ○ CMS             │
│    ○ Blog            │
│    ○ Reviews         │
│                      │
│  REPORTS             │  ← Sub-menu per department
│                      │
│  ⚙️ SETTINGS         │
│    ○ Organization    │
│    ○ Roles           │
│    ○ Webhooks        │
│    ○ Audit Log       │
│                      │
├──────────────────────┤
│  👤 Ritesh Kumar     │
│  🚪 Logout           │
└──────────────────────┘
```

### 7.2 Breadcrumbs

```
Every workspace has breadcrumbs:

  Bookings  /  #BK-00A1B2  /  Timeline
  Customers  /  Rajesh Sharma  /  Trips
  Vehicles  /  Toyota Innova  /  Maintenance
```

### 7.3 Tab Navigation (within workspace)

```
Each workspace uses horizontal tabs:

  [Timeline] [Trip] [Vehicle] [Driver] [Payments] [Notes] [+]

  [+] expands to: Activity, Communication, Documents, Settings
```

---

## 8. State Diagrams

### 8.1 Booking Lifecycle

```
                    ┌─────────┐
                    │NEW LEAD │
                    └────┬────┘
                         │ Qualified
                    ┌────▼────┐
                    │QUALIFIED│
                    └────┬────┘
                         │ Contacted
                    ┌────▼─────┐
                    │CONTACTED │
                    └────┬─────┘
                         │ Quote prepared
                    ┌────▼────────┐
                    │QUOTE_______ │
                    │PREPARING    │
                    └────┬────────┘
                         │ Quote sent
                    ┌────▼─────┐
                    │QUOTE SENT│
                    └────┬─────┘
                    ┌────┴────┐
                    │         │
               Approve    Reject
                    │         │
              ┌─────▼──┐  ┌──▼──────┐
              │ QUOTE  │  │CANCELLED│
              │ACCEPTED│  └─────────┘
              └────┬───┘
                   │ Booking created
              ┌────▼─────────┐
              │BOOKING       │
              │CONFIRMED     │
              └────┬─────────┘
                   │ Enters dispatch queue
              ┌────▼──────────┐
              │WAITING_______ │
              │ASSIGNMENT     │
              └────┬──────────┘
                   │ Vehicle assigned
              ┌────▼──────────┐
              │VEHICLE_______ │
              │ASSIGNED       │
              └────┬──────────┘
                   │ Driver assigned
              ┌────▼──────────┐
              │DRIVER________ │
              │ASSIGNED       │
              └────┬──────────┘
                   │ Dispatched
              ┌────▼──────────┐
              │READY FOR_____ │
              │DISPATCH       │
              └────┬──────────┘
                   │ Trip started
              ┌────▼──────────┐
              │TRIP STARTED   │
              └────┬──────────┘
                   │ Pickup completed
              ┌────▼───────────┐
              │PICKUP_________ │
              │COMPLETED       │
              └────┬───────────┘
                   │ Drop completed
              ┌────▼──────────┐
              │DROP__________ │
              │COMPLETED      │
              └────┬──────────┘
                   │ Trip completed
              ┌────▼───────────┐
              │TRIP COMPLETED  │
              └────┬───────────┘
                   │ Invoice generated
              ┌────▼────────────┐
              │INVOICE__________│
              │GENERATED        │
              └────┬────────────┘
                   │ Closed
              ┌────▼────┐
              │ CLOSED  │
              └─────────┘

  Any state can transition to CANCELLED
  CANCELLED is terminal
```

### 8.2 Dispatch Flow

```
  Booking Confirmed
         │
         ▼
  ┌──────────────┐
  │ PENDING      │  ← Appears in "Awaiting" lane
  └──────┬───────┘
         │ Check vehicle availability
         ▼
  ┌──────────────┐
  │ VEHICLE      │  ← "Assigning" lane
  │ ASSIGNING    │
  └──────┬───────┘
         │ Vehicle assigned
         ▼
  ┌──────────────┐
  │ DRIVER       │  ← "Assigning" lane
  │ ASSIGNING    │
  └──────┬───────┘
         │ Driver assigned
         ▼
  ┌──────────────┐
  │ READY        │  ← "Ready" lane
  └──────┬───────┘
         │ Operations clicks Dispatch
         ▼
  ┌──────────────┐
  │ DISPATCHED   │  → Trip created
  └──────────────┘    → "Running" lane

  If >2 hours in any pre-dispatch state → moves to "Delayed" lane
```

### 8.3 Payment Flow

```
  Booking Confirmed
         │
         ▼
  ┌──────────────┐
  │ ADVANCE      │  ← Customer pays advance (optional)
  │ PAYMENT      │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ TRIP         │
  │ COMPLETED    │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ INVOICE      │  ← Auto-generated
  │ GENERATED    │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ FINAL        │  ← Customer pays balance
  │ PAYMENT      │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ SETTLEMENT   │  ← Driver gets paid
  │ PAID         │
  └──────────────┘
```

---

## 9. Database Relationships

### Entity Relationship Map

```
Organization ──┬── Branch ──┬── User
               │            ├── Lead
               │            ├── Quotation
               │            ├── Booking
               │            └── Invoice
               │
               ├── User (employees)
               │
               └── (settings, configs)

Lead ──┬── Quotation ──┬── Booking ──┬── Dispatch ──┬── Trip
       │               │             │              │
       └── FollowUp    │             │              ├── Expense
                       │             │              ├── Incident
                       │             │              └── Settlement
                       │             │
                       │             ├── Payment
                       │             ├── Invoice
                       │             ├── Cancellation
                       │             ├── Rating
                       │             └── FollowUp
                       │
                       └── (linked via leadId)

Vehicle ──┬── Booking
          ├── Trip
          ├── Maintenance
          ├── Expense
          └── Dispatch

User (Driver) ──┬── Trip (driverId)
                ├── Booking (driverId)
                ├── DriverStatus
                ├── CabDriverProfile
                ├── DriverLeave
                ├── DriverShift
                ├── Settlement
                ├── Expense
                └── Incident

User (Customer) ──┬── Booking (customerId)
                  ├── Invoice
                  ├── Payment
                  ├── Rating
                  └── Cancellation

Notification ── User

AuditLog ── User

FollowUp ──┬── Lead
           └── Booking
```

### Key Business Rules

| Rule | Enforcement |
|------|-------------|
| Booking requires approved Quotation | API validation (`/api/admin/leads/[id]/convert`) |
| Trip only created from Dispatch finalize | Only in `operations-queue.ts::finalizeDispatch()` |
| Vehicle availability check before assign | `vehicle-availability.ts::checkVehicleAvailability()` |
| Driver availability check before assign | `driver-availability.ts::checkDriverAvailability()` |
| Dispatch created on booking conversion | Auto in `convert/route.ts` |
| Invoice auto-generated on trip complete | Event subscriber |
| Cancellation creates Cancellation record | In `status/route.ts` |
| Lead status auto-updated on follow-up outcome | In `followups/route.ts` |

---

## 10. API Contracts

### 10.1 Booking Status Transition

```
PUT /api/bookings/{id}/status

Request:
{
  "status": "DRIVER_ASSIGNED",
  "vehicleId": "uuid",
  "driverId": "uuid",
  "reason": "optional cancellation reason"
}

Response 200:
{
  "id": "uuid",
  "status": "DRIVER_ASSIGNED",
  "customerFacingStatus": "Driver Assigned",
  "timeline": [
    { "label": "Request Submitted", "order": 1, "completed": true, "active": false },
    { "label": "Being Reviewed", "order": 2, "completed": true, "active": false },
    ...
    { "label": "Driver Assigned", "order": 8, "completed": true, "active": true },
    { "label": "Trip Ready", "order": 9, "completed": false, "active": false }
  ],
  "vehicleId": "uuid",
  "driverId": "uuid",
  "startTime": null,
  "endTime": null
}

Error 400:
{ "error": "Cannot transition from WAITING_ASSIGNMENT to STARTED" }

Error 403:
{ "error": "Only managers can perform this action" }
```

### 10.2 Dispatch Assign Vehicle

```
POST /api/admin/dispatch/{id}/assign-vehicle

Request:
{ "vehicleId": "uuid" }

Response 200:
{
  "id": "uuid",
  "bookingId": "uuid",
  "status": "VEHICLE_ASSIGNING",
  "vehicleId": "uuid",
  "vehicleCheckStatus": "CLEARED",
  "vehicleCheckedAt": "2026-07-10T09:00:00Z"
}

Error 400:
{ "error": "Vehicle unavailable: insurance expired, under maintenance" }
```

### 10.3 Dispatch Finalize

```
POST /api/admin/dispatch/{id}/finalize

Response 201:
{
  "id": "uuid",
  "tripNumber": "TR-00A1B2",
  "bookingId": "uuid",
  "status": "SCHEDULED",
  "vehicleId": "uuid",
  "driverId": "uuid",
  "scheduledPickupTime": "2026-07-15T09:00:00Z"
}

Error 400:
{ "error": "Both vehicle and driver must be assigned before dispatch" }
```

### 10.4 Create Follow-up

```
POST /api/admin/followups

Request:
{
  "leadId": "uuid",
  "type": "CALL",
  "notes": "Customer interested in Innova for Delhi trip",
  "outcome": "INTERESTED",
  "nextAction": "SEND_QUOTE",
  "leadScore": 8,
  "duration": 240,
  "reminderAt": "2026-07-11T10:00:00Z"
}

Response 201:
{
  "id": "uuid",
  "type": "CALL",
  "notes": "...",
  "outcome": "INTERESTED",
  "nextAction": "SEND_QUOTE",
  "leadScore": 8,
  "duration": 240,
  "createdAt": "2026-07-10T14:30:00Z",
  "user": { "id": "uuid", "name": "Ritesh" }
}
```

### 10.5 Record Payment

```
POST /api/admin/payments

Request:
{
  "bookingId": "uuid",
  "customerId": "uuid",
  "type": "ADVANCE",
  "amount": 2000,
  "method": "CASH",
  "reference": "Receipt #001"
}

Response 201:
{
  "id": "uuid",
  "paymentNumber": "PAY-00A1B2",
  "type": "ADVANCE",
  "amount": 2000,
  "method": "CASH",
  "receivedAt": "2026-07-10T14:30:00Z"
}
```

### 10.6 Generate Invoice

```
POST /api/admin/invoices

Request:
{
  "bookingId": "uuid",
  "subtotal": 5200,
  "gst": 260,
  "discount": 0,
  "total": 5460,
  "dueDate": "2026-07-20"
}

Response 201:
{
  "id": "uuid",
  "invoiceNumber": "INV-001",
  "status": "DRAFT",
  "total": 5460,
  "paidAmount": 0
}
```

### 10.7 Event Payload (Webhook)

```
POST {webhook.url}
Headers:
  X-Event-Type: BOOKING_STATUS_CHANGED
  X-Webhook-Signature: {hmac-sha256-hex}

Body:
{
  "event": "BOOKING_STATUS_CHANGED",
  "timestamp": "2026-07-10T14:30:00Z",
  "data": {
    "bookingId": "uuid",
    "newStatus": "DRIVER_ASSIGNED",
    "previousStatus": "VEHICLE_ASSIGNED"
  }
}
```

### 10.8 Customer Timeline

```
GET /api/bookings/{id}

Response 200:
{
  "id": "uuid",
  "status": "WAITING_ASSIGNMENT",
  "customerFacingStatus": "Booking Confirmed",
  "timeline": [
    { "label": "Request Submitted", "order": 1, "completed": true, "active": false },
    { "label": "Being Reviewed", "order": 2, "completed": true, "active": false },
    { "label": "Quotation Being Prepared", "order": 3, "completed": true, "active": false },
    { "label": "Quotation Sent", "order": 4, "completed": true, "active": false },
    { "label": "Waiting for Approval", "order": 5, "completed": true, "active": false },
    { "label": "Booking Confirmed", "order": 6, "completed": true, "active": true },
    { "label": "Vehicle Assigned", "order": 7, "completed": false, "active": false },
    { "label": "Driver Assigned", "order": 8, "completed": false, "active": false },
    { "label": "Trip Ready", "order": 9, "completed": false, "active": false },
    { "label": "Trip Started", "order": 10, "completed": false, "active": false },
    { "label": "In Progress", "order": 11, "completed": false, "active": false },
    { "label": "Trip Completed", "order": 12, "completed": false, "active": false }
  ],
  "customer": { "name": "Rajesh Sharma", "phone": "+91..." },
  "vehicle": null,
  "driver": null
}
```
