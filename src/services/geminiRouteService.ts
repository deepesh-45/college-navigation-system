import { GoogleGenAI } from '@google/genai';
import { LLMRouteKnowledge } from '../data/llmRoutesKnowledge';

export const getGeminiApiKey = (): string => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  return metaEnv?.VITE_GEMINI_API_KEY || '';
};

export const generateLLMRouteWithGemini = async (
  rawDescription: string,
  compassHeading: number,
  stepsWalked: number
): Promise<LLMRouteKnowledge | null> => {
  const apiKey = getGeminiApiKey();

  const systemPrompt = `You are a Smart Campus Navigation AI.
Convert the user's natural language voice description into a JSON LLMRouteKnowledge object.

Rules:
1. Category must be one of: "washroom", "lab", "cabin", "classroom", "facility", "entrance", "canteen".
2. Break down the route into step-by-step instructions.
3. Include compass headings (0=North, 90=East, 180=South, 270=West).
4. Include step counts.

JSON Format required:
{
  "id": "ROUTE_CUSTOM_GENERATED",
  "category": "washroom",
  "destinationName": "Ground Floor Restroom",
  "aliases": ["washroom", "toilet", "restroom"],
  "startPoint": "Main Entrance Lobby",
  "building": "CSE & AI Block",
  "floor": 0,
  "totalSteps": 45,
  "totalDistanceMeters": 35,
  "overviewSummary": "Summary of directions...",
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Instruction text...",
      "headingDegrees": 0,
      "headingText": "North (360°)",
      "stepsCount": 30,
      "landmarkHint": "Landmark hint",
      "voicePrompt": "Voice prompt text"
    }
  ]
}`;

  const userPrompt = `Raw voice input: "${rawDescription}". Current compass heading: ${compassHeading}° N. Current recorded steps: ${stepsWalked}.`;

  try {
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemPrompt}\n\n${userPrompt}`
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as LLMRouteKnowledge;
      }
    }
  } catch (err) {
    console.warn('Gemini API notice, using structured fallback parser:', err);
  }

  // Pure Local LLM Parser Fallback (No Key Required)
  const isWashroom = rawDescription.toLowerCase().includes('washroom') || rawDescription.toLowerCase().includes('toilet');
  const isLab = rawDescription.toLowerCase().includes('lab') || rawDescription.toLowerCase().includes('ai');
  const category = isWashroom ? 'washroom' : isLab ? 'lab' : 'facility';
  const name = isWashroom ? 'Ground Floor Restroom' : isLab ? 'Advanced AI Lab CS-204' : 'Campus Landmark';

  return {
    id: `ROUTE_${Date.now()}`,
    category,
    destinationName: name,
    aliases: [name.toLowerCase(), category],
    startPoint: 'CSE Block Main Entrance Lobby',
    building: 'Computer Science & AI Block',
    floor: 0,
    totalSteps: stepsWalked > 0 ? stepsWalked : 45,
    totalDistanceMeters: Math.round((stepsWalked || 45) * 0.75),
    overviewSummary: rawDescription,
    steps: [
      {
        stepNumber: 1,
        instruction: `Facing ${compassHeading}° N, ${rawDescription}`,
        headingDegrees: compassHeading,
        headingText: `${compassHeading}° N`,
        stepsCount: stepsWalked || 30,
        landmarkHint: 'Notice signage ahead',
        voicePrompt: rawDescription
      }
    ]
  };
};
