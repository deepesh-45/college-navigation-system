import { CAMPUS_LANDMARKS } from '../src/data/landmarksData';

function validateCampusDatabase() {
  console.log('🔍 Starting Smart Campus Landmark Dataset Validation...');

  let errors = 0;

  // Check Anchor Landmarks Integrity
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
    console.log(`\n✅ PASSED: Campus Landmark Dataset is 100% valid!`);
    console.log(`  - Anchor Floor Landmarks: ${CAMPUS_LANDMARKS.length}`);
  }
}

validateCampusDatabase();
