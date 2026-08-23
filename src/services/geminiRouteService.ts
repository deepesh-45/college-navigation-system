import { LLMRouteKnowledge } from '../data/llmRoutesKnowledge';
import { GROUND_FLOOR_CORPUS, FIRST_FLOOR_CORPUS } from '../data/corpuses';

export const getGeminiApiKeys = (): { primary: string; fallback: string } => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  return {
    primary: metaEnv?.VITE_GEMINI_API_KEY || '',
    fallback: metaEnv?.VITE_GEMINI_API_KEY_FALLBACK || ''
  };
};

// Generate Step-by-Step Navigation Directly from Raw Spoken Corpuses with Gemini AI
export const generateRouteDirectlyFromCorpus = async (
  destinationQuery: string
): Promise<LLMRouteKnowledge | null> => {
  const { primary, fallback } = getGeminiApiKeys();
  const apiKeysToTry = [primary, fallback].filter(k => k && !k.includes('DemoApiKey'));

  const systemPrompt = `You are a Smart Campus Navigation AI Engine.
Analyze the following raw spoken campus walk corpuses and generate a step-by-step navigation route from Main Entrance to the requested destination: "${destinationQuery}".

RAW CAMPUS CORPUSES:
[GROUND FLOOR (FLOOR 1)]:
${GROUND_FLOOR_CORPUS}

[FIRST FLOOR (FLOOR 2)]:
${FIRST_FLOOR_CORPUS}

RULES:
1. Carefully analyze the corpuses to extract the required number of steps, directional turns (turn left, turn right, continue straight), and floor transitions via stairs/elevators.
2. Format EVERY step instruction strictly as:
   "Move straight approx [N] steps and [turn left / turn right / continue straight / take stairs up / take stairs down / reach destination]."
3. Calculate totalSteps by summing stepsCount across all steps.
4. Calculate totalDistanceMeters as Math.round(totalSteps * 0.75).
5. Return strictly raw valid JSON (no markdown formatting around json) conforming to this structure:

{
  "id": "ROUTE_DYNAMIC_CORPUS_${Date.now()}",
  "category": "lab|classroom|cabin|washroom|watercooler|auditorium|library|canteen|facility",
  "destinationName": "${destinationQuery}",
  "aliases": ["${destinationQuery.toLowerCase()}"],
  "startPoint": "Main Entrance",
  "building": "Main Campus",
  "floor": 1,
  "totalSteps": 45,
  "totalDistanceMeters": 34,
  "overviewSummary": "Direct navigation route to ${destinationQuery} synthesized from campus corpus.",
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
  return generateRouteDirectlyFromCorpus(rawDescription);
};
