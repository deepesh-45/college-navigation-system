import initialMainData from './json/maindata.json';
import { LLMRouteKnowledge, LLMStepInstruction } from './llmRoutesKnowledge';

export interface MainDataAtomicStep {
  stepNumber: number;
  instruction: string;
  action: 'straight' | 'left' | 'right' | 'stair_up' | 'stair_down' | 'elevator' | 'arrive';
  stepsCount: number;
  headingDegrees: number;
  headingText: string;
  voicePrompt: string;
}

export interface MainDataRoute {
  id: string;
  floor: number;
  startLandmark: string;
  facingOrientation: string;
  destination: string;
  pathDescription: string;
  atomicSteps: MainDataAtomicStep[];
}

const STORAGE_KEY = 'MAIN_DATA_JSON';

// Load stored routes from localStorage or initial maindata.json
export const loadMainDataRoutes = (): MainDataRoute[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Notice loading MAIN_DATA_JSON from storage:', e);
  }
  return initialMainData as MainDataRoute[];
};

export const saveMainDataRoutes = (routes: MainDataRoute[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routes, null, 2));
  } catch (e) {
    console.warn('Notice saving MAIN_DATA_JSON to storage:', e);
  }
};

export const MAIN_DATA_ROUTES: MainDataRoute[] = loadMainDataRoutes();

// Decompose raw walk path description into small atomic single-work steps
// Example output: "Move left", "Move 33 steps", "Move right", "Move 2 steps", "Destination reached"
export const breakdownPathToAtomicSteps = (pathText: string, destination: string): MainDataAtomicStep[] => {
  const steps: MainDataAtomicStep[] = [];
  const sentences = pathText.split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim().length > 0);

  let stepCounter = 1;

  for (const sentence of sentences) {
    const sLower = sentence.toLowerCase().trim();

    // Extract step count digits
    const stepMatch = sLower.match(/(\d+)\s*steps?/);
    const stepsCount = stepMatch ? parseInt(stepMatch[1], 10) : 0;

    let action: MainDataAtomicStep['action'] = 'straight';
    let headingDegrees = 0;
    let headingText = 'straight';
    let instruction = '';

    if (sLower.includes('left') || sLower.includes('move left') || sLower.includes('turn left')) {
      action = 'left';
      headingDegrees = 270;
      headingText = 'turn left';
      instruction = 'Move left';
    } else if (sLower.includes('right') || sLower.includes('move right') || sLower.includes('turn right')) {
      action = 'right';
      headingDegrees = 90;
      headingText = 'turn right';
      instruction = 'Move right';
    } else if (sLower.includes('stair') || sLower.includes('stairs up')) {
      action = 'stair_up';
      headingDegrees = 0;
      headingText = 'take stairs up';
      instruction = stepsCount > 0 ? `Move straight ${stepsCount} steps and take stairs up` : 'Take stairs up';
    } else if (sLower.includes('elevator') || sLower.includes('lift')) {
      action = 'elevator';
      headingDegrees = 0;
      headingText = 'take elevator';
      instruction = stepsCount > 0 ? `Move straight ${stepsCount} steps and take elevator` : 'Take elevator';
    } else if (sLower.includes('destination') || sLower.includes('reach') || sLower.includes('arrived')) {
      action = 'arrive';
      headingDegrees = 0;
      headingText = 'arrive';
      instruction = `Destination reached (${destination})`;
    } else {
      action = 'straight';
      headingDegrees = 0;
      headingText = 'straight';
      instruction = stepsCount > 0 ? `Move ${stepsCount} steps` : `Move straight`;
    }

    steps.push({
      stepNumber: stepCounter++,
      instruction,
      action,
      stepsCount,
      headingDegrees,
      headingText,
      voicePrompt: instruction
    });
  }

  // Ensure final step is "Destination reached"
  const lastStep = steps[steps.length - 1];
  if (!lastStep || lastStep.action !== 'arrive') {
    steps.push({
      stepNumber: stepCounter++,
      instruction: `Destination reached`,
      action: 'arrive',
      stepsCount: 0,
      headingDegrees: 0,
      headingText: 'arrive',
      voicePrompt: `Destination reached`
    });
  }

  return steps;
};

// Add new route entry to maindata.json and storage
export const addMainDataRoute = (
  floor: number,
  startLandmark: string,
  facingOrientation: string,
  destination: string,
  pathDescription: string
): MainDataRoute => {
  const atomicSteps = breakdownPathToAtomicSteps(pathDescription, destination);

  const newRoute: MainDataRoute = {
    id: `route_${floor === 1 ? 'gf' : 'ff'}_${destination.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
    floor,
    startLandmark,
    facingOrientation,
    destination,
    pathDescription,
    atomicSteps
  };

  // Replace existing route if same destination & floor exists, or push new
  const existingIdx = MAIN_DATA_ROUTES.findIndex(r => r.floor === floor && r.destination.toLowerCase() === destination.toLowerCase());
  if (existingIdx >= 0) {
    MAIN_DATA_ROUTES[existingIdx] = newRoute;
  } else {
    MAIN_DATA_ROUTES.push(newRoute);
  }

  saveMainDataRoutes(MAIN_DATA_ROUTES);
  return newRoute;
};

// Search stored maindata.json route
export const findMainDataRoute = (query: string, startLandmark?: string): MainDataRoute | null => {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return null;

  for (const route of MAIN_DATA_ROUTES) {
    const destMatch = route.destination.toLowerCase().includes(normalized) || normalized.includes(route.destination.toLowerCase());
    const landmarkMatch = !startLandmark || route.startLandmark.toLowerCase().includes(startLandmark.toLowerCase());

    if (destMatch && landmarkMatch) {
      return route;
    }
  }

  return null;
};

// Convert MainDataRoute to LLMRouteKnowledge for navigation cockpit
export const convertMainDataToLLMRoute = (route: MainDataRoute): LLMRouteKnowledge => {
  const llmSteps: LLMStepInstruction[] = route.atomicSteps.map(s => ({
    stepNumber: s.stepNumber,
    instruction: s.instruction,
    headingDegrees: s.headingDegrees,
    headingText: s.headingText,
    stepsCount: s.stepsCount,
    action: s.action === 'arrive' ? 'straight' : s.action,
    voicePrompt: s.instruction
  }));

  const totalSteps = llmSteps.reduce((sum, s) => sum + s.stepsCount, 0);

  return {
    id: route.id,
    category: 'facility',
    destinationName: route.destination,
    aliases: [route.destination.toLowerCase()],
    startPoint: route.startLandmark,
    facingOrientation: route.facingOrientation,
    building: 'Main Campus',
    floor: route.floor,
    totalSteps,
    totalDistanceMeters: Math.round(totalSteps * 0.75),
    overviewSummary: `Landmark navigation to ${route.destination} via ${route.startLandmark} (${llmSteps.length} atomic steps).`,
    steps: llmSteps
  };
};
