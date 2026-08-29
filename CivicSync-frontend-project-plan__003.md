# CivicSync — Comprehensive End-to-End Frontend Project Plan


**One-Liner:** A trust-verified community platform where blood, pet care, charity, and disaster relief requests get verified before they go public — plus two free-standing civic features (water-clogging reports and disease pre-alerts) that run on the same map and don't touch money at all.

**Pitch Strategy for Project Show:** Position this as the "trust infrastructure for local giving and civic action," not just another CRUD donation app. The central theme is **Provable Trust**. Every feature must visually reinforce that this system guarantees authenticity.

---

## 1. Detailed User Personas & Roles

The system caters to 5 distinct roles, sharing a unified frontend architecture.

### 1.1 The Donor (The Giver)
*   **Goal:** Wants to help the community but is skeptical of fake charity requests.
*   **Pain Point:** "I don't know if my money/blood is actually reaching the right person."
*   **App Interactions:** Browsing the Home Feed, viewing the Trust Trail, making donations, receiving "Proof of Impact" notifications.
*   **Key UI Need:** High-transparency campaign cards, clear "Verified" badges, frictionless payment/contact flows.

### 1.2 The Requester (The Receiver)
*   **Goal:** Needs urgent help (blood, pet treatment, funds, disaster relief).
*   **Pain Point:** Desperation and the need for quick amplification.
*   **App Interactions:** Submitting "New Requests," uploading proof documents, posting updates, tracking campaign progress.
*   **Key UI Need:** Extremely simple and fast multi-step forms, clear status indicators (Pending -> Verified -> Live).

### 1.3 The Civic Reporter (The Citizen)
*   **Goal:** Wants to report local issues (water-clogging, disease symptoms) without hassle.
*   **Pain Point:** Bureaucratic reporting systems take too long.
*   **App Interactions:** One-click quick reports, dropping pins on maps, anonymous symptom toggles.
*   **Key UI Need:** Map-centric interface, quick photo upload (webcam capture or file upload), instant feedback loops.

### 1.4 The Verifier Partner (The Authority: Hospital, Vet, NGO)
*   **Goal:** Wants to validate requests quickly to facilitate aid.
*   **Pain Point:** Overwhelmed with unstructured requests.
*   **App Interactions:** Viewing a specialized dashboard, approving/rejecting requests with reasons.
*   **Key UI Need:** A clean, optimized "Queue" view (table/list), quick-action buttons (Approve/Reject), document preview modals.

### 1.5 The System Admin (The Moderator)
*   **Goal:** Maintain platform integrity and manage partners.
*   **App Interactions:** Global dashboard, partner onboarding, dispute resolution, platform analytics.

*Note: In the frontend, the Verifier and Admin share the same dashboard interface, just with different data scoping and permission toggles.*

---

## 2. Comprehensive Feature Breakdown

### A. The Trust Engine (Core USP)
*   **The Trust Trail:** A vertical timeline component on every campaign showing its lifecycle: Submitted -> Verified by [Partner] -> Live -> Goal Reached -> Proof of Impact Uploaded.
*   **Unified Badge System:** Standardized status badges across the app: 
    *   *Grey/Dashed:* Pending Verification
    *   *Green/Solid with Check:* Verified
    *   *Red/Muted:* Flagged/Resolved

### B. Giving Modules (Money/Resource)
*   **Blood Donation:** Matches donors to patients. No money involved. UI focuses on Blood Type, Urgency, and Hospital location.
*   **Pet Care:** Crowdfunding for injured strays. UI highlights photos, vet estimates, and verified clinic names.
*   **Charity / Medical:** General fundraising. UI focuses on goal progress bars, recipient stories, and verification documents.
*   **Disaster Relief:** High-urgency, location-based campaigns. UI features map clusters and bulk-resource needs.

### C. Civic Modules (Data/Reporting)
*   **Water-Clogging Radar:** Live map showing flooded streets. Users snap photos, drop pins. Others can "Confirm" the pin to boost its validity.
*   **Disease Pre-Alerts:** Anonymous symptom reporting (e.g., "Fever," "Dengue symptoms"). Backend aggregates data and pushes localized alerts to the map and user feeds when thresholds are met.

---

## 3. Deep-Dive Information Architecture

This is a **web app** (desktop-first, responsive down to tablet/mobile browser widths) — so navigation lives in a persistent **top navbar** (or a collapsible left sidebar on wider screens), not a mobile bottom tab bar. The Home page itself is redesigned as a **unified social-feed**, closer to Facebook/Twitter than a typical donation-app dashboard: every kind of post — verified campaigns, civic reports, disease alerts, proof-of-impact updates — flows into one scrollable timeline, and the other sections become dedicated nav destinations rather than mobile tabs.

```text
CivicSync Web App
├── Onboarding Flow
│   ├── Landing / Welcome Screen (Animated Logo, value prop)
│   ├── Role Selection (Giver / Requester - purely for UX personalization)
│   └── Permissions (Location, Camera/Webcam, Browser Notifications)
│
├── Top Navigation Bar (Persistent, across all pages)
│   ├── Logo / Home link
│   ├── Nav Items: Home | Map | Alerts | Profile
│   ├── Global "New Post" Button (opens the Report/Request composer — replaces the mobile FAB)
│   ├── Search bar
│   └── Notification bell + Avatar/Profile dropdown
│
├── 1. Home (Main Feed — "Social Media" Style)
│   ├── Composer/Prompt bar at top ("Need help or want to report something?" → opens New Post modal)
│   ├── Unified Feed — ALL post types interleaved chronologically/by-relevance:
│   │   ├── Campaign Posts (Blood / Pet / Charity / Disaster) — Trust Badge, progress bar, Donate/Help CTA
│   │   ├── Civic Reports (Water-Clogging pins) — photo, "Confirm This" action, confirmation count
│   │   ├── Disease Pre-Alert posts — localized alert card, threshold info
│   │   └── Proof-of-Impact / Update posts — reshared updates from campaigns the user follows
│   ├── Category Filters (Pills: All, Blood, Pet, Charity, Disaster, Civic Reports, Alerts)
│   ├── Social interaction bar per post: Like/Support, Comment, Share, Confirm (for civic reports)
│   └── Campaign Detail Modal (Trust Trail, Donate CTA, Updates, Comments)
│
├── 2. Map (Nav Item / Dedicated Page)
│   ├── Interactive Map Interface (Google Maps / Mapbox)
│   ├── Layer Toggles (Clogging Pins, Disease Heatmap, Campaign Locations)
│   └── Pin Detail Side Panel / Popover (not a mobile bottom sheet — inline panel next to the map)
│
├── New Post Modal (Triggered from Navbar "New Post" button, available from anywhere)
│   ├── Request Help (Multi-step form for Blood/Pet/Charity/Disaster)
│   ├── Report Clogging (Photo upload/webcam capture + geotag via browser location)
│   └── Report Symptom (Anonymous 2-click form)
│
├── 3. Alerts (Nav Item)
│   ├── Localized Disease Warnings
│   └── Platform Notifications (e.g., "Your donation reached its goal")
│
├── 4. Profile (Nav Item)
│   ├── User Impact Dashboard (Total donated, reports verified)
│   ├── Activity History (My Requests, My Donations, My Reports)
│   ├── Settings & Language Toggle (EN/BN)
│   └── Verifier/Admin Portal Entry (Visible link/section for authorized roles)
│
└── Verifier/Admin Portal (Separate Route, e.g. /admin)
    ├── Auth/Login
    ├── Pending Verification Queue (Data table with filters — ideal for the extra screen space a web layout gives)
    └── Request Review Modal (Approve/Reject/Require Info)
```

---

## 4. Excruciatingly Detailed End-to-End Workflows

### Workflow 1: The Blood Donation Lifecycle (The Demo Winner)
1.  **Request:** User clicks 'New Post' -> 'Request Help' -> 'Blood'. Enters Patient Name, Blood Type (Dropdown), Units needed, Hospital (Searchable list). Submits.
2.  **State Change:** Request appears in user's Profile as *Pending Verification*.
3.  **Verification:** Hospital Admin (Verifier) logs into Dashboard. Sees the request in their queue. Checks their internal registry. Clicks **Approve**.
4.  **Go Live:** Request instantly appears on the Home Feed and Map with a shiny green **Verified** badge.
5.  **Matching:** A Donor browses the Home feed, filters by "Blood", sees the request, and views the Trust Trail ("Verified by City Hospital 5 mins ago").
6.  **Action:** Donor clicks "I can donate". A confirmation modal appears. The Requester is notified.
7.  **Closure:** After donation, Requester uploads a photo (Proof). Trust Trail updates to "Completed". Donor gets a push notification: "Your blood saved a life today."

### Workflow 2: Water-Clogging Crowd-Sourcing
1.  **Report:** User encounters a flooded street (or hears about one). Clicks 'New Post' -> 'Report Clogging'.
2.  **Capture:** A webcam-capture or file-upload dialog opens. User uploads/snaps a photo. Browser Geolocation API pulls coordinates automatically (with a manual pin-adjust fallback on the map).
3.  **Submit:** User clicks 'Submit'. Pin drops on the Map instantly and a post appears in the Home feed, colored *Yellow (Unconfirmed)*.
4.  **Crowd-Verification:** Another user sees the post in their Home feed or opens the Map, sees the Yellow pin. Clicks it, views the photo, and clicks **"Confirm This"**.
5.  **State Change:** Pin turns *Red (Confirmed)* after 3 user confirmations.
6.  **Resolution:** 12 hours later, without further confirmations, or if a user reports it cleared, the pin fades out (and the feed post is marked resolved).

### Workflow 3: Verifier Partner Queue Management
1.  **Login:** Vet Clinic logs in.
2.  **Dashboard:** They see a split-pane view. Left: List of pending Pet Care requests. Right: Detail view.
3.  **Review:** They click a request. They see the user-uploaded photo of the injured stray and the description.
4.  **Action:** They can click "Approve" (turns it live), "Reject" (requires typing a reason), or "Request Info" (sends a notification back to user asking for a clearer photo).

---

## 5. Screen-by-Screen UI/UX Specifications

### Screen: Home Feed (Social-Media Style, Unified)
*   **Header:** Persistent top navbar (logo, nav links, "New Post" button, search, notification bell, avatar).
*   **Sub-header:** Horizontal scrolling filter pills (All, Blood, Pet, Charity, Disaster, Civic Reports, Alerts).
*   **Composer Bar:** A Facebook/Twitter-style prompt at the top of the feed ("Need help, or want to report something?") that opens the New Post modal — this is the primary entry point for creating any post type on web, replacing a mobile FAB.
*   **Body:** Infinite scroll of a single, unified timeline mixing Campaign Posts, Civic Report Posts, and Alert Posts — this is the core "social feed" feel: users don't have to leave Home to see a flooded street report or a disease alert next to a blood request.
*   **Campaign Post Card UI:**
    *   Top left: Category Icon + Trust Badge (Verified) + timestamp (social-post style).
    *   Center: High-quality image (if applicable) or bold typography for blood/urgent needs.
    *   Content: Title, Location (distance from user), Progress bar (Funds raised / required).
    *   Interaction bar: "Donate/Help" primary button, plus Like/Support, Comment, and Share — like a normal social post.
*   **Civic Report / Alert Post Card UI:**
    *   Same card shell as a Campaign Post for visual consistency, but action bar swaps "Donate" for "Confirm This" (clogging reports) or "View on Map" (disease alerts), keeping the whole feed feeling like one cohesive social timeline rather than two different apps stitched together.

### Screen: Campaign Detail (The "Trust Trail" Screen)
*   **Hero Image/Header:** Full width.
*   **Sticky Bottom Bar:** Call to Action ("Donate Now") always visible on scroll.
*   **Body Content:**
    *   **Tab 1: Story.** The requester's description.
    *   **Tab 2: Trust Trail (Crucial).** A vertical stepper component:
        *   ✅ *Nov 12, 10:00 AM:* Request Submitted by [User]
        *   ✅ *Nov 12, 11:30 AM:* Verified by [Delta Hospital] - *View Document*
        *   ⏳ *In Progress:* Raising 50,000 BDT (60% funded)
        *   🔒 *Pending:* Proof of Funds Usage
*   **UI Vibe:** Transparent, clinical, highly professional.

### Screen: The Map
*   **Base:** Dark mode or desaturated map style (so pins pop).
*   **Floating Elements:** Search bar at top. "Locate Me" button bottom right.
*   **Data Layers:**
    *   Water pins (Blue/Yellow).
    *   Disease Heatmap (Subtle red glowing zones).
    *   Active campaigns (Custom icons).
*   **Interaction:** Clicking a pin opens an inline side panel (docked next to the map, not a mobile bottom sheet) with details, photos, and a "Confirm" or "Get Directions" button.

---

## 6. UI Direction & Aesthetics

To wow the judges, the app must look like a premium, state-of-the-art product, not a generic class assignment.

*   **Color Palette:**
    *   **Primary (Trust):** Deep Civic Blue (`#1A365D`) or Teal (`#0D9488`).
    *   **Backgrounds:** Off-white (`#F8FAFC`) for light mode, deep slate (`#0F172A`) for dark mode (highly recommended for the "premium" feel).
    *   **Semantic Colors (Strict usage):**
        *   *Verified/Success:* Emerald Green (`#10B981`).
        *   *Warning/Clogging:* Amber (`#F59E0B`).
        *   *Urgent/Blood/Disease:* Rose/Crimson (`#E11D48`).
*   **Typography:** Modern, highly legible sans-serif. Use **Inter** or **Outfit**. Heavy weights for headers (bold, authoritative), medium for body (clean).
*   **Shapes & Components:**
    *   Slightly rounded corners (e.g., `border-radius: 12px` or `16px`).
    *   Glassmorphism (frosted glass) effects on map overlays and sticky headers to give a modern, layered feel.
    *   Micro-animations: Buttons should have a subtle hover/scale-down effect on click. The Trust Badge should have a subtle shimmer effect.
*   **No Placeholders:** In the demo, use high-quality, realistic images, realistic hospital names, and localized Dhaka addresses.

---

## 7. Execution Strategy (MVP to Final)

### Phase 1: Foundation & The "Wow" Flow (Weeks 1-2)
1.  Setup project (React/Next.js or Vite, Tailwind/Vanilla CSS, Framer Motion for animations).
2.  Build the unified UI Shell (Top Navbar, App Header, Layout wrappers).
3.  **Build the Blood Donation Flow completely.** This is your primary demo. It proves the requester-verifier-donor loop.
4.  Build the Trust Trail component (it will be reused everywhere).

### Phase 2: The Map & Civic Features (Week 3)
1.  Integrate Mapbox or Google Maps.
2.  Implement the Water-Clogging report flow (camera to pin-drop).
3.  Implement the Disease pre-alert heatmap layer.

### Phase 3: Expansion & Dashboard (Week 4)
1.  Clone the Blood flow for Pets, Charity, and Disaster (just changing form fields and card visuals).
2.  Build the Verifier Dashboard (table view, modal reviews).

### Phase 4: Polish for the Pitch (Week 5)
1.  Seed the database with hyper-realistic fake data (Real Dhaka locations, realistic requests).
2.  Add micro-interactions (shimmers on loading, smooth page transitions).
3.  Ensure the Bengali toggle works for the main Home and Detail screens.

---

## 8. Stretch Goals (If Time Permits)

These are not core to the MVP or the pitch demo, but would strengthen the "gamified civic engagement" angle if the timeline allows — build these only after Phases 1-4 are solid.

*   **Contributor Leaderboard:**
    *   A dedicated Leaderboard page (or a widget on Profile/Home sidebar) ranking users by a **Points** system.
    *   Points earned for: donating, having a request verified, confirming civic reports (clogging pins), submitting disease pre-alerts that get validated, and uploading Proof of Impact.
    *   Weekly / Monthly / All-Time toggle, plus a "Top in your area (Dhaka)" filter to keep it locally relevant.
    *   Badges/Titles for milestones (e.g., "Verified Blood Hero," "Community Watcher") displayed on the user's Profile and next to their name on feed posts — reinforces the "Trust" theme by rewarding verified, high-integrity contributions rather than raw activity.
*   **Streaks & Engagement Nudges:** Simple "X-day reporting streak" indicator to encourage consistent civic reporting.
*   **Points-to-Perks (Optional):** Top contributors get a subtle visual flair (e.g., a gold ring around their avatar) — purely cosmetic, no monetary value, to keep it distinct from the money-based Giving Modules.

---

