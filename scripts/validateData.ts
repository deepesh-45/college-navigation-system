import { CAMPUS_NODES, CAMPUS_EDGES } from '../src/data/campusGraphData';
import { LLM_ROUTES_KNOWLEDGE } from '../src/data/llmRoutesKnowledge';

function validateCampusDatabase() {
  console.log('🔍 Starting Smart Campus Graph & LLM Dataset Validation...');

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

  if (errors > 0) {
    console.error(`\nFAILED: Found ${errors} dataset validation errors.`);
    process.exit(1);
  } else {
    console.log(`\n✅ PASSED: Campus Graph & LLM Dataset is 100% valid!`);
    console.log(`  - Atomic Graph Nodes: ${CAMPUS_NODES.length}`);
    console.log(`  - Directional Graph Edges: ${CAMPUS_EDGES.length}`);
    console.log(`  - LLM Knowledge Routes: ${LLM_ROUTES_KNOWLEDGE.length}`);
  }
}

validateCampusDatabase();
