import { LLMRouteKnowledge } from '../data/llmRoutesKnowledge';
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
      console.warn('Gemini API Key attempt notice, trying fallback:', err);
    }
  }

  return null;
};

export const generateLLMRouteWithGemini = async (
  rawDescription: string,
  _compassHeading?: number,
  _stepsWalked?: number
): Promise<LLMRouteKnowledge | null> => {
  return generateRouteDirectlyFromCorpus(rawDescription, 'Main Entrance');
};
