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

  const systemPrompt = `You are an expert AI Spatial Graph Architect for Smart Campus Navigation.
Analyze the following natural language spoken campus walk transcript and extract a complete, floor-wise spatial graph and step-by-step route permutations.

STRICT TAXONOMY & SCHEMA RULES:
1. Every physical location MUST be classified into one of these exact node types:
   ['entrance', 'junction', 'staircase', 'elevator', 'washroom', 'watercooler', 'classroom', 'lab', 'cabin', 'auditorium', 'library', 'canteen', 'facility']
2. Assign each node a floor number (Ground Floor = 0, First Floor = 1, Second Floor = 2, Third Floor = 3).
3. Identify Staircase and Elevator nodes as special inter-floor connectors linking adjacent floors.
4. Extract directional edges between adjacent nodes with stepsCount, headingText (straight, turn left, turn right, take stairs up, take stairs down, take elevator), and standard instruction prompt format ("Move straight approx N steps and [action].").
5. Format every step instruction strictly as:
   "Move straight approx [N] steps and [turn left / turn right / take stairs up / take stairs down / take elevator / reach destination]."

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
      "type": "classroom|staircase|elevator|entrance|junction|washroom|watercooler|cabin|auditorium|lab|library|canteen|facility"
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
          "instruction": "Move straight approx 10 steps and turn left.",
          "headingDegrees": 270,
          "headingText": "turn left",
          "stepsCount": 10,
          "voicePrompt": "Move straight approx 10 steps and turn left."
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
