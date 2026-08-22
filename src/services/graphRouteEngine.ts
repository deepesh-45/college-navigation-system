import { LLM_ROUTES_KNOWLEDGE, LLMRouteKnowledge, LLMStepInstruction } from '../data/llmRoutesKnowledge';
import { GraphNode, GraphEdge } from '../data/campusGraphData';
import { extractGraphFromLLMRoutes } from './graphExtractor';

export const getExtractedGraph = () => {
  return extractGraphFromLLMRoutes(LLM_ROUTES_KNOWLEDGE);
};

export const findNodeByIdOrAlias = (query: string): GraphNode | null => {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return null;
  const { nodes } = getExtractedGraph();

  for (const node of nodes) {
    if (node.id.toLowerCase() === normalized || node.name.toLowerCase().includes(normalized)) {
      return node;
    }
    if (node.aliases.some(a => a.toLowerCase().includes(normalized) || normalized.includes(a.toLowerCase()))) {
      return node;
    }
  }

  return null;
};

// Format Standardized Gemini AI Step Prompt
export const formatStandardStepInstruction = (
  stepsCount: number,
  action: 'straight' | 'left' | 'right' | 'stair_up' | 'stair_down' | 'elevator' | 'arrive',
  landmarkHint?: string
): string => {
  let actionText = '';
  switch (action) {
    case 'left': actionText = 'turn left'; break;
    case 'right': actionText = 'turn right'; break;
    case 'stair_up': actionText = 'take stairs up'; break;
    case 'stair_down': actionText = 'take stairs down'; break;
    case 'elevator': actionText = 'take elevator'; break;
    case 'arrive': actionText = 'reach destination'; break;
    default: actionText = 'continue straight'; break;
  }

  let prompt = `Move straight approx ${stepsCount} steps and ${actionText}.`;
  if (landmarkHint) {
    prompt += ` (Landmark: ${landmarkHint})`;
  }
  return prompt;
};

// Dijkstra's Shortest Path Algorithm over Extracted Graph
export const calculateShortestGraphPath = (startNodeId: string, destNodeId: string): GraphEdge[] | null => {
  if (startNodeId === destNodeId) return [];
  const { nodes, edges } = getExtractedGraph();

  const distances: Record<string, number> = {};
  const previousEdge: Record<string, GraphEdge | null> = {};
  const unvisited = new Set<string>();

  for (const node of nodes) {
    distances[node.id] = Infinity;
    previousEdge[node.id] = null;
    unvisited.add(node.id);
  }

  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    let currentId: string | null = null;
    let minDistance = Infinity;

    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        currentId = nodeId;
      }
    }

    if (!currentId || minDistance === Infinity) break;
    if (currentId === destNodeId) break;

    unvisited.delete(currentId);

    const outgoingEdges = edges.filter(e => e.fromNodeId === currentId);
    for (const edge of outgoingEdges) {
      if (unvisited.has(edge.toNodeId)) {
        const alt = distances[currentId] + edge.stepsCount;
        if (alt < distances[edge.toNodeId]) {
          distances[edge.toNodeId] = alt;
          previousEdge[edge.toNodeId] = edge;
        }
      }
    }
  }

  const pathEdges: GraphEdge[] = [];
  let currNodeId: string | null = destNodeId;

  while (currNodeId && previousEdge[currNodeId]) {
    const targetEdge: GraphEdge = previousEdge[currNodeId]!;
    pathEdges.unshift(targetEdge);
    currNodeId = targetEdge.fromNodeId;
  }

  return pathEdges.length > 0 ? pathEdges : null;
};

// Synthesizes a graph path into a standardized step-by-step LLMRouteKnowledge
export const generateRoutePermutationFromGraph = (
  startNode: GraphNode,
  destNode: GraphNode
): LLMRouteKnowledge | null => {
  const edges = calculateShortestGraphPath(startNode.id, destNode.id);
  if (!edges) return null;

  let totalSteps = 0;
  const steps: LLMStepInstruction[] = edges.map((edge, index) => {
    totalSteps += edge.stepsCount;
    const isLast = index === edges.length - 1;

    let actionType: 'straight' | 'left' | 'right' | 'stair_up' | 'stair_down' | 'elevator' | 'arrive' = 'straight';
    const inst = edge.instruction.toLowerCase();

    if (isLast) {
      actionType = 'arrive';
    } else if (inst.includes('left')) {
      actionType = 'left';
    } else if (inst.includes('right')) {
      actionType = 'right';
    } else if (inst.includes('staircase up') || inst.includes('stairs up') || inst.includes('climb stairs')) {
      actionType = 'stair_up';
    } else if (inst.includes('staircase down') || inst.includes('stairs down')) {
      actionType = 'stair_down';
    } else if (inst.includes('elevator')) {
      actionType = 'elevator';
    }

    const standardPrompt = formatStandardStepInstruction(edge.stepsCount, actionType, edge.landmarkHint);

    return {
      stepNumber: index + 1,
      instruction: standardPrompt,
      headingDegrees: edge.headingDegrees,
      headingText: edge.headingText,
      stepsCount: edge.stepsCount,
      landmarkHint: edge.landmarkHint,
      action: actionType === 'arrive' ? 'straight' : actionType,
      voicePrompt: standardPrompt
    };
  });

  return {
    id: `GRAPH_ROUTE_${startNode.id}_TO_${destNode.id}`,
    category: destNode.type === 'washroom' ? 'washroom' : destNode.type === 'lab' ? 'lab' : destNode.type === 'cabin' ? 'cabin' : destNode.type === 'canteen' ? 'canteen' : 'facility',
    destinationName: destNode.name,
    aliases: destNode.aliases,
    startPoint: startNode.name,
    building: destNode.building,
    floor: destNode.floor,
    totalSteps,
    totalDistanceMeters: Math.round(totalSteps * 0.75),
    overviewSummary: `Step-by-step route from ${startNode.name} to ${destNode.name} (${steps.length} steps, ${totalSteps} total footsteps).`,
    steps
  };
};
