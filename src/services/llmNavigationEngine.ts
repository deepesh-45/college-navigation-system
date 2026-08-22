import { LLM_ROUTES_KNOWLEDGE, LLMRouteKnowledge } from '../data/llmRoutesKnowledge';

export interface LLMNavigationResult {
  matched: boolean;
  isNearbyLandmarkFallback?: boolean;
  nearbyLandmarkName?: string;
  route: LLMRouteKnowledge | null;
  responseMessage: string;
}

export const resolveLLMVoiceQuery = (query: string): LLMNavigationResult => {
  const normalized = query.toLowerCase().trim();

  if (!normalized) {
    return {
      matched: false,
      route: null,
      responseMessage: "I didn't catch that. Please speak your destination, like 'Where is the washroom?' or 'Take me to the AI Lab'."
    };
  }

  // 1. Direct alias match search
  for (const route of LLM_ROUTES_KNOWLEDGE) {
    for (const alias of route.aliases) {
      if (normalized.includes(alias)) {
        return {
          matched: true,
          isNearbyLandmarkFallback: false,
          route,
          responseMessage: `Found route to ${route.destinationName}! ${route.overviewSummary}`
        };
      }
    }
  }

  // 2. Category Keyword Matching
  if (normalized.includes('washroom') || normalized.includes('toilet') || normalized.includes('restroom')) {
    const route = LLM_ROUTES_KNOWLEDGE.find(r => r.category === 'washroom') || LLM_ROUTES_KNOWLEDGE[0];
    return {
      matched: true,
      isNearbyLandmarkFallback: false,
      route,
      responseMessage: `Found route to ${route.destinationName}. ${route.overviewSummary}`
    };
  }

  if (normalized.includes('lab') || normalized.includes('ai') || normalized.includes('robotics')) {
    const route = LLM_ROUTES_KNOWLEDGE.find(r => r.category === 'lab') || LLM_ROUTES_KNOWLEDGE[1];
    return {
      matched: true,
      isNearbyLandmarkFallback: false,
      route,
      responseMessage: `Found route to ${route.destinationName}. ${route.overviewSummary}`
    };
  }

  if (normalized.includes('hod') || normalized.includes('rajesh') || normalized.includes('cabin') || normalized.includes('office')) {
    const route = LLM_ROUTES_KNOWLEDGE.find(r => r.category === 'cabin') || LLM_ROUTES_KNOWLEDGE[2];
    return {
      matched: true,
      isNearbyLandmarkFallback: false,
      route,
      responseMessage: `Found route to ${route.destinationName}. ${route.overviewSummary}`
    };
  }

  if (normalized.includes('library') || normalized.includes('book') || normalized.includes('study')) {
    const route = LLM_ROUTES_KNOWLEDGE.find(r => r.category === 'facility') || LLM_ROUTES_KNOWLEDGE[3];
    return {
      matched: true,
      isNearbyLandmarkFallback: false,
      route,
      responseMessage: `Found route to ${route.destinationName}. ${route.overviewSummary}`
    };
  }

  if (normalized.includes('food') || normalized.includes('canteen') || normalized.includes('eat') || normalized.includes('coffee')) {
    const route = LLM_ROUTES_KNOWLEDGE.find(r => r.category === 'canteen') || LLM_ROUTES_KNOWLEDGE[4];
    return {
      matched: true,
      isNearbyLandmarkFallback: false,
      route,
      responseMessage: `Found route to ${route.destinationName}. ${route.overviewSummary}`
    };
  }

  // 3. Fallback: Direct route not found -> Guide user to Nearby Landmark Point!
  const fallbackRoute = LLM_ROUTES_KNOWLEDGE[0];
  const nearbyLandmark = fallbackRoute.startPoint; // e.g. "CSE Block Main Entrance Lobby"

  return {
    matched: true,
    isNearbyLandmarkFallback: true,
    nearbyLandmarkName: nearbyLandmark,
    route: fallbackRoute,
    responseMessage: `⚠️ Direct route for "${query}" not found in database. Please walk 10 meters to nearby landmark "${nearbyLandmark}", from where your guided route starts!`
  };
};
