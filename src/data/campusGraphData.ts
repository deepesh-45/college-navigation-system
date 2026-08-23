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
  stepsCount: number;
  headingDegrees: number;
  headingText: string;
  instruction: string;
  landmarkHint?: string;
  isStaircaseOrElevator?: boolean;
}

export const CAMPUS_NODES: GraphNode[] = [];
export const CAMPUS_EDGES: GraphEdge[] = [];

export const saveCampusGraphToStorage = () => {
  try {
    localStorage.setItem('SAVED_CAMPUS_NODES', JSON.stringify(CAMPUS_NODES));
    localStorage.setItem('SAVED_CAMPUS_EDGES', JSON.stringify(CAMPUS_EDGES));
  } catch (e) {
    console.warn('Storage save notice:', e);
  }
};
