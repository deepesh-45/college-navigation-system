export interface GraphNode {
  id: string;
  name: string;
  type:
    | 'entrance'
    | 'junction'
    | 'staircase'
    | 'elevator'
    | 'washroom'
    | 'watercooler'
    | 'classroom'
    | 'lab'
    | 'cabin'
    | 'auditorium'
    | 'library'
    | 'canteen'
    | 'facility';
  building: string;
  floor: number;
  aliases: string[];
  coordinates?: { x: number; y: number };
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

// Real Campus Graph Nodes collected from live field walk (Floor 1)
export const CAMPUS_NODES: GraphNode[] = [
  {
    id: "main_entrance",
    name: "Main Entrance",
    aliases: ["entrance", "gate"],
    building: "Main Campus",
    floor: 1,
    type: "entrance"
  },
  {
    id: "hallway_junction",
    name: "Hallway Junction",
    aliases: ["hallway junction"],
    building: "Main Campus",
    floor: 1,
    type: "junction"
  },
  {
    id: "staircase_floor_2",
    name: "Staircase Floor 2",
    aliases: ["staircase floor 2"],
    building: "Main Campus",
    floor: 1,
    type: "staircase"
  },
  {
    id: "elevator_floor_2",
    name: "Elevator Floor 2",
    aliases: ["elevator floor 2"],
    building: "Main Campus",
    floor: 1,
    type: "elevator"
  },
  {
    id: "node_5",
    name: "Node 5",
    aliases: ["node 5"],
    building: "Main Campus",
    floor: 1,
    type: "facility"
  },
  {
    id: "data_science_lab",
    name: "Data Science Lab",
    aliases: ["data science lab", "ds lab"],
    building: "Main Campus",
    floor: 1,
    type: "lab"
  },
  {
    id: "node_8",
    name: "Node 8",
    aliases: ["node 8"],
    building: "Main Campus",
    floor: 1,
    type: "facility"
  },
  {
    id: "node_6",
    name: "Node 6",
    aliases: ["node 6"],
    building: "Main Campus",
    floor: 1,
    type: "facility"
  }
];

// Real Campus Graph Edges collected from live field walk (Floor 1)
export const CAMPUS_EDGES: GraphEdge[] = [
  {
    id: "edge_main_entrance_to_hallway_junction",
    fromNodeId: "main_entrance",
    toNodeId: "hallway_junction",
    stepsCount: 15,
    headingText: "continue straight",
    headingDegrees: 0,
    instruction: "Move straight approx 15 steps and continue straight."
  },
  {
    id: "edge_hallway_junction_to_staircase_floor_2",
    fromNodeId: "hallway_junction",
    toNodeId: "staircase_floor_2",
    stepsCount: 14,
    headingText: "turn left",
    headingDegrees: 270,
    instruction: "Move straight approx 14 steps and turn left."
  },
  {
    id: "edge_staircase_floor_2_to_elevator_floor_2",
    fromNodeId: "staircase_floor_2",
    toNodeId: "elevator_floor_2",
    stepsCount: 20,
    headingText: "continue straight",
    headingDegrees: 0,
    instruction: "Move straight approx 20 steps and continue straight."
  },
  {
    id: "edge_elevator_floor_2_to_node_5",
    fromNodeId: "elevator_floor_2",
    toNodeId: "node_5",
    stepsCount: 5,
    headingText: "continue straight",
    headingDegrees: 0,
    instruction: "Move straight approx 5 steps and continue straight."
  },
  {
    id: "edge_node_5_to_staircase_floor_2",
    fromNodeId: "node_5",
    toNodeId: "staircase_floor_2",
    stepsCount: 20,
    headingText: "take stairs up",
    headingDegrees: 0,
    instruction: "Move straight approx 20 steps and take stairs up."
  },
  {
    id: "edge_staircase_floor_2_to_data_science_lab",
    fromNodeId: "staircase_floor_2",
    toNodeId: "data_science_lab",
    stepsCount: 10,
    headingText: "continue straight",
    headingDegrees: 0,
    instruction: "Move straight approx 10 steps and continue straight."
  },
  {
    id: "edge_data_science_lab_to_node_8",
    fromNodeId: "data_science_lab",
    toNodeId: "node_8",
    stepsCount: 20,
    headingText: "turn left",
    headingDegrees: 270,
    instruction: "Move straight approx 20 steps and turn left."
  },
  {
    id: "edge_node_5_to_node_6",
    fromNodeId: "node_5",
    toNodeId: "node_6",
    stepsCount: 20,
    headingText: "continue straight",
    headingDegrees: 0,
    instruction: "Move straight approx 20 steps and continue straight."
  }
];

export const saveCampusGraphToStorage = () => {
  try {
    localStorage.setItem('SAVED_CAMPUS_NODES', JSON.stringify(CAMPUS_NODES));
    localStorage.setItem('SAVED_CAMPUS_EDGES', JSON.stringify(CAMPUS_EDGES));
  } catch (e) {
    console.warn('Storage save notice:', e);
  }
};
