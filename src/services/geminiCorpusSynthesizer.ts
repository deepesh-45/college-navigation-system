import { LLMRouteKnowledge, LLMStepInstruction } from '../data/llmRoutesKnowledge';
import { GraphNode, GraphEdge } from '../data/campusGraphData';

export interface GeminiCorpusSynthesizerResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  routes: LLMRouteKnowledge[];
  summaryText: string;
}

export const synthesizeCampusCorpusWithGemini = async (
  rawTranscriptText: string
): Promise<GeminiCorpusSynthesizerResult> => {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  
  if (!apiKey || apiKey.includes('DemoApiKey')) {
    return fallbackLocalCorpusParser(rawTranscriptText);
  }

  const systemPrompt = `You are an expert AI Spatial Graph Architect and Navigation Dataset Synthesizer for Smart College Indoor/Outdoor Navigation Systems.
Your goal is to parse the provided raw natural language campus walk description, identify every physical location/entity by name, extract atomic graph nodes & directional edges, and synthesize complete step-by-step route permutations.

================================================================================
1. STRICT PHYSICAL NODE TAXONOMY & CLASSIFICATION RULES
================================================================================
Every physical location or landmark extracted MUST be assigned one of the following exact \`type\` values:
- \`entrance\`: Main entrances, building gates, exit doors (e.g. "Main Entrance", "Block A Gate", "Library Gate")
- \`junction\`: Hallway turns, corridor intersections, T-junctions (e.g. "Main Corridor Junction", "North Hallway Crossroads")
- \`staircase\`: Stairs linking floors (e.g. "Staircase Floor 1", "Central Stairwell")
- \`elevator\`: Lifts & Elevators (e.g. "Main Lift Floor 1", "Block B Elevator")
- \`classroom\`: Lecture halls, tutorial rooms, classrooms (e.g. "Classroom 101", "Lecture Theatre 3")
- \`lab\`: Computer labs, research labs, science labs (e.g. "Data Science Lab", "AI Research Center", "Physics Lab")
- \`cabin\`: Faculty cabins, HOD offices, admin offices (e.g. "Dean Office", "HOD CSE Cabin", "Dr. Sharma Cabin")
- \`washroom\`: Restrooms & washrooms (e.g. "Gents Washroom F1", "Ladies Restroom F2")
- \`watercooler\`: Drinking water fountains/coolers (e.g. "Water Cooler Station F1", "Filter Station F2")
- \`auditorium\`: Auditoriums, seminar halls, event centers (e.g. "Main Auditorium", "Seminar Hall B")
- \`library\`: Central library, department reading rooms (e.g. "Central Library", "Digital Resource Center")
- \`canteen\`: Cafeteria, food courts, coffee shops (e.g. "Campus Canteen", "Nescafe Kiosk")
- \`facility\`: General campus facilities, accounts, reprographics (e.g. "Accounts Office", "Printing Center")

================================================================================
2. STANDARDIZED NAVIGATION STEP PROMPT FORMAT
================================================================================
Every single step instruction generated in edges and routes MUST strictly follow this exact format:
"Move straight approx [N] steps and [Action]."

Allowed Actions:
- "turn left" (headingDegrees: 270)
- "turn right" (headingDegrees: 90)
- "continue straight" (headingDegrees: 0)
- "take stairs up" (headingDegrees: 0)
- "take stairs down" (headingDegrees: 180)
- "take elevator" (headingDegrees: 0)
- "reach [Destination Name]" (for arrival at destination)

================================================================================
3. ROUTE PERMUTATIONS SYNTHESIS RULES
================================================================================
- Synthesize complete step-by-step navigation routes from the starting location (e.g. "Main Entrance") to EVERY named destination node (labs, classrooms, washrooms, cabins, library, auditorium, etc.).
- Calculate totalSteps by summing the stepsCount across all steps in the route.
- Calculate totalDistanceMeters as Math.round(totalSteps * 0.75).
- For multi-floor navigation, routing MUST first direct the user to the staircase or elevator node on the current floor, include the stair climbing/descending transition step, and then navigate on the target floor to the final destination.

================================================================================
4. REQUIRED STRICT JSON OUTPUT FORMAT
================================================================================
Return ONLY raw valid JSON (no markdown formatting around json):

{
  "nodes": [
    {
      "id": "node_id",
      "name": "Node Name",
      "aliases": ["alias1", "alias2"],
      "building": "Main Campus",
      "floor": 1,
      "type": "entrance|junction|staircase|elevator|classroom|lab|cabin|washroom|watercooler|auditorium|library|canteen|facility"
    }
  ],
  "edges": [
    {
      "id": "edge_id",
      "fromNodeId": "from_id",
      "toNodeId": "to_id",
      "stepsCount": 30,
      "headingText": "turn right",
      "headingDegrees": 90,
      "instruction": "Move straight approx 30 steps and turn right.",
      "landmarkHint": "near Lib Gate"
    }
  ],
  "routes": [
    {
      "id": "route_id",
      "category": "lab|classroom|cabin|washroom|watercooler|auditorium|library|canteen|facility",
      "destinationName": "Data Science Lab",
      "aliases": ["ds lab"],
      "startPoint": "Main Entrance",
      "building": "Main Campus",
      "floor": 1,
      "totalSteps": 40,
      "totalDistanceMeters": 30,
      "overviewSummary": "Route from Main Entrance to Data Science Lab.",
      "steps": [
        {
          "stepNumber": 1,
          "instruction": "Move straight approx 10 steps and turn left.",
          "headingDegrees": 270,
          "headingText": "turn left",
          "stepsCount": 10,
          "voicePrompt": "Move straight approx 10 steps and turn left."
        }
      ]
    }
  ]
}

Raw Spoken Campus Transcript to Synthesize:
"${rawTranscriptText}"`;

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

    return {
      nodes: parsed.nodes || [],
      edges: parsed.edges || [],
      routes: parsed.routes || [],
      summaryText: `Successfully processed corpus with Gemini AI! Extracted ${parsed.nodes?.length || 0} nodes, ${parsed.edges?.length || 0} edges, and ${parsed.routes?.length || 0} routes across floors.`
    };
  } catch (e: any) {
    console.error('Gemini Synthesis Error:', e);
    return fallbackLocalCorpusParser(rawTranscriptText);
  }
};

// Fallback Local NLP Heuristic Parser if API Key is not set
const fallbackLocalCorpusParser = (text: string): GeminiCorpusSynthesizerResult => {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const routes: LLMRouteKnowledge[] = [];

  let currentFloor = 1;
  let previousNodeId: string | null = null;
  let stepIndex = 1;

  const defaultStartNode: GraphNode = {
    id: 'main_entrance',
    name: 'Main Entrance',
    aliases: ['entrance', 'gate'],
    building: 'Main Campus',
    floor: 1,
    type: 'entrance'
  };
  nodes.push(defaultStartNode);
  previousNodeId = defaultStartNode.id;

  const routeSteps: LLMStepInstruction[] = [];
  let cumulativeSteps = 0;

  sentences.forEach((sentence, idx) => {
    const lower = sentence.toLowerCase();
    
    // Extract step count number
    const stepMatch = lower.match(/(\d+)\s*steps/);
    const stepsCount = stepMatch ? parseInt(stepMatch[1], 10) : 20;
    cumulativeSteps += stepsCount;

    // Detect Floor Changes
    if (lower.includes('second floor') || lower.includes('floor 2') || lower.includes('upward to 2nd')) {
      currentFloor = 2;
    } else if (lower.includes('ground floor') || lower.includes('floor 0')) {
      currentFloor = 0;
    } else if (lower.includes('third floor') || lower.includes('floor 3')) {
      currentFloor = 3;
    }

    // Determine Action Type
    let actionText = 'continue straight';
    let headingDegrees = 0;
    if (lower.includes('left')) { actionText = 'turn left'; headingDegrees = 270; }
    else if (lower.includes('right')) { actionText = 'turn right'; headingDegrees = 90; }
    else if (lower.includes('stairs') || lower.includes('upward')) { actionText = 'take stairs up'; headingDegrees = 0; }
    else if (lower.includes('down')) { actionText = 'take stairs down'; headingDegrees = 180; }

    // Extract Location Name & Taxonomy Classification
    let locName = `Node ${idx + 1}`;
    let nodeType: GraphNode['type'] = 'facility';

    if (lower.includes('junction')) { locName = 'Hallway Junction'; nodeType = 'junction'; }
    else if (lower.includes('stairs')) { locName = `Staircase Floor ${currentFloor}`; nodeType = 'staircase'; }
    else if (lower.includes('elevator') || lower.includes('lift')) { locName = `Elevator Floor ${currentFloor}`; nodeType = 'elevator'; }
    else if (lower.includes('data science lab')) { locName = 'Data Science Lab'; nodeType = 'lab'; }
    else if (lower.includes('ai lab') || lower.includes('research lab')) { locName = 'AI Research Lab'; nodeType = 'lab'; }
    else if (lower.includes('classroom') || lower.includes('room')) { locName = 'Classroom'; nodeType = 'classroom'; }
    else if (lower.includes('washroom') || lower.includes('restroom')) { locName = 'Washroom'; nodeType = 'washroom'; }
    else if (lower.includes('watercooler') || lower.includes('water')) { locName = 'Water Cooler Station'; nodeType = 'watercooler'; }
    else if (lower.includes('cabin') || lower.includes('faculty')) { locName = 'Faculty Cabin'; nodeType = 'cabin'; }
    else if (lower.includes('auditorium')) { locName = 'Main Auditorium'; nodeType = 'auditorium'; }
    else if (lower.includes('library')) { locName = 'Central Library'; nodeType = 'library'; }
    else if (lower.includes('canteen')) { locName = 'Campus Canteen'; nodeType = 'canteen'; }

    const nodeId = locName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    if (!nodes.some(n => n.id === nodeId)) {
      nodes.push({
        id: nodeId,
        name: locName,
        aliases: [locName.toLowerCase()],
        building: 'Main Campus',
        floor: currentFloor,
        type: nodeType
      });
    }

    const standardPrompt = `Move straight approx ${stepsCount} steps and ${actionText}.`;

    if (previousNodeId && previousNodeId !== nodeId) {
      edges.push({
        id: `edge_${previousNodeId}_to_${nodeId}`,
        fromNodeId: previousNodeId,
        toNodeId: nodeId,
        stepsCount,
        headingText: actionText,
        headingDegrees,
        instruction: standardPrompt
      });
    }

    routeSteps.push({
      stepNumber: stepIndex++,
      instruction: standardPrompt,
      headingDegrees,
      headingText: actionText,
      stepsCount,
      voicePrompt: standardPrompt
    });

    previousNodeId = nodeId;
  });

  if (nodes.length > 1) {
    const lastNode = nodes[nodes.length - 1];
    routes.push({
      id: `ROUTE_${lastNode.id}`,
      category: lastNode.type === 'washroom' ? 'washroom' : lastNode.type === 'watercooler' ? 'watercooler' : lastNode.type === 'lab' ? 'lab' : lastNode.type === 'cabin' ? 'cabin' : lastNode.type === 'classroom' ? 'classroom' : lastNode.type === 'auditorium' ? 'auditorium' : lastNode.type === 'library' ? 'library' : lastNode.type === 'canteen' ? 'canteen' : 'facility',
      destinationName: lastNode.name,
      aliases: lastNode.aliases,
      startPoint: 'Main Entrance',
      building: 'Main Campus',
      floor: lastNode.floor,
      totalSteps: cumulativeSteps,
      totalDistanceMeters: Math.round(cumulativeSteps * 0.75),
      overviewSummary: `Step-by-step route from Main Entrance to ${lastNode.name}.`,
      steps: routeSteps
    });
  }

  return {
    nodes,
    edges,
    routes,
    summaryText: `Parsed spoken transcript into ${nodes.length} nodes, ${edges.length} edges, and ${routes.length} floor-wise routes!`
  };
};
