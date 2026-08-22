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

// Clean atomic graph arrays for real campus data collection
export const CAMPUS_NODES: GraphNode[] = [];
export const CAMPUS_EDGES: GraphEdge[] = [];
