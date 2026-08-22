export interface LLMStepInstruction {
  stepNumber: number;
  instruction: string;
  headingDegrees: number; // 0=N, 90=E, 180=S, 270=W
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

export const LLM_ROUTES_KNOWLEDGE: LLMRouteKnowledge[] = [
  // DEMO EXAMPLE 1: Ground Floor Restroom via Multi-Turn East Corridor
  {
    id: "ROUTE_WASHROOM_GROUND",
    category: "washroom",
    destinationName: "Ground Floor Restroom / Washroom",
    aliases: ["washroom", "toilet", "restroom", "bathroom", "gents washroom", "ladies washroom", "ground floor washroom"],
    startPoint: "CSE Block Main Entrance Lobby",
    building: "Computer Science & AI Block",
    floor: 0,
    totalSteps: 48,
    totalDistanceMeters: 36,
    overviewSummary: "Face North 25 steps, turn East at Notice Board 15 steps, then turn South 8 steps.",
    steps: [
      {
        stepNumber: 1,
        instruction: "Facing North (360° N) at the Main Entrance Lobby, walk 25 steps straight down the central corridor.",
        headingDegrees: 0,
        headingText: "North (360°)",
        stepsCount: 25,
        landmarkHint: "Pass the orientation kiosk display on your right",
        voicePrompt: "Facing North, walk 25 steps straight down the main corridor."
      },
      {
        stepNumber: 2,
        instruction: "At the Digital Notice Board junction, turn Right towards East (90° E).",
        headingDegrees: 90,
        headingText: "East (90°)",
        stepsCount: 0,
        landmarkHint: "Notice Board corner wall",
        voicePrompt: "Turn Right towards the East."
      },
      {
        stepNumber: 3,
        instruction: "Walk 15 steps down the side corridor past the water dispenser.",
        headingDegrees: 90,
        headingText: "East (90°)",
        stepsCount: 15,
        landmarkHint: "Water cooler & fire extinguisher pillar",
        voicePrompt: "Walk 15 steps down the corridor."
      },
      {
        stepNumber: 4,
        instruction: "At the fire extinguisher pillar, turn Right towards South (180° S). Walk 8 steps.",
        headingDegrees: 180,
        headingText: "South (180°)",
        stepsCount: 8,
        landmarkHint: "Restroom signage overhead",
        voicePrompt: "Turn Right South and walk 8 steps. The Washroom is on your right!"
      }
    ]
  },

  // DEMO EXAMPLE 2: Advanced AI Lab (CS-204) via Staircase A Altitude Change
  {
    id: "ROUTE_AI_LAB_CS204",
    category: "lab",
    destinationName: "Advanced AI & Robotics Lab (Room CS-204)",
    aliases: ["ai lab", "robotics lab", "advanced ai lab", "cs204", "cs 204", "ai department lab"],
    startPoint: "CSE Block Main Entrance Lobby",
    building: "Computer Science & AI Block",
    floor: 1,
    totalSteps: 82,
    totalDistanceMeters: 62,
    overviewSummary: "Walk North 30 steps to Staircase A, climb to Floor 1, turn West 20 steps, then turn South 12 steps.",
    steps: [
      {
        stepNumber: 1,
        instruction: "Facing North (360° N) at the Lobby, walk 30 steps past the Dean's trophy wall to Staircase A landing.",
        headingDegrees: 0,
        headingText: "North (360°)",
        stepsCount: 30,
        landmarkHint: "Trophy display wall on left",
        voicePrompt: "Walk 30 steps North to Staircase A."
      },
      {
        stepNumber: 2,
        instruction: "Climb up Staircase A (20 steps) to Floor 1 landing. (Altitude sensor will detect floor change!).",
        headingDegrees: 0,
        headingText: "North (360°)",
        stepsCount: 20,
        landmarkHint: "Floor 1 glass double doors landing",
        voicePrompt: "Climb the stairs to Floor 1."
      },
      {
        stepNumber: 3,
        instruction: "On Floor 1 landing, turn Left towards West (270° W) into the Executive Department Wing.",
        headingDegrees: 270,
        headingText: "West (270°)",
        stepsCount: 20,
        landmarkHint: "Executive Department corridor",
        voicePrompt: "Turn Left West and walk 20 steps."
      },
      {
        stepNumber: 4,
        instruction: "At the HOD notice display, turn Left towards South (180° S). Walk 12 steps.",
        headingDegrees: 180,
        headingText: "South (180°)",
        stepsCount: 12,
        landmarkHint: "Smart Door Lock #CS-204",
        voicePrompt: "Turn South and walk 12 steps. Advanced AI Lab CS-204 is on your left!"
      }
    ]
  },

  // DEMO EXAMPLE 3: HOD CSE Office Suite (Dr. Rajesh Kumar)
  {
    id: "ROUTE_HOD_CABIN",
    category: "cabin",
    destinationName: "HOD CSE Office (Dr. Rajesh Kumar)",
    aliases: ["hod office", "hod cabin", "hod cse", "dr rajesh", "rajesh kumar", "head of department"],
    startPoint: "CSE Block Main Entrance Lobby",
    building: "Computer Science & AI Block",
    floor: 1,
    totalSteps: 85,
    totalDistanceMeters: 65,
    overviewSummary: "Walk North 25 steps to Elevator B, take elevator to Floor 1, turn West 40 steps.",
    steps: [
      {
        stepNumber: 1,
        instruction: "Walk 25 steps North to Elevator Elevator Bank B / Staircase A.",
        headingDegrees: 0,
        headingText: "North (360°)",
        stepsCount: 25,
        landmarkHint: "Elevator indicator LED panel",
        voicePrompt: "Walk 25 steps North to the elevator."
      },
      {
        stepNumber: 2,
        instruction: "Take Elevator B or Stairs up to Floor 1.",
        headingDegrees: 0,
        headingText: "North (360°)",
        stepsCount: 20,
        landmarkHint: "Floor 1 HOD Directory Board",
        voicePrompt: "Go up to Floor 1."
      },
      {
        stepNumber: 3,
        instruction: "On Floor 1, turn West (270° W) into the Executive Faculty Corridor.",
        headingDegrees: 270,
        headingText: "West (270°)",
        stepsCount: 0,
        landmarkHint: "Executive wooden paneling corridor",
        voicePrompt: "Turn West into the Executive Faculty Corridor."
      },
      {
        stepNumber: 4,
        instruction: "Walk 40 steps straight down the carpeted hallway. HOD CSE Cabin is at the end of the corridor.",
        headingDegrees: 270,
        headingText: "West (270°)",
        stepsCount: 40,
        landmarkHint: "Nameplate: Dr. Rajesh Kumar, HOD CSE",
        voicePrompt: "Walk 40 steps. HOD Office is at the end of the hallway."
      }
    ]
  },

  // DEMO EXAMPLE 4: Central Knowledge Library & Digital Hub
  {
    id: "ROUTE_LIBRARY",
    category: "facility",
    destinationName: "Central Knowledge Library",
    aliases: ["library", "central library", "reading room", "digital library", "books", "study hall"],
    startPoint: "Main Gate Kiosk",
    building: "Central Library Block",
    floor: 0,
    totalSteps: 120,
    totalDistanceMeters: 90,
    overviewSummary: "Head East 80 steps along the palm tree walkway, turn North 40 steps up the ramp.",
    steps: [
      {
        stepNumber: 1,
        instruction: "Facing East (90° E) at Main Gate 1, walk 80 steps along the main palm tree walkway.",
        headingDegrees: 90,
        headingText: "East (90°)",
        stepsCount: 80,
        landmarkHint: "Central Fountain on your right",
        voicePrompt: "Walk 80 steps East along the palm tree walkway."
      },
      {
        stepNumber: 2,
        instruction: "At the Central Fountain roundabout, turn Left towards North (0° N).",
        headingDegrees: 0,
        headingText: "North (360°)",
        stepsCount: 0,
        landmarkHint: "Library glass dome visible ahead",
        voicePrompt: "Turn Left towards the North."
      },
      {
        stepNumber: 3,
        instruction: "Walk 40 steps straight up the ramps. The Central Library main double doors are directly in front of you.",
        headingDegrees: 0,
        headingText: "North (360°)",
        stepsCount: 40,
        landmarkHint: "24/7 Digital Library Portal",
        voicePrompt: "Walk 40 steps up the ramp. Central Library is directly ahead."
      }
    ]
  },

  // DEMO EXAMPLE 5: Student Food Court & Canteen
  {
    id: "ROUTE_CANTEEN",
    category: "canteen",
    destinationName: "Student Food Court & Canteen",
    aliases: ["canteen", "food court", "cafeteria", "coffee shop", "snacks", "food", "mess"],
    startPoint: "CSE Block Main Entrance Lobby",
    building: "Student Activity Center",
    floor: 0,
    totalSteps: 95,
    totalDistanceMeters: 75,
    overviewSummary: "Exit South 20 steps, turn East 60 steps along the lawn pathway, turn South 15 steps into Canteen.",
    steps: [
      {
        stepNumber: 1,
        instruction: "Exit CSE Block facing South (180° S) and walk 20 steps into the outdoor quadrangle.",
        headingDegrees: 180,
        headingText: "South (180°)",
        stepsCount: 20,
        landmarkHint: "Outdoor Quadrangle Lawn",
        voicePrompt: "Walk 20 steps South out into the quadrangle."
      },
      {
        stepNumber: 2,
        instruction: "Turn Left towards East (90° E) along the paved garden pathway.",
        headingDegrees: 90,
        headingText: "East (90°)",
        stepsCount: 60,
        landmarkHint: "Solar pergola seating area",
        voicePrompt: "Turn East and walk 60 steps along the garden path."
      },
      {
        stepNumber: 3,
        instruction: "Turn South (180° S) towards the open pergola. Food Court entrance is 15 steps ahead.",
        headingDegrees: 180,
        headingText: "South (180°)",
        stepsCount: 15,
        landmarkHint: "Food Court Canopy Signage",
        voicePrompt: "Turn South and walk 15 steps. Welcome to the Food Court!"
      }
    ]
  }
];
