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

// Load saved nodes & edges from device localStorage if available
const loadSavedNodes = (): GraphNode[] => {
  try {
    const saved = localStorage.getItem('SAVED_CAMPUS_NODES');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const loadSavedEdges = (): GraphEdge[] => {
  try {
    const saved = localStorage.getItem('SAVED_CAMPUS_EDGES');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const CAMPUS_NODES: GraphNode[] = loadSavedNodes();
export const CAMPUS_EDGES: GraphEdge[] = loadSavedEdges();

export const saveCampusGraphToStorage = () => {
  try {
    localStorage.setItem('SAVED_CAMPUS_NODES', JSON.stringify(CAMPUS_NODES));
    localStorage.setItem('SAVED_CAMPUS_EDGES', JSON.stringify(CAMPUS_EDGES));
  } catch (e) {
    console.warn('Storage save notice:', e);
  }
};
