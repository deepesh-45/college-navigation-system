import { GraphNode } from '../campusGraphData';

// First Floor (Floor 2) Mapped Node Positions relative to Stair Landing Landmark Anchor
export const FIRST_FLOOR_NODES: GraphNode[] = [
  {
    id: "stair_landing_ff",
    name: "Stair Landing",
    aliases: ["stair landing", "stair end", "staircase first floor", "stairs first floor"],
    building: "Main Campus",
    floor: 2,
    type: "staircase",
    coordinates: { x: 0, y: 0 }
  },
  {
    id: "main_auditorium",
    name: "Main Auditorium",
    aliases: ["main auditorium", "auditorium", "seminar hall"],
    building: "Main Campus",
    floor: 2,
    type: "auditorium",
    coordinates: { x: 0, y: 10 }
  },
  {
    id: "ai_research_center",
    name: "AI Research Center",
    aliases: ["ai research center", "ai lab", "ai center"],
    building: "Main Campus",
    floor: 2,
    type: "lab",
    coordinates: { x: 25, y: 10 }
  },
  {
    id: "central_library",
    name: "Central Library",
    aliases: ["central library", "library", "reading room"],
    building: "Main Campus",
    floor: 2,
    type: "library",
    coordinates: { x: 25, y: 25 }
  },
  {
    id: "faculty_cabins",
    name: "Faculty Cabins",
    aliases: ["faculty cabins", "cabins", "professors cabins"],
    building: "Main Campus",
    floor: 2,
    type: "cabin",
    coordinates: { x: 13, y: 25 }
  },
  {
    id: "washroom_ff",
    name: "Gents and Ladies Washroom",
    aliases: ["washroom", "gents washroom", "ladies washroom", "toilet", "restroom"],
    building: "Main Campus",
    floor: 2,
    type: "washroom",
    coordinates: { x: 13, y: 33 }
  }
];
