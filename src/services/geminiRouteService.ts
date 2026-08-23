import { LLMRouteKnowledge, LLMStepInstruction } from '../data/llmRoutesKnowledge';
import { CAMPUS_LANDMARKS, findLandmarkByNameOrAlias, getAnchorLandmarkForFloor } from '../data/landmarksData';
import { loadMainDataMarkdownText } from '../data/maindataService';

export interface ParsedVoiceIntent {
  startPoint: string;
  destination: string;
}

export const getGeminiApiKeys = (): { primary: string; fallback: string } => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  return {
    primary: metaEnv?.VITE_GEMINI_API_KEY || '',
    fallback: metaEnv?.VITE_GEMINI_API_KEY_FALLBACK || ''
  };
};

// Parse Natural Language Spoken Voice Query into Start Point & Destination Entities via Gemini AI API
export const parseVoiceIntentWithGemini = async (
  userVoiceQuery: string
): Promise<ParsedVoiceIntent> => {
  const { primary, fallback } = getGeminiApiKeys();
  const apiKeysToTry = [primary, fallback].filter(k => k && !k.includes('DemoApiKey'));

  const systemPrompt = `You are a Smart Campus Voice Intent Parser.
Extract the starting location and destination from the user's spoken voice query.
If the starting location is not explicitly mentioned by the user, default startPoint to "Main Entrance".

Available Campus Anchor Landmarks:
- Ground Floor (Floor 1): "Main Entrance" (Orientation: Face the same way as you enter through the main entrance)
- First Floor (Floor 2): "Stair Landing" (Orientation: Face towards the wall at the end of the staircase)

User Spoken Query: "${userVoiceQuery}"

Return strictly raw valid JSON (no markdown formatting around json):
{
  "startPoint": "Extracted Start Location or Main Entrance",
  "destination": "Extracted Destination Location"
}`;

  for (const apiKey of apiKeysToTry) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      });

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJsonText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonText);
      if (parsed && parsed.destination) {
        return {
          startPoint: parsed.startPoint || 'Main Entrance',
          destination: parsed.destination
        };
      }
    } catch (err) {
      console.warn('Gemini Voice Intent Parser notice, using fallback:', err);
    }
  }

  // Fallback Local NLP Pattern Extractor
  const lower = userVoiceQuery.toLowerCase();
  let startPoint = 'Main Entrance';
  let destination = userVoiceQuery;

  if (lower.includes('from ') && lower.includes(' to ')) {
    const parts = lower.split(' to ');
    destination = parts[1].trim();
    startPoint = parts[0].replace('from ', '').replace('i am at ', '').replace('start from ', '').trim();
  } else if (lower.includes('take me to ')) {
    destination = lower.replace('take me to ', '').trim();
  } else if (lower.includes('where is ')) {
    destination = lower.replace('where is ', '').trim();
  } else if (lower.includes('how to reach ')) {
    destination = lower.replace('how to reach ', '').trim();
  }

  return {
    startPoint: startPoint || 'Main Entrance',
    destination: destination || userVoiceQuery
  };
};

// Dedicated Gemini AI Navigation Prompt Engine (Landmark Facing Orientation Step 1 + Atomic Steps)
export const generateRouteDirectlyFromCorpus = async (
  destinationQuery: string,
  startPoint: string = 'Main Entrance'
): Promise<LLMRouteKnowledge | null> => {
  const { primary, fallback } = getGeminiApiKeys();
  const apiKeysToTry = [primary, fallback].filter(k => k && !k.includes('DemoApiKey'));

  const matchedLandmark = findLandmarkByNameOrAlias(startPoint) || getAnchorLandmarkForFloor(1);
  const facingOrientation = matchedLandmark.facingOrientation;
  const mainDataMdText = loadMainDataMarkdownText();

  const systemPrompt = `You are the Master Smart Campus AI Navigation Engine.
Analyze maindata.md landmark routes and generate a step-by-step navigation route from "${matchedLandmark.name}" to "${destinationQuery}".

STARTING LANDMARK ORIENTATION INSTRUCTION:
"${facingOrientation}"

LIVE MAINDATA.MD LANDMARK ROUTES:
${mainDataMdText}

CRITICAL SIMPLE ATOMIC STEP DECOMPOSITION RULES:
1. Step 1 MUST be the Landmark Facing Orientation Instruction:
   "instruction": "${facingOrientation}"
2. Subsequent steps MUST be simple single actions (ONE action per step):
   - Walk step: "Move straight [N] steps." / "Move [N] steps."
   - Turn step: "Move left." / "Move right."
   - Stair step: "Take stairs up." / "Take stairs down."
   - Arrival step: "Destination reached (${destinationQuery})."

Return strictly raw valid JSON (no markdown formatting around json):
{
  "id": "ROUTE_DYNAMIC_CORPUS_${Date.now()}",
  "category": "lab|classroom|cabin|washroom|watercooler|auditorium|library|canteen|facility",
  "destinationName": "${destinationQuery}",
  "aliases": ["${destinationQuery.toLowerCase()}"],
  "startPoint": "${matchedLandmark.name}",
  "facingOrientation": "${facingOrientation}",
  "building": "Main Campus",
  "floor": ${matchedLandmark.floor},
  "totalSteps": 35,
  "totalDistanceMeters": 26,
  "overviewSummary": "Landmark navigation from ${matchedLandmark.name} to ${destinationQuery}.",
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "${facingOrientation}",
      "headingDegrees": 0,
      "headingText": "orient",
      "stepsCount": 0,
      "voicePrompt": "${facingOrientation}"
    },
    {
      "stepNumber": 2,
      "instruction": "Move straight 15 steps.",
      "headingDegrees": 0,
      "headingText": "straight",
      "stepsCount": 15,
      "voicePrompt": "Move straight 15 steps."
    }
  ]
}`;

  for (const apiKey of apiKeysToTry) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      });

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJsonText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonText);
      if (parsed && parsed.steps && parsed.steps.length > 0) {
        parsed.facingOrientation = facingOrientation;
        return parsed as LLMRouteKnowledge;
      }
    } catch (err) {
      console.warn('Gemini API Key attempt notice, using local landmark corpus path builder:', err);
    }
  }

  // Pure Deterministic Landmark Corpus Path Builder Fallback
  return generateLocalCorpusAtomicPath(destinationQuery, startPoint);
};

// Deterministic Landmark Corpus Path Builder with Step 1 Landmark Orientation & Atomic Steps
const generateLocalCorpusAtomicPath = (destination: string, start: string): LLMRouteKnowledge => {
  const destLower = destination.toLowerCase();

  // Match starting landmark (Floor 1: Main Entrance, Floor 2: Stair Landing)
  const landmark = findLandmarkByNameOrAlias(start) || 
    (start.toLowerCase().includes('first floor') || start.toLowerCase().includes('stair') 
      ? CAMPUS_LANDMARKS[1] 
      : CAMPUS_LANDMARKS[0]);

  const startName = landmark.name;
  const facingOrientation = landmark.facingOrientation;

  const steps: LLMStepInstruction[] = [];
  let floor = landmark.floor;
  let category: LLMRouteKnowledge['category'] = 'facility';

  // Step 1: Landmark Facing Orientation Step
  steps.push({
    stepNumber: 1,
    instruction: facingOrientation,
    headingDegrees: 0,
    headingText: "orient",
    stepsCount: 0,
    voicePrompt: facingOrientation
  });

  // Ground Floor Atomic Steps (Starting from Main Entrance)
  const stepWalkToJunction: LLMStepInstruction = {
    stepNumber: 2,
    instruction: `Move straight 15 steps.`,
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 15,
    voicePrompt: `Move straight 15 steps.`
  };

  const stepTurnLeftJunction: LLMStepInstruction = {
    stepNumber: 3,
    instruction: "Move left.",
    headingDegrees: 270,
    headingText: "turn left",
    stepsCount: 0,
    voicePrompt: "Move left."
  };

  const stepWalkToStairs: LLMStepInstruction = {
    stepNumber: 4,
    instruction: "Move straight 14 steps.",
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 14,
    voicePrompt: "Move straight 14 steps."
  };

  const stepWalkToElevator: LLMStepInstruction = {
    stepNumber: 5,
    instruction: "Move straight 20 steps.",
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 20,
    voicePrompt: "Move straight 20 steps."
  };

  const stepWalkToDSLab: LLMStepInstruction = {
    stepNumber: 5,
    instruction: "Move straight 10 steps.",
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 10,
    voicePrompt: "Move straight 10 steps."
  };

  const stepArriveDSLab: LLMStepInstruction = {
    stepNumber: 6,
    instruction: `Destination reached (${destination}).`,
    headingDegrees: 0,
    headingText: "arrive",
    stepsCount: 0,
    voicePrompt: `Destination reached (${destination}).`
  };

  // First Floor Atomic Steps (Starting from Stair Landing)
  const stepWalkToAuditorium: LLMStepInstruction = {
    stepNumber: 2,
    instruction: "Move straight 10 steps.",
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 10,
    voicePrompt: "Move straight 10 steps."
  };

  const stepArriveAuditorium: LLMStepInstruction = {
    stepNumber: 3,
    instruction: `Destination reached (${destination}).`,
    headingDegrees: 0,
    headingText: "arrive",
    stepsCount: 0,
    voicePrompt: `Destination reached (${destination}).`
  };

  if (landmark.floor === 2) {
    steps.push(stepWalkToAuditorium, stepArriveAuditorium);
  } else {
    if (destLower.includes('data science') || destLower.includes('ds lab')) {
      category = 'lab';
      steps.push(stepWalkToJunction, stepTurnLeftJunction, stepWalkToStairs, stepWalkToDSLab, stepArriveDSLab);
    } else {
      steps.push(stepWalkToJunction, stepTurnLeftJunction, stepWalkToStairs, stepWalkToElevator, stepArriveDSLab);
    }
  }

  // Renumber step numbers sequentially
  steps.forEach((s, idx) => {
    s.stepNumber = idx + 1;
  });

  const totalSteps = steps.reduce((sum, s) => sum + s.stepsCount, 0);

  return {
    id: `ROUTE_ATOMIC_${destination.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now()}`,
    category,
    destinationName: destination,
    aliases: [destination.toLowerCase()],
    startPoint: startName,
    facingOrientation,
    building: 'Main Campus',
    floor,
    totalSteps,
    totalDistanceMeters: Math.round(totalSteps * 0.75),
    overviewSummary: `Atomic step navigation route from ${startName} to ${destination} (${steps.length} simple steps).`,
    steps
  };
};

export const generateLLMRouteWithGemini = async (
  rawDescription: string,
  _compassHeading?: number,
  _stepsWalked?: number
): Promise<LLMRouteKnowledge | null> => {
  return generateRouteDirectlyFromCorpus(rawDescription, 'Main Entrance');
};
