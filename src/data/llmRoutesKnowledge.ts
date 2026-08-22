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
  category: 'washroom' | 'lab' | 'cabin' | 'classroom' | 'facility' | 'entrance' | 'canteen';
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

// Clean dataset array for real campus data collection
export const LLM_ROUTES_KNOWLEDGE: LLMRouteKnowledge[] = [];
