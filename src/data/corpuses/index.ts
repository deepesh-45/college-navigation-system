import { GROUND_FLOOR_CORPUS } from './groundFloorCorpus';
import { FIRST_FLOOR_CORPUS } from './firstFloorCorpus';

export { GROUND_FLOOR_CORPUS } from './groundFloorCorpus';
export { FIRST_FLOOR_CORPUS } from './firstFloorCorpus';

export const CAMPUS_FLOOR_CORPUSES: Record<string, { floorName: string; floorNumber: number; text: string }> = {
  ground_floor: {
    floorName: 'Ground Floor',
    floorNumber: 1,
    text: GROUND_FLOOR_CORPUS
  },
  first_floor: {
    floorName: 'First Floor',
    floorNumber: 2,
    text: FIRST_FLOOR_CORPUS
  }
};
