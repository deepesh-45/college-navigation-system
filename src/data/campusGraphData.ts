export interface GraphNode {
  id: string;
  name: string;
  type: 'entrance' | 'junction' | 'staircase' | 'elevator' | 'washroom' | 'lab' | 'cabin' | 'facility' | 'canteen';
  building: string;
  floor: number;
  aliases: string[];
}

export interface GraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  stepsCount: number; // Base unit: physical steps
  headingDegrees: number; // 0=N, 90=E, 180=S, 270=W
  headingText: string;
  instruction: string;
  landmarkHint?: string;
  isStaircaseOrElevator?: boolean;
}

// 1. ATOMIC CAMPUS NODES
export const CAMPUS_NODES: GraphNode[] = [
  {
    id: "NODE_MAIN_ENTRANCE",
    name: "CSE Block Main Entrance Lobby",
    type: "entrance",
    building: "Computer Science & AI Block",
    floor: 0,
    aliases: ["main entrance", "lobby", "cse main door", "entrance lobby", "front gate"]
  },
  {
    id: "NODE_JUNCTION_NOTICE_BOARD",
    name: "Notice Board Corridor Junction",
    type: "junction",
    building: "Computer Science & AI Block",
    floor: 0,
    aliases: ["notice board", "corridor junction", "main hallway junction"]
  },
  {
    id: "NODE_WASHROOM_GROUND",
    name: "Ground Floor Restroom / Washroom",
    type: "washroom",
    building: "Computer Science & AI Block",
    floor: 0,
    aliases: ["washroom", "toilet", "restroom", "gents washroom", "ladies washroom", "ground floor washroom"]
  },
  {
    id: "NODE_STAIRCASE_A_GROUND",
    name: "Staircase A Ground Floor Landing",
    type: "staircase",
    building: "Computer Science & AI Block",
    floor: 0,
    aliases: ["staircase a", "stairs ground floor", "stairway"]
  },
  {
    id: "NODE_STAIRCASE_A_FLOOR1",
    name: "Staircase A Floor 1 Landing",
    type: "staircase",
    building: "Computer Science & AI Block",
    floor: 1,
    aliases: ["floor 1 stairs", "first floor landing"]
  },
  {
    id: "NODE_JUNCTION_FLOOR1_WING",
    name: "Floor 1 Executive Wing Junction",
    type: "junction",
    building: "Computer Science & AI Block",
    floor: 1,
    aliases: ["executive wing junction", "first floor corridor"]
  },
  {
    id: "NODE_ROOM_CS204_AI_LAB",
    name: "Advanced AI & Robotics Lab (CS-204)",
    type: "lab",
    building: "Computer Science & AI Block",
    floor: 1,
    aliases: ["ai lab", "robotics lab", "advanced ai lab", "cs204", "cs 204", "ai department lab"]
  },
  {
    id: "NODE_ROOM_HOD_CABIN",
    name: "HOD CSE Office (Dr. Rajesh Kumar)",
    type: "cabin",
    building: "Computer Science & AI Block",
    floor: 1,
    aliases: ["hod office", "hod cabin", "hod cse", "dr rajesh", "rajesh kumar", "head of department"]
  },
  {
    id: "NODE_CENTRAL_LIBRARY",
    name: "Central Knowledge Library",
    type: "facility",
    building: "Central Library Block",
    floor: 0,
    aliases: ["library", "central library", "reading room", "digital library", "books"]
  },
  {
    id: "NODE_CANTEEN",
    name: "Student Food Court & Canteen",
    type: "canteen",
    building: "Student Activity Center",
    floor: 0,
    aliases: ["canteen", "food court", "cafeteria", "coffee shop", "food"]
  }
];

// 2. ATOMIC DIRECTIONAL GRAPH EDGES (Bidirectional Connections)
export const CAMPUS_EDGES: GraphEdge[] = [
  // Lobby ➔ Notice Board Junction
  {
    id: "EDGE_1",
    fromNodeId: "NODE_MAIN_ENTRANCE",
    toNodeId: "NODE_JUNCTION_NOTICE_BOARD",
    stepsCount: 25,
    headingDegrees: 0,
    headingText: "North (360°)",
    instruction: "Face North (360° N) and walk 25 steps straight down the main entrance corridor.",
    landmarkHint: "Pass the orientation kiosk on your right"
  },
  {
    id: "EDGE_1_REV",
    fromNodeId: "NODE_JUNCTION_NOTICE_BOARD",
    toNodeId: "NODE_MAIN_ENTRANCE",
    stepsCount: 25,
    headingDegrees: 180,
    headingText: "South (180°)",
    instruction: "Face South (180° S) and walk 25 steps back to the Main Entrance Lobby.",
    landmarkHint: "Main glass doors straight ahead"
  },

  // Notice Board Junction ➔ Washroom
  {
    id: "EDGE_2",
    fromNodeId: "NODE_JUNCTION_NOTICE_BOARD",
    toNodeId: "NODE_WASHROOM_GROUND",
    stepsCount: 23,
    headingDegrees: 90,
    headingText: "East (90°)",
    instruction: "Turn Right towards East (90° E) at notice board and walk 23 steps down side hallway.",
    landmarkHint: "Water cooler & restroom signage"
  },
  {
    id: "EDGE_2_REV",
    fromNodeId: "NODE_WASHROOM_GROUND",
    toNodeId: "NODE_JUNCTION_NOTICE_BOARD",
    stepsCount: 23,
    headingDegrees: 270,
    headingText: "West (270°)",
    instruction: "Exit washroom and walk 23 steps West back to Notice Board Corridor Junction.",
    landmarkHint: "Digital Notice Display Board"
  },

  // Notice Board Junction ➔ Staircase A Ground
  {
    id: "EDGE_3",
    fromNodeId: "NODE_JUNCTION_NOTICE_BOARD",
    toNodeId: "NODE_STAIRCASE_A_GROUND",
    stepsCount: 15,
    headingDegrees: 0,
    headingText: "North (360°)",
    instruction: "Continue walking North (360° N) 15 steps to Staircase A landing.",
    landmarkHint: "Staircase A glass door ahead"
  },
  {
    id: "EDGE_3_REV",
    fromNodeId: "NODE_STAIRCASE_A_GROUND",
    toNodeId: "NODE_JUNCTION_NOTICE_BOARD",
    stepsCount: 15,
    headingDegrees: 180,
    headingText: "South (180°)",
    instruction: "Walk South (180° S) 15 steps back to Notice Board Junction.",
    landmarkHint: "Notice Board corner wall"
  },

  // Staircase A Ground ➔ Staircase A Floor 1 (Ascend/Descend)
  {
    id: "EDGE_4",
    fromNodeId: "NODE_STAIRCASE_A_GROUND",
    toNodeId: "NODE_STAIRCASE_A_FLOOR1",
    stepsCount: 20,
    headingDegrees: 0,
    headingText: "North (360°)",
    instruction: "Climb up Staircase A (20 steps) to Floor 1 landing.",
    landmarkHint: "Floor 1 glass double doors",
    isStaircaseOrElevator: true
  },
  {
    id: "EDGE_4_REV",
    fromNodeId: "NODE_STAIRCASE_A_FLOOR1",
    toNodeId: "NODE_STAIRCASE_A_GROUND",
    stepsCount: 20,
    headingDegrees: 180,
    headingText: "South (180°)",
    instruction: "Walk down Staircase A (20 steps) to Ground Floor landing.",
    landmarkHint: "Ground Floor exit door",
    isStaircaseOrElevator: true
  },

  // Staircase A Floor 1 ➔ Floor 1 Executive Wing Junction
  {
    id: "EDGE_5",
    fromNodeId: "NODE_STAIRCASE_A_FLOOR1",
    toNodeId: "NODE_JUNCTION_FLOOR1_WING",
    stepsCount: 20,
    headingDegrees: 270,
    headingText: "West (270°)",
    instruction: "Turn Left West (270° W) into Floor 1 Executive Department Corridor. Walk 20 steps.",
    landmarkHint: "Department awards display case"
  },
  {
    id: "EDGE_5_REV",
    fromNodeId: "NODE_JUNCTION_FLOOR1_WING",
    toNodeId: "NODE_STAIRCASE_A_FLOOR1",
    stepsCount: 20,
    headingDegrees: 90,
    headingText: "East (90°)",
    instruction: "Walk East (90° E) 20 steps back to Staircase A landing.",
    landmarkHint: "Staircase A glass door"
  },

  // Floor 1 Executive Wing Junction ➔ AI Lab CS-204
  {
    id: "EDGE_6",
    fromNodeId: "NODE_JUNCTION_FLOOR1_WING",
    toNodeId: "NODE_ROOM_CS204_AI_LAB",
    stepsCount: 12,
    headingDegrees: 180,
    headingText: "South (180°)",
    instruction: "Turn Left South (180° S) and walk 12 steps to Advanced AI Lab CS-204.",
    landmarkHint: "Smart Door Lock #CS-204"
  },
  {
    id: "EDGE_6_REV",
    fromNodeId: "NODE_ROOM_CS204_AI_LAB",
    toNodeId: "NODE_JUNCTION_FLOOR1_WING",
    stepsCount: 12,
    headingDegrees: 0,
    headingText: "North (360°)",
    instruction: "Exit AI Lab, turn North (360° N) and walk 12 steps back to Executive Wing Junction.",
    landmarkHint: "Corridor directory sign"
  },

  // Floor 1 Executive Wing Junction ➔ HOD CSE Cabin
  {
    id: "EDGE_7",
    fromNodeId: "NODE_JUNCTION_FLOOR1_WING",
    toNodeId: "NODE_ROOM_HOD_CABIN",
    stepsCount: 40,
    headingDegrees: 270,
    headingText: "West (270°)",
    instruction: "Walk West (270° W) 40 steps straight down the carpeted hallway to HOD Office.",
    landmarkHint: "Nameplate: Dr. Rajesh Kumar, HOD CSE"
  },
  {
    id: "EDGE_7_REV",
    fromNodeId: "NODE_ROOM_HOD_CABIN",
    toNodeId: "NODE_JUNCTION_FLOOR1_WING",
    stepsCount: 40,
    headingDegrees: 90,
    headingText: "East (90°)",
    instruction: "Exit HOD Cabin and walk East (90° E) 40 steps back to Executive Wing Junction.",
    landmarkHint: "Trophy cabinet"
  },

  // Main Entrance ➔ Central Library
  {
    id: "EDGE_8",
    fromNodeId: "NODE_MAIN_ENTRANCE",
    toNodeId: "NODE_CENTRAL_LIBRARY",
    stepsCount: 90,
    headingDegrees: 90,
    headingText: "East (90°)",
    instruction: "Exit CSE Block facing East (90° E) and walk 90 steps along the palm tree plaza ramp.",
    landmarkHint: "Central Fountain & Library Glass Dome"
  },
  {
    id: "EDGE_8_REV",
    fromNodeId: "NODE_CENTRAL_LIBRARY",
    toNodeId: "NODE_MAIN_ENTRANCE",
    stepsCount: 90,
    headingDegrees: 270,
    headingText: "West (270°)",
    instruction: "Walk West (270° W) 90 steps back to CSE Block Main Entrance Lobby.",
    landmarkHint: "CSE & AI Block Entrance Arch"
  },

  // Main Entrance ➔ Student Canteen
  {
    id: "EDGE_9",
    fromNodeId: "NODE_MAIN_ENTRANCE",
    toNodeId: "NODE_CANTEEN",
    stepsCount: 75,
    headingDegrees: 180,
    headingText: "South (180°)",
    instruction: "Exit Main Entrance facing South (180° S) and walk 75 steps into the Food Court Quadrangle.",
    landmarkHint: "Outdoor Solar Pergola Seating"
  },
  {
    id: "EDGE_9_REV",
    fromNodeId: "NODE_CANTEEN",
    toNodeId: "NODE_MAIN_ENTRANCE",
    stepsCount: 75,
    headingDegrees: 0,
    headingText: "North (360°)",
    instruction: "Walk North (360° N) 75 steps back to CSE Block Main Entrance Lobby.",
    landmarkHint: "CSE Main Lobby Doors"
  }
];
