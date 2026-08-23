import rawMainDataMd from './maindata.md?raw';
import rawNodesMd from './nodes/nodes.md?raw';
import { LLMRouteKnowledge, LLMStepInstruction } from '../types';
import { findLandmarkByNameOrAlias } from './landmarksData';

export const loadNodesMarkdownText = (): string => {
  return rawNodesMd || '# Smart Campus Mapped Nodes & Destinations\n';
};

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
  aliases: string[];
  pathDescription: string;
  atomicSteps: MainDataAtomicStep[];
}

const STORAGE_KEY_MD = 'MAIN_DATA_MD';

// Load stored maindata.md text from localStorage or default maindata.md file
export const loadMainDataMarkdownText = (): string => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MD);
    if (saved !== null && saved.trim().length > 0) {
      return saved;
    }
  } catch (e) {
    console.warn('Notice loading MAIN_DATA_MD from storage:', e);
  }
  return rawMainDataMd || '# Smart Campus Main Landmark Data\n\n<!-- Format per line: Landmark to Destination - Path -->\n';
};

export const saveMainDataMarkdownText = (mdText: string) => {
  try {
    localStorage.setItem(STORAGE_KEY_MD, mdText);
  } catch (e) {
    console.warn('Notice saving MAIN_DATA_MD to storage:', e);
  }
};

// Decompose raw walk path description into small atomic single-work steps
export const breakdownPathToAtomicSteps = (pathText: string, destination: string): MainDataAtomicStep[] => {
  const steps: MainDataAtomicStep[] = [];
  const sentences = pathText.split(/(?<=[.!?])\s+|\s*\.\s*|\n+/).filter(s => s.trim().length > 0);

  let stepCounter = 1;

  for (const sentence of sentences) {
    const sLower = sentence.toLowerCase().trim();
    if (!sLower) continue;

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
    } else if (sLower.includes('destination') || sLower.includes('reach') || sLower.includes('arrived') || sLower.includes('infront') || sLower.includes('in front')) {
      action = 'arrive';
      headingDegrees = 0;
      headingText = 'arrive';
      instruction = `Destination reached (${destination})`;
    } else {
      action = 'straight';
      headingDegrees = 0;
      headingText = 'straight';
      instruction = stepsCount > 0 ? `Move straight ${stepsCount} steps` : `Move straight`;
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
      instruction: `Destination reached (${destination})`,
      action: 'arrive',
      stepsCount: 0,
      headingDegrees: 0,
      headingText: 'arrive',
      voicePrompt: `Destination reached (${destination})`
    });
  }

  return steps;
};

// Parse maindata.md lines at runtime
export const parseMainDataMarkdown = (mdText: string): MainDataRoute[] => {
  const routes: MainDataRoute[] = [];
  const lines = mdText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('<!--'));

  for (const line of lines) {
    if (!line.includes(' - ') || !line.toLowerCase().includes(' to ')) continue;

    const parts = line.split(' - ');
    const headerPart = parts[0].trim();
    const pathDescription = parts.slice(1).join(' - ').trim();

    const headerSplit = headerPart.split(/ to /i);
    if (headerSplit.length < 2) continue;

    const startLandmark = headerSplit[0].trim();
    const destinationRaw = headerSplit[1].trim();

    // Extract aliases if destination is separated by 'or' or 'and'
    const aliases = destinationRaw.split(/\s+(?:or|and)\s+/i).map(a => a.trim()).filter(Boolean);
    const primaryDestination = aliases[0] || destinationRaw;

    const landmarkObj = findLandmarkByNameOrAlias(startLandmark);
    const floor = landmarkObj ? landmarkObj.floor : (startLandmark.toLowerCase().includes('stair') ? 2 : 1);
    const facingOrientation = landmarkObj ? landmarkObj.facingOrientation : (floor === 2 ? 'Face towards the wall at the end of the staircase' : 'Face the same way as you enter through the main entrance');

    const atomicSteps = breakdownPathToAtomicSteps(pathDescription, primaryDestination);

    routes.push({
      id: `route_${floor === 1 ? 'gf' : 'ff'}_${primaryDestination.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
      floor,
      startLandmark,
      facingOrientation,
      destination: primaryDestination,
      aliases,
      pathDescription,
      atomicSteps
    });
  }

  return routes;
};

// Append new entry line to maindata.md in format: Landmark to Destination - Path
export const appendEntryToMainDataMarkdown = (
  startLandmark: string,
  destination: string,
  pathDescription: string
): string => {
  const currentMd = loadMainDataMarkdownText();
  const newLine = `${startLandmark} to ${destination} - ${pathDescription.replace(/\n+/g, ' ').trim()}`;
  const updatedMd = currentMd.trim() + '\n' + newLine + '\n';
  saveMainDataMarkdownText(updatedMd);
  return updatedMd;
};

// Helper: Normalize text for flexible intent matching
const normalizeTextForSearch = (str: string): string => {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Helper: Extract numbers from string (e.g. "room f-05" -> 5, "f12" -> 12)
const extractNumbersFromString = (str: string): number[] => {
  const matches = str.match(/\d+/g);
  return matches ? matches.map(m => parseInt(m, 10)) : [];
};

// INTENT & NUMERIC KEYWORD SEARCH IN MAINDATA.MD
export const findMainDataRouteFromMarkdown = (query: string, startLandmark?: string): MainDataRoute | null => {
  const mdText = loadMainDataMarkdownText();
  const routes = parseMainDataMarkdown(mdText);

  const qRaw = query.toLowerCase().trim();
  const qNorm = normalizeTextForSearch(query);
  const qNums = extractNumbersFromString(query);
  if (!qNorm) return null;

  for (const route of routes) {
    const landmarkMatch = !startLandmark || normalizeTextForSearch(route.startLandmark).includes(normalizeTextForSearch(startLandmark)) || normalizeTextForSearch(startLandmark).includes(normalizeTextForSearch(route.startLandmark));
    if (!landmarkMatch) continue;

    const allAliases = [route.destination, ...route.aliases];

    for (const alias of allAliases) {
      const aRaw = alias.toLowerCase().trim();
      const aNorm = normalizeTextForSearch(alias);
      const aNums = extractNumbersFromString(alias);

      // 1. Direct or Substring Normalized Match
      if (aRaw === qRaw || aNorm === qNorm || aNorm.includes(qNorm) || qNorm.includes(aNorm) || aRaw.includes(qRaw) || qRaw.includes(aRaw)) {
        return route;
      }

      // 2. Numeric Matching (e.g. "f-05" or "room 5" matches "Room F-05")
      if (qNums.length > 0 && aNums.length > 0) {
        const hasNumberMatch = qNums.some(num => aNums.includes(num));
        if (hasNumberMatch) {
          // Check for category keyword alignment (e.g. "room", "f", "lab", "floor", "stairs")
          const keywords = ['room', 'f', 'lab', 'stairs', 'floor', 'node'];
          const qHasKeyword = keywords.some(k => qRaw.includes(k));
          const aHasKeyword = keywords.some(k => aRaw.includes(k));
          if (qHasKeyword || aHasKeyword || qNums.length === aNums.length) {
            return route;
          }
        }
      }

      // 3. Synonym / Intent Keyword Match
      const intentSynonyms: Record<string, string[]> = {
        washroom: ['washroom', 'toilet', 'restroom', 'bathroom', 'lavatory', 'wc', 'boys washroom', 'girls washroom'],
        watercooler: ['watercooler', 'water', 'drinking water', 'cooler', 'filter'],
        elevator: ['elevator', 'lift'],
        pantry: ['pantry', 'store', 'storeroom'],
        mechanical: ['mechanical', 'mech'],
        datascience: ['data science', 'ds lab', 'ds'],
        language: ['communication language', 'language lab', 'english lab'],
        smartapp: ['smart application', 'smart app', 'app lab']
      };

      for (const [, synonyms] of Object.entries(intentSynonyms)) {
        const qMatchesKey = synonyms.some(syn => qRaw.includes(syn));
        const aMatchesKey = synonyms.some(syn => aRaw.includes(syn));
        if (qMatchesKey && aMatchesKey) {
          return route;
        }
      }
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
    aliases: route.aliases,
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
