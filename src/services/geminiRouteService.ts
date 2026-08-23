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

// Generate Step-by-Step Navigation Directly from Raw Spoken Corpuses (Simple Atomic Single-Action Steps)
export const generateRouteDirectlyFromCorpus = async (
  destinationQuery: string,
  startPoint: string = 'Main Entrance'
): Promise<LLMRouteKnowledge | null> => {
  const { primary, fallback } = getGeminiApiKeys();
  const apiKeysToTry = [primary, fallback].filter(k => k && !k.includes('DemoApiKey'));

  const systemPrompt = `You are a Smart Campus Navigation AI Engine.
Analyze the following raw spoken campus walk corpuses and generate a step-by-step navigation route from "${startPoint}" to "${destinationQuery}".

RAW CAMPUS CORPUSES:
[GROUND FLOOR (FLOOR 1)]:
${GROUND_FLOOR_CORPUS}

[FIRST FLOOR (FLOOR 2)]:
${FIRST_FLOOR_CORPUS}

CRITICAL SIMPLE ATOMIC STEP RULE:
Keep each step simple and ONE work/action at a time! Do NOT combine walking, turning, or stair climbing into a single step.
Format step instructions as simple atomic single actions:
- Walk step: "Move straight approx [N] steps."
- Turn step: "Turn left." or "Turn right."
- Stair step: "Take stairs up." or "Take stairs down."
- Elevator step: "Take elevator."
- Arrival step: "Reach ${destinationQuery}."

Return strictly raw valid JSON (no markdown formatting around json):
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
  "overviewSummary": "Direct atomic step navigation from ${startPoint} to ${destinationQuery}.",
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Move straight approx 15 steps.",
      "headingDegrees": 0,
      "headingText": "straight",
      "stepsCount": 15,
      "voicePrompt": "Move straight approx 15 steps."
    },
    {
      "stepNumber": 2,
      "instruction": "Turn left.",
      "headingDegrees": 270,
      "headingText": "turn left",
      "stepsCount": 0,
      "voicePrompt": "Turn left."
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
      console.warn('Gemini API Key attempt notice, using local atomic corpus path builder:', err);
    }
  }

  // Pure Deterministic Atomic Single-Action Corpus Path Builder Fallback
  return generateLocalCorpusAtomicPath(destinationQuery, startPoint);
};

// Deterministic Atomic Single-Action Corpus Path Builder (ONE action per step)
const generateLocalCorpusAtomicPath = (destination: string, start: string): LLMRouteKnowledge => {
  const destLower = destination.toLowerCase();
  const startName = start.trim() || 'Main Entrance';

  const steps: LLMStepInstruction[] = [];
  let totalSteps = 0;
  let floor = 1;
  let category: LLMRouteKnowledge['category'] = 'facility';

  // Atomic Single-Action Steps Definitions
  const stepWalkToJunction: LLMStepInstruction = {
    stepNumber: 1,
    instruction: `Move straight approx 15 steps from ${startName} to hallway junction.`,
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 15,
    voicePrompt: `Move straight approx 15 steps from ${startName} to hallway junction.`
  };

  const stepTurnLeftJunction: LLMStepInstruction = {
    stepNumber: 2,
    instruction: "Turn left.",
    headingDegrees: 270,
    headingText: "turn left",
    stepsCount: 0,
    voicePrompt: "Turn left."
  };

  const stepWalkToStairs: LLMStepInstruction = {
    stepNumber: 3,
    instruction: "Move straight approx 14 steps to reach staircase.",
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 14,
    voicePrompt: "Move straight approx 14 steps to reach staircase."
  };

  const stepWalkToElevator: LLMStepInstruction = {
    stepNumber: 4,
    instruction: "Move straight approx 20 steps to reach elevator.",
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 20,
    voicePrompt: "Move straight approx 20 steps to reach elevator."
  };

  const stepWalkToNode5: LLMStepInstruction = {
    stepNumber: 5,
    instruction: "Move straight approx 5 steps.",
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 5,
    voicePrompt: "Move straight approx 5 steps."
  };

  const stepArriveNode5: LLMStepInstruction = {
    stepNumber: 6,
    instruction: "Reach Node 5 facility.",
    headingDegrees: 0,
    headingText: "arrive",
    stepsCount: 0,
    voicePrompt: "Reach Node 5 facility."
  };

  const stepWalkToNode6: LLMStepInstruction = {
    stepNumber: 6,
    instruction: "Move straight approx 20 steps.",
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 20,
    voicePrompt: "Move straight approx 20 steps."
  };

  const stepArriveNode6: LLMStepInstruction = {
    stepNumber: 7,
    instruction: "Reach Node 6 facility.",
    headingDegrees: 0,
    headingText: "arrive",
    stepsCount: 0,
    voicePrompt: "Reach Node 6 facility."
  };

  const stepWalkToDSLab: LLMStepInstruction = {
    stepNumber: 4,
    instruction: "Move straight approx 10 steps.",
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 10,
    voicePrompt: "Move straight approx 10 steps."
  };

  const stepArriveDSLab: LLMStepInstruction = {
    stepNumber: 5,
    instruction: "Reach Data Science Lab.",
    headingDegrees: 0,
    headingText: "arrive",
    stepsCount: 0,
    voicePrompt: "Reach Data Science Lab."
  };

  const stepTurnLeftDSLab: LLMStepInstruction = {
    stepNumber: 5,
    instruction: "Turn left.",
    headingDegrees: 270,
    headingText: "turn left",
    stepsCount: 0,
    voicePrompt: "Turn left."
  };

  const stepWalkToNode8: LLMStepInstruction = {
    stepNumber: 6,
    instruction: "Move straight approx 20 steps.",
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 20,
    voicePrompt: "Move straight approx 20 steps."
  };

  const stepArriveNode8: LLMStepInstruction = {
    stepNumber: 7,
    instruction: "Reach Node 8 facility.",
    headingDegrees: 0,
    headingText: "arrive",
    stepsCount: 0,
    voicePrompt: "Reach Node 8 facility."
  };

  // First Floor Atomic Steps
  const stepClimbStairs: LLMStepInstruction = {
    stepNumber: 4,
    instruction: "Take stairs up to First Floor.",
    headingDegrees: 0,
    headingText: "take stairs up",
    stepsCount: 20,
    voicePrompt: "Take stairs up to First Floor."
  };

  const stepWalkToAuditorium: LLMStepInstruction = {
    stepNumber: 5,
    instruction: "Move straight approx 10 steps.",
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 10,
    voicePrompt: "Move straight approx 10 steps."
  };

  const stepArriveAuditorium: LLMStepInstruction = {
    stepNumber: 6,
    instruction: "Reach Main Auditorium.",
    headingDegrees: 0,
    headingText: "arrive",
    stepsCount: 0,
    voicePrompt: "Reach Main Auditorium."
  };

  const stepTurnRightAuditorium: LLMStepInstruction = {
    stepNumber: 6,
    instruction: "Turn right.",
    headingDegrees: 90,
    headingText: "turn right",
    stepsCount: 0,
    voicePrompt: "Turn right."
  };

  const stepWalkToAILab: LLMStepInstruction = {
    stepNumber: 7,
    instruction: "Move straight approx 25 steps.",
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 25,
    voicePrompt: "Move straight approx 25 steps."
  };

  const stepArriveAILab: LLMStepInstruction = {
    stepNumber: 8,
    instruction: "Reach AI Research Center.",
    headingDegrees: 0,
    headingText: "arrive",
    stepsCount: 0,
    voicePrompt: "Reach AI Research Center."
  };

  const stepWalkToLibrary: LLMStepInstruction = {
    stepNumber: 8,
    instruction: "Move straight approx 15 steps.",
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 15,
    voicePrompt: "Move straight approx 15 steps."
  };

  const stepArriveLibrary: LLMStepInstruction = {
    stepNumber: 9,
    instruction: "Reach Central Library.",
    headingDegrees: 0,
    headingText: "arrive",
    stepsCount: 0,
    voicePrompt: "Reach Central Library."
  };

  const stepTurnLeftLibrary: LLMStepInstruction = {
    stepNumber: 9,
    instruction: "Turn left.",
    headingDegrees: 270,
    headingText: "turn left",
    stepsCount: 0,
    voicePrompt: "Turn left."
  };

  const stepWalkToCabins: LLMStepInstruction = {
    stepNumber: 10,
    instruction: "Move straight approx 12 steps.",
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 12,
    voicePrompt: "Move straight approx 12 steps."
  };

  const stepArriveCabins: LLMStepInstruction = {
    stepNumber: 11,
    instruction: "Reach Faculty Cabins.",
    headingDegrees: 0,
    headingText: "arrive",
    stepsCount: 0,
    voicePrompt: "Reach Faculty Cabins."
  };

  const stepWalkToWashroom: LLMStepInstruction = {
    stepNumber: 11,
    instruction: "Move straight approx 8 steps.",
    headingDegrees: 0,
    headingText: "straight",
    stepsCount: 8,
    voicePrompt: "Move straight approx 8 steps."
  };

  const stepArriveWashroom: LLMStepInstruction = {
    stepNumber: 12,
    instruction: "Reach Washroom.",
    headingDegrees: 0,
    headingText: "arrive",
    stepsCount: 0,
    voicePrompt: "Reach Washroom."
  };

  // Build Route based on Destination Query using Atomic Steps (ONE action per step)
  if (destLower.includes('junction')) {
    steps.push(stepWalkToJunction);
  } else if (destLower.includes('stair')) {
    steps.push(stepWalkToJunction, stepTurnLeftJunction, stepWalkToStairs);
  } else if (destLower.includes('elevator') || destLower.includes('lift')) {
    steps.push(stepWalkToJunction, stepTurnLeftJunction, stepWalkToStairs, stepWalkToElevator);
  } else if (destLower.includes('node 5') || destLower.includes('node5')) {
    steps.push(stepWalkToJunction, stepTurnLeftJunction, stepWalkToStairs, stepWalkToElevator, stepWalkToNode5, stepArriveNode5);
  } else if (destLower.includes('node 6') || destLower.includes('node6')) {
    steps.push(stepWalkToJunction, stepTurnLeftJunction, stepWalkToStairs, stepWalkToElevator, stepWalkToNode5, stepWalkToNode6, stepArriveNode6);
  } else if (destLower.includes('data science') || destLower.includes('ds lab')) {
    category = 'lab';
    steps.push(stepWalkToJunction, stepTurnLeftJunction, stepWalkToStairs, stepWalkToDSLab, stepArriveDSLab);
  } else if (destLower.includes('node 8') || destLower.includes('node8')) {
    steps.push(stepWalkToJunction, stepTurnLeftJunction, stepWalkToStairs, stepWalkToDSLab, stepTurnLeftDSLab, stepWalkToNode8, stepArriveNode8);
  } else if (destLower.includes('auditorium')) {
    floor = 2;
    category = 'auditorium';
    steps.push(stepWalkToJunction, stepTurnLeftJunction, stepWalkToStairs, stepClimbStairs, stepWalkToAuditorium, stepArriveAuditorium);
  } else if (destLower.includes('ai') || destLower.includes('research')) {
    floor = 2;
    category = 'lab';
    steps.push(stepWalkToJunction, stepTurnLeftJunction, stepWalkToStairs, stepClimbStairs, stepWalkToAuditorium, stepTurnRightAuditorium, stepWalkToAILab, stepArriveAILab);
  } else if (destLower.includes('library')) {
    floor = 2;
    category = 'library';
    steps.push(stepWalkToJunction, stepTurnLeftJunction, stepWalkToStairs, stepClimbStairs, stepWalkToAuditorium, stepTurnRightAuditorium, stepWalkToAILab, stepWalkToLibrary, stepArriveLibrary);
  } else if (destLower.includes('cabin') || destLower.includes('faculty')) {
    floor = 2;
    category = 'cabin';
    steps.push(stepWalkToJunction, stepTurnLeftJunction, stepWalkToStairs, stepClimbStairs, stepWalkToAuditorium, stepTurnRightAuditorium, stepWalkToAILab, stepWalkToLibrary, stepTurnLeftLibrary, stepWalkToCabins, stepArriveCabins);
  } else if (destLower.includes('washroom') || destLower.includes('toilet') || destLower.includes('restroom')) {
    floor = 2;
    category = 'washroom';
    steps.push(stepWalkToJunction, stepTurnLeftJunction, stepWalkToStairs, stepClimbStairs, stepWalkToAuditorium, stepTurnRightAuditorium, stepWalkToAILab, stepWalkToLibrary, stepTurnLeftLibrary, stepWalkToCabins, stepWalkToWashroom, stepArriveWashroom);
  } else {
    // Custom landmark
    steps.push(
      {
        stepNumber: 1,
        instruction: `Move straight approx 15 steps from ${startName}.`,
        headingDegrees: 0,
        headingText: "straight",
        stepsCount: 15,
        voicePrompt: `Move straight approx 15 steps from ${startName}.`
      },
      {
        stepNumber: 2,
        instruction: "Turn right.",
        headingDegrees: 90,
        headingText: "turn right",
        stepsCount: 0,
        voicePrompt: "Turn right."
      },
      {
        stepNumber: 3,
        instruction: `Move straight approx 20 steps to reach ${destination}.`,
        headingDegrees: 0,
        headingText: "straight",
        stepsCount: 20,
        voicePrompt: `Move straight approx 20 steps to reach ${destination}.`
      }
    );
  }

  // Renumber step numbers sequentially
  steps.forEach((s, idx) => {
    s.stepNumber = idx + 1;
  });

  totalSteps = steps.reduce((sum, s) => sum + s.stepsCount, 0);

  return {
    id: `ROUTE_ATOMIC_${destination.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now()}`,
    category,
    destinationName: destination,
    aliases: [destination.toLowerCase()],
    startPoint: startName,
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
