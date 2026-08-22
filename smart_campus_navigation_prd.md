# Smart Campus Navigation — 24-Hour Hackathon PRD

**Status:** Implementation-ready draft  
**Target:** 24-hour hackathon demo  
**Primary development environment:** Antigravity  
**Document rule:** Real campus information must never be invented. Any missing real-world data is explicitly marked as `REQUIRED INPUT`.

---

## 1. Product Overview

### 1.1 Product concept

Build an **AI-powered campus navigation system** centered around a physical kiosk.

A visitor reaches a campus kiosk and can:

1. View an interactive 2D campus map.
2. Search for a building, department, lab, faculty cabin, room, or facility.
3. Ask the AI assistant using natural language.
4. Use voice input for conversational queries.
5. Receive a route from the kiosk's known location to the selected destination.
6. Scan a QR code to transfer the selected route to their phone.
7. Continue navigation through a mobile web application without installing an app.
8. Use voice guidance while navigating.

### 1.2 Core product flow

```text
Visitor
  ↓
Physical Kiosk
  ↓
Ask / Search / Voice
  ↓
AI understands request
  ↓
Campus knowledge database
  ↓
Destination resolved
  ↓
Navigation graph
  ↓
A* / Dijkstra route calculation
  ↓
Interactive 2D SVG map
  ↓
QR code generated
  ↓
User scans with phone
  ↓
Mobile navigation web page
  ↓
Voice / visual guidance
```

### 1.3 Core value proposition

> **Ask where you need to go, see the route instantly, scan once, and continue navigation on your own phone.**

The product should feel like a complete campus-navigation service rather than a static campus map.

---

# 2. Hackathon Strategy

## 2.1 24-hour principle

Do not attempt to build a production-grade indoor positioning platform in 24 hours.

The MVP must prioritize:

- reliability
- visual polish
- complete end-to-end flow
- realistic campus data
- strong demonstration
- simple architecture
- easy deployment

## 2.2 MVP priority

### P0 — Must work

- Kiosk interface
- Interactive 2D campus map
- Campus search
- AI destination understanding
- Campus knowledge database
- Navigation graph
- A* or Dijkstra route calculation
- Route rendering on map
- QR handoff
- Mobile web navigation
- Basic voice input
- Basic voice guidance

### P1 — Add if time permits

- Multi-floor maps
- Faculty-name search
- Hindi/Hinglish queries
- Accessibility-aware routing
- Nearest facility search
- Route recalculation
- Building information cards
- Animated route progression

### P2 — Future scope

- Real-time indoor positioning
- BLE beacons
- AR navigation
- Full 3D campus
- Dedicated mobile application
- Crowd-aware routing
- IoT sensor integration
- Live emergency routing

---

# 3. Critical Rule: Never Invent Campus Data

The implementation must distinguish between:

### Product-generated data

Safe to create:

- UI labels
- navigation algorithms
- route visualization
- generic categories
- sample/demo states

### Real campus data

Must be supplied by the user/team:

- building names
- room numbers
- faculty names
- faculty cabin locations
- departments
- labs
- floor counts
- entrances
- staircases
- elevators
- corridors
- actual distances
- campus coordinates
- official map/floor plans

If real data is missing, the system must not hallucinate it.

Instead:

```text
DATA_NOT_AVAILABLE
```

or show:

> "This location is not currently available in the campus directory."

---

# 4. REQUIRED INPUTS BEFORE IMPLEMENTATION

These inputs must be collected before final campus configuration.

## 4.1 Hackathon information

`REQUIRED INPUT`

- Official hackathon name
- Official problem statement
- Judging criteria
- Hardware requirements
- API/AI restrictions
- Submission requirements
- Demo duration
- Team size

## 4.2 Campus information

`REQUIRED INPUT`

- Campus name
- Campus map/floor plans if available
- Demo area
- Buildings included in MVP
- Floors included
- Building entrances
- Walkable paths
- Staircases
- Elevators
- Important rooms
- Faculty cabins
- Labs
- Facilities

## 4.3 Hardware

`REQUIRED INPUT`

- Kiosk display
- Touchscreen availability
- Laptop/mini PC/Raspberry Pi
- Internet availability
- Audio/speaker availability
- Microphone availability

## 4.4 AI

`REQUIRED INPUT`

- AI provider
- API availability
- Voice API availability
- Supported languages
- API budget/rate limits

---

# 5. Real-World Data Collection Plan

## 5.1 Data source priority

Use sources in this order:

1. Official campus/floor plans
2. Official college directory
3. Physical campus survey
4. Approved photographs/signage
5. Administrative/reception confirmation
6. Existing public map data
7. Manual verification

Do not rely on a single source for important locations if verification is possible.

## 5.2 Physical survey

Team members should walk through the demo area and record:

### Buildings

- ID
- official name
- abbreviation
- building type
- number of floors

### Floors

- floor ID
- floor number
- building ID

### Rooms

- room number
- official room name
- department
- floor
- building

### Faculty

- name
- designation
- department
- cabin/room
- floor
- building

### Facilities

- library
- laboratory
- auditorium
- canteen
- restroom
- reception
- medical room
- parking
- ATM
- other verified facilities

### Navigation

- entrances
- corridors
- junctions
- stairs
- elevators
- ramps
- outdoor paths
- approximate distances

---

# 6. Recommended Data Collection Spreadsheet

Create one master spreadsheet with these sheets.

## `buildings`

| id | name | type | floors |
|---|---|---|---|
| B001 | REQUIRED | REQUIRED | REQUIRED |

## `floors`

| id | building_id | floor_number | map_file |
|---|---|---:|---|
| F001 | B001 | 0 | required |

## `rooms`

| id | building_id | floor_id | room_number | name | category |
|---|---|---|---|---|---|
| R001 | REQUIRED | REQUIRED | REQUIRED | REQUIRED | REQUIRED |

## `faculty`

| id | name | department | room_id |
|---|---|---|---|
| FAC001 | REQUIRED | REQUIRED | R001 |

## `facilities`

| id | name | category | room_id/node_id |
|---|---|---|---|
| POI001 | REQUIRED | REQUIRED | REQUIRED |

## `nodes`

| id | floor_id | x | y | type |
|---|---|---:|---:|---|
| N001 | F001 | REQUIRED | REQUIRED | entrance |

## `edges`

| from | to | distance | accessible |
|---|---|---:|---|
| N001 | N002 | REQUIRED | true |

---

# 7. Map Strategy

## 7.1 MVP map technology

Use:

> **Interactive 2D SVG**

Do not use a static PNG as the primary map.

SVG allows:

- zoom
- pan
- clickable locations
- route overlays
- destination highlighting
- animated routes
- floor switching
- custom styling
- coordinate-based navigation

## 7.2 What the SVG represents

The SVG is the **visual layer**.

It should contain:

- building outlines
- rooms where useful
- corridors
- stairs
- elevators
- entrances
- important POIs
- labels
- navigation nodes/path geometry

The SVG does **not** calculate routes by itself.

---

# 8. How to Build the Campus SVG

## Step 1 — Obtain a verified reference

Use an approved:

- official campus map
- floor plan
- evacuation map
- architectural plan
- surveyed layout

## Step 2 — Simplify

Do not reproduce every architectural detail.

Include only what is useful for navigation.

## Step 3 — Draw

Recommended tools:

- Figma
- Inkscape
- Boxy SVG

For a 24-hour hackathon, Figma/Inkscape is preferred over GIS software unless a team member already knows GIS.

## Step 4 — Export SVG

Each building/floor should ideally have a separate SVG.

Example:

```text
maps/
├── campus.svg
├── cse-ground.svg
├── cse-floor-1.svg
├── library-ground.svg
└── admin-ground.svg
```

---

# 9. Map Coordinate System

Every navigation node and important destination must have coordinates relative to its SVG.

Example:

```json
{
  "id": "AI_LAB",
  "floorId": "CSE_F1",
  "x": 650,
  "y": 320
}
```

These coordinates allow the application to connect database locations to the visual map.

---

# 10. Navigation Graph

The navigation system should represent the campus as a graph.

```text
Node = location / junction / entrance
Edge = walkable connection
Weight = distance or estimated travel cost
```

Example:

```text
N001 → N002 → N003 → N004
                  ↓
                 N005
```

## 10.1 Node types

Supported types:

- entrance
- junction
- corridor
- room
- staircase
- elevator
- ramp
- facility
- destination

## 10.2 Edge attributes

Each edge should support:

```json
{
  "from": "N001",
  "to": "N002",
  "distance": 25,
  "accessible": true,
  "stairs": false
}
```

---

# 11. Route Algorithm

Use:

> **A\*** for the primary route engine.

Dijkstra can be used as a fallback or simpler implementation.

A* should operate only on verified navigation graph data.

Input:

```text
startNode
destinationNode
routingPreferences
```

Output:

```text
ordered node list
distance
estimated walking time
floor changes
instructions
```

Example:

```json
{
  "nodes": ["N001", "N002", "N007", "N014"],
  "distance": 145,
  "estimatedMinutes": 3,
  "floorChanges": 1
}
```

---

# 12. Current Location Strategy for MVP

Do not attempt precise indoor positioning in the initial 24-hour build.

## Default

The kiosk has a known starting location:

```text
currentLocation = KIOSK_LOCATION
```

## Mobile fallback

Allow the user to select:

> "Where are you?"

with verified locations.

Example:

- Main Entrance
- Admin
- CSE Entrance
- Library

## Optional enhancement

Place QR checkpoint markers at major junctions.

Scanning a checkpoint updates:

```text
currentNode = checkpointNode
```

This creates a reliable indoor positioning approximation without requiring BLE infrastructure.

---

# 13. AI Assistant

The AI is not the navigation engine.

Its job is:

1. understand natural language
2. identify intent
3. identify destination
4. query campus data
5. trigger navigation tools
6. answer campus information questions

## Example

User:

> "Mujhe AI lab jaana hai."

AI should resolve:

```json
{
  "intent": "navigate",
  "destinationQuery": "AI lab"
}
```

The backend then resolves the destination against verified campus data.

---

# 14. AI Tool/Function Architecture

The AI should have controlled tools/functions such as:

```text
searchCampusLocations(query)
getLocationDetails(locationId)
findFaculty(name)
findFacilities(category)
calculateRoute(startNode, destinationId)
getCurrentLocation()
startNavigation(destinationId)
```

The LLM must not invent database records.

## Unknown location

If no verified match exists:

> "I couldn't find that location in the campus directory."

---

# 15. Supported Query Types

### Navigation

> "Where is the AI lab?"

### Faculty

> "Where is Professor X's cabin?"

### Department

> "Where is the CSE department?"

### Facility

> "Where is the library?"

### Nearby

> "What is near the CSE block?"

### Information

> "What floor is the AI lab on?"

### Conversational

> "I need to meet the HOD of CSE."

The AI should resolve the request into a verified campus entity.

---

# 16. Voice

## Kiosk

Preferred flow:

```text
Microphone
 ↓
Speech-to-text
 ↓
AI
 ↓
Response
 ↓
Text + optional text-to-speech
```

## Mobile

Use browser-supported speech input where practical.

If browser voice APIs are unreliable for the target demo device, provide a visible text-input fallback.

Voice must never be the only way to operate the system.

---

# 17. Kiosk UI

## Home screen

```text
SMART CAMPUS NAVIGATION

Where do you want to go?

[ Search destination ]

[ 🎤 Ask by voice ]

Popular destinations:
[ Library ]
[ CSE ]
[ Admin ]
[ Auditorium ]

[ Explore Map ]
```

## Route screen

Show:

- current location
- destination
- route
- distance
- estimated time
- floor changes
- QR code
- start/restart navigation

---

# 18. QR Handoff

The QR code should encode a short route/session URL.

Example concept:

```text
/mobile?route=<session-id>
```

Do not put large JSON data directly into the QR unless necessary.

## Route session

Backend stores:

```json
{
  "sessionId": "generated-id",
  "startNode": "N001",
  "destinationId": "R025",
  "route": ["N001", "N004", "N010", "N025"],
  "createdAt": "timestamp"
}
```

The phone opens the route session.

For hackathon reliability, the QR may alternatively encode a compact signed/encoded route payload if backend persistence becomes a bottleneck.

---

# 19. Mobile Web App

The mobile experience should require no installation.

## Mobile screens

### Route overview

- destination
- current location
- distance
- estimated time
- map

### Navigation

- current step
- next instruction
- route map
- voice button

### Search

- campus search
- AI assistant

### Destination

- building
- floor
- room
- description
- relevant information

---

# 20. Route Instructions

Convert graph transitions into human-readable instructions.

Examples:

```text
Walk straight for 50 m.
Turn left at the central junction.
Enter CSE Block.
Take Staircase A to Floor 2.
Turn right.
AI Lab is on your left.
```

For MVP, instructions can be generated from predefined edge/node metadata rather than requiring complex spatial reasoning.

---

# 21. Accessibility

If verified data is available, support:

- stairs
- elevators
- ramps
- accessible entrances

Routing preference:

```text
standard
accessible
```

Accessible route should avoid edges marked:

```text
accessible = false
```

This is a strong optional hackathon feature.

---

# 22. Recommended Tech Stack

The exact stack can be adjusted after confirming team skills.

### Frontend

Recommended:

- React
- TypeScript
- Vite
- Tailwind CSS or equivalent
- SVG
- QR code library

### Backend

Recommended:

- Node.js
- TypeScript
- Express/Fastify or serverless API

Alternative:

- Python + FastAPI

### Database

For a 24-hour prototype:

**PostgreSQL/Supabase** or **Firebase**.

If the data is small and mostly static, a version-controlled JSON dataset can be used for the MVP, with a database as a future upgrade.

### AI

Use the hackathon-approved LLM/API.

### Hosting

Use whichever platform is allowed and fastest for the team.

---

# 23. Suggested Data Architecture

```text
Campus
 ├── Buildings
 │    └── Floors
 │         ├── Rooms
 │         ├── Nodes
 │         └── Map SVG
 │
 ├── Faculty
 ├── Departments
 ├── Facilities
 │
 └── Navigation Graph
      ├── Nodes
      └── Edges
```

---

# 24. Suggested Project Structure

```text
campus-nav/
│
├── apps/
│   ├── kiosk/
│   └── mobile/
│
├── backend/
│   ├── api/
│   ├── ai/
│   ├── navigation/
│   └── services/
│
├── data/
│   ├── buildings.json
│   ├── floors.json
│   ├── rooms.json
│   ├── faculty.json
│   ├── facilities.json
│   ├── nodes.json
│   └── edges.json
│
├── maps/
│   ├── campus.svg
│   └── floors/
│
├── shared/
│   ├── types/
│   └── constants/
│
├── scripts/
│   ├── validate-data
│   └── import-data
│
├── .env.example
└── README.md
```

---

# 25. Data Validation

Before the application starts, validate:

- every room references a real building
- every floor references a real building
- every faculty record references a valid room/location
- every navigation node references a valid floor
- every edge references valid nodes
- every destination has a node
- every map file exists
- no duplicate IDs
- no disconnected destination nodes

Create a validation script:

```text
npm run validate:data
```

The application should fail clearly if required navigation data is invalid.

---

# 26. Kiosk → Mobile Architecture

```text
                 KIOSK
                   │
             React Web App
                   │
          ┌────────┴────────┐
          ↓                 ↓
      Campus Map           AI
          │                 │
          └────────┬────────┘
                   ↓
             Route Engine
                   │
                   ↓
              QR Session
                   │
                   ↓
              USER PHONE
                   │
             Mobile Web App
                   │
          ┌────────┴────────┐
          ↓                 ↓
        Map              Voice
          │                 │
          └────────┬────────┘
                   ↓
             Navigation
```

---

# 27. Demo Hardware

Do not over-engineer.

Minimum:

- laptop/PC
- large monitor/display
- microphone
- speaker
- internet
- phone for QR demonstration

Optional:

- touchscreen display
- Raspberry Pi/mini PC
- physical kiosk enclosure

The laptop can act as the kiosk computer.

---

# 28. 24-Hour Implementation Plan

## Hour 0–2 — Data

- finalize demo area
- collect official map/floor-plan references
- survey missing locations
- collect room/faculty/facility data
- define navigation nodes

**Deliverable:** verified dataset.

## Hour 2–5 — Map

- create SVG
- create floor maps
- define coordinates
- define navigation nodes/edges

**Deliverable:** working interactive map.

## Hour 5–8 — Routing

- implement graph
- implement A*
- implement route rendering
- implement route instructions

**Deliverable:** destination → route.

## Hour 8–12 — Kiosk

- home screen
- search
- map
- destination screen
- QR generation

**Deliverable:** complete kiosk flow.

## Hour 12–15 — Mobile

- QR route opening
- mobile map
- route details
- navigation screen

**Deliverable:** kiosk → phone flow.

## Hour 15–18 — AI

- campus search
- natural-language destination resolution
- tool/function calls
- text response
- voice input if stable

**Deliverable:** AI navigation.

## Hour 18–20 — Voice/accessibility

- voice output
- language support if feasible
- accessibility routing if data exists

## Hour 20–22 — Polish

- animations
- loading states
- error states
- responsive UI
- kiosk presentation

## Hour 22–24 — Testing/demo

- test all routes
- test QR on multiple phones
- test unknown destinations
- test AI failures
- prepare demo script
- record backup demo video/screenshots

---

# 29. Demo Scenario

The demo should tell one simple story.

### Scene 1

Visitor arrives at campus.

### Scene 2

Kiosk asks:

> "Where would you like to go?"

### Scene 3

Visitor says:

> "I need to meet the CSE HOD."

### Scene 4

AI resolves the verified faculty/location record.

### Scene 5

Kiosk displays:

```text
Main Entrance
     ↓
CSE Block
     ↓
Floor 2
     ↓
HOD Cabin
```

### Scene 6

QR appears.

### Scene 7

Judge scans it.

### Scene 8

Phone opens the same route.

### Scene 9

Voice guidance starts.

### Scene 10

Change destination:

> "Actually, take me to the library."

The system recalculates.

This demonstrates the complete product rather than individual features.

---

# 30. Failure Handling

## Unknown destination

Show:

> "I couldn't find that location."

Offer:

- search again
- browse buildings
- popular destinations

## AI unavailable

Search must still work.

The application should remain usable without the AI.

## Voice unavailable

Show text input.

## QR/backend failure

Provide:

> "Open mobile navigation"

with a fallback route URL or manual destination selection.

## Missing campus data

Never fabricate.

Display:

> "This location has not been added to the campus directory yet."

---

# 31. Security and Privacy

The MVP should avoid collecting unnecessary personal information.

Do not require:

- name
- phone number
- email
- account creation

for basic navigation.

QR sessions should contain only necessary navigation information.

Do not expose private faculty information beyond what is officially approved for the demo.

---

# 32. What NOT to build in the 24-hour MVP

Do not allow these features to consume core development time:

- real-time indoor GPS replacement
- BLE trilateration
- AR navigation
- full 3D map
- custom hardware navigation nodes
- native mobile app
- sophisticated RAG pipeline
- crowd prediction
- facial recognition
- live user tracking
- complex authentication

They can appear under **Future Scope**.

---

# 33. Future Roadmap

## Phase 2

- BLE indoor positioning
- QR checkpoints
- multi-building navigation
- richer accessibility routing
- multilingual voice

## Phase 3

- 3D campus visualization
- AR navigation
- live occupancy
- emergency route management
- smart kiosks across campus

## Phase 4

- IoT-enabled campus
- real-time positioning
- crowd-aware routing
- campus digital twin
- integration with college systems

---

# 34. Success Criteria

The hackathon MVP is successful if a judge can:

1. Approach the kiosk.
2. Ask for a verified destination.
3. See the destination on the campus map.
4. See a valid route.
5. Scan a QR code.
6. Open the route on a phone.
7. Start navigation.
8. Receive basic guidance.
9. Change the destination.
10. Complete the entire flow without developer intervention.

---

# 35. Antigravity Implementation Instructions

Antigravity must follow these rules.

## Rule 1 — No invented campus data

Use placeholders until verified data is supplied.

## Rule 2 — Separate data from UI

Campus information must live in structured data files/database, not hard-coded across components.

## Rule 3 — Separate map from routing

SVG is presentation.

Navigation graph is logic.

## Rule 4 — AI must use tools/data

Do not allow the LLM to invent destinations or routes.

## Rule 5 — Search must work without AI

The basic product must remain functional if the AI API fails.

## Rule 6 — Mobile and kiosk share the same backend/data

Do not duplicate campus information.

## Rule 7 — Optimize for the demo

Prioritize stable P0 functionality over experimental P2 features.

---

# 36. Required Antigravity Build Sequence

Antigravity should implement in this order:

```text
1. Project setup
       ↓
2. Data schemas
       ↓
3. Campus sample/placeholder dataset
       ↓
4. SVG map renderer
       ↓
5. Navigation graph
       ↓
6. A* routing
       ↓
7. Kiosk UI
       ↓
8. Mobile UI
       ↓
9. QR handoff
       ↓
10. AI tools
       ↓
11. Voice
       ↓
12. Accessibility
       ↓
13. Validation
       ↓
14. Polish
```

Do not begin with the AI chatbot.

The navigation foundation must exist first.

---

# 37. Final MVP Architecture

```text
                       ┌──────────────────┐
                       │  PHYSICAL KIOSK  │
                       └────────┬─────────┘
                                │
                         Kiosk Web App
                                │
                ┌───────────────┼───────────────┐
                │               │               │
              Search           AI            Voice
                │               │               │
                └───────────────┼───────────────┘
                                │
                         Campus Database
                                │
                    ┌───────────┴───────────┐
                    │                       │
                SVG Maps              Navigation Graph
                                            │
                                           A*
                                            │
                                            ↓
                                         Route
                                            │
                                ┌───────────┴───────────┐
                                │                       │
                              Kiosk                    QR
                                                        │
                                                        ↓
                                                  Mobile Web
                                                        │
                                              ┌─────────┴─────────┐
                                              │                   │
                                             Map                Voice
                                              │                   │
                                              └─────────┬─────────┘
                                                        ↓
                                                   Navigation
```

---

# 38. Product Positioning

Do not present this as:

> "A campus map website."

Present it as:

> **"An AI-powered smart campus navigation kiosk that understands natural-language requests, connects them to verified campus information, calculates indoor routes, and seamlessly transfers navigation to the visitor's phone through a QR code."**

The strongest demo is the complete chain:

**Ask → Understand → Locate → Route → Visualize → Scan → Navigate.**

---

# 39. Immediate Next Steps

Before implementation begins, collect these real inputs:

- [ ] Official hackathon problem statement/rules
- [ ] Actual campus name
- [ ] Demo buildings/area
- [ ] Campus/floor-plan reference
- [ ] Verified building list
- [ ] Verified room list
- [ ] Faculty/cabin information approved for use
- [ ] Lab/facility information
- [ ] Entrance/stair/elevator information
- [ ] Approximate walkable paths/distances
- [ ] Available kiosk hardware
- [ ] AI/API availability
- [ ] Team size and technical skills

Once these are available, replace all `REQUIRED INPUT` fields with verified information.

**Do not generate or assume missing campus information.**

---

## Final Hackathon Scope

### Build

**AI + Kiosk + 2D SVG + A* + QR + Mobile Web + Voice**

### Don't build

**3D + AR + BLE positioning + IoT mesh + native app**

The objective is not to demonstrate every possible technology.

The objective is to demonstrate a **complete, polished, believable smart-campus navigation experience within 24 hours.**
