import { LLM_ROUTES_KNOWLEDGE, LLMRouteKnowledge } from '../data/llmRoutesKnowledge';
import { CAMPUS_NODES } from '../data/campusGraphData';
import { findNodeByIdOrAlias, generateRoutePermutationFromGraph } from './graphRouteEngine';
import { generateRouteDirectlyFromCorpus, parseVoiceIntentWithGemini, ParsedVoiceIntent } from './geminiRouteService';

export interface LLMNavigationResult {
  matched: boolean;
  isAmbiguous?: boolean;
  ambiguousMatches?: LLMRouteKnowledge[];
  isNearbyLandmarkFallback?: boolean;
  nearbyLandmarkName?: string;
  parsedIntent?: ParsedVoiceIntent;
  route: LLMRouteKnowledge | null;
  responseMessage: string;
}

export const resolveLLMVoiceQueryAsync = async (
  query: string,
  explicitStartPoint?: string
): Promise<LLMNavigationResult> => {
  const normalized = query.toLowerCase().trim();

  if (!normalized) {
    return {
      matched: false,
      route: null,
      responseMessage: "I didn't catch that. Please speak your starting location and destination, e.g. 'I am at Main Entrance, take me to Data Science Lab'."
    };
  }

  // 1. Decode Voice Intent to extract Start Point and Destination via Gemini API
  const parsedIntent = await parseVoiceIntentWithGemini(query);
  const startPoint = explicitStartPoint || parsedIntent.startPoint || 'Main Entrance';
  const destination = parsedIntent.destination || query;

  // 2. Try Graph Shortest Path Engine
  const startNode = CAMPUS_NODES.length > 0 ? (findNodeByIdOrAlias(startPoint) || CAMPUS_NODES[0]) : null;
  const destNode = findNodeByIdOrAlias(destination);

  if (startNode && destNode && startNode.id !== destNode.id) {
    const graphRoute = generateRoutePermutationFromGraph(startNode, destNode);
    if (graphRoute) {
      return {
        matched: true,
        isAmbiguous: false,
        isNearbyLandmarkFallback: false,
        parsedIntent: { startPoint, destination },
        route: graphRoute,
        responseMessage: `Generated route from ${startPoint} to ${destNode.name}! Total ${graphRoute.totalSteps} steps.`
      };
    }
  }

  // 3. Dynamic Real-Time Gemini AI Direct Corpus Navigation (Decoded Start Point -> Destination)
  const corpusSynthesizedRoute = await generateRouteDirectlyFromCorpus(destination, startPoint);
  if (corpusSynthesizedRoute) {
    LLM_ROUTES_KNOWLEDGE.push(corpusSynthesizedRoute);
    return {
      matched: true,
      isAmbiguous: false,
      isNearbyLandmarkFallback: false,
      parsedIntent: { startPoint, destination },
      route: corpusSynthesizedRoute,
      responseMessage: `Synthesized navigation from ${startPoint} to ${corpusSynthesizedRoute.destinationName} directly from campus corpus! Total ${corpusSynthesizedRoute.totalSteps} steps.`
    };
  }

  // 4. Fallback: Default route
  const fallbackRoute = LLM_ROUTES_KNOWLEDGE.length > 0 ? LLM_ROUTES_KNOWLEDGE[0] : null;
  return {
    matched: fallbackRoute !== null,
    isAmbiguous: false,
    isNearbyLandmarkFallback: true,
    nearbyLandmarkName: startPoint,
    parsedIntent: { startPoint, destination },
    route: fallbackRoute,
    responseMessage: `⚠️ Could not extract route from ${startPoint} to "${destination}".`
  };
};

// Synchronous wrapper for backward compatibility
export const resolveLLMVoiceQuery = (query: string, customStartName: string = 'Main Entrance'): LLMNavigationResult => {
  const normalized = query.toLowerCase().trim();
  const startNode = CAMPUS_NODES.length > 0 ? (findNodeByIdOrAlias(customStartName) || CAMPUS_NODES[0]) : null;
  const destNode = findNodeByIdOrAlias(query);

  if (startNode && destNode && startNode.id !== destNode.id) {
    const graphRoute = generateRoutePermutationFromGraph(startNode, destNode);
    if (graphRoute) {
      return {
        matched: true,
        isAmbiguous: false,
        isNearbyLandmarkFallback: false,
        route: graphRoute,
        responseMessage: `Generated optimal route from ${startNode.name} to ${destNode.name}!`
      };
    }
  }

  const matchingRoutes = LLM_ROUTES_KNOWLEDGE.filter(r => 
    r.destinationName.toLowerCase().includes(normalized) ||
    r.aliases.some(a => a.toLowerCase().includes(normalized))
  );

  if (matchingRoutes.length > 0) {
    return {
      matched: true,
      route: matchingRoutes[0],
      responseMessage: `Found route to ${matchingRoutes[0].destinationName}!`
    };
  }

  return {
    matched: false,
    route: null,
    responseMessage: `Route for "${query}" not found.`
  };
};
