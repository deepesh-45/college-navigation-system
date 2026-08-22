import { LLM_ROUTES_KNOWLEDGE, LLMRouteKnowledge } from '../data/llmRoutesKnowledge';
import { GraphNode, GraphEdge } from '../data/campusGraphData';

export interface ExtractedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const extractGraphFromLLMRoutes = (routes: LLMRouteKnowledge[] = LLM_ROUTES_KNOWLEDGE): ExtractedGraph => {
  const nodesMap = new Map<string, GraphNode>();
  const edgesMap = new Map<string, GraphEdge>();

  const sanitizeId = (str: string) => str.toUpperCase().replace(/[^A-Z0-9]/g, '_');

  routes.forEach(route => {
    // 1. Register Start Point Node
    const startId = `NODE_${sanitizeId(route.startPoint)}`;
    if (!nodesMap.has(startId)) {
      nodesMap.set(startId, {
        id: startId,
        name: route.startPoint,
        type: 'entrance',
        building: route.building,
        floor: 0,
        aliases: [route.startPoint.toLowerCase(), 'start']
      });
    }

    // 2. Register Destination Node
    const destId = `NODE_${sanitizeId(route.destinationName)}`;
    if (!nodesMap.has(destId)) {
      nodesMap.set(destId, {
        id: destId,
        name: route.destinationName,
        type: route.category === 'washroom' ? 'washroom' : route.category === 'lab' ? 'lab' : route.category === 'cabin' ? 'cabin' : route.category === 'canteen' ? 'canteen' : 'facility',
        building: route.building,
        floor: route.floor,
        aliases: route.aliases
      });
    }

    // 3. Extract Intermediate Step Nodes & Edges
    let prevNodeId = startId;

    route.steps.forEach((step, idx) => {
      const isLastStep = idx === route.steps.length - 1;
      const currNodeId = isLastStep ? destId : step.landmarkHint ? `NODE_${sanitizeId(step.landmarkHint)}` : `NODE_${sanitizeId(route.destinationName)}_STEP_${step.stepNumber}`;

      if (!nodesMap.has(currNodeId)) {
        nodesMap.set(currNodeId, {
          id: currNodeId,
          name: step.landmarkHint || `${route.destinationName} Waypoint ${step.stepNumber}`,
          type: step.instruction.toLowerCase().includes('stair') ? 'staircase' : step.instruction.toLowerCase().includes('elevator') ? 'elevator' : 'junction',
          building: route.building,
          floor: route.floor,
          aliases: [step.landmarkHint?.toLowerCase() || ''].filter(Boolean)
        });
      }

      // Create Forward Edge
      const edgeId = `EDGE_${prevNodeId}_TO_${currNodeId}`;
      if (!edgesMap.has(edgeId)) {
        edgesMap.set(edgeId, {
          id: edgeId,
          fromNodeId: prevNodeId,
          toNodeId: currNodeId,
          stepsCount: step.stepsCount,
          headingDegrees: step.headingDegrees,
          headingText: step.headingText,
          instruction: step.instruction,
          landmarkHint: step.landmarkHint,
          isStaircaseOrElevator: step.instruction.toLowerCase().includes('stair') || step.instruction.toLowerCase().includes('elevator')
        });
      }

      // Create Reverse Edge (Opposite Compass Angle: (heading + 180) % 360)
      const revEdgeId = `EDGE_${currNodeId}_TO_${prevNodeId}`;
      if (!edgesMap.has(revEdgeId)) {
        const revHeading = (step.headingDegrees + 180) % 360;
        const revHeadingText = revHeading === 0 ? 'North (360°)' : revHeading === 90 ? 'East (90°)' : revHeading === 180 ? 'South (180°)' : 'West (270°)';
        edgesMap.set(revEdgeId, {
          id: revEdgeId,
          fromNodeId: currNodeId,
          toNodeId: prevNodeId,
          stepsCount: step.stepsCount,
          headingDegrees: revHeading,
          headingText: revHeadingText,
          instruction: `Walk ${step.stepsCount} steps in reverse heading ${revHeadingText}.`,
          landmarkHint: step.landmarkHint,
          isStaircaseOrElevator: step.instruction.toLowerCase().includes('stair') || step.instruction.toLowerCase().includes('elevator')
        });
      }

      prevNodeId = currNodeId;
    });
  });

  return {
    nodes: Array.from(nodesMap.values()),
    edges: Array.from(edgesMap.values())
  };
};
