import { BUILDINGS, ROOMS, FACULTY } from '../data/campusData';
import { findRoute } from './routeEngine';
import { RouteResult } from '../types';

export interface AIResolution {
  success: boolean;
  intent: 'navigate' | 'info' | 'unknown';
  matchedEntityName?: string;
  matchedEntityType?: string;
  responseMessage: string;
  route?: RouteResult | null;
}

export function processUserVoiceQuery(rawQuery: string): AIResolution {
  const query = rawQuery.toLowerCase().trim();

  if (!query) {
    return {
      success: false,
      intent: 'unknown',
      responseMessage: "I didn't hear anything. Please press the mic button and speak your destination!"
    };
  }

  // 1. Check Faculty Match
  for (const fac of FACULTY) {
    const nameLower = fac.name.toLowerCase();
    const titleLower = fac.title.toLowerCase();
    if (query.includes(nameLower) || query.includes(fac.id.toLowerCase()) || 
        (query.includes('rajesh') && nameLower.includes('rajesh')) ||
        (query.includes('ananya') && nameLower.includes('ananya')) ||
        (query.includes('vikram') && nameLower.includes('vikram')) ||
        (query.includes('hod') && titleLower.includes('hod')) ||
        (query.includes('dean') && titleLower.includes('dean'))) {
      
      const route = findRoute('N_KIOSK_MAIN', fac.roomId);
      return {
        success: true,
        intent: 'navigate',
        matchedEntityName: `${fac.name} (${fac.title})`,
        matchedEntityType: 'Faculty Cabin',
        responseMessage: `Found ${fac.name}, ${fac.title} in the ${fac.department}. Calculating shortest route from Kiosk #1.`,
        route
      };
    }
  }

  // 2. Check Rooms Match (AI Lab, Robotics, HOD Cabin, Dean Office, Auditorium Hall, Library Reading)
  for (const room of ROOMS) {
    const rName = room.name.toLowerCase();
    const rNum = room.roomNumber.toLowerCase();
    if (query.includes(rName) || query.includes(rNum) ||
        (query.includes('ai') && query.includes('lab') && rName.includes('ai')) ||
        (query.includes('robotics') && rName.includes('robotics')) ||
        (query.includes('dean') && rName.includes('dean'))) {
      
      const route = findRoute('N_KIOSK_MAIN', room.id);
      return {
        success: true,
        intent: 'navigate',
        matchedEntityName: room.name,
        matchedEntityType: `Room ${room.roomNumber}`,
        responseMessage: `Navigating to ${room.name} (${room.roomNumber}) on Floor ${room.floorNumber}.`,
        route
      };
    }
  }

  // 3. Check Facilities Match (Food Court, Canteen, Coffee, Library, ATM, Medical)
  if (query.includes('food') || query.includes('canteen') || query.includes('eat') || query.includes('coffee') || query.includes('lunch') || query.includes('nescafe')) {
    const route = findRoute('N_KIOSK_MAIN', 'B_CANTEEN');
    return {
      success: true,
      intent: 'navigate',
      matchedEntityName: 'Central Food Court & Coffee Lounge',
      matchedEntityType: 'Campus Facility',
      responseMessage: 'Directing you to the Central Food Court & Nescafe Lounge.',
      route
    };
  }

  if (query.includes('library') || query.includes('book') || query.includes('reading') || query.includes('study')) {
    const route = findRoute('N_KIOSK_MAIN', 'B_LIBRARY');
    return {
      success: true,
      intent: 'navigate',
      matchedEntityName: 'Central Knowledge Library',
      matchedEntityType: 'Facility',
      responseMessage: 'Navigating to Central Knowledge Library. It is currently open with 24/7 reading halls.',
      route
    };
  }

  if (query.includes('atm') || query.includes('cash') || query.includes('bank') || query.includes('money')) {
    const route = findRoute('N_KIOSK_MAIN', 'FACIL_ATM');
    return {
      success: true,
      intent: 'navigate',
      matchedEntityName: 'Campus ATM & Finance Desk',
      matchedEntityType: 'Amenity',
      responseMessage: 'The Campus ATM is located near the Admin Block entrance.',
      route
    };
  }

  if (query.includes('medical') || query.includes('doctor') || query.includes('first aid') || query.includes('emergency') || query.includes('hospital')) {
    const route = findRoute('N_KIOSK_MAIN', 'FACIL_MED');
    return {
      success: true,
      intent: 'navigate',
      matchedEntityName: 'First Aid & Medical Emergency Desk',
      matchedEntityType: 'Emergency Desk',
      responseMessage: 'Guiding you to the Medical Emergency Desk at Admin Block.',
      route
    };
  }

  if (query.includes('auditorium') || query.includes('hackathon') || query.includes('event') || query.includes('stage') || query.includes('hall')) {
    const route = findRoute('N_KIOSK_MAIN', 'B_AUDITORIUM');
    return {
      success: true,
      intent: 'navigate',
      matchedEntityName: 'APJ Abdul Kalam Grand Auditorium',
      matchedEntityType: 'Event Venue',
      responseMessage: 'Routing to APJ Abdul Kalam Grand Auditorium, host venue for the 24-Hour AI Hackathon!',
      route
    };
  }

  // 4. Check Buildings Match
  for (const b of BUILDINGS) {
    const bName = b.name.toLowerCase();
    const bShort = b.shortName.toLowerCase();
    if (query.includes(bName) || query.includes(bShort) ||
        (query.includes('cse') && bShort.includes('cse')) ||
        (query.includes('admin') && bShort.includes('admin'))) {
      
      const route = findRoute('N_KIOSK_MAIN', b.id);
      return {
        success: true,
        intent: 'navigate',
        matchedEntityName: b.name,
        matchedEntityType: 'Campus Block',
        responseMessage: `Found ${b.name}. Displaying shortest path from Gate Kiosk.`,
        route
      };
    }
  }

  // No verified match found (Rule 3: Never invent campus data)
  return {
    success: false,
    intent: 'unknown',
    responseMessage: `I couldn't find "${rawQuery}" in the verified campus directory. Try asking for CSE Block, AI Lab, Library, Food Court, Auditorium, or HOD CSE!`
  };
}
