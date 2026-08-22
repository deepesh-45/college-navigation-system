# 📐 Smart Campus Navigation — Concise Dataset Schema & Data Filling Rules

This rule specification enforces strict, consistent data entry across `llmRoutesKnowledge.ts` and `campusGraphData.ts`.

---

## 🧭 1. Compass Angles & Heading Standards

| Angle (° Degree) | Direction Text (`headingText`) | Allowed Degrees (`headingDegrees`) |
| :--- | :--- | :--- |
| **0° / 360°** | `North (360°)` | `0` or `360` |
| **90°** | `East (90°)` | `90` |
| **180°** | `South (180°)` | `180` |
| **270°** | `West (270°)` | `270` |

> ⚠️ **Rule**: Never use arbitrary angles (e.g. 45° or 120°). Round all turn angles to the nearest cardinal quadrant (0°, 90°, 180°, 270°).

---

## 👟 2. Step Count & Stride Rules (`stepsCount`)

- **Base Measurement Unit**: 1 Physical Stride Step $\approx 0.75 \text{ meters}$.
- **Turn-Only Steps**: Set `stepsCount: 0` for pivot turns in place.
- **Walking Steps**: Must be a positive integer ($> 0$).
- **Total Distance Formula**:
  $$\text{totalDistanceMeters} = \text{Math.round}(\text{totalSteps} \times 0.75)$$

---

## 🏷️ 3. Category & Type Specifications

### Route Categories (`category`):
Must be strictly one of:
- `'washroom'` • `'lab'` • `'cabin'` • `'classroom'` • `'facility'` • `'entrance'` • `'canteen'`

### Graph Node Types (`type`):
Must be strictly one of:
- `'entrance'` • `'junction'` • `'staircase'` • `'elevator'` • `'washroom'` • `'lab'` • `'cabin'` • `'facility'` • `'canteen'`

---

## 🆔 4. Identifier (ID) Naming Conventions

Use uppercase `SNAKE_CASE` for all identifiers:

- **Route IDs**: `ROUTE_[CATEGORY]_[LOCATION_NAME]`  
  *Example*: `ROUTE_WASHROOM_GROUND`, `ROUTE_AI_LAB_CS204`

- **Node IDs**: `NODE_[TYPE]_[LOCATION_NAME]`  
  *Example*: `NODE_MAIN_ENTRANCE`, `NODE_JUNCTION_NOTICE_BOARD`

- **Edge IDs**: `EDGE_[FROM_NODE]_TO_[TO_NODE]`  
  *Example*: `EDGE_LOBBY_TO_NOTICE_BOARD`

---

## 📍 5. Landmark Hints & Voice Prompts

- **`landmarkHint`**: Required at every turn, node, or stair landing. Must describe a physically visible object (e.g. *"Notice board corner wall"*, *"Water cooler & fire extinguisher"*, *"Floor 1 glass double doors"*).
- **`voicePrompt`**: Concise, spoken instruction (e.g. *"Facing North, walk 25 steps straight down the main corridor."*).

---

## ⚡ 6. Validation Command

Before committing or testing, always verify database schema integrity:
```bash
npm run validate:data && npx tsc --noEmit
```
