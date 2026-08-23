import { CAMPUS_NODES, CAMPUS_EDGES } from '../src/data/campusGraphData';
import { LLM_ROUTES_KNOWLEDGE } from '../src/data/llmRoutesKnowledge';
import { CAMPUS_LANDMARKS } from '../src/data/landmarksData';

function validateCampusDatabase() {
  console.log('🔍 Starting Smart Campus Graph & Landmark Dataset Validation...');

  const nodeIds = new Set(CAMPUS_NODES.map(n => n.id));
  let errors = 0;

  // 1. Check Graph Edges Node FK integrity
  CAMPUS_EDGES.forEach(e => {
    if (!nodeIds.has(e.fromNodeId)) {
      console.error(`❌ Edge "${e.id}" references invalid fromNodeId: ${e.fromNodeId}`);
      errors++;
    }
    if (!nodeIds.has(e.toNodeId)) {
      console.error(`❌ Edge "${e.id}" references invalid toNodeId: ${e.toNodeId}`);
      errors++;
    }
    if (e.stepsCount < 0) {
      console.error(`❌ Edge "${e.id}" has invalid negative stepsCount: ${e.stepsCount}`);
      errors++;
    }
  });

  // 2. Check LLM Routes Integrity
  LLM_ROUTES_KNOWLEDGE.forEach(r => {
    if (!r.steps || r.steps.length === 0) {
      console.error(`❌ Route "${r.id}" has 0 step instructions`);
      errors++;
    }
  });

  // 3. Check Anchor Landmarks Integrity
  if (!CAMPUS_LANDMARKS || CAMPUS_LANDMARKS.length === 0) {
    console.error(`❌ CAMPUS_LANDMARKS is empty!`);
    errors++;
  } else {
    CAMPUS_LANDMARKS.forEach(l => {
      if (!l.id || !l.name || !l.facingOrientation) {
        console.error(`❌ Landmark "${l.id}" is missing name or facingOrientation`);
        errors++;
      }
    });
  }

  if (errors > 0) {
    console.error(`\nFAILED: Found ${errors} dataset validation errors.`);
    process.exit(1);
  } else {
    console.log(`\n✅ PASSED: Campus Graph & Landmark Dataset is 100% valid!`);
    console.log(`  - Anchor Floor Landmarks: ${CAMPUS_LANDMARKS.length}`);
    console.log(`  - Atomic Graph Nodes: ${CAMPUS_NODES.length}`);
    console.log(`  - Directional Graph Edges: ${CAMPUS_EDGES.length}`);
    console.log(`  - LLM Knowledge Routes: ${LLM_ROUTES_KNOWLEDGE.length}`);
  }
}

validateCampusDatabase();
