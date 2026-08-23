import { GROUND_FLOOR_NODES } from './groundFloorNodes';
import { FIRST_FLOOR_NODES } from './firstFloorNodes';
import { GraphNode } from '../campusGraphData';

export { GROUND_FLOOR_NODES } from './groundFloorNodes';
export { FIRST_FLOOR_NODES } from './firstFloorNodes';

// Get all mapped nodes for a specific floor (Floor 1 = Ground Floor, Floor 2 = First Floor)
export const getNodesForFloor = (floor: number): GraphNode[] => {
  return floor === 2 ? FIRST_FLOOR_NODES : GROUND_FLOOR_NODES;
};

// All combined mapped nodes across all floors
export const ALL_FLOOR_NODES: GraphNode[] = [
  ...GROUND_FLOOR_NODES,
  ...FIRST_FLOOR_NODES
];
