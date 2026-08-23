import { LLMRouteKnowledge } from '../data/llmRoutesKnowledge';
import { generateRouteDirectlyFromCorpus, parseVoiceIntentWithGemini, ParsedVoiceIntent } from './geminiRouteService';
import { findMainDataRoute, convertMainDataToLLMRoute } from '../data/maindataService';

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
      responseMessage: "I didn't catch that. Please speak or type your destination."
    };
  }

  // 1. Decode Voice Intent to extract Start Point and Destination
  const parsedIntent = await parseVoiceIntentWithGemini(query);
  const startPoint = explicitStartPoint && explicitStartPoint.trim() ? explicitStartPoint.trim() : (parsedIntent.startPoint || 'Main Entrance');
  const destination = parsedIntent.destination || query;

  // 2. Check maindata.json FIRST for exact or saved landmark routes
  const savedMainDataRoute = findMainDataRoute(destination, startPoint);
  if (savedMainDataRoute) {
    const route = convertMainDataToLLMRoute(savedMainDataRoute);
    return {
      matched: true,
      isAmbiguous: false,
      isNearbyLandmarkFallback: false,
      parsedIntent: { startPoint, destination },
      route,
      responseMessage: `Found landmark route to ${route.destinationName} in maindata.json! Total ${route.steps.length} atomic steps.`
    };
  }

  // 3. Fallback: Synthesize Navigation Steps DIRECTLY from Raw Corpuses (Ground & First Floor Corpuses)
  const corpusSynthesizedRoute = await generateRouteDirectlyFromCorpus(destination, startPoint);

  if (corpusSynthesizedRoute) {
    return {
      matched: true,
      isAmbiguous: false,
      isNearbyLandmarkFallback: false,
      parsedIntent: { startPoint, destination },
      route: corpusSynthesizedRoute,
      responseMessage: `Synthesized navigation from ${startPoint} to ${corpusSynthesizedRoute.destinationName} directly from campus corpus! Total ${corpusSynthesizedRoute.steps.length} atomic steps.`
    };
  }

  return {
    matched: false,
    route: null,
    responseMessage: `⚠️ Could not synthesize route from ${startPoint} to "${destination}".`
  };
};

// Synchronous wrapper for backward compatibility
export const resolveLLMVoiceQuery = (_query: string, _customStartName: string = 'Main Entrance'): LLMNavigationResult => {
  return {
    matched: false,
    route: null,
    responseMessage: `Use resolveLLMVoiceQueryAsync for direct corpus synthesis.`
  };
};
