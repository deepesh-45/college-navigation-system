export interface Building {
  id: string;
  name: string;
  shortName: string;
  category: 'academic' | 'admin' | 'facility' | 'auditorium' | 'amenity';
  floors: number;
  description: string;
  iconName?: string;
  x: number; // Map SVG coordinate
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface Room {
  id: string;
  buildingId: string;
  floorId: string;
  floorNumber: number;
  roomNumber: string;
  name: string;
  category: 'lab' | 'lecture_hall' | 'cabin' | 'office' | 'facility' | 'restroom' | 'auditorium';
  department?: string;
  nodeId: string;
  description?: string;
}

export interface Faculty {
  id: string;
  name: string;
  title: string;
  department: string;
  roomId: string;
  email?: string;
  officeHours?: string;
}

export interface Facility {
  id: string;
  name: string;
  category: 'canteen' | 'library' | 'atm' | 'medical' | 'reception' | 'parking' | 'sports';
  roomId?: string;
  nodeId: string;
  icon: string;
  description: string;
}

export interface NavNode {
  id: string;
  buildingId?: string;
  floorId: string;
  floorNumber: number;
  lat?: number;
  lng?: number;
  x: number;
  y: number;
  type: 'entrance' | 'junction' | 'corridor' | 'room' | 'staircase' | 'elevator' | 'kiosk' | 'destination' | 'cabin';
  name?: string;
}

export interface NavEdge {
  from: string;
  to: string;
  distance: number; // In meters
  accessible: boolean;
  stairs: boolean;
  elevator?: boolean;
}

export interface Notice {
  id: string;
  title: string;
  category: 'Academic' | 'Event' | 'Alert' | 'Placement' | 'Sports';
  date: string;
  time?: string;
  location?: string;
  summary: string;
  urgent?: boolean;
  destinationId?: string;
  iconName?: 'Sparkles' | 'GraduationCap' | 'BookOpen' | 'Coffee' | 'Megaphone' | 'Bell';
}

export interface RouteResult {
  nodes: NavNode[];
  pathIds: string[];
  totalDistance: number;
  estimatedMinutes: number;
  instructions: string[];
  destination: Room | Facility | Building;
  startNode: NavNode;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'success' | 'error';
