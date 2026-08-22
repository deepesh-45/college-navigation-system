import fs from 'fs';
import path from 'path';

interface Building { id: string; name: string; }
interface Floor { id: string; buildingId: string; }
interface Room { id: string; buildingId: string; floorId: string; nodeId: string; }
interface Faculty { id: string; roomId: string; }
interface NavNode { id: string; buildingId?: string; floorId: string; }
interface NavEdge { from: string; to: string; }

function validateCampusDatabase() {
  console.log('🔍 Starting Smart Campus Dataset Validation...');
  const jsonDir = path.join(process.cwd(), 'src', 'data', 'json');

  const buildings: Building[] = JSON.parse(fs.readFileSync(path.join(jsonDir, 'buildings.json'), 'utf-8'));
  const floors: Floor[] = JSON.parse(fs.readFileSync(path.join(jsonDir, 'floors.json'), 'utf-8'));
  const rooms: Room[] = JSON.parse(fs.readFileSync(path.join(jsonDir, 'rooms.json'), 'utf-8'));
  const faculty: Faculty[] = JSON.parse(fs.readFileSync(path.join(jsonDir, 'faculty.json'), 'utf-8'));
  const nodes: NavNode[] = JSON.parse(fs.readFileSync(path.join(jsonDir, 'nodes.json'), 'utf-8'));
  const edges: NavEdge[] = JSON.parse(fs.readFileSync(path.join(jsonDir, 'edges.json'), 'utf-8'));

  const buildingIds = new Set(buildings.map(b => b.id));
  const floorIds = new Set(floors.map(f => f.id));
  const nodeIds = new Set(nodes.map(n => n.id));
  const roomIds = new Set(rooms.map(r => r.id));

  let errors = 0;

  // 1. Check Floor -> Building FK
  floors.forEach(f => {
    if (!buildingIds.has(f.buildingId)) {
      console.error(`❌ Floor "${f.id}" references invalid buildingId: ${f.buildingId}`);
      errors++;
    }
  });

  // 2. Check Room -> Building & Floor & Node FK
  rooms.forEach(r => {
    if (!buildingIds.has(r.buildingId)) {
      console.error(`❌ Room "${r.id}" references invalid buildingId: ${r.buildingId}`);
      errors++;
    }
    if (!floorIds.has(r.floorId)) {
      console.error(`❌ Room "${r.id}" references invalid floorId: ${r.floorId}`);
      errors++;
    }
    if (!nodeIds.has(r.nodeId)) {
      console.error(`❌ Room "${r.id}" references invalid nodeId: ${r.nodeId}`);
      errors++;
    }
  });

  // 3. Check Faculty -> Room FK
  faculty.forEach(fac => {
    if (!roomIds.has(fac.roomId)) {
      console.error(`❌ Faculty "${fac.id}" references invalid roomId: ${fac.roomId}`);
      errors++;
    }
  });

  // 4. Check Edges -> Node FK
  edges.forEach(e => {
    if (!nodeIds.has(e.from)) {
      console.error(`❌ Edge from "${e.from}" references non-existent node`);
      errors++;
    }
    if (!nodeIds.has(e.to)) {
      console.error(`❌ Edge to "${e.to}" references non-existent node`);
      errors++;
    }
  });

  if (errors > 0) {
    console.error(`\nFAILED: Found ${errors} database validation errors.`);
    process.exit(1);
  } else {
    console.log(`\n✅ PASSED: Campus Dataset is 100% valid!`);
    console.log(`  - Buildings: ${buildings.length}`);
    console.log(`  - Floors: ${floors.length}`);
    console.log(`  - Rooms: ${rooms.length}`);
    console.log(`  - Faculty: ${faculty.length}`);
    console.log(`  - Graph Nodes: ${nodes.length}`);
    console.log(`  - Graph Edges: ${edges.length}`);
  }
}

validateCampusDatabase();
