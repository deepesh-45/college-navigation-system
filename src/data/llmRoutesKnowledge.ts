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

// Real Campus LLM Route Knowledge collected from live field walk (Floor 1)
export const LLM_ROUTES_KNOWLEDGE: LLMRouteKnowledge[] = [
  {
    id: "ROUTE_data_science_lab",
    category: "lab",
    destinationName: "Data Science Lab",
    aliases: ["data science lab", "ds lab"],
    startPoint: "Main Entrance",
    building: "Main Campus",
    floor: 1,
    totalSteps: 79,
    totalDistanceMeters: 59,
    overviewSummary: "Step-by-step route from Main Entrance to Data Science Lab.",
    steps: [
      {
        stepNumber: 1,
        instruction: "Move straight approx 15 steps and continue straight.",
        headingDegrees: 0,
        headingText: "continue straight",
        stepsCount: 15,
        voicePrompt: "Move straight approx 15 steps and continue straight."
      },
      {
        stepNumber: 2,
        instruction: "Move straight approx 14 steps and turn left.",
        headingDegrees: 270,
        headingText: "turn left",
        stepsCount: 14,
        voicePrompt: "Move straight approx 14 steps and turn left."
      },
      {
        stepNumber: 3,
        instruction: "Move straight approx 20 steps and continue straight.",
        headingDegrees: 0,
        headingText: "continue straight",
        stepsCount: 20,
        voicePrompt: "Move straight approx 20 steps and continue straight."
      },
      {
        stepNumber: 4,
        instruction: "Move straight approx 20 steps and take stairs up.",
        headingDegrees: 0,
        headingText: "take stairs up",
        stepsCount: 20,
        voicePrompt: "Move straight approx 20 steps and take stairs up."
      },
      {
        stepNumber: 5,
        instruction: "Move straight approx 10 steps to reach Data Science Lab.",
        headingDegrees: 0,
        headingText: "continue straight",
        stepsCount: 10,
        voicePrompt: "Move straight approx 10 steps to reach Data Science Lab."
      }
    ]
  },
  {
    id: "ROUTE_node_8",
    category: "facility",
    destinationName: "Node 8",
    aliases: ["node 8"],
    startPoint: "Main Entrance",
    building: "Main Campus",
    floor: 1,
    totalSteps: 124,
    totalDistanceMeters: 93,
    overviewSummary: "Step-by-step route from Main Entrance to Node 8.",
    steps: [
      {
        stepNumber: 1,
        instruction: "Move straight approx 15 steps and continue straight.",
        headingDegrees: 0,
        headingText: "continue straight",
        stepsCount: 15,
        voicePrompt: "Move straight approx 15 steps and continue straight."
      },
      {
        stepNumber: 2,
        instruction: "Move straight approx 20 steps and turn left.",
        headingDegrees: 270,
        headingText: "turn left",
        stepsCount: 20,
        voicePrompt: "Move straight approx 20 steps and turn left."
      },
      {
        stepNumber: 3,
        instruction: "Move straight approx 14 steps and turn left.",
        headingDegrees: 270,
        headingText: "turn left",
        stepsCount: 14,
        voicePrompt: "Move straight approx 14 steps and turn left."
      },
      {
        stepNumber: 4,
        instruction: "Move straight approx 20 steps and continue straight.",
        headingDegrees: 0,
        headingText: "continue straight",
        stepsCount: 20,
        voicePrompt: "Move straight approx 20 steps and continue straight."
      },
      {
        stepNumber: 5,
        instruction: "Move straight approx 5 steps and continue straight.",
        headingDegrees: 0,
        headingText: "continue straight",
        stepsCount: 5,
        voicePrompt: "Move straight approx 5 steps and continue straight."
      },
      {
        stepNumber: 6,
        instruction: "Move straight approx 20 steps and take stairs up.",
        headingDegrees: 0,
        headingText: "take stairs up",
        stepsCount: 20,
        voicePrompt: "Move straight approx 20 steps and take stairs up."
      },
      {
        stepNumber: 7,
        instruction: "Move straight approx 10 steps and continue straight.",
        headingDegrees: 0,
        headingText: "continue straight",
        stepsCount: 10,
        voicePrompt: "Move straight approx 10 steps and continue straight."
      },
      {
        stepNumber: 8,
        instruction: "Move straight approx 20 steps and turn left.",
        headingDegrees: 270,
        headingText: "turn left",
        stepsCount: 20,
        voicePrompt: "Move straight approx 20 steps and turn left."
      }
    ]
  },
  {
    id: "ROUTE_node_6",
    category: "facility",
    destinationName: "Node 6",
    aliases: ["node 6"],
    startPoint: "Main Entrance",
    building: "Main Campus",
    floor: 1,
    totalSteps: 94,
    totalDistanceMeters: 71,
    overviewSummary: "Step-by-step route from Main Entrance to Node 6.",
    steps: [
      {
        stepNumber: 1,
        instruction: "Move straight approx 15 steps and continue straight.",
        headingDegrees: 0,
        headingText: "continue straight",
        stepsCount: 15,
        voicePrompt: "Move straight approx 15 steps and continue straight."
      },
      {
        stepNumber: 2,
        instruction: "Move straight approx 20 steps and turn left.",
        headingDegrees: 270,
        headingText: "turn left",
        stepsCount: 20,
        voicePrompt: "Move straight approx 20 steps and turn left."
      },
      {
        stepNumber: 3,
        instruction: "Move straight approx 14 steps and turn left.",
        headingDegrees: 270,
        headingText: "turn left",
        stepsCount: 14,
        voicePrompt: "Move straight approx 14 steps and turn left."
      },
      {
        stepNumber: 4,
        instruction: "Move straight approx 20 steps and continue straight.",
        headingDegrees: 0,
        headingText: "continue straight",
        stepsCount: 20,
        voicePrompt: "Move straight approx 20 steps and continue straight."
      },
      {
        stepNumber: 5,
        instruction: "Move straight approx 5 steps and continue straight.",
        headingDegrees: 0,
        headingText: "continue straight",
        stepsCount: 5,
        voicePrompt: "Move straight approx 5 steps and continue straight."
      },
      {
        stepNumber: 6,
        instruction: "Move straight approx 20 steps and continue straight.",
        headingDegrees: 0,
        headingText: "continue straight",
        stepsCount: 20,
        voicePrompt: "Move straight approx 20 steps and continue straight."
      }
    ]
  }
];

export const saveLLMRoutesToStorage = () => {
  try {
    localStorage.setItem('SAVED_LLM_ROUTES', JSON.stringify(LLM_ROUTES_KNOWLEDGE));
  } catch (e) {
    console.warn('Storage save notice:', e);
  }
};
