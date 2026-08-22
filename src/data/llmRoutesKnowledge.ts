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
  {
    id: "ROUTE_WASHROOM_GROUND",
    category: "washroom",
    destinationName: "Ground Floor Restroom / Washroom",
    aliases: ["washroom", "toilet", "restroom", "bathroom", "gents washroom", "ladies washroom", "ground floor washroom"],
    startPoint: "CSE Block Main Entrance Lobby",
    building: "Computer Science & AI Block",
    floor: 0,
    totalSteps: 45,
    totalDistanceMeters: 35,
    overviewSummary: "Head North 30 steps down the main lobby, turn East at the notice board, and walk 15 steps.",
    steps: [
      {
        stepNumber: 1,
        instruction: "Face North (360° N) at the Main Lobby Entrance and walk 30 steps straight down the main central corridor.",
        headingDegrees: 0,
        headingText: "North (360°)",
        stepsCount: 30,
        landmarkHint: "Pass the orientation kiosk on your right",
        voicePrompt: "Facing North, walk 30 steps straight down the main corridor."
      },
      {
        stepNumber: 2,
        instruction: "At the digital notice board junction, turn Right towards East (90° E).",
        headingDegrees: 90,
        headingText: "East (90°)",
        stepsCount: 0,
        landmarkHint: "Notice board on corner wall",
        voicePrompt: "Turn Right towards the East."
      },
      {
        stepNumber: 3,
        instruction: "Walk 15 steps down the side hallway. The Washroom entrance is on your Left.",
        headingDegrees: 90,
        headingText: "East (90°)",
        stepsCount: 15,
        landmarkHint: "Restroom signage indicator",
        voicePrompt: "Walk 15 steps. The washroom is on your left."
      }
    ]
  },
  {
    id: "ROUTE_AI_LAB_CS204",
    category: "lab",
    destinationName: "Advanced AI & Robotics Lab (Room CS-204)",
    aliases: ["ai lab", "robotics lab", "advanced ai lab", "cs204", "cs 204", "ai department lab"],
    startPoint: "CSE Block Main Entrance Lobby",
    building: "Computer Science & AI Block",
    floor: 1,
    totalSteps: 70,
    totalDistanceMeters: 55,
    overviewSummary: "Walk 25 steps North to Staircase A, ascend to Floor 1, turn South, and walk 25 steps to Room CS-204.",
    steps: [
      {
        stepNumber: 1,
        instruction: "Facing North (360° N), walk 25 steps straight down the hallway towards Staircase A.",
        headingDegrees: 0,
        headingText: "North (360°)",
        stepsCount: 25,
        landmarkHint: "Staircase A glass door ahead",
        voicePrompt: "Walk 25 steps North to Staircase A."
      },
      {
        stepNumber: 2,
        instruction: "Walk up Staircase A (20 steps) to reach Floor 1 corridor.",
        headingDegrees: 0,
        headingText: "North (360°)",
        stepsCount: 20,
        landmarkHint: "Floor 1 signage landing",
        voicePrompt: "Take the stairs up to Floor 1."
      },
      {
        stepNumber: 3,
        instruction: "On Floor 1 landing, turn 180° South (180° S) into the East wing corridor.",
        headingDegrees: 180,
        headingText: "South (180°)",
        stepsCount: 0,
        landmarkHint: "Department awards display case",
        voicePrompt: "Turn South into the East wing corridor."
      },
      {
        stepNumber: 4,
        instruction: "Walk 25 steps. Advanced AI Lab (CS-204) is the second glass door on your Right.",
        headingDegrees: 180,
        headingText: "South (180°)",
        stepsCount: 25,
        landmarkHint: "Smart Door Lock #CS-204",
        voicePrompt: "Walk 25 steps. AI Lab CS-204 is on your right."
      }
    ]
  },
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
    overviewSummary: "Walk 25 steps North to Elevator/Stairs, go to Floor 1, turn West, and walk 40 steps to HOD Cabin.",
    steps: [
      {
        stepNumber: 1,
        instruction: "Walk 25 steps North to the Elevator Elevator Bank / Staircase A.",
        headingDegrees: 0,
        headingText: "North (360°)",
        stepsCount: 25,
        landmarkHint: "Elevator indicator LED",
        voicePrompt: "Walk 25 steps North to the elevator."
      },
      {
        stepNumber: 2,
        instruction: "Take Elevator or Stairs to Floor 1.",
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
    overviewSummary: "Head East 80 steps along the main paved walkway, turn North 40 steps to Library Plaza entrance.",
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
