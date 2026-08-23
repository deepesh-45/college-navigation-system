import { LLMRouteKnowledge } from '../types';
import { findLandmarkByNameOrAlias, getAnchorLandmarkForFloor } from '../data/landmarksData';
import { loadMainDataMarkdownText, findMainDataRouteFromMarkdown, convertMainDataToLLMRoute, loadNodesMarkdownText } from '../data/maindataService';
import {
  buildGeminiDestinationExtractorAndValidatorPrompt,
  buildGeminiNavigationSystemPrompt,
  buildGeminiVoiceIntentSystemPrompt
} from '../prompts/geminiNavigationPrompt';

export interface ParsedVoiceIntent {
  startPoint: string;
  destination: string;
}

export interface ExtractedDestinationValidationResult {
  extractedDestination: string;
  matchedNodeInNodesMd?: string;
  pathExists: boolean;
  explanation: string;
}

export const getGeminiApiKeys = (): { primary: string; fallback: string } => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  return {
    primary: metaEnv?.VITE_GEMINI_API_KEY || '',
    fallback: metaEnv?.VITE_GEMINI_API_KEY_FALLBACK || ''
  };
};

// Stage 1: Extract Destination Intent & Validate Path Existence in `nodes.md` via Gemini AI Prompt
export const extractAndValidateDestinationWithGemini = async (
  userQuery: string,
  selectedLandmarkName: string = 'Main Entrance'
): Promise<ExtractedDestinationValidationResult> => {
  const { primary, fallback } = getGeminiApiKeys();
  const apiKeysToTry = [primary, fallback].filter(k => k && !k.includes('DemoApiKey'));

  const nodesMdText = loadNodesMarkdownText();
  const systemPrompt = buildGeminiDestinationExtractorAndValidatorPrompt({
    userQuery,
    nodesMdText,
    selectedLandmarkName
  });

  for (const apiKey of apiKeysToTry) {
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
      if (parsed && typeof parsed.pathExists === 'boolean') {
        return {
          extractedDestination: parsed.extractedDestination || userQuery,
          matchedNodeInNodesMd: parsed.matchedNodeInNodesMd,
          pathExists: parsed.pathExists,
          explanation: parsed.explanation || ''
        };
      }
    } catch (err) {
      console.warn('Gemini Destination Extractor & Validator notice:', err);
    }
  }

  // Local Fallback Validator against maindata.md / nodes.md
  const matchedRoute = findMainDataRouteFromMarkdown(userQuery, selectedLandmarkName);
  if (matchedRoute) {
    return {
      extractedDestination: matchedRoute.destination,
      matchedNodeInNodesMd: matchedRoute.destination,
      pathExists: true,
      explanation: 'Matched route in maindata.md'
    };
  }

  return {
    extractedDestination: userQuery,
    pathExists: false,
    explanation: 'No path found matching destination in nodes.md / maindata.md'
  };
};

// Parse Natural Language Spoken Voice Query into Start Point & Destination Entities via Gemini AI API
export const parseVoiceIntentWithGemini = async (
  userVoiceQuery: string
): Promise<ParsedVoiceIntent> => {
  const { primary, fallback } = getGeminiApiKeys();
  const apiKeysToTry = [primary, fallback].filter(k => k && !k.includes('DemoApiKey'));

  const systemPrompt = buildGeminiVoiceIntentSystemPrompt(userVoiceQuery);

  for (const apiKey of apiKeysToTry) {
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
      if (parsed && parsed.destination) {
        return {
          startPoint: parsed.startPoint || 'Main Entrance',
          destination: parsed.destination
        };
      }
    } catch (err) {
      console.warn('Gemini Voice Intent Parser notice:', err);
    }
  }

  // Fallback Local NLP Pattern Extractor
  const lower = userVoiceQuery.toLowerCase();
  let startPoint = 'Main Entrance';
  let destination = userVoiceQuery;

  if (lower.includes('from ') && lower.includes(' to ')) {
    const parts = lower.split(' to ');
    destination = parts[1].trim();
    startPoint = parts[0].replace('from ', '').replace('i am at ', '').replace('start from ', '').trim();
  } else if (lower.includes('take me to ')) {
    destination = lower.replace('take me to ', '').trim();
  } else if (lower.includes('where is ')) {
    destination = lower.replace('where is ', '').trim();
  } else if (lower.includes('how to reach ')) {
    destination = lower.replace('how to reach ', '').trim();
  }

  return {
    startPoint: startPoint || 'Main Entrance',
    destination: destination || userVoiceQuery
  };
};

// Stage 2: STRICT MAINDATA.MD ATOMIC STEP NAVIGATION GENERATOR
export const generateRouteDirectlyFromCorpus = async (
  destinationQuery: string,
  startPoint: string = 'Main Entrance'
): Promise<LLMRouteKnowledge | null> => {
  // 1. Stage 1 Validation check
  const validation = await extractAndValidateDestinationWithGemini(destinationQuery, startPoint);
  if (!validation.pathExists) {
    console.warn(`Destination path does not exist in nodes.md / maindata.md: "${destinationQuery}"`);
    return null;
  }

  const targetDestination = validation.extractedDestination || destinationQuery;

  // 2. Search maindata.md FIRST
  const savedMainRoute = findMainDataRouteFromMarkdown(targetDestination, startPoint);
  if (savedMainRoute) {
    return convertMainDataToLLMRoute(savedMainRoute);
  }

  const { primary, fallback } = getGeminiApiKeys();
  const apiKeysToTry = [primary, fallback].filter(k => k && !k.includes('DemoApiKey'));

  const matchedLandmark = findLandmarkByNameOrAlias(startPoint) || getAnchorLandmarkForFloor(1);
  const facingOrientation = matchedLandmark.facingOrientation;
  const mainDataMdText = loadMainDataMarkdownText();

  // 3. Stage 2 Dedicated Gemini Navigation Step Generator Prompt
  const systemPrompt = buildGeminiNavigationSystemPrompt({
    startLandmarkName: matchedLandmark.name,
    facingOrientation,
    destinationQuery: targetDestination,
    mainDataMdText,
    selectedFloor: matchedLandmark.floor
  });

  for (const apiKey of apiKeysToTry) {
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
      if (parsed && parsed.steps && parsed.steps.length > 0) {
        parsed.facingOrientation = facingOrientation;
        return parsed as LLMRouteKnowledge;
      }
    } catch (err) {
      console.warn('Gemini API Key attempt notice:', err);
    }
  }

  // NO FAKE FALLBACKS! maindata.md is the ONLY source of truth!
  return null;
};

export const generateLLMRouteWithGemini = async (
  rawDescription: string,
  _compassHeading?: number,
  _stepsWalked?: number
): Promise<LLMRouteKnowledge | null> => {
  return generateRouteDirectlyFromCorpus(rawDescription, 'Main Entrance');
};
