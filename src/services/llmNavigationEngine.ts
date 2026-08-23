import { LLM_ROUTES_KNOWLEDGE, LLMRouteKnowledge } from '../data/llmRoutesKnowledge';
import { CAMPUS_NODES } from '../data/campusGraphData';
import { findNodeByIdOrAlias, generateRoutePermutationFromGraph } from './graphRouteEngine';
import { generateRouteDirectlyFromCorpus } from './geminiRouteService';

export interface LLMNavigationResult {
  matched: boolean;
  isAmbiguous?: boolean;
  ambiguousMatches?: LLMRouteKnowledge[];
  isNearbyLandmarkFallback?: boolean;
  nearbyLandmarkName?: string;
  route: LLMRouteKnowledge | null;
  responseMessage: string;
}

export const resolveLLMVoiceQueryAsync = async (
  query: string,
  customStartName?: string
): Promise<LLMNavigationResult> => {
  const normalized = query.toLowerCase().trim();

  if (!normalized) {
    return {
      matched: false,
      route: null,
      responseMessage: "I didn't catch that. Please speak your destination, like 'Where is the washroom?' or 'Take me to the Data Science Lab'."
    };
  }

  // 1. Try Graph Shortest Path Permutation Engine
  const startNode = CAMPUS_NODES.length > 0 ? (findNodeByIdOrAlias(customStartName || 'main entrance') || CAMPUS_NODES[0]) : null;
  const destNode = findNodeByIdOrAlias(query);

  if (startNode && destNode && startNode.id !== destNode.id) {
    const graphRoute = generateRoutePermutationFromGraph(startNode, destNode);
    if (graphRoute) {
      return {
        matched: true,
        isAmbiguous: false,
        isNearbyLandmarkFallback: false,
        route: graphRoute,
        responseMessage: `Generated optimal route from ${startNode.name} to ${destNode.name}! Total ${graphRoute.totalSteps} steps (${graphRoute.totalDistanceMeters}m walk).`
      };
    }
  }

  // 2. Search static LLM routes for exact or category matches
  const matchingRoutes: LLMRouteKnowledge[] = [];

  for (const route of LLM_ROUTES_KNOWLEDGE) {
    const isNameMatch = route.destinationName.toLowerCase().includes(normalized);
    const isCategoryMatch = route.category.toLowerCase().includes(normalized);
    const isAliasMatch = route.aliases.some(a => a.toLowerCase().includes(normalized) || normalized.includes(a.toLowerCase()));

    if (isNameMatch || isCategoryMatch || isAliasMatch) {
      if (!matchingRoutes.some(r => r.id === route.id)) {
        matchingRoutes.push(route);
      }
    }
  }

  // Ambiguity Detection
  if (matchingRoutes.length > 1) {
    const destinationNames = matchingRoutes.map(r => r.destinationName).join(' OR ');
    return {
      matched: true,
      isAmbiguous: true,
      ambiguousMatches: matchingRoutes,
      route: matchingRoutes[0],
      responseMessage: `⚠️ Ambiguous Destination: Multiple locations match "${query}". Did you mean ${destinationNames}? Please select below or speak your exact choice.`
    };
  }

  // Single Direct Match
  if (matchingRoutes.length === 1) {
    const route = matchingRoutes[0];
    return {
      matched: true,
      isAmbiguous: false,
      isNearbyLandmarkFallback: false,
      route,
      responseMessage: `Found route to ${route.destinationName}! ${route.overviewSummary}`
    };
  }

  // 3. Dynamic Real-Time Gemini AI Direct Corpus Navigation Generation!
  const corpusSynthesizedRoute = await generateRouteDirectlyFromCorpus(query);
  if (corpusSynthesizedRoute) {
    // Cache synthesized route into memory
    LLM_ROUTES_KNOWLEDGE.push(corpusSynthesizedRoute);
    return {
      matched: true,
      isAmbiguous: false,
      isNearbyLandmarkFallback: false,
      route: corpusSynthesizedRoute,
      responseMessage: `Synthesized step-by-step route to ${corpusSynthesizedRoute.destinationName} directly from campus corpus! Total ${corpusSynthesizedRoute.totalSteps} steps.`
    };
  }

  // 4. Fallback: Default route
  const fallbackRoute = LLM_ROUTES_KNOWLEDGE.length > 0 ? LLM_ROUTES_KNOWLEDGE[0] : null;
  return {
    matched: fallbackRoute !== null,
    isAmbiguous: false,
    isNearbyLandmarkFallback: true,
    nearbyLandmarkName: fallbackRoute ? fallbackRoute.startPoint : "Campus Main Entrance",
    route: fallbackRoute,
    responseMessage: `⚠️ Could not extract route for "${query}". Redirecting to Main Entrance.`
  };
};

// Synchronous wrapper for backward compatibility
export const resolveLLMVoiceQuery = (query: string, customStartName?: string): LLMNavigationResult => {
  const normalized = query.toLowerCase().trim();
  const startNode = CAMPUS_NODES.length > 0 ? (findNodeByIdOrAlias(customStartName || 'main entrance') || CAMPUS_NODES[0]) : null;
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
