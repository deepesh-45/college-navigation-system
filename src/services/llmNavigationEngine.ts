import { LLM_ROUTES_KNOWLEDGE, LLMRouteKnowledge } from '../data/llmRoutesKnowledge';
import { CAMPUS_NODES } from '../data/campusGraphData';
import { findNodeByIdOrAlias, generateRoutePermutationFromGraph } from './graphRouteEngine';

export interface LLMNavigationResult {
  matched: boolean;
  isAmbiguous?: boolean;
  ambiguousMatches?: LLMRouteKnowledge[];
  isNearbyLandmarkFallback?: boolean;
  nearbyLandmarkName?: string;
  route: LLMRouteKnowledge | null;
  responseMessage: string;
}

export const resolveLLMVoiceQuery = (query: string, customStartName?: string): LLMNavigationResult => {
  const normalized = query.toLowerCase().trim();

  if (!normalized) {
    return {
      matched: false,
      route: null,
      responseMessage: "I didn't catch that. Please speak your destination, like 'Where is the washroom?' or 'Take me to the AI Lab'."
    };
  }

  // 1. Try Graph Shortest Path Permutation Engine
  const startNode = findNodeByIdOrAlias(customStartName || 'main entrance') || CAMPUS_NODES[0];
  const destNode = findNodeByIdOrAlias(query);

  if (destNode && startNode.id !== destNode.id) {
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

  // 2. Search all matching static LLM routes for ambiguity or direct match
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

  // 3. Ambiguity Detection: If multiple routes match
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

  // 4. Single Direct Match
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

  // 5. Fallback: Direct route not found -> Guide user to Nearby Landmark Point!
  const fallbackRoute = LLM_ROUTES_KNOWLEDGE[0];
  const nearbyLandmark = fallbackRoute.startPoint; // e.g. "CSE Block Main Entrance Lobby"

  return {
    matched: true,
    isAmbiguous: false,
    isNearbyLandmarkFallback: true,
    nearbyLandmarkName: nearbyLandmark,
    route: fallbackRoute,
    responseMessage: `⚠️ Direct route for "${query}" not found in database. Please walk 10 meters to nearby landmark "${nearbyLandmark}", from where your guided route starts!`
  };
};
