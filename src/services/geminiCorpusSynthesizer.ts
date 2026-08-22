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

  const systemPrompt = `You are an expert AI Spatial Graph Architect for College Navigation.
Analyze the following natural language spoken campus walk transcript and extract a complete, floor-wise spatial graph and step-by-step route permutations.

REQUIRED RULES FOR OUTPUT JSON:
1. Extract all physical locations/junctions/landmarks as atomic Graph Nodes (e.g. main_entrance, junction_1, staircase_f1, data_science_lab_f2).
2. Assign each node a floor number (e.g. Ground Floor = 0, First Floor = 1, Second Floor = 2).
3. Identify Staircase and Elevator nodes as special inter-floor connectors.
4. Extract directional edges between adjacent nodes with stepsCount, headingText (N, E, S, W, straight, left, right), and standard instruction prompt format ("Move straight approx N steps and [turn left/turn right/take stairs up/take stairs down/reach destination]").
5. For inter-floor travel (e.g. from Floor 1 to Floor 2), routing MUST first direct the user to the Staircase/Elevator node on the current floor, then climb/descend stairs, then navigate on target floor to destination.

Raw Spoken Campus Transcript:
"${rawTranscriptText}"

Return strictly raw valid JSON with the following structure (no markdown formatting around json):
{
  "nodes": [
    {
      "id": "node_id",
      "name": "Node Name",
      "aliases": ["alias1", "alias2"],
      "building": "Main Building",
      "floor": 1,
      "type": "classroom|lab|cabin|facility|washroom|entrance|staircase|elevator|junction"
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
      "category": "lab",
      "destinationName": "Data Science Lab",
      "aliases": ["ds lab"],
      "startPoint": "Main Entrance",
      "building": "Main Building",
      "floor": 2,
      "totalSteps": 40,
      "totalDistanceMeters": 30,
      "overviewSummary": "Route from Main Entrance to Data Science Lab.",
      "steps": [
        {
          "stepNumber": 1,
          "instruction": "Move straight approx 10 steps and continue straight.",
          "headingDegrees": 0,
          "headingText": "straight",
          "stepsCount": 10,
          "voicePrompt": "Move straight approx 10 steps and continue straight."
        }
      ]
    }
  ]
}`;

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
    }

    // Determine Action Type
    let actionText = 'straight';
    let headingDegrees = 0;
    if (lower.includes('left')) { actionText = 'turn left'; headingDegrees = 270; }
    else if (lower.includes('right')) { actionText = 'turn right'; headingDegrees = 90; }
    else if (lower.includes('stairs') || lower.includes('upward')) { actionText = 'take stairs up'; headingDegrees = 0; }
    else if (lower.includes('down')) { actionText = 'take stairs down'; headingDegrees = 180; }

    // Extract Location Name
    let locName = `Node ${idx + 1}`;
    if (lower.includes('junction')) locName = 'Hallway Junction';
    else if (lower.includes('stairs')) locName = `Staircase Floor ${currentFloor}`;
    else if (lower.includes('data science lab')) locName = 'Data Science Lab';
    else if (lower.includes('ai lab')) locName = 'AI Research Lab';
    else if (lower.includes('washroom')) locName = 'Restroom Facilities';
    else if (lower.includes('canteen')) locName = 'Campus Canteen';

    const nodeId = locName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    if (!nodes.some(n => n.id === nodeId)) {
      nodes.push({
        id: nodeId,
        name: locName,
        aliases: [locName.toLowerCase()],
        building: 'Main Campus',
        floor: currentFloor,
        type: lower.includes('lab') ? 'lab' : lower.includes('stairs') ? 'staircase' : 'facility'
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
      category: 'lab',
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
