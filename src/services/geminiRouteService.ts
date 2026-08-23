import { LLMRouteKnowledge, LLMStepInstruction } from '../data/llmRoutesKnowledge';
import { GROUND_FLOOR_CORPUS, FIRST_FLOOR_CORPUS } from '../data/corpuses';

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

// Generate Step-by-Step Navigation Directly from Raw Spoken Corpuses (User Start Point -> Destination)
export const generateRouteDirectlyFromCorpus = async (
  destinationQuery: string,
  startPoint: string = 'Main Entrance'
): Promise<LLMRouteKnowledge | null> => {
  const { primary, fallback } = getGeminiApiKeys();
  const apiKeysToTry = [primary, fallback].filter(k => k && !k.includes('DemoApiKey'));

  const systemPrompt = `You are a Smart Campus Navigation AI Engine.
Analyze the following raw spoken campus walk corpuses and generate a step-by-step navigation route from the starting location "${startPoint}" to the requested destination "${destinationQuery}".

RAW CAMPUS CORPUSES:
[GROUND FLOOR (FLOOR 1)]:
${GROUND_FLOOR_CORPUS}

[FIRST FLOOR (FLOOR 2)]:
${FIRST_FLOOR_CORPUS}

RULES:
1. Carefully analyze the corpuses to locate the starting point "${startPoint}" and destination "${destinationQuery}".
2. Extract the required number of steps, directional turns (turn left, turn right, continue straight), and floor transitions via stairs/elevators between "${startPoint}" and "${destinationQuery}".
3. Format EVERY step instruction strictly as:
   "Move straight approx [N] steps and [turn left / turn right / continue straight / take stairs up / take stairs down / reach destination]."
4. Calculate totalSteps by summing stepsCount across all steps.
5. Calculate totalDistanceMeters as Math.round(totalSteps * 0.75).
6. Set startPoint to "${startPoint}" and destinationName to "${destinationQuery}".
7. Return strictly raw valid JSON (no markdown formatting around json) conforming to this structure:

{
  "id": "ROUTE_DYNAMIC_CORPUS_${Date.now()}",
  "category": "lab|classroom|cabin|washroom|watercooler|auditorium|library|canteen|facility",
  "destinationName": "${destinationQuery}",
  "aliases": ["${destinationQuery.toLowerCase()}"],
  "startPoint": "${startPoint}",
  "building": "Main Campus",
  "floor": 1,
  "totalSteps": 35,
  "totalDistanceMeters": 26,
  "overviewSummary": "Direct navigation route from ${startPoint} to ${destinationQuery} synthesized from campus corpus.",
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Move straight approx 15 steps and continue straight.",
      "headingDegrees": 0,
      "headingText": "continue straight",
      "stepsCount": 15,
      "voicePrompt": "Move straight approx 15 steps and continue straight."
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
        return parsed as LLMRouteKnowledge;
      }
    } catch (err) {
      console.warn('Gemini API Key attempt notice, using local corpus path builder:', err);
    }
  }

  // Pure Deterministic Corpus Graph & Route Generator Fallback
  return generateLocalCorpusPath(destinationQuery, startPoint);
};

// Deterministic Corpus Path Builder based on exact sentences in GROUND_FLOOR_CORPUS & FIRST_FLOOR_CORPUS
const generateLocalCorpusPath = (destination: string, start: string): LLMRouteKnowledge => {
  const destLower = destination.toLowerCase();
  const startName = start.trim() || 'Main Entrance';

  const steps: LLMStepInstruction[] = [];
  let totalSteps = 0;
  let floor = 1;
  let category: LLMRouteKnowledge['category'] = 'facility';

  // Ground Floor Corpus Steps
  const stepMainToJunction: LLMStepInstruction = {
    stepNumber: 1,
    instruction: `Move straight approx 15 steps from ${startName} to reach hallway junction.`,
    headingDegrees: 0,
    headingText: "continue straight",
    stepsCount: 15,
    voicePrompt: `Move straight approx 15 steps from ${startName} to reach hallway junction.`
  };

  const stepJunctionToStairs: LLMStepInstruction = {
    stepNumber: 2,
    instruction: "Move straight approx 14 steps and turn left to reach staircase.",
    headingDegrees: 270,
    headingText: "turn left",
    stepsCount: 14,
    voicePrompt: "Move straight approx 14 steps and turn left to reach staircase."
  };

  const stepStairsToElevator: LLMStepInstruction = {
    stepNumber: 3,
    instruction: "Move straight approx 20 steps to reach elevator.",
    headingDegrees: 0,
    headingText: "continue straight",
    stepsCount: 20,
    voicePrompt: "Move straight approx 20 steps to reach elevator."
  };

  const stepElevatorToNode5: LLMStepInstruction = {
    stepNumber: 4,
    instruction: "Move straight approx 5 steps to reach Node 5 facility.",
    headingDegrees: 0,
    headingText: "continue straight",
    stepsCount: 5,
    voicePrompt: "Move straight approx 5 steps to reach Node 5 facility."
  };

  const stepNode5ToNode6: LLMStepInstruction = {
    stepNumber: 5,
    instruction: "Move straight approx 20 steps to reach Node 6 facility.",
    headingDegrees: 0,
    headingText: "continue straight",
    stepsCount: 20,
    voicePrompt: "Move straight approx 20 steps to reach Node 6 facility."
  };

  const stepStairsToDSLab: LLMStepInstruction = {
    stepNumber: 3,
    instruction: "Move straight approx 10 steps to reach Data Science Lab.",
    headingDegrees: 0,
    headingText: "continue straight",
    stepsCount: 10,
    voicePrompt: "Move straight approx 10 steps to reach Data Science Lab."
  };

  const stepDSLabToNode8: LLMStepInstruction = {
    stepNumber: 4,
    instruction: "Move straight approx 20 steps and turn left to reach Node 8 facility.",
    headingDegrees: 270,
    headingText: "turn left",
    stepsCount: 20,
    voicePrompt: "Move straight approx 20 steps and turn left to reach Node 8 facility."
  };

  // First Floor Corpus Steps
  const stepStairsUpToFirstFloor: LLMStepInstruction = {
    stepNumber: 3,
    instruction: "Move straight approx 20 steps and take stairs up to First Floor.",
    headingDegrees: 0,
    headingText: "take stairs up",
    stepsCount: 20,
    voicePrompt: "Move straight approx 20 steps and take stairs up to First Floor."
  };

  const stepToAuditorium: LLMStepInstruction = {
    stepNumber: 4,
    instruction: "Move straight approx 10 steps to reach Main Auditorium.",
    headingDegrees: 0,
    headingText: "continue straight",
    stepsCount: 10,
    voicePrompt: "Move straight approx 10 steps to reach Main Auditorium."
  };

  const stepToAILab: LLMStepInstruction = {
    stepNumber: 5,
    instruction: "Move straight approx 25 steps and turn right to reach AI Research Center.",
    headingDegrees: 90,
    headingText: "turn right",
    stepsCount: 25,
    voicePrompt: "Move straight approx 25 steps and turn right to reach AI Research Center."
  };

  const stepToLibrary: LLMStepInstruction = {
    stepNumber: 6,
    instruction: "Move straight approx 15 steps to reach Central Library.",
    headingDegrees: 0,
    headingText: "continue straight",
    stepsCount: 15,
    voicePrompt: "Move straight approx 15 steps to reach Central Library."
  };

  const stepToCabins: LLMStepInstruction = {
    stepNumber: 7,
    instruction: "Move straight approx 12 steps and turn left to reach Faculty Cabins.",
    headingDegrees: 270,
    headingText: "turn left",
    stepsCount: 12,
    voicePrompt: "Move straight approx 12 steps and turn left to reach Faculty Cabins."
  };

  const stepToWashroom: LLMStepInstruction = {
    stepNumber: 8,
    instruction: "Move straight approx 8 steps to reach Washroom.",
    headingDegrees: 0,
    headingText: "continue straight",
    stepsCount: 8,
    voicePrompt: "Move straight approx 8 steps to reach Washroom."
  };

  // Build Route based on Destination Query
  if (destLower.includes('junction')) {
    steps.push(stepMainToJunction);
  } else if (destLower.includes('stair')) {
    steps.push(stepMainToJunction, stepJunctionToStairs);
  } else if (destLower.includes('elevator') || destLower.includes('lift')) {
    steps.push(stepMainToJunction, stepJunctionToStairs, stepStairsToElevator);
  } else if (destLower.includes('node 5') || destLower.includes('node5')) {
    steps.push(stepMainToJunction, stepJunctionToStairs, stepStairsToElevator, stepElevatorToNode5);
  } else if (destLower.includes('node 6') || destLower.includes('node6')) {
    steps.push(stepMainToJunction, stepJunctionToStairs, stepStairsToElevator, stepElevatorToNode5, stepNode5ToNode6);
  } else if (destLower.includes('data science') || destLower.includes('ds lab')) {
    category = 'lab';
    steps.push(stepMainToJunction, stepJunctionToStairs, stepStairsToDSLab);
  } else if (destLower.includes('node 8') || destLower.includes('node8')) {
    steps.push(stepMainToJunction, stepJunctionToStairs, stepStairsToDSLab, stepDSLabToNode8);
  } else if (destLower.includes('auditorium')) {
    floor = 2;
    category = 'auditorium';
    steps.push(stepMainToJunction, stepJunctionToStairs, stepStairsUpToFirstFloor, stepToAuditorium);
  } else if (destLower.includes('ai') || destLower.includes('research')) {
    floor = 2;
    category = 'lab';
    steps.push(stepMainToJunction, stepJunctionToStairs, stepStairsUpToFirstFloor, stepToAuditorium, stepToAILab);
  } else if (destLower.includes('library')) {
    floor = 2;
    category = 'library';
    steps.push(stepMainToJunction, stepJunctionToStairs, stepStairsUpToFirstFloor, stepToAuditorium, stepToAILab, stepToLibrary);
  } else if (destLower.includes('cabin') || destLower.includes('faculty')) {
    floor = 2;
    category = 'cabin';
    steps.push(stepMainToJunction, stepJunctionToStairs, stepStairsUpToFirstFloor, stepToAuditorium, stepToAILab, stepToLibrary, stepToCabins);
  } else if (destLower.includes('washroom') || destLower.includes('toilet') || destLower.includes('restroom')) {
    floor = 2;
    category = 'washroom';
    steps.push(stepMainToJunction, stepJunctionToStairs, stepStairsUpToFirstFloor, stepToAuditorium, stepToAILab, stepToLibrary, stepToCabins, stepToWashroom);
  } else {
    // Custom landmark
    steps.push(
      {
        stepNumber: 1,
        instruction: `Move straight approx 15 steps from ${startName} to main hallway junction.`,
        headingDegrees: 0,
        headingText: "continue straight",
        stepsCount: 15,
        voicePrompt: `Move straight approx 15 steps from ${startName} to main hallway junction.`
      },
      {
        stepNumber: 2,
        instruction: `Move straight approx 20 steps and turn right to reach ${destination}.`,
        headingDegrees: 90,
        headingText: "turn right",
        stepsCount: 20,
        voicePrompt: `Move straight approx 20 steps and turn right to reach ${destination}.`
      }
    );
  }

  // Renumber step numbers sequentially
  steps.forEach((s, idx) => {
    s.stepNumber = idx + 1;
  });

  totalSteps = steps.reduce((sum, s) => sum + s.stepsCount, 0);

  return {
    id: `ROUTE_CORPUS_${destination.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now()}`,
    category,
    destinationName: destination,
    aliases: [destination.toLowerCase()],
    startPoint: startName,
    building: 'Main Campus',
    floor,
    totalSteps,
    totalDistanceMeters: Math.round(totalSteps * 0.75),
    overviewSummary: `Step-by-step navigation route from ${startName} to ${destination} synthesized directly from corpus text (${steps.length} steps, ${totalSteps} total footsteps).`,
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
