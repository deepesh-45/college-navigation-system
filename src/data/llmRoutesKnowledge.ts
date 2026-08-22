export interface LLMStepInstruction {
  stepNumber: number;
  instruction: string;
  headingDegrees: number; // 0=N, 90=E, 180=S, 270=W
  headingText: string;
  stepsCount: number;
  landmarkHint?: string;
  action?: 'straight' | 'left' | 'right' | 'stair_up' | 'stair_down' | 'elevator';
  voicePrompt: string;
}

export interface LLMRouteKnowledge {
  id: string;
  category:
    | 'washroom'
    | 'watercooler'
    | 'lab'
    | 'cabin'
    | 'classroom'
    | 'auditorium'
    | 'library'
    | 'facility'
    | 'entrance'
    | 'canteen';
  destinationName: string;
  aliases: string[];
  startPoint: string;
  building: string;
  floor: number;
  totalSteps: number;
  totalDistanceMeters: number;
  overviewSummary: string;
  steps: LLMStepInstruction[];
}

// Load saved LLM routes from device localStorage if available
const loadSavedRoutes = (): LLMRouteKnowledge[] => {
  try {
    const saved = localStorage.getItem('SAVED_LLM_ROUTES');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const LLM_ROUTES_KNOWLEDGE: LLMRouteKnowledge[] = loadSavedRoutes();

export const saveLLMRoutesToStorage = () => {
  try {
    localStorage.setItem('SAVED_LLM_ROUTES', JSON.stringify(LLM_ROUTES_KNOWLEDGE));
  } catch (e) {
    console.warn('Storage save notice:', e);
  }
};
