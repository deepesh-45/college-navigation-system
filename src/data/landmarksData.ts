import landmarksJson from './json/landmarks.json';

export interface CampusLandmark {
  id: string;
  name: string;
  floor: number;
  floorName: string;
  building: string;
  facingOrientation: string;
  aliases: string[];
  type: string;
}

export const CAMPUS_LANDMARKS: CampusLandmark[] = landmarksJson as CampusLandmark[];

// Get default anchor landmark for a floor (Floor 1 = Main Entrance, Floor 2 = Stair Landing)
export const getAnchorLandmarkForFloor = (floor: number): CampusLandmark => {
  const found = CAMPUS_LANDMARKS.find(l => l.floor === floor);
  return found || CAMPUS_LANDMARKS[0];
};

// Find landmark by name or alias
export const findLandmarkByNameOrAlias = (query: string): CampusLandmark | null => {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return null;

  for (const landmark of CAMPUS_LANDMARKS) {
    if (
      landmark.name.toLowerCase().includes(normalized) ||
      landmark.id.toLowerCase().includes(normalized) ||
      landmark.aliases.some(a => a.toLowerCase().includes(normalized) || normalized.includes(a.toLowerCase()))
    ) {
      return landmark;
    }
  }

  return null;
};
