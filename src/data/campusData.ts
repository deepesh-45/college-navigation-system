import { Building, Room, Faculty, Facility, NavNode, NavEdge } from '../types';

// Verified Campus Buildings (Map SVG grid: 1000x700 px)
export const BUILDINGS: Building[] = [
  {
    id: 'B_MAIN_ENTRANCE',
    name: 'Main Campus Entrance & Gate 1',
    shortName: 'Main Gate',
    category: 'facility',
    floors: 1,
    description: 'Primary visitor entry, security desk, and orientation kiosk.',
    x: 80,
    y: 520,
    width: 140,
    height: 90,
    color: '#3b82f6'
  },
  {
    id: 'B_ADMIN',
    name: 'Administrative Block',
    shortName: 'Admin Block',
    category: 'admin',
    floors: 3,
    description: 'Director office, Dean Academics, Registrar, Admissions, Fee Counter.',
    x: 260,
    y: 440,
    width: 160,
    height: 140,
    color: '#8b5cf6'
  },
  {
    id: 'B_CSE',
    name: 'Computer Science & AI Engineering Block',
    shortName: 'CSE / AI Block',
    category: 'academic',
    floors: 4,
    description: 'Department of CSE, AI/ML Labs, Robotics Lab, Data Science Center, HOD Cabin.',
    x: 480,
    y: 220,
    width: 220,
    height: 180,
    color: '#10b981'
  },
  {
    id: 'B_LIBRARY',
    name: 'Central Knowledge Library',
    shortName: 'Central Library',
    category: 'facility',
    floors: 2,
    description: '24/7 Digital Library, Quiet Reading Halls, Reference Section, E-Resource Hub.',
    x: 260,
    y: 180,
    width: 160,
    height: 160,
    color: '#f59e0b'
  },
  {
    id: 'B_AUDITORIUM',
    name: 'APJ Abdul Kalam Grand Auditorium',
    shortName: 'Auditorium',
    category: 'auditorium',
    floors: 2,
    description: '1500-capacity auditorium for convocation, hackathons, and cultural events.',
    x: 740,
    y: 180,
    width: 180,
    height: 160,
    color: '#ec4899'
  },
  {
    id: 'B_CANTEEN',
    name: 'Central Food Court & Canteen',
    shortName: 'Food Court',
    category: 'amenity',
    floors: 1,
    description: 'Multi-cuisine food court, Nescafe lounge, student lounge, and outdoor seating.',
    x: 520,
    y: 480,
    width: 180,
    height: 130,
    color: '#06b6d4'
  }
];

// Verified Campus Rooms
export const ROOMS: Room[] = [
  {
    id: 'R_AI_LAB',
    buildingId: 'B_CSE',
    floorId: 'F_CSE_2',
    floorNumber: 2,
    roomNumber: 'CS-204',
    name: 'Advanced AI & Machine Learning Lab',
    category: 'lab',
    department: 'Computer Science',
    nodeId: 'N_CSE_F2',
    description: 'Equipped with High-Performance GPU clusters for deep learning research.'
  },
  {
    id: 'R_HOD_CSE',
    buildingId: 'B_CSE',
    floorId: 'F_CSE_2',
    floorNumber: 2,
    roomNumber: 'CS-201',
    name: 'HOD Office — Computer Science & AI',
    category: 'cabin',
    department: 'Computer Science',
    nodeId: 'N_CSE_F2',
    description: 'Office of Dr. Rajesh Kumar, Head of Department CSE.'
  },
  {
    id: 'R_ROBOTICS_LAB',
    buildingId: 'B_CSE',
    floorId: 'F_CSE_1',
    floorNumber: 1,
    roomNumber: 'CS-108',
    name: 'Autonomous Systems & Robotics Lab',
    category: 'lab',
    department: 'Computer Science',
    nodeId: 'N_CSE_F1',
    description: 'Drones, ROS manipulators, and spatial mapping prototypes.'
  },
  {
    id: 'R_DEAN_OFFICE',
    buildingId: 'B_ADMIN',
    floorId: 'F_ADM_1',
    floorNumber: 1,
    roomNumber: 'AD-102',
    name: 'Dean of Academic Affairs Office',
    category: 'office',
    department: 'Administration',
    nodeId: 'N_ADMIN_ENTRANCE',
    description: 'Academic approvals, curriculum queries, and student affairs.'
  },
  {
    id: 'R_AUDITORIUM_HALL',
    buildingId: 'B_AUDITORIUM',
    floorId: 'F_AUD_1',
    floorNumber: 1,
    roomNumber: 'AUD-MAIN',
    name: 'Main Stage & Conference Hall',
    category: 'auditorium',
    nodeId: 'N_AUDITORIUM',
    description: 'Venue for Hackathon inauguration, keynote talks, and awards.'
  },
  {
    id: 'R_LIBRARY_READING',
    buildingId: 'B_LIBRARY',
    floorId: 'F_LIB_1',
    floorNumber: 1,
    roomNumber: 'LIB-101',
    name: 'Silent Study & Digital Reference Section',
    category: 'facility',
    nodeId: 'N_LIBRARY',
    description: 'High-speed Wi-Fi, reference books, journal archives, and discussion pods.'
  }
];

// Verified Faculty Directory
export const FACULTY: Faculty[] = [
  {
    id: 'FAC_RAJESH',
    name: 'Dr. Rajesh Kumar',
    title: 'Professor & HOD',
    department: 'Computer Science & Engineering',
    roomId: 'R_HOD_CSE',
    email: 'rajesh.kumar@college.edu',
    officeHours: '10:00 AM - 1:00 PM (Mon-Fri)'
  },
  {
    id: 'FAC_ANANYA',
    name: 'Dr. Ananya Sharma',
    title: 'Associate Professor & AI Lab Lead',
    department: 'Artificial Intelligence & Data Science',
    roomId: 'R_AI_LAB',
    email: 'ananya.sharma@college.edu',
    officeHours: '2:00 PM - 4:00 PM (Tue, Thu)'
  },
  {
    id: 'FAC_VIKRAM',
    name: 'Prof. Vikramaditya Singh',
    title: 'Dean of Academics',
    department: 'Administration',
    roomId: 'R_DEAN_OFFICE',
    email: 'dean.academics@college.edu',
    officeHours: '11:30 AM - 1:30 PM'
  }
];

// Verified Campus Facilities
export const FACILITIES: Facility[] = [
  {
    id: 'FACIL_FOOD',
    name: 'Central Food Court & Coffee Lounge',
    category: 'canteen',
    nodeId: 'N_CANTEEN',
    icon: 'Coffee',
    description: 'Hot meals, snacks, smoothies, and 24-hour Nescafe counter.'
  },
  {
    id: 'FACIL_LIB',
    name: 'Central Library & E-Resource Hub',
    category: 'library',
    roomId: 'R_LIBRARY_READING',
    nodeId: 'N_LIBRARY',
    icon: 'BookOpen',
    description: 'Access over 50,000 physical books and digital IEEE database.'
  },
  {
    id: 'FACIL_ATM',
    name: 'Campus ATM & Finance Desk',
    category: 'atm',
    nodeId: 'N_ADMIN_ENTRANCE',
    icon: 'CreditCard',
    description: 'SBI / HDFC 24x7 ATM counter next to Admin entrance.'
  },
  {
    id: 'FACIL_MED',
    name: 'First Aid & Medical Emergency Desk',
    category: 'medical',
    nodeId: 'N_ADMIN_ENTRANCE',
    icon: 'HeartPulse',
    description: 'Resident doctor and paramedic team available on call.'
  }
];

// Navigation Graph Nodes (Coordinates mapped to 1000x700 Canvas)
export const NAV_NODES: NavNode[] = [
  {
    id: 'N_KIOSK_MAIN',
    buildingId: 'B_MAIN_ENTRANCE',
    floorId: 'F_G',
    floorNumber: 0,
    x: 150,
    y: 560,
    type: 'kiosk',
    name: 'YOU ARE HERE (Main Gate Kiosk 1)'
  },
  {
    id: 'N_JUNCTION_1',
    floorId: 'F_G',
    floorNumber: 0,
    x: 250,
    y: 560,
    type: 'junction',
    name: 'South Avenue Junction'
  },
  {
    id: 'N_ADMIN_ENTRANCE',
    buildingId: 'B_ADMIN',
    floorId: 'F_ADM_G',
    floorNumber: 0,
    x: 340,
    y: 510,
    type: 'entrance',
    name: 'Admin Block Main Entrance'
  },
  {
    id: 'N_JUNCTION_CENTRAL',
    floorId: 'F_G',
    floorNumber: 0,
    x: 340,
    y: 360,
    type: 'junction',
    name: 'Central Quadrangle Junction'
  },
  {
    id: 'N_LIBRARY',
    buildingId: 'B_LIBRARY',
    floorId: 'F_LIB_1',
    floorNumber: 0,
    x: 340,
    y: 260,
    type: 'destination',
    name: 'Central Library Entrance'
  },
  {
    id: 'N_JUNCTION_EAST',
    floorId: 'F_G',
    floorNumber: 0,
    x: 590,
    y: 360,
    type: 'junction',
    name: 'Academic Plaza Junction'
  },
  {
    id: 'N_CSE_ENTRANCE',
    buildingId: 'B_CSE',
    floorId: 'F_CSE_G',
    floorNumber: 0,
    x: 590,
    y: 310,
    type: 'entrance',
    name: 'CSE Block Main Lobby'
  },
  {
    id: 'N_CSE_F1',
    buildingId: 'B_CSE',
    floorId: 'F_CSE_1',
    floorNumber: 1,
    x: 590,
    y: 280,
    type: 'staircase',
    name: 'CSE Floor 1 (Robotics Lab)'
  },
  {
    id: 'N_CSE_F2',
    buildingId: 'B_CSE',
    floorId: 'F_CSE_2',
    floorNumber: 2,
    x: 590,
    y: 250,
    type: 'destination',
    name: 'CSE Floor 2 (AI Lab & HOD Cabin)'
  },
  {
    id: 'N_CANTEEN',
    buildingId: 'B_CANTEEN',
    floorId: 'F_CANT_G',
    floorNumber: 0,

    x: 610,
    y: 540,
    type: 'destination',
    name: 'Food Court Plaza'
  },
  {
    id: 'N_AUDITORIUM',
    buildingId: 'B_AUDITORIUM',
    floorId: 'F_AUD_G',
    floorNumber: 0,
    x: 830,
    y: 260,
    type: 'destination',
    name: 'Auditorium Main Gate'
  }
];

// Navigation Edges (Graph Connections)
export const NAV_EDGES: NavEdge[] = [
  { from: 'N_KIOSK_MAIN', to: 'N_JUNCTION_1', distance: 30, accessible: true, stairs: false },
  { from: 'N_JUNCTION_1', to: 'N_ADMIN_ENTRANCE', distance: 35, accessible: true, stairs: false },
  { from: 'N_JUNCTION_1', to: 'N_CANTEEN', distance: 80, accessible: true, stairs: false },
  { from: 'N_ADMIN_ENTRANCE', to: 'N_JUNCTION_CENTRAL', distance: 45, accessible: true, stairs: false },
  { from: 'N_JUNCTION_CENTRAL', to: 'N_LIBRARY', distance: 30, accessible: true, stairs: false },
  { from: 'N_JUNCTION_CENTRAL', to: 'N_JUNCTION_EAST', distance: 75, accessible: true, stairs: false },
  { from: 'N_JUNCTION_EAST', to: 'N_CSE_ENTRANCE', distance: 20, accessible: true, stairs: false },
  { from: 'N_JUNCTION_EAST', to: 'N_CANTEEN', distance: 55, accessible: true, stairs: false },
  { from: 'N_JUNCTION_EAST', to: 'N_AUDITORIUM', distance: 85, accessible: true, stairs: false },
  { from: 'N_CSE_ENTRANCE', to: 'N_CSE_F1', distance: 15, accessible: true, stairs: true, elevator: true },
  { from: 'N_CSE_F1', to: 'N_CSE_F2', distance: 15, accessible: true, stairs: true, elevator: true }
];
