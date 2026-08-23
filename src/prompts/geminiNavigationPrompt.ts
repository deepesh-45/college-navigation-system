/**
 * Dedicated System Prompt Builder for Smart Campus AI Navigation Engine
 * 
 * Provides Gemini AI API with:
 * 1. Starting Landmark & Facing Orientation Rule (Step 1)
 * 2. Destination Query
 * 3. Live maindata.md Landmark Route Database (Single Source of Truth)
 */

export interface PromptInputParams {
  startLandmarkName: string;
  facingOrientation: string;
  destinationQuery: string;
  mainDataMdText: string;
  selectedFloor?: number;
}

/**
 * Builds the dedicated system prompt sent to Gemini AI API for step extraction
 */
export const buildGeminiNavigationSystemPrompt = (params: PromptInputParams): string => {
  const { startLandmarkName, facingOrientation, destinationQuery, mainDataMdText, selectedFloor = 1 } = params;

  return `You are the Master Smart Campus AI Navigation Engine.
Extract the route matching Starting Landmark "${startLandmarkName}" and Destination "${destinationQuery}" STRICTLY from maindata.md.

STARTING LANDMARK ORIENTATION INSTRUCTION:
"${facingOrientation}"

LIVE MAINDATA.MD LANDMARK ROUTES (SINGLE SOURCE OF TRUTH):
${mainDataMdText}

CRITICAL RULES:
1. Use ONLY the paths defined in maindata.md. If the destination "${destinationQuery}" is NOT present in maindata.md, return JSON {"error": "Path not found in maindata.md"}.
2. Step 1 MUST be the Landmark Facing Orientation Instruction:
   "instruction": "${facingOrientation}"
3. Subsequent steps MUST be simple atomic single actions (ONE action per step):
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
  "startPoint": "${startLandmarkName}",
  "facingOrientation": "${facingOrientation}",
  "building": "Main Campus",
  "floor": ${selectedFloor},
  "totalSteps": 35,
  "totalDistanceMeters": 26,
  "overviewSummary": "Landmark navigation from ${startLandmarkName} to ${destinationQuery}.",
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
};

/**
 * Builds system prompt for Voice Query Intent Parsing (Extracts Start Point & Destination)
 */
export const buildGeminiVoiceIntentSystemPrompt = (userVoiceQuery: string): string => {
  return `You are a Smart Campus Voice Intent Parser.
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
};
