# 🛠️ Smart AI Campus Navigation — Technical Stack & System Architecture

This document provides a comprehensive technical breakdown of the architecture, technologies, data schemas, AI models, sensors, and deployment pipelines powering the **Smart AI Campus Navigation System**.

---

## 🏗️ 1. High-Level Architecture Overview

```text
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │ PRESENTATION LAYER (Mobile-First Web App)                                        │
 │ • React 18 + TypeScript + Vite 6 + Tailwind CSS                                 │
 │ • Framer Motion Kinetic Animations + Three.js Vanta.js Canvas                   │
 │ • Google Fonts (Alkatra, Patua One, Space Grotesk, Outfit, Inter)               │
 └──────────────────────────────────────┬──────────────────────────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        ▼                               ▼                               ▼
 ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
 │ VOICE AI ENGINE      │    │ MOBILE SENSORS       │    │ ADMIN DATA FEEDING   │
 │ • STT: SpeechRecog.  │    │ • DeviceOrientation  │    │ • Password Auth      │
 │ • TTS: SpeechSynth.  │    │   360° Compass       │    │ • Live Sensor Feeds  │
 │ • Google Gemini AI   │    │ • DeviceMotion       │    │ • Gemini AI Route    │
 │ • LLM Route Engine   │    │   Step Counter       │    │   Generator          │
 └──────────────────────┘    └──────────────────────┘    └──────────────────────┘
        │                               │                               │
        └───────────────────────────────┼───────────────────────────────┘
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │ DATA & DEPLOYMENT LAYER                                                         │
 │ • Decoupled JSON Schemas (LLMRouteKnowledge, Buildings, Rooms, Faculty, Nodes)   │
 │ • GitHub Pages Automated Deployment + Vite Static Production Bundle             │
 └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 2. Frontend Technology Stack

| Technology / Library | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^18.2.0` | Core UI component framework |
| **TypeScript** | `^5.2.2` | Strict type safety & contract enforcement |
| **Vite** | `^6.4.3` | Lightning-fast HMR dev server & production bundler |
| **Tailwind CSS** | `^3.4.1` | Utility-first responsive styling & master color palette |
| **Framer Motion** | `^11.0.8` | Kinetic headline animations & seamless tab transitions |
| **Lucide React** | `^0.344.0` | Modern SVG iconography |
| **Vanta.js / Three.js**| `^0.5.24` / `^0.162.0` | Interactive 3D dots background canvas |
| **@google/genai** | `^0.1.1` | Official Google Gemini AI SDK |

---

## 🎨 3. Typography & Master Design Palette

### Google Fonts:
- **`Alkatra`** (`font-alkatra`): Kinetic Hindi headlines (*"नमस्कारम्!"*, *"स्वागतम्"*).
- **`Patua One`** (`font-patua`): Bold English headlines (*"Hello!"*, *"Welcome!"*).
- **`Space Grotesk`** (`font-[#level1]`): Primary level headers & route titles.
- **`Outfit`** (`font-[#level2]`): Secondary subheadings & navigation prompts.
- **`Inter`** (`font-[#level3]`): Body text, instructions, and metadata badges.

### Master HSL Color Palette:
- **Namaskaram Gradient**: `linear-gradient(135deg, #1d4ed8 0%, #6d28d9 50%, #be185d 100%)`
- **Hello Gradient**: `linear-gradient(135deg, #0284c7 0%, #4338ca 100%)`
- **Primary Button Gradient**: `linear-gradient(135deg, #1d4ed8 0%, #4338ca 50%, #6d28d9 100%)`

---

## 🤖 4. Natural Language AI & Bi-Directional Voice Processing

### A. Speech-to-Text (STT) Integration (`speechService.ts`)
- **Speech Recognition**: Uses browser-native `window.SpeechRecognition` / `webkitSpeechRecognition` to transcribe live user voice inputs into text queries on smartphones.

### B. Text-to-Speech (TTS) Integration (`speechService.ts`)
- **Speech Synthesis**: Uses browser-native `window.speechSynthesis` (`SpeechSynthesisUtterance`) to speak back natural turn-by-turn guidance and AI responses aloud in natural human voice.

### C. Natural Language LLM Route Engine (`llmNavigationEngine.ts`)
- Evaluates user queries using fuzzy alias matching and category intent resolution, outputting structured LLM route instructions.

### D. Gemini AI Route Generator (`geminiRouteService.ts`)
- Uses Google's **Gemini AI API** (`gemini-2.5-flash` model via `@google/genai`) to parse raw natural language voice descriptions into structured `LLMRouteKnowledge` JSON format.

---

## 🧭 5. Mobile Motion & Sensor Architecture

### A. 360° Live Compass Orientation (`sensorService.ts`)
- Listens to browser `DeviceOrientationEvent`.
- Calculates real-time 360° heading angle:
  - iOS Safari: `event.webkitCompassHeading`
  - Standard Android/Web: `360 - event.alpha`
- Renders live rotating compass needle dial (`0° N`, `90° E`, `180° S`, `270° W`).

### B. Accelerometer Step Counter (`sensorService.ts`)
- Listens to browser `DeviceMotionEvent`.
- Computes acceleration magnitude vector:
  $$\text{Magnitude} = \sqrt{x^2 + y^2 + z^2}$$
- Detects physical foot strides when acceleration delta exceeds threshold ($> 2.8 \, \text{m/s}^2$).

### C. Haptic Vibration & Audio Chime Feedback (`sensorService.ts`)
- **Haptic Vibration**: Calls `navigator.vibrate([60])` when advancing steps and `navigator.vibrate([100, 50, 100])` on destination arrival.
- **Audio Chime**: Web Audio API synthesizer chime ($587.33 \, \text{Hz} \rightarrow 880 \, \text{Hz}$) plays upon reaching destination.

---

## 📊 6. Database Schemas & Data Models (`LLMRouteKnowledge`)

### Core TypeScript Interface (`src/data/llmRoutesKnowledge.ts`):

```typescript
export interface LLMStepInstruction {
  stepNumber: number;
  instruction: string;
  headingDegrees: number; // 0=North, 90=East, 180=South, 270=West
  headingText: string;
  stepsCount: number;
  landmarkHint?: string;
  voicePrompt: string;
}

export interface LLMRouteKnowledge {
  id: string;
  category: 'washroom' | 'lab' | 'cabin' | 'classroom' | 'facility' | 'entrance' | 'canteen';
  destinationName: string;
  aliases: string[];
  startPoint: string;
  building: string;
  floor: number;
  totalSteps: number;
  totalDistanceMeters: number;
  overviewSummary: string;
  steps: LLMStepInstruction[];
}
```

---

## 🔑 7. Password-Protected Admin Data Feeding Portal (`AdminPortalView.tsx`)

- **Authentication**: Password protected (`admin123`).
- **Live Data Feeds**:
  - Displays live **360° Compass Angle (`° N`)** and **Live Accelerometer Step Counter** so the data collector can see exact directions and physical step counts while walking.
- **One-Tap AI Ingestion**: Speaks/types directions ➔ Gemini AI formats JSON ➔ Appends directly into active database (`LLM_ROUTES_KNOWLEDGE`).

---

## 🚀 8. Build, Testing & CI/CD Pipeline

- **Automated Dataset Validator**: `scripts/validateData.ts` (`npm run validate:data`) verifies foreign key integrity, node connectivity, and JSON syntax.
- **Strict TypeScript Check**: `npx tsc --noEmit` verifies type contracts.
- **Production Bundler**: `vite build` outputs minified static bundle in `dist/`.
- **Live Deployment**: GitHub Pages (`gh-pages` branch) deployed live at:
  ```text
  https://deepesh-45.github.io/college-navigation-system/
  ```
