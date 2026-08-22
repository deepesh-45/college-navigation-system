import { Notice } from '../types';

export const NOTICES: Notice[] = [
  {
    id: 'NOT_1',
    title: 'Smart Campus 24-Hour AI Hackathon Live!',
    category: 'Event',
    date: 'Today',
    time: '10:00 AM - 10:00 AM',
    location: 'APJ Abdul Kalam Grand Auditorium',
    summary: 'Hackathon coding phase is live! Project submissions and live demo evaluation begin tomorrow at 9:00 AM.',
    urgent: true,
    destinationId: 'B_AUDITORIUM',
    iconName: 'Sparkles'
  },
  {
    id: 'NOT_2',
    title: 'Guest Lecture on AI & Generative Agents',
    category: 'Academic',
    date: 'Aug 24, 2026',
    time: '02:00 PM',
    location: 'AI Lab, CSE Block Floor 2',
    summary: 'Keynote session by Google DeepMind Research Team on Agentic Workflows and Spatial Intelligence.',
    urgent: false,
    destinationId: 'R_AI_LAB',
    iconName: 'GraduationCap'
  },
  {
    id: 'NOT_3',
    title: '24/7 Extended Library Hours for Exam Prep',
    category: 'Academic',
    date: 'Active Now',
    location: 'Central Knowledge Library',
    summary: 'All reading rooms, study pods, and e-resource terminals will stay open round-the-clock with cafeteria access.',
    urgent: false,
    destinationId: 'B_LIBRARY',
    iconName: 'BookOpen'
  },
  {
    id: 'NOT_4',
    title: 'Campus Food Court Midnight Refreshment',
    category: 'Placement',
    date: 'Tonight',
    time: '11:00 PM - 03:00 AM',
    location: 'Central Food Court & Nescafe',
    summary: 'Complimentary tea, coffee, and hackathon snacks served at Nescafe lounge for all participants.',
    urgent: false,
    destinationId: 'B_CANTEEN',
    iconName: 'Coffee'
  },
  {
    id: 'NOT_5',
    title: 'Robotics & Drone Systems Demo',
    category: 'Academic',
    date: 'Aug 25, 2026',
    time: '11:00 AM',
    location: 'Robotics Lab, CSE Floor 1',
    summary: 'Hands-on demonstration of ROS manipulation, autonomous quadcopters, and spatial navigation.',
    urgent: false,
    destinationId: 'R_ROBOTICS_LAB',
    iconName: 'Megaphone'
  },
  {
    id: 'NOT_6',
    title: 'Dean Academics Clearance Desk',
    category: 'Academic',
    date: 'Daily',
    time: '11:30 AM - 01:30 PM',
    location: 'Admin Block AD-102',
    summary: 'Academic approvals, credit transfers, and student project verification window.',
    urgent: false,
    destinationId: 'R_DEAN_OFFICE',
    iconName: 'Bell'
  }
];

export const QUICK_STATS = {
  activeStudents: 4250,
  campusArea: '120 Acres',
  totalBuildings: 18,
  kioskLocation: 'Main Gate Gate #1'
};
