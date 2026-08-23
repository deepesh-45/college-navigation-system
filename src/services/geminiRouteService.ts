import { LLMRouteKnowledge } from '../types';
import { findLandmarkByNameOrAlias, getAnchorLandmarkForFloor } from '../data/landmarksData';
import { loadMainDataMarkdownText, findMainDataRouteFromMarkdown, convertMainDataToLLMRoute } from '../data/maindataService';

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

// STRICT MAINDATA.MD NAVIGATION ENGINE (maindata.md is the ONLY source of path information)
export const generateRouteDirectlyFromCorpus = async (
  destinationQuery: string,
  startPoint: string = 'Main Entrance'
): Promise<LLMRouteKnowledge | null> => {
  // 1. Search maindata.md FIRST
  const savedMainRoute = findMainDataRouteFromMarkdown(destinationQuery, startPoint);
  if (savedMainRoute) {
    return convertMainDataToLLMRoute(savedMainRoute);
  }

  const { primary, fallback } = getGeminiApiKeys();
  const apiKeysToTry = [primary, fallback].filter(k => k && !k.includes('DemoApiKey'));

  const matchedLandmark = findLandmarkByNameOrAlias(startPoint) || getAnchorLandmarkForFloor(1);
  const facingOrientation = matchedLandmark.facingOrientation;
  const mainDataMdText = loadMainDataMarkdownText();

  const systemPrompt = `You are the Master Smart Campus AI Navigation Engine.
Extract the route matching Starting Landmark "${matchedLandmark.name}" and Destination "${destinationQuery}" STRICTLY from maindata.md.

STARTING LANDMARK ORIENTATION INSTRUCTION:
"${facingOrientation}"

LIVE MAINDATA.MD LANDMARK ROUTES:
${mainDataMdText}

CRITICAL RULES:
1. Use ONLY the paths defined in maindata.md. If the destination "${destinationQuery}" is NOT present in maindata.md, return JSON {"error": "Path not found in maindata.md"}.
2. Step 1 MUST be the Landmark Facing Orientation Instruction:
   "instruction": "${facingOrientation}"
3. Subsequent steps MUST be simple single actions (ONE action per step):
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
      console.warn('Gemini API Key attempt notice:', err);
    }
  }

  // NO FAKE FALLBACKS! maindata.md is the ONLY source of truth!
  return null;
};

export const generateLLMRouteWithGemini = async (
  rawDescription: string,
  _compassHeading?: number,
  _stepsWalked?: number
): Promise<LLMRouteKnowledge | null> => {
  return generateRouteDirectlyFromCorpus(rawDescription, 'Main Entrance');
};
