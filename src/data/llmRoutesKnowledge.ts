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
  facingOrientation?: string;
  building: string;
  floor: number;
  totalSteps: number;
  totalDistanceMeters: number;
  overviewSummary: string;
  steps: LLMStepInstruction[];
}

export const LLM_ROUTES_KNOWLEDGE: LLMRouteKnowledge[] = [];

export const saveLLMRoutesToStorage = () => {
  try {
    localStorage.setItem('SAVED_LLM_ROUTES', JSON.stringify(LLM_ROUTES_KNOWLEDGE));
  } catch (e) {
    console.warn('Storage save notice:', e);
  }
};
