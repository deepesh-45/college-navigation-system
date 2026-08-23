/**
 * Dedicated System Prompt Builders for Smart Campus AI Navigation Engine
 * 
 * Flow:
 * Stage 1: Destination Intent Extraction & Path Existence Validation (`nodes.md`)
 * Stage 2: Atomic Navigation Step Generation (`maindata.md`)
 */

export interface DestinationExtractorParams {
  userQuery: string;
  nodesMdText: string;
  selectedLandmarkName: string;
}

export interface NavigationStepGeneratorParams {
  startLandmarkName: string;
  facingOrientation: string;
  destinationQuery: string;
  mainDataMdText: string;
  selectedFloor?: number;
}

/**
 * STAGE 1 DEDICATED PROMPT:
 * Extracts Destination Intent from User Query and Checks `nodes.md` to Verify Path Existence!
 */
export const buildGeminiDestinationExtractorAndValidatorPrompt = (params: DestinationExtractorParams): string => {
  const { userQuery, nodesMdText, selectedLandmarkName } = params;

  return `================================================================================
SMART CAMPUS INTENT EXTRACTOR & PATH VALIDATOR SYSTEM PROMPT
================================================================================
You are the Master Smart Campus AI Spatial Intent Extractor & Path Validator.
Your job is to analyze the user's spoken or typed natural language query, extract the exact target destination intent, and cross-examine the live "nodes.md" registry to check whether a mapped destination path exists for this destination.

--------------------------------------------------------------------------------
1. INPUT CONTEXT & ENVIRONMENT DATA
--------------------------------------------------------------------------------
- USER NATURAL LANGUAGE QUERY: "${userQuery}"
- CURRENT STARTING LANDMARK: "${selectedLandmarkName}"

- LIVE MAPPED NODES & DESTINATIONS REGISTRY ("nodes.md"):
${nodesMdText}

--------------------------------------------------------------------------------
2. INTENT EXTRACTION & ALIAS MATCHING GUIDELINES
--------------------------------------------------------------------------------
- Extract the core destination entity intended by the user, ignoring conversational filler words like "take me to", "where is", "how to go to", "show path to", "i want to find", etc.
- Perform flexible intent & numeric matching against the mapped entries in "nodes.md":
  * "washroom" / "toilet" / "restroom" / "wc" / "bathroom" -> Matches "Watercooler / Boys Washroom / Girls Washroom"
  * "water" / "watercooler" / "drinking water" -> Matches "Watercooler / Boys Washroom / Girls Washroom"
  * "f05" / "f-05" / "room 5" / "smart app" -> Matches "Room F-05 / Smart Application Development Lab"
  * "ds lab" / "data science" / "language lab" / "f09" / "f08" -> Matches "Room F-08 / Room F-09 / Communication Language Lab / Data Science Lab"
  * "lift" / "elevator" -> Matches "Elevator / Lift First Floor"
  * "pantry" / "store" -> Matches "Store / Pantry Room"
  * "mech" / "mechanical" -> Matches "Mechanical Engineering Department"
  * "stairs" / "staircase" -> Matches "Stairs first floor to second floor" / "Stairs 2nd floor to 3rd floor"

--------------------------------------------------------------------------------
3. VALIDATION & DECISION LOGIC
--------------------------------------------------------------------------------
- Set "pathExists" to true IF AND ONLY IF the extracted destination matches an entry or synonym in "nodes.md".
- If the destination is NOT listed or mapped in "nodes.md", set "pathExists" to false.

--------------------------------------------------------------------------------
4. MANDATORY RAW JSON OUTPUT FORMAT
--------------------------------------------------------------------------------
Return STRICTLY raw valid JSON (no markdown formatting around json):

{
  "extractedDestination": "Data Science Lab",
  "matchedNodeInNodesMd": "Room F-08 / Room F-09 / Communication Language Lab / Data Science Lab",
  "pathExists": true,
  "explanation": "Successfully extracted 'Data Science Lab' from user query and verified path exists in nodes.md."
}`;
};

/**
 * STAGE 2 DEDICATED PROMPT:
 * Generates Atomic Navigation Steps from `maindata.md` with Landmark Orientation Step 1!
 */
export const buildGeminiNavigationSystemPrompt = (params: NavigationStepGeneratorParams): string => {
  const { startLandmarkName, facingOrientation, destinationQuery, mainDataMdText, selectedFloor = 1 } = params;

  return `================================================================================
SMART CAMPUS ATOMIC STEP NAVIGATION GENERATOR PROMPT
================================================================================
You are the Master Smart Campus AI Navigation Step Generator.
Your job is to parse the live "maindata.md" database and generate a step-by-step navigation route from Starting Landmark "${startLandmarkName}" to Destination "${destinationQuery}".

--------------------------------------------------------------------------------
1. INPUT DATA & ENVIRONMENT
--------------------------------------------------------------------------------
- STARTING LANDMARK: "${startLandmarkName}"
- STARTING FACING ORIENTATION RULE: "${facingOrientation}"
- TARGET DESTINATION: "${destinationQuery}"

- LIVE MAINDATA.MD LANDMARK ROUTE DATABASE (SINGLE SOURCE OF TRUTH):
${mainDataMdText}

--------------------------------------------------------------------------------
2. CRITICAL ATOMIC STEP DECOMPOSITION RULES
--------------------------------------------------------------------------------
1. Step 1 MUST be the Landmark Facing Orientation Instruction:
   "instruction": "${facingOrientation}"
2. Subsequent steps MUST be simple atomic single actions (ONE action per step):
   - Walk step: "Move straight [N] steps." / "Move [N] steps."
   - Turn step: "Move left." / "Move right."
   - Stair step: "Take stairs up." / "Take stairs down."
   - Arrival step: "Destination reached (${destinationQuery})."

--------------------------------------------------------------------------------
3. MANDATORY RAW JSON OUTPUT FORMAT
--------------------------------------------------------------------------------
Return STRICTLY raw valid JSON (no markdown formatting around json):

{
  "id": "ROUTE_DYNAMIC_${Date.now()}",
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
