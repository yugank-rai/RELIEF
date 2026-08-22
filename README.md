# 🚨 RELIEF — Requirements (v1, locked before build)

**Team YuVaRA** · OmniKon National Hackathon 2026 · Theme: Disaster Management · Timeframe: ~2 days

---

## 1. Scope

### In scope (build for demo)
- Citizen incident reporting (multi-step form, offline-tolerant)
- Rule-based priority scoring + dedup/corroboration logic
- Volunteer matching (skill + distance + availability)
- Resource stock check at nearest center
- Public emergency dashboard (map + active incidents)
- Emergency response dashboard (authority side: queue, assign, status)
- Shelter & resource finder
- Basic auth with 4 roles: `citizen`, `volunteer`, `authority`, `resource_manager`

### Out of scope / cut if time runs short
- Admin analytics dashboard (charts, audit log, user/role management UI) — lowest demo priority, can be static/mocked
- LLM doubt-clearing chatbot — explicitly rejected earlier (contradicts "rule-based, not AI/ML" positioning); may revisit as a constrained FAQ layer post-hackathon
- Real SMS gateway integration — build the offline sync queue and the code path for it, but a live Twilio account is optional; can be demoed as "queued, ready to send" without an actual SMS provider key
- Hospital network / NGO database / IoT integrations (listed as future scope in the deck, not this build)

---

## 2. Tech Stack (Locked)

- **Backend**: Node.js + Express, TypeScript, Drizzle ORM, PostgreSQL, Zod for validation, JWT auth
- **Frontend**: React + TypeScript (Vite), Tailwind CSS, shadcn/ui-style components, Lucide icons, React Leaflet (OpenStreetMap) for maps, Recharts (only if admin dashboard is reached)
- **Dev tooling**: `tsx` (backend dev server), `drizzle-kit` (migrations)

> *No other frameworks substituted mid-build without discussion.*

---

## 3. Data Model Summary

*(Full schema defined in step 3 — this is the entity list only.)*

- **`users`**: role (`citizen` / `volunteer` / `authority` / `resource_manager`), skills, location
- **`incidents`**: type, severity, status, location, reportCount, isDuplicateOf, priorityScore, clientCreatedAt / serverReceivedAt (for offline sync ordering)
- **`resource_centers` + `resource_stock`**: item type, quantity
- **`shelters`**: capacity, occupancy, active status

---

## 4. Auth & Roles

- JWT-based auth, role stored in token
- 4 roles, route-level RBAC:
  - **`citizen`**: report incidents, view own reports, find shelters
  - **`volunteer`**: view assigned/nearby tasks, accept/update status
  - **`authority`**: view all incidents, assign responders, override status
  - **`resource_manager`**: manage stock, view demand vs supply
- Citizen incident reporting must also work unauthenticated (anonymous reporting option, per UX spec) — auth is required for volunteer/authority/resource_manager actions only

---

## 5. Feature List by Priority Tier

### Must-have (demo depends on these)
- Incident create + list API
- Priority scoring engine (weighted formula, locked below)
- Dedup/geo-check logic (spatial + temporal + category match, corroboration not discard)
- Volunteer matching (skill + distance + availability)
- Incident reporting flow UI (multi-step, mobile-first)
- Emergency response dashboard UI (queue + status controls)

### Nice-to-have
- Public emergency dashboard with live map
- Shelter & resource finder UI
- Offline sync queue (client-side IndexedDB queue + reconnect flush)

### Cut if short on time
- Admin analytics dashboard
- Disaster details page (can reuse dashboard components instead of a dedicated page)
- Real SMS provider integration

---

## 6. Screen Build Order (Confirmed)

1. Incident reporting flow (current focus)
2. Public emergency dashboard
3. Emergency response dashboard
4. Shelter & resource finder
5. Disaster details page (if time remains)
6. Admin dashboard (if time remains)

---

## 7. Locked Logic Decisions (Do not re-derive mid-build)

### Priority formula:
$$\text{Priority} = (0.35 \times \text{Severity}) + (0.20 \times \text{TimeWaiting}) + (0.20 \times \text{Vulnerability}) + (0.15 \times \text{ResourceUrgency}) + (0.10 \times \text{ReportCount})$$

- All inputs normalized to 0–10 before weighting. Max score = 10.

### Dedup rule:
New report flagged as possible duplicate of an open incident if:
- **Spatial**: ~150–200m radius (wider in low-GPS areas) **AND**
- **Temporal**: 6–12hr rolling window **AND**
- **Category**: same incident type

*On match:* link as corroboration, increment `reportCount`, do not discard.
*On no match:* create new incident.

### Offline sync conflict rule:
When two offline reports for the same incident sync on reconnect, use **server arrival time** (not device clock) to pick the canonical incident; the later one becomes a linked corroboration record, not a discarded duplicate.

---

## 8. Non-functional Requirements

- Mobile-first, fully responsive
- WCAG-aligned: keyboard navigation, screen reader support, severity shown via icon + text + color (never color alone)
- Persistent emergency action button on mobile
- Loading/empty/error/success states on every data view
- Confirm before destructive actions
- Realistic sample data for prototype/demo (no lorem ipsum)
