import { GraphNode } from '../campusGraphData';

// Ground Floor (Floor 1) Mapped Node Positions relative to Main Entrance Landmark Anchor
export const GROUND_FLOOR_NODES: GraphNode[] = [
  {
    id: "main_entrance",
    name: "Main Entrance",
    aliases: ["main entrance", "entrance", "gate", "main gate"],
    building: "Main Campus",
    floor: 1,
    type: "entrance",
    coordinates: { x: 0, y: 0 }
  },
  {
    id: "hallway_junction",
    name: "Hallway Junction",
    aliases: ["hallway junction", "junction", "central junction"],
    building: "Main Campus",
    floor: 1,
    type: "junction",
    coordinates: { x: 0, y: 15 }
  },
  {
    id: "staircase_floor_2",
    name: "Staircase Floor 2",
    aliases: ["staircase", "stairs", "ground floor staircase"],
    building: "Main Campus",
    floor: 1,
    type: "staircase",
    coordinates: { x: -14, y: 15 }
  },
  {
    id: "elevator_floor_2",
    name: "Elevator Floor 2",
    aliases: ["elevator", "lift", "ground floor elevator"],
    building: "Main Campus",
    floor: 1,
    type: "elevator",
    coordinates: { x: -34, y: 15 }
  },
  {
    id: "node_5",
    name: "Node 5 Facility",
    aliases: ["node 5", "node5", "facility 5"],
    building: "Main Campus",
    floor: 1,
    type: "facility",
    coordinates: { x: -39, y: 15 }
  },
  {
    id: "node_6",
    name: "Node 6 Facility",
    aliases: ["node 6", "node6", "facility 6"],
    building: "Main Campus",
    floor: 1,
    type: "facility",
    coordinates: { x: -59, y: 15 }
  },
  {
    id: "data_science_lab",
    name: "Data Science Lab",
    aliases: ["data science lab", "ds lab", "data science"],
    building: "Main Campus",
    floor: 1,
    type: "lab",
    coordinates: { x: -14, y: 25 }
  },
  {
    id: "node_8",
    name: "Node 8 Facility",
    aliases: ["node 8", "node8", "facility 8"],
    building: "Main Campus",
    floor: 1,
    type: "facility",
    coordinates: { x: -34, y: 25 }
  }
];
