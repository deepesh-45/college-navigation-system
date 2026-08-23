import { GraphNode } from '../campusGraphData';

// Ground Floor (Floor 1) Mapped Node Positions relative to Main Entrance Landmark Anchor
export const GROUND_FLOOR_NODES: GraphNode[] = [
  {
    id: "main_entrance",
    name: "Main Entrance",
    aliases: ["main entrance", "entrance", "gate", "main gate"],
    building: "Main Campus",
    floor: 1,
    type: "entrance"
  }
];
