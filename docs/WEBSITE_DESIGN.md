# Aradhana Travel — Public Website Design

> Designed for conversion. Every pixel convinces the visitor to book.

---

## Table of Contents

1. [Sitemap & URL Architecture](#1-sitemap--url-architecture)
2. [Design System](#2-design-system)
3. [Component Library](#3-component-library)
4. [Homepage Wireframe](#4-homepage-wireframe)
5. [Service Pages](#5-service-pages)
6. [Fleet Pages](#6-fleet-pages)
7. [Tour Package Pages](#7-tour-package-pages)
8. [Destination Pages](#8-destination-pages)
9. [Customer Portal](#9-customer-portal)
10. [Utility Pages](#10-utility-pages)
11. [CMS Data Model](#11-cms-data-model)
12. [Mobile UX](#12-mobile-ux)

---

## 1. Sitemap & URL Architecture

### 1.1 Complete URL Structure

```
/
├── (marketing)                          # Public pages
│   ├── /                                # Homepage
│   ├── /about                           # About Us
│   ├── /contact                         # Contact Us
│   ├── /faq                             # Frequently Asked Questions
│   │
│   ├── /services                        # All cab services overview
│   │   ├── /services/outstation         # Outstation cab service
│   │   ├── /services/airport            # Airport transfer
│   │   ├── /services/local              # Local rental
│   │   ├── /services/one-way            # One-way cab
│   │   ├── /services/round-trip         # Round trip cab
│   │   ├── /services/corporate          # Corporate travel
│   │   ├── /services/wedding            # Wedding car rental
│   │   └── /services/tempo-traveller    # Tempo traveller rental
│   │
│   ├── /fleet                           # Fleet overview
│   │   ├── /fleet/suv                   # SUV cars
│   │   ├── /fleet/sedan                 # Sedan cars
│   │   ├── /fleet/luxury                # Luxury cars
│   │   ├── /fleet/tempo-traveller       # Tempo traveller
│   │   ├── /fleet/mini-bus              # Mini bus
│   │   └── /fleet/{slug}               # Individual vehicle page
│   │
│   ├── /destinations                    # All destinations
│   │   ├── /destinations/jaipur         # Jaipur travel
│   │   ├── /destinations/delhi          # Delhi travel
│   │   ├── /destinations/agra           # Agra travel
│   │   ├── /destinations/udaipur        # Udaipur travel
│   │   ├── /destinations/jodhpur        # Jodhpur travel
│   │   ├── /destinations/jaisalmer      # Jaisalmer travel
│   │   ├── /destinations/shimla         # Shimla travel
│   │   ├── /destinations/manali         # Manali travel
│   │   └── /destinations/{slug}        # Dynamic destination
│   │
│   ├── /packages                        # Tour packages overview
│   │   └── /packages/{slug}            # Individual package
│   │
│   ├── /offers                          # Special offers
│   ├── /blog                            # Blog listing
│   │   └── /blog/{slug}                # Blog post
│   ├── /gallery                         # Photo gallery
│   └── /reviews                         # Customer reviews
│
├── (customer)                           # Customer portal
│   ├── /login                           # OTP login
│   ├── /register                        # Registration
│   ├── /dashboard                       # Customer dashboard
│   ├── /bookings                        # My bookings list
│   │   └── /bookings/{id}              # Booking detail
│   ├── /quotations                      # My quotations
│   ├── /invoices                        # My invoices
│   ├── /payments                        # Payment history
│   ├── /tracking/{id}                  # Live trip tracking
│   ├── /profile                         # Edit profile
│   └── /support                         # Customer support
│
└── (api)                                # API routes (not public)
    ├── /api/auth/...
    ├── /api/booking/...
    └── ...
```

### 1.2 SEO Hierarchy

```
Priority 1 (Hero pages)   → Home, Fleet, Destinations, Packages
Priority 2 (Service pages)→ Outstation, Airport, Local, Tours
Priority 3 (Detail pages) → Vehicle detail, Package detail, Destination detail
Priority 4 (Utility)      → About, Contact, FAQ, Blog, Gallery
Priority 5 (Customer)     → Dashboard, Bookings, Profile (noindex)
```

### 1.3 URL Conventions

```
Pages:        /service/{slug}          → /services/outstation
              /destination/{slug}      → /destinations/jaipur-to-delhi
              /fleet/{slug}            → /fleet/toyota-innova
              /packages/{slug}         → /packages/rajasthan-tour

Blog:         /blog/{slug}             → /blog/top-10-places-in-jaipur

Query params: /fleet?type=suv          → Filter fleet
              /packages?duration=3     → Filter by duration
              /blog?category=tours     → Filter blog

Pagination:   /blog/page/2
              /packages/page/2
```

---

## 2. Design System

### 2.1 Brand Identity

```
Brand Name:     Aradhana Travel
Tagline:        Your Journey, Our Promise
Voice:          Warm, professional, trustworthy, local (Rajasthani pride)

Color Palette:

  Brand Primary:    #B91C1C  (Deep Red)     — Logo, primary buttons, headers
  Brand Secondary:  #F59E0B  (Amber)        — Accents, highlights, deals
  Brand Dark:       #1F2937  (Gray-800)    — Text, dark backgrounds
  Brand Light:      #FEF2F2  (Red-50)      — Subtle backgrounds

  Semantic:
    Success:    #059669  (Emerald-600)
    Info:       #3B82F6  (Blue-500)
    Warning:    #D97706  (Amber-600)
    Error:      #DC2626  (Red-600)

  Neutrals:
    Background: #FAFAFA
    Card:       #FFFFFF
    Border:     #E5E7EB
    Text:       #111827
    Muted:      #6B7280
    Light:      #9CA3AF

Typography:
  Headings:   Playfair Display (serif — elegance, trust)
  Body:       Inter (sans-serif — readability)
  Monospace:  JetBrains Mono (only for codes/numbers)

Font Scale:
  Display:   48/56/64px  — Hero titles
  H1:        36/40/44px  — Page titles
  H2:        28/32/36px  — Section headers
  H3:        22/24/28px  — Card titles
  H4:        18/20/22px  — Subsection headers
  Body:      16/18px     — Content
  Small:     14px        — Metadata
  Caption:   12px        — Badges, footnotes

Spacing Scale (rem):
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8

Border Radius:
  Buttons:   8px
  Cards:     12px
  Inputs:    8px
  Images:    12px
  Badges:    9999px (pill)

Shadows:
  Card:      0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)
  Elevated:  0 10px 25px rgba(0,0,0,0.12)
  Hover:     0 4px 12px rgba(0,0,0,0.1)
```

### 2.2 Animations

```
Page transitions:    Fade up (300ms, ease-out)
Card hover:          Lift +2px, shadow increase (200ms)
Button hover:        Scale 1.02, shadow (150ms)
Image reveal:        Fade in on scroll (IntersectionObserver)
Mobile menu:         Slide from right (250ms)
Modal:               Fade + scale (200ms)
Notification:        Slide from top (300ms)
Loading skeleton:    Pulse animation (1.5s infinite)
Counter:             Count-up on scroll
Carousel:            Smooth slide (400ms cubic-bezier)
Accordion:           Height expand (200ms)
```

---

## 3. Component Library

### 3.1 Button System

```
Primary (Red):
  Default:  bg-red-700 text-white shadow-sm
  Hover:    bg-red-800 shadow-md
  Active:   bg-red-900
  Disabled: bg-gray-300 text-gray-500

Secondary (Outline):
  Default:  border-2 border-red-700 text-red-700 bg-transparent
  Hover:    bg-red-50
  Active:   bg-red-100

Ghost:
  Default:  text-gray-700 bg-transparent
  Hover:    bg-gray-100

WhatsApp (special):
  Default:  bg-green-500 text-white
  Hover:    bg-green-600

Sizes:
  lg:   px-8 py-3 text-lg
  md:   px-6 py-2.5 text-base
  sm:   px-4 py-1.5 text-sm

Icon + Label: gap-2, icon on left
Full width:   w-full (mobile)
```

### 3.2 Card System

```
Vehicle Card:
  ┌──────────────────────┐
  │  [Image] 16:9        │
  ├──────────────────────┤
  │  Vehicle Name         │
  │  Starting ₹11/km      │
  │  Seats · Luggage · AC │
  │  [Book Now →]         │
  └──────────────────────┘

Package Card:
  ┌──────────────────────┐
  │  [Image] 16:9        │
  ├──────────────────────┤
  │  Duration Badge       │
  │  Package Name         │
  │  ₹8,999 per person    │
  │  ★ 4.8 (127 reviews)  │
  │  [View Details →]     │
  │                       │
  └──────────────────────┘

Testimonial Card:
  ┌──────────────────────┐
  │  ★ ★ ★ ★ ★           │
  │  "Amazing service..." │
  │  — Rajesh, Jaipur     │
  │  [Vehicle used]       │
  └──────────────────────┘

Service Card:
  ┌──────────────────────┐
  │  [Icon]              │
  │  Outstation           │
  │  Intercity cab       │
  │  service             │
  │  [Learn More →]      │
  └──────────────────────┘
```

### 3.3 Form Components

```
Quote Request Form:
  ┌─────────────────────────────────┐
  │  Request a Cab                  │
  │                                 │
  │  Pickup Location  [___________] │
  │  Drop Location    [___________] │
  │  Pickup Date      [____] [Time] │
  │  Passengers       [_____]      │
  │  Vehicle Type     [Dropdown v] │
  │                                 │
  │  [Get Free Quote →]            │
  └─────────────────────────────────┘

  Glass effect: backdrop-blur-md, bg-white/90
  Sticky on desktop, full-width on mobile
```

### 3.4 Navigation

```
Desktop Header:
  ┌─────────────────────────────────────────────────────┐
  │  [LOGO]  Services ▼  Fleet ▼  Packages  Destinations │
  │          Offers      Blog      About      Contact    │
  │                                           [Login]    │
  │                    WhatsApp: +91 98765 43210          │
  └─────────────────────────────────────────────────────┘

  Sticky on scroll. White bg. Shadow on scroll.
  Services dropdown: Outstation, Airport, Local, One-way, Corporate
  Fleet dropdown: SUV, Sedan, Luxury, Tempo Traveller

Mobile Header:
  ┌─────────────────────┐
  │ [LOGO]         [☰] │
  │                     │
  │ (Slide menu)        │
  │   Home              │
  │   Services >        │
  │   Fleet >           │
  │   Packages          │
  │   Destinations      │
  │   Offers            │
  │   Blog              │
  │   About             │
  │   Contact           │
  │                     │
  │   📞 Call Us         │
  │   💬 WhatsApp        │
  └─────────────────────┘

  Bottom bar (mobile):
  ┌────────────────────────────┐
  │ [Call] [WhatsApp] [Quote]  │
  └────────────────────────────┘
  Always visible. Fixed bottom.
```

### 3.5 Footer

```
┌─────────────────────────────────────────────────────────────┐
│  COMPANY INFO                    QUICK LINKS                │
│  [Logo]                          Home · About · Contact     │
│  Your Journey, Our Promise       Services · Fleet · FAQ     │
│  24/7 support: +91 98765 43210   Blog · Gallery · Reviews   │
│  info@aradhanatravel.com                                     │
│  Jaipur, Rajasthan                FLEET                      │
│                                  SUV · Sedan · Luxury        │
│  SOCIAL                          Tempo Traveller · Mini Bus  │
│  [FB] [IG] [YT] [WA]                                         │
│                                  PACKAGES                    │
│                                  Rajasthan Tour · Delhi Tour │
│  NEWSLETTER                      Himachal Tour · More        │
│  [___________] [Subscribe]                                   │
│                                  POLICIES                    │
│  DOWNLOAD APP                    Privacy · Terms · Refund    │
│  [Google Play] [App Store]       Cancellation                │
├─────────────────────────────────────────────────────────────┤
│  © 2026 Aradhana Travel Service. All rights reserved.       │
│  Designed with ❤️ in Jaipur                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Homepage Wireframe

### 4.1 Full Section Order

```
1.  HERO
    ┌─────────────────────────────────────────────────────────────┐
    │  Video/Image Background (parallax, dark overlay)            │
    │                                                             │
    │  "Explore Rajasthan with Aradhana Travel"                   │
    │  "Your trusted travel partner since 2010"                   │
    │                                                             │
    │  ┌─────────────────────────────────────────────────┐        │
    │  │  Request a Cab                                  │        │
    │  │  Pickup [__________]  Drop [__________]          │        │
    │  │  Date   [____]       Vehicle [Dropdown v]       │        │
    │  │  [Get Free Quote →]                             │        │
    │  └─────────────────────────────────────────────────┘        │
    │                                                             │
    │  Trusted by 10,000+ happy travelers                          │
    └─────────────────────────────────────────────────────────────┘

2.  WHY CHOOSE US
    ┌─────────────────────────────────────────────────────────────┐
    │  Why Aradhana Travel?                                       │
    │                                                             │
    │  [Shield]        [Clock]         [Star]         [MapPin]   │
    │  Safe & Reliable  24/7 Support   Top Rated      Local Exp  │
    │  All vehicles      Always here    4.8 ★          10+ yrs   │
    │  sanitized                       (500+ reviews)  expertise  │
    └─────────────────────────────────────────────────────────────┘

3.  SERVICES
    [Outstation] [Airport] [Local] [One Way] [Corporate] [Tempo Traveller]
    6 cards in grid. Icons + labels.

4.  FLEET PREVIEW
    [SUV] [Sedan] [Luxury] [Tempo Traveller]
    Horizontal scroll on mobile. 4 cards.

5.  POPULAR ROUTES
    [Jaipur → Delhi] [Jaipur → Agra] [Jaipur → Udaipur]
    [Jaipur → Jodhpur] [Jaipur → Jaisalmer] [Jaipur → Ajmer]
    Each card: route image, distance, duration, starting price, [Book]

6.  POPULAR DESTINATIONS
    City cards with image overlay. "Explore Jaipur", "Explore Udaipur"

7.  FEATURED TOUR PACKAGES
    3 package cards. Image | Duration badge | Name | Price | Rating

8.  SPECIAL OFFERS
    Limited-time deals. Countdown timer. CTA.

9.  TESTIMONIALS
    Carousel. Star rating | Quote | Name | Location | Vehicle used

10. GALLERY
    6 images grid. Modal on click.

11. TRAVEL VIDEOS
    YouTube embeds. Grid.

12. STATISTICS
    [10,000+]   [500+]    [50+]     [4.8★]
    Customers   Reviews   Vehicles  Rating
    Count-up animation.

13. FAQ
    Accordion. Most common questions. "Still have questions? Contact us."

14. LATEST BLOG
    3 blog cards. Image | Date | Title | Excerpt

15. PARTNERS / CERTIFICATIONS
    Logo grid.

16. CONTACT CTA
    Full-width banner. "Ready to Travel? Let's Plan Your Trip"
    [Call Now] [WhatsApp] [Request Quote]

17. FOOTER
    (See footer component above)
```

### 4.2 Hero Section Detail

```
┌─────────────────────────────────────────────────────────────┐
│  [Video Background: Rajasthan landscape / Cab driving]       │
│  [Overlay: gradient black → transparent, 0.6 opacity]       │
│                                                             │
│                                                             │
│              "Explore Rajasthan with"                        │
│           "Aradhana Travel Service"                          │
│                                                             │
│     "Your trusted travel partner across Rajasthan"           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🚗 Request a Cab                         [Get Quote]│   │
│  │  Pickup [Jaipur Airport▼] Drop [________]           │   │
│  │  Date   [15 Jul 2026 ▼]   Passengers [2]           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│       🏆 Trusted by 10,000+ happy travelers  ★ 4.8/5       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Glass-effect form: bg-white/90 backdrop-blur-md rounded-2xl shadow-xl
Max-width: 480px (desktop), full-width (mobile)
```

### 4.3 Mobile Homepage

```
┌─────────────────────┐
│  [Video/Hero]       │
│  "Explore Rajasthan"│
│  [Quote Form]       │
│                     │
│  Why Choose Us      │
│  [4 icon cards]     │
│                     │
│  Services           │
│  [Horizontal      →]│
│  scroll row         │
│                     │
│  Fleet              │
│  [Horizontal      →]│
│  scroll row         │
│                     │
│  Popular Routes     │
│  [List cards]       │
│                     │
│  Packages           │
│  [3 cards]          │
│                     │
│  Testimonials       │
│  [Swipe carousel]   │
│                     │
│  FAQ                │
│  [Accordion]        │
│                     │
│  Contact CTA        │
│  [Call] [WhatsApp]  │
│                     │
├─────────────────────┤
│ [Call] [WA] [Quote] │  ← Fixed bottom bar
└─────────────────────┘
```

---

## 5. Service Pages

### 5.1 Service Page Template

Each service page follows the same layout:

```
┌─────────────────────────────────────────────────────────────┐
│  Hero: Service name + brief description + CTA               │
├─────────────────────────────────────────────────────────────┤
│  What We Offer (3-4 feature cards specific to this service) │
├─────────────────────────────────────────────────────────────┤
│  Popular Routes (for Outstation) or Coverage Areas          │
├─────────────────────────────────────────────────────────────┤
│  Fleet Available (vehicles suitable for this service)       │
├─────────────────────────────────────────────────────────────┤
│  Pricing (starting rates, examples)                         │
├─────────────────────────────────────────────────────────────┤
│  How It Works (3-step: Book → Travel → Pay)                │
├─────────────────────────────────────────────────────────────┤
│  FAQ (service-specific questions)                           │
├─────────────────────────────────────────────────────────────┤
│  CTA: "Book Your {Service} Now"                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Outstation Page Content Highlights

```
Hero: "Rajasthan Outstation Cab Service"
Sub: "Safe, comfortable intercity travel across Rajasthan"

What We Offer:
  • One-way and round-trip options
  • Professional drivers
  • Clean, sanitized vehicles
  • Transparent pricing (no hidden charges)

Popular Routes:
  Jaipur → Delhi (280 km, 5 hrs)    ₹3,500
  Jaipur → Agra (240 km, 4 hrs)     ₹2,800
  Jaipur → Udaipur (400 km, 6 hrs)  ₹5,500
  (List with images, distance, duration, price)
```

### 5.3 Airport Transfer Page Highlights

```
Hero: "Jaipur Airport Cab Service"
Sub: "Hassle-free pickup and drop at Jaipur International Airport"

Features:
  • Flight tracking (we monitor delays)
  • Meet-and-greet at arrival gate
  • Free waiting (60 min for domestic, 90 min for international)
  • Fixed pricing (no surge)

Pricing:
  Airport → City Center: ₹600
  Airport → Bani Park: ₹500
  Airport → Sitapura: ₹700
  Airport → Ajmer: ₹2,500
```

### 5.4 Local Rental Page Highlights

```
Hero: "Local Cab Rental in Jaipur"
Sub: "Explore Jaipur at your own pace"

Packages:
  4 hours / 40 km  — ₹1,200
  8 hours / 80 km  — ₹2,000
  12 hours / 120 km — ₹2,800

Popular Trips:
  • Amer Fort & City Palace (4 hrs)
  • Full day: Amer + Jaigarh + Nahargarh + City Palace + Hawa Mahal
  • Shopping: Bapu Bazaar + Johari Bazaar
```

---

## 6. Fleet Pages

### 6.1 Fleet Overview Page

```
┌─────────────────────────────────────────────────────────────┐
│  Hero: "Our Fleet — Safe, comfortable, reliable"            │
├─────────────────────────────────────────────────────────────┤
│  Filter bar: [All] [SUV] [Sedan] [Luxury] [Tempo Traveller]│
├─────────────────────────────────────────────────────────────┤
│  Vehicle cards grid (4 columns desktop, 2 tablet, 1 mobile) │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ [Car Image]  │  │ [Car Image]  │  │ [Car Image]  │      │
│  │ Toyota Innova │  │ Honda City   │  │ Mercedes E   │      │
│  │ ★ 4.9  (89)  │  │ ★ 4.7 (124)  │  │ ★ 4.9  (56)  │      │
│  │ ₹13/km       │  │ ₹11/km       │  │ ₹22/km       │      │
│  │ 7 seats 3 bag│  │ 4 seats 2 bag│  │ 4 seats 3 bag│      │
│  │ [View →]     │  │ [View →]     │  │ [View →]     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Individual Vehicle Page

```
┌─────────────────────────────────────────────────────────────┐
│  Vehicle: Toyota Innova Crysta                              │
├─────────────────────────────────────────────────────────────┤
│  Gallery (main image + thumbnails)                          │
│  [Main Image — 16:9]                                        │
│  [Thumb 1] [Thumb 2] [Thumb 3] [Thumb 4]                   │
├─────────────────────────────────────────────────────────────┤
│  2-Column Layout:                                           │
│                                                             │
│  Left (70%):                    Right (30%): Fixed card     │
│                                                             │
│  Specifications               ┌──────────────────────┐     │
│  • 7 Seats                     │  Request a Quote     │     │
│  • 3 Luggage Bags              │                      │     │
│  • Automatic Transmission     │  Trip Type [Dropdown]│     │
│  • Diesel                      │  Date [________]     │     │
│  • Air Conditioning            │  Pickup [________]   │     │
│  • Music System                │  Drop   [________]   │     │
│  • Pushback Seats              │                      │     │
│  • ABS + Airbags               │  [Get Price →]       │     │
│                                └──────────────────────┘     │
│  Pricing (sticky on scroll)                                 │
│  • ₹13/km (outstation)                                      │
│  • ₹1,200/4hrs (local)                                      │
│  • Night charges apply after 10 PM                          │
│                                                             │
│  Suitable For                                                │
│  • Family trips, group travel, airport transfers            │
│  • Best for 5-6 passengers with luggage                     │
│                                                             │
│  Features                                                   │
│  [AC] [Music] [Charger] [Sunroof] [ABS] [Airbags]           │
│  [Pushback Seats] [Cruise Control]                          │
│                                                             │
│  Review Section                                             │
│  ★ 4.9 (89 reviews)                                         │
│  "Very comfortable for long drives..."                      │
│                                                             │
│  FAQ                                                        │
│  Accordion with vehicle-specific questions                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Tour Package Pages

### 7.1 Package Overview Page

```
┌─────────────────────────────────────────────────────────────┐
│  Hero: "Rajasthan Tour Packages — Explore the Royal State"  │
├─────────────────────────────────────────────────────────────┤
│  Filters: Duration [All ▼]  Type [All ▼]  Price [All ▼]    │
├─────────────────────────────────────────────────────────────┤
│  Package cards grid:                                        │
│                                                             │
│  ┌────────────────────────────────────────────────┐         │
│  │  [Banner Image: 16:9]                    3 Days│         │
│  ├────────────────────────────────────────────────┤         │
│  │  Jaipur to Agra Tour Package                  │         │
│  │  ★ 4.8 (127 reviews)  |  ₹8,999 per person    │         │
│  │  Includes: Hotel, Cab, Meals, Guide           │         │
│  │  [View Details →]                             │         │
│  └────────────────────────────────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Individual Package Page

```
┌─────────────────────────────────────────────────────────────┐
│  Package: "Enchanting Rajasthan — 7 Days"                   │
├─────────────────────────────────────────────────────────────┤
│  [Hero Banner Image — full width, 16:9]                     │
│  Overlay: Duration | Price | Rating                         │
├─────────────────────────────────────────────────────────────┤
│  Quick Info Bar:                                             │
│  [7 Days] [6 Nights] [₹15,999/person] [★ 4.9] [Meals incl] │
├─────────────────────────────────────────────────────────────┤
│  2-Column Layout:                                            │
│                                                             │
│  Left (65%):                         Right (35%):           │
│                                                             │
│  Overview                            ┌─────────────────┐    │
│  Detailed description of the tour    │  Book This Tour  │    │
│                                      │                  │    │
│  Gallery                             │  Date [______]   │    │
│  Image grid with lightbox            │  Persons [2]     │    │
│                                      │  [Request Quote] │    │
│  Day-wise Itinerary                  │                  │    │
│  ┌──────────────────────────────┐    │  What's Included │    │
│  │ Day 1: Jaipur Arrival        │    │  ✅ Hotel        │    │
│  │ Morning: Check-in hotel      │    │  ✅ Cab          │    │
│  │ Afternoon: City Palace tour  │    │  ✅ Breakfast    │    │
│  │ Evening: Hawa Mahal sunset   │    │  ✅ Guide        │    │
│  └──────────────────────────────┘    │  ❌ Flights      │    │
│                                      │                  │    │
│  Day 2: Jaipur → Agra               │  Cancellation    │    │
│  7:00 AM: Drive to Agra (4 hrs)    │  Free cancel     │    │
│  12:00 PM: Check-in hotel          │  up to 48 hrs    │    │
│  2:00 PM: Taj Mahal tour           │                  │    │
│                                      └─────────────────┘    │
│  (Day 3, 4, 5, 6, 7...)                                    │
│                                                             │
│  What's Included (detailed)                                 │
│  What's Excluded                                            │
│                                                             │
│  Hotels Used (images + names)                               │
│                                                             │
│  Map (interactive route map)                                │
│                                                             │
│  Reviews (carousel)                                         │
│                                                             │
│  FAQ                                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Destination Pages

### 8.1 Destination Page Template

```
┌─────────────────────────────────────────────────────────────┐
│  Hero: "Explore Jaipur — The Pink City"                     │
│  [Full-width image]                                         │
├─────────────────────────────────────────────────────────────┤
│  About the City (2-3 paragraphs with key highlights)        │
├─────────────────────────────────────────────────────────────┤
│  Top Attractions (image grid with names)                   │
│  [Hawa Mahal] [City Palace] [Amer Fort] [Jantar Mantar]    │
├─────────────────────────────────────────────────────────────┤
│  Tour Packages for {City}                                   │
│  3 package cards linking to package detail                  │
├─────────────────────────────────────────────────────────────┤
│  Cab Services in {City}                                     │
│  [Local Darshan] [Airport Transfer] [Outstation]            │
├─────────────────────────────────────────────────────────────┤
│  How to Reach (by road, rail, air)                         │
├─────────────────────────────────────────────────────────────┤
│  Best Time to Visit                                         │
├─────────────────────────────────────────────────────────────┤
│  FAQ                                                        │
├─────────────────────────────────────────────────────────────┤
│  CTA: "Plan Your {City} Trip"                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Customer Portal

### 9.1 OTP Login

```
┌─────────────────────────────────────────────────────────────┐
│  Welcome Back                                               │
│                                                             │
│  ┌──────────────────────────────────────┐                   │
│  │  +91  [Mobile Number]                │                   │
│  │                                       │                   │
│  │  [Send OTP →]                        │                   │
│  └──────────────────────────────────────┘                   │
│                                                             │
│  — OR —                                                     │
│                                                             │
│  Continue as Guest                                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐                   │
│  │  Enter OTP sent to +91 98765*****   │                   │
│  │                                       │                   │
│  │  [_][_][_][_][_][_]                   │                   │
│  │                                       │                   │
│  │  [Verify & Login →]                  │                   │
│  │                                       │                   │
│  │  Resend in 30s                       │                   │
│  └──────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Customer Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Welcome, Rajesh!                        [Logout]           │
├─────────────────────────────────────────────────────────────┤
│  Active Trip Card (if trip in progress):                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🟢 Trip In Progress                                 │   │
│  │  Jaipur → Delhi  |  Driver: Suresh                   │   │
│  │  [Track Live]                                         │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Quick Stats:                                                │
│  [3 Active]  [2 Pending Quotes]  [5 Completed]  [4 Invoices]│
├─────────────────────────────────────────────────────────────┤
│  Recent Bookings:                                            │
│  ┌───────────────────────────────────────────┬──────────┐   │
│  │ Jul 10  | Jaipur → Delhi   | ₹5,200      │ 🟢 Trip  │   │
│  │ Jul 5   | Airport          | ₹600        │ ✅ Done  │   │
│  │ Jun 28  | Jaipur → Ajmer   | ₹3,500      │ ✅ Done  │   │
│  └───────────────────────────────────────────┴──────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Quick Actions:                                              │
│  [Book Again] [My Quotes] [Invoices] [Support]              │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 Tracking Page

```
┌─────────────────────────────────────────────────────────────┐
│  Trip Tracking  |  #BK-00A1                                 │
├─────────────────────────────────────────────────────────────┤
│  Timeline (vertical):                                       │
│                                                             │
│  ✅ Request Submitted        Jul 10, 9:30 AM               │
│  ✅ Quotation Accepted       Jul 10, 11:00 AM              │
│  ✅ Booking Confirmed        Jul 10, 11:30 AM              │
│  ✅ Vehicle Assigned         Jul 11, 10:00 AM              │
│  ✅ Driver Assigned          Jul 11, 10:30 AM              │
│  ✅ Trip Ready               Jul 15, 8:00 AM               │
│  🟢 Trip Started             Now                           │
│  ○ Pickup Completed                                        │
│  ○ Drop Completed                                           │
│  ○ Trip Completed                                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Driver: Suresh Kumar                                       │
│  Phone: +91 98765 43210   [Call] [WhatsApp]                │
│  Vehicle: Toyota Innova (White) · RJ14-AB-1234              │
│                                                             │
│  Route:                                                     │
│  🟢 Hotel Marriott, Jaipur                                  │
│       ↓  280 km  ·  Est. 5 hours                            │
│  🟡 Amer Fort, Jaipur (pickup)                              │
│       ↓                                                     │
│  🔴 Delhi Airport (drop)                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Utility Pages

### 10.1 About Page

```
┌─────────────────────────────────────────────────────────────┐
│  Hero: "Our Story — 15 Years of Trust"                      │
├─────────────────────────────────────────────────────────────┤
│  Our Journey (timeline):                                    │
│  2010 → Founded with 2 cars                                │
│  2013 → Expanded to 10 cars, added outstation              │
│  2016 → 50+ vehicles, tour packages launched               │
│  2020 → Digital transformation, contactless service        │
│  2026 → 200+ fleet, 10,000+ happy customers                │
├─────────────────────────────────────────────────────────────┤
│  Mission & Vision (side by side)                            │
├─────────────────────────────────────────────────────────────┤
│  Why Choose Us (icons + descriptions)                      │
├─────────────────────────────────────────────────────────────┤
│  Our Team (photos + roles)                                  │
├─────────────────────────────────────────────────────────────┤
│  Certifications & Partners (logo grid)                     │
├─────────────────────────────────────────────────────────────┤
│  Stats: [15 Years] [10K Customers] [200+ Fleet] [4.8★]    │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Contact Page

```
┌─────────────────────────────────────────────────────────────┐
│  Hero: "We're Here to Help"                                 │
├─────────────────────────────────────────────────────────────┤
│  2-Column:                                                  │
│                                                             │
│  Left:                              Right:                  │
│  Contact Form                       Map (Google Maps)       │
│  [Name]                                                    │
│  [Phone]                                                   │
│  [Email]                              Branch Details:       │
│  [Subject ▼]                          Head Office           │
│  [Message]                            Bani Park, Jaipur     │
│                                       Phone: +91 98765...   │
│  [Send Message →]                     Email: info@...      │
│                                                             │
│  Quick Contacts:                                            │
│  📞 Booking: +91 98765 43210                                │
│  💬 WhatsApp: +91 98765 43210                               │
│  🚨 Emergency: +91 98765 43210                              │
│  ✉️ Email: info@aradhanatravel.com                          │
│                                                             │
│  Working Hours:                                             │
│  Mon-Sat: 6:00 AM — 10:00 PM                               │
│  Sunday: 8:00 AM — 8:00 PM                                 │
│  24/7 Emergency Support Available                           │
└─────────────────────────────────────────────────────────────┘
```

### 10.3 FAQ Page

```
┌─────────────────────────────────────────────────────────────┐
│  Hero: "Frequently Asked Questions"                         │
├─────────────────────────────────────────────────────────────┤
│  Categories (horizontal pills):                              │
│  [All] [Booking] [Payment] [Cancellation] [Fleet] [Safety]  │
├─────────────────────────────────────────────────────────────┤
│  Search: [Search questions...]                              │
├─────────────────────────────────────────────────────────────┤
│  Accordion list:                                            │
│                                                             │
│  ▼ How do I book a cab?                                     │
│    You can book via our website, call us, or WhatsApp.      │
│                                                             │
│  ▼ What payment methods do you accept?                     │
│    Cash, UPI (GPay/PhonePe), Credit/Debit Card, Net Banking │
│                                                             │
│  ▼ Can I cancel my booking?                                │
│    Yes, free cancellation up to 2 hours before pickup.      │
│    After that, 50% cancellation fee applies.                │
│                                                             │
│  [Still have questions? Contact us →]                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. CMS Data Model

Every section on every page is admin-managed via the CMS.

### 11.1 Homepage Sections (admin manages order)

| Section | CMS Fields | Type |
|---------|-----------|------|
| Hero | title, subtitle, bgVideo, bgImage, overlayOpacity | Singleton |
| Why Choose Us | title, items[] (icon, title, desc) | Ordered list |
| Services | title, description, services[] (icon, title, desc, link) | Ordered list |
| Fleet Preview | title, description, link | Links to fleet page |
| Popular Routes | title, routes[] (image, from, to, distance, duration, price) | Ordered list |
| Popular Destinations | title, destinations[] (image, name, slug, description) | Ordered list |
| Featured Packages | title, packages[] (select from packages) | Relationship |
| Special Offers | title, offers[] (image, title, description, discount, validUntil) | Ordered list |
| Testimonials | title, testimonials[] (select from reviews) | Relationship |
| Gallery | title, images[] (select from gallery) | Relationship |
| Statistics | title, stats[] (value, label, icon) | Ordered list |
| FAQ | title, faqs[] (select from FAQ) | Relationship |
| Blog | title, blogs[] (select from blog) | Relationship |
| Partners | title, partners[] (logo, name) | Ordered list |
| Contact CTA | title, subtitle, buttonText, buttonLink | Singleton |
| SEO | metaTitle, metaDesc, metaKeywords, ogImage | Per-section |

### 11.2 Dynamic Page Types

| Page Type | CMS Management |
|-----------|---------------|
| Services | Create/edit/delete service pages. Slug, title, description, content blocks |
| Fleet Vehicles | Create/edit/delete vehicles. Gallery, specs, pricing, features, reviews |
| Tour Packages | Create/edit/delete packages. Itinerary, inclusions, exclusions, hotels, pricing |
| Destinations | Create/edit/delete destinations. Attractions, packages, travel info |
| Blog Posts | Create/edit/delete posts. Categories, tags, featured image, content |
| FAQ | Create/edit/delete. Categories, question, answer, search-enabled |
| Gallery | Upload images, albums, categories |
| Reviews/Testimonials | Customer name, photo, rating, review, vehicle used |
| Offers | Title, description, discount %, valid until, terms |
| Navigation | Menu items, order, parent/child, links |
| Static Pages | About, Terms, Privacy, Refund Policy |

### 11.3 CMS Architecture

```
Admin manages content via:
  /admin/cms/homepage    → Reorder drag-drop sections
  /admin/cms/services    → CRUD for service pages
  /admin/cms/fleet       → CRUD for vehicles
  /admin/cms/packages    → CRUD for tour packages
  /admin/cms/destinations→ CRUD for destination pages
  /admin/cms/blog        → Blog editor
  /admin/cms/faq         → FAQ management
  /admin/cms/gallery     → Image upload
  /admin/cms/testimonials→ Review management
  /admin/cms/navigation  → Menu builder
  /admin/cms/pages       → Static pages
  /admin/cms/settings    → Site-wide settings, SEO, contact info
```

---

## 12. Mobile UX

### 12.1 Mobile-First Principles

```
1. Bottom CTA bar always visible (Call | WhatsApp | Request Quote)
2. Forms are full-width, single column
3. Cards stack vertically
4. Horizontal scroll for fleet/services/destinations
5. Sticky header with compact logo
6. Touch targets: minimum 44x44px
7. Swipe gestures for carousels
8. Infinite scroll for blog/gallery
9. Skeleton loaders for all content
10. No hover-dependent interactions
```

### 12.2 Mobile Breakpoints

```
Mobile:   0-639px   (single column)
Tablet:   640-1023px (2 columns)
Desktop:  1024+px    (3-4 columns)
Wide:     1440+px    (max-width container)
```

### 12.3 Mobile Navigation Behavior

```
Header:
  - Compact (50px vs 72px desktop)
  - Logo only left
  - Hamburger right
  - Scroll: hide on scroll down, show on scroll up

Menu:
  - Full-screen overlay
  - Slide from right
  - Sections with collapsible sub-items
  - CTA buttons (Call, WhatsApp) at bottom of menu

Bottom Bar:
  - Fixed at bottom of viewport
  - 3 buttons: [📞 Call] [💬 WhatsApp] [📝 Quote]
  - z-50, safe-area-inset-bottom for notched phones
  - Height: 64px
  - Hide on keyboard open (detect via visualViewport)
```

---

## Implementation Priority

```
Phase 1: Foundation
  ├── Design System (Tailwind config, CSS variables)
  ├── Layout (Header, Footer, Navigation)
  ├── Shared Components (Buttons, Cards, Forms)
  └── API Routes (Services, Fleet, Packages)

Phase 2: Homepage
  ├── Hero + Quote Form
  ├── All 18 sections
  ├── Mobile responsive
  └── Animations

Phase 3: Service Pages
  ├── Template
  ├── Outstation, Airport, Local
  └── Dynamic CMS content

Phase 4: Fleet
  ├── Overview + Filters
  ├── Vehicle Detail
  └── Sticky booking card

Phase 5: Tour Packages
  ├── Overview + Filters
  ├── Package Detail (itinerary, gallery, booking)
  └── Dynamic from CMS

Phase 6: Destinations
  ├── Destination pages
  └── SEO-optimized content

Phase 7: Customer Portal
  ├── OTP Login
  ├── Dashboard
  ├── Bookings, Quotations, Invoices
  └── Live Tracking

Phase 8: Blog & Content
  ├── Blog listing + detail
  ├── FAQ
  ├── Gallery
  └── Reviews

Phase 9: Utility Pages
  ├── About, Contact
  ├── Offers
  └── Policies

Phase 10: Polish
  ├── SEO (metadata, sitemap, schema)
  ├── Performance (images, fonts, lazy loading)
  ├── PWA (service worker, offline)
  └── Analytics (conversion tracking)
```
